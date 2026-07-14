import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { generateMeetingCode, MEETING_TYPES } from './meeting-types';

@Injectable()
export class MeetingsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(data: {
    title: string; type: string; date: string; mode?: string; location?: string;
    meetingLink?: string; facilitatorId?: string; department?: string;
  }) {
    const type = MEETING_TYPES.includes(data.type as any) ? data.type : 'other';
    const mode = data.mode || 'physical';
    const meetingDate = new Date(data.date);

    if (mode === 'physical' && data.location) {
      const windowStart = new Date(meetingDate.getTime() - 60 * 60 * 1000);
      const windowEnd = new Date(meetingDate.getTime() + 60 * 60 * 1000);
      const conflict = await this.prisma.meeting.findFirst({
        where: {
          location: { equals: data.location, mode: 'insensitive' },
          date: { gte: windowStart, lte: windowEnd },
        },
      });
      if (conflict) {
        throw new BadRequestException(
          `${data.location} is already booked around that time - "${conflict.title}" at ${conflict.date.toLocaleString()}`,
        );
      }
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        title: data.title,
        type,
        date: meetingDate,
        mode,
        location: data.location,
        meetingLink: data.meetingLink,
        facilitatorId: data.facilitatorId,
        department: data.department || null,
        code: generateMeetingCode(),
      },
    });

    const expected = await this.prisma.person.findMany({
      where: meeting.department ? { department: meeting.department } : undefined,
    });

    await this.prisma.meetingAttendee.createMany({
      data: expected.map((p) => ({ meetingId: meeting.id, personId: p.id })),
    });

    this.notifications
      .sendMeetingInvite(expected.map((p) => ({ fullName: p.fullName, email: p.email })), meeting)
      .catch((err) => {
        console.error('Meeting invite emails failed to send:', err.message);
      });

    return meeting;
  }

  findMany(filters: { department?: string; date?: string; when?: 'upcoming' | 'past' }) {
    let dateFilter: any;
    if (filters.date) {
      dateFilter = { gte: new Date(`${filters.date}T00:00:00`), lt: new Date(`${filters.date}T23:59:59`) };
    } else if (filters.when === 'past') {
      dateFilter = { lt: new Date() };
    } else if (filters.when === 'upcoming') {
      dateFilter = { gte: new Date() };
    }

    return this.prisma.meeting.findMany({
      where: {
        department: filters.department || undefined,
        date: dateFilter,
      },
      orderBy: { date: filters.when === 'past' ? 'desc' : 'asc' },
      take: 100,
      include: { facilitator: true, attendees: true },
    });
  
  }

  async findByCode(code: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { code: code.toUpperCase() },
      include: { attendees: { include: { person: true } }, facilitator: true },
    });
    if (!meeting) throw new NotFoundException('No meeting with that code');
    return meeting;
  }

  findOne(id: string) {
    return this.prisma.meeting.findUnique({
      where: { id },
      include: {
        attendees: { include: { person: true }, orderBy: { person: { fullName: 'asc' } } },
        facilitator: true,
      },
    });
  }

  async signAttendance(meetingId: string, personId: string, signatureSvg: string) {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) throw new NotFoundException('Person not found');

    return this.prisma.meetingAttendee.upsert({
      where: { meetingId_personId: { meetingId, personId } },
      update: { signatureSvg, signedAt: new Date() },
      create: { meetingId, personId, signatureSvg, signedAt: new Date() },
    });
  
  }
}
