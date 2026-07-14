import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  create(data: { personId: string; type: string; startDate: string; endDate: string; note?: string }) {
    return this.prisma.leaveRecord.create({
      data: {
        personId: data.personId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        note: data.note,
      },
    });
  }

  // Everyone whose leave/remote window covers today - this is what the
  // dashboard uses to tell "on leave" apart from "just didn't sign in".
  today() {
    // startDate/endDate are stored as UTC-midnight of whatever calendar date
    // was picked (that's how a plain "YYYY-MM-DD" string gets parsed). Building
    // "today" the same way - instead of local midnight - is what was missing,
    // and why a leave marked for today wasn't showing up as today.
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const today = new Date(`${y}-${m}-${d}`);

    return this.prisma.leaveRecord.findMany({
      where: { startDate: { lte: today }, endDate: { gte: today } },
      include: { person: true },
    });
  }

  // Used by the monthly export to mark leave/remote days instead of "absent".
  forMonth(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return this.prisma.leaveRecord.findMany({
      where: { startDate: { lte: end }, endDate: { gte: start } },
      include: { person: true },
    });
  }
}
