import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const FIVE_PM_HOUR = 17;

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private today() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Called from the kiosk (or eventually the fingerprint device webhook).
  // First tap of the day = time in, second tap = time out.
  async signInOrOut(personId: string, source = 'webauthn') {
    const date = this.today();
    const existing = await this.prisma.attendanceLog.findUnique({
      where: { personId_date: { personId, date } },
    });

    if (!existing) {
      return this.prisma.attendanceLog.create({
        data: { personId, date, timeIn: new Date(), source },
      });
    }

    if (existing.timeIn && !existing.timeOut) {
      return this.prisma.attendanceLog.update({
        where: { id: existing.id },
        data: { timeOut: new Date() },
      });
    }

    // Already signed in and out today - nothing more to record.
    return existing;
  }

  todayLog() {
    return this.prisma.attendanceLog.findMany({
      where: { date: this.today() },
      include: { person: true },
      orderBy: { timeIn: 'asc' },
    });
  }

  history(personId: string) {
    return this.prisma.attendanceLog.findMany({
      where: { personId },
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  // What the door unit calls once it's installed. First punch of the day
  // becomes timeIn, the next becomes timeOut - identical logic to the kiosk.
  async recordFromDevice(biometricId: string) {
    const person = await this.prisma.person.findUnique({ where: { biometricId } });
    if (!person) return null;
    return this.signInOrOut(person.id, 'biometric');
  }

  // Attendance percentage = days actually signed in, out of working days
  // since this person joined (weekends excluded). Early sign-outs = number
  // of days they left before 5pm.
  async personStats(personId: string) {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) return null;

    const logs = await this.prisma.attendanceLog.findMany({ where: { personId } });
    const daysPresent = logs.filter((l) => l.timeIn).length;
    const earlySignOuts = logs.filter((l) => l.timeOut && l.timeOut.getHours() < FIVE_PM_HOUR).length;

    const workingDays = countWeekdays(person.createdAt, new Date());
    const attendancePercentage = workingDays > 0 ? Math.round((daysPresent / workingDays) * 100) : 0;

    return { attendancePercentage, daysPresent, earlySignOuts, workingDays };
  }

  async allStats() {
    const people = await this.prisma.person.findMany();
    return Promise.all(people.map(async (p) => ({ person: p, ...(await this.personStats(p.id)) })));
  }

  // Builds the sheet management actually wants to see: one row per person,
  // one column per working day, marked Present / Absent / Leave / Remote.
  async monthlyReportBuffer(year: number, month: number) {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const days: Date[] = [];
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d));
    }

    sheet.columns = [
      { header: 'Name', key: 'name', width: 26 },
      { header: 'Department', key: 'department', width: 22 },
      ...days.map((d) => ({ header: d.getDate().toString(), key: `d${d.getDate()}`, width: 5 })),
      { header: 'Attendance %', key: 'pct', width: 14 },
      { header: 'Early sign-outs', key: 'early', width: 15 },
    ];
    sheet.getRow(1).font = { bold: true };

    const people = await this.prisma.person.findMany({ orderBy: { fullName: 'asc' } });

    for (const person of people) {
      const logs = await this.prisma.attendanceLog.findMany({
        where: { personId: person.id, date: { gte: start, lte: end } },
      });
      const leave = await this.prisma.leaveRecord.findMany({
        where: { personId: person.id, startDate: { lte: end }, endDate: { gte: start } },
      });

      const row: Record<string, any> = { name: person.fullName, department: person.department || '—' };
      let daysPresent = 0;
      let earlySignOuts = 0;

      for (const d of days) {
        const log = logs.find((l) => sameDay(l.date, d));
        const onLeave = leave.find((l) => d >= l.startDate && d <= l.endDate);
        if (log?.timeIn) {
          row[`d${d.getDate()}`] = 'P';
          daysPresent++;
          if (log.timeOut && log.timeOut.getHours() < FIVE_PM_HOUR) earlySignOuts++;
        } else if (onLeave) {
          row[`d${d.getDate()}`] = onLeave.type === 'remote' ? 'R' : 'L';
        } else {
          row[`d${d.getDate()}`] = 'A';
        }
      }

      row.pct = days.length ? Math.round((daysPresent / days.length) * 100) + '%' : '0%';
      row.early = earlySignOuts;
      sheet.addRow(row);
    }

    sheet.addRow([]);
    sheet.addRow(['P = Present', 'A = Absent', 'L = On leave', 'R = Remote']);

    return workbook.xlsx.writeBuffer();
  }
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function countWeekdays(start: Date, end: Date) {
  let count = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cursor <= last) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}
