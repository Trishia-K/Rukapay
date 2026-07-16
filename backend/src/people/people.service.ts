import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PeopleService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string, department?: string) {
    return this.prisma.person.findMany({
      where: {
        fullName: search ? { contains: search, mode: 'insensitive' } : undefined,
        department: department || undefined,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async create(data: { fullName: string; department?: string; role?: string; email?: string }) {
    try {
      return await this.prisma.person.create({
        data: {
          ...data,
          email: data.email?.trim() ? data.email.trim() : undefined, // empty string -> undefined, so it's stored as null, not "" (avoids unique-constraint collisions between multiple blank emails)
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new BadRequestException('Someone with that email already exists.');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.prisma.attendanceLog.deleteMany({ where: { personId: id } });
    await this.prisma.meetingAttendee.deleteMany({ where: { personId: id } });
    await this.prisma.leaveRecord.deleteMany({ where: { personId: id } });
    await this.prisma.meeting.updateMany({ where: { facilitatorId: id }, data: { facilitatorId: null } });
    return this.prisma.person.delete({ where: { id } });
  }
}
