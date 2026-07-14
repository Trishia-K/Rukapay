import { Body, Controller, Get, Headers, Param, Post, Query, Res, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private attendance: AttendanceService) {}

  // Note: there is deliberately no direct "sign someone in" endpoint here.
  // The only way attendance gets logged is through a verified fingerprint
  // scan (see FingerprintService.signInVerify), so a raw API call alone
  // can never mark someone present.

  @Get('today')
  today() {
    return this.attendance.todayLog();
  }

  @Get('history/:personId')
  history(@Param('personId') personId: string) {
    return this.attendance.history(personId);
  }

  @Get('stats/:personId')
  stats(@Param('personId') personId: string) {
    return this.attendance.personStats(personId);
  }

  @Get('stats')
  allStats() {
    return this.attendance.allStats();
  }

  // e.g. GET /api/attendance/report?year=2026&month=7
  @Get('report')
  async report(@Query('year') year: string, @Query('month') month: string, @Res() res: Response) {
    const buffer = await this.attendance.monthlyReportBuffer(Number(year), Number(month));
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="RukaTrack-Attendance-${year}-${month}.xlsx"`,
    });
    res.send(buffer);
  }

  // Point the fingerprint device's push feature (or a small poller script)
  // at this endpoint once it's installed. Kept intentionally minimal for now.
  @Post('device-webhook')
  deviceWebhook(
    @Body() body: { biometricId: string },
    @Headers('x-webhook-secret') secret: string,
  ) {
    if (secret !== process.env.BIOMETRIC_WEBHOOK_SECRET) {
      throw new UnauthorizedException();
    }
    return this.attendance.recordFromDevice(body.biometricId);
  }
}
