import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MEETING_TYPE_LABELS } from './meeting-types';

@Controller('meetings')
export class MeetingsController {
  constructor(private meetings: MeetingsService) {}

  @Get('types')
  types() {
    return MEETING_TYPE_LABELS;
  }

  @Get()
  findMany(
    @Query('department') department?: string,
    @Query('date') date?: string,
    @Query('when') when?: 'upcoming' | 'past',
  ) {
    return this.meetings.findMany({ department, date, when });
  }

  @Post()
  create(@Body() body: {
    title: string; type: string; date: string; mode?: string; location?: string;
    meetingLink?: string; facilitatorId?: string; department?: string;
  }) {
    return this.meetings.create(body);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.meetings.findByCode(code);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetings.findOne(id);
  }

  @Post(':id/sign')
  sign(@Param('id') id: string, @Body() body: { personId: string; signatureSvg: string }) {
    return this.meetings.signAttendance(id, body.personId, body.signatureSvg);
  }
}