import { Body, Controller, Get, Post } from '@nestjs/common';
import { LeaveService } from './leave.service';

@Controller('leave')
export class LeaveController {
  constructor(private leave: LeaveService) {}

  @Post()
  create(@Body() body: { personId: string; type: string; startDate: string; endDate: string; note?: string }) {
    return this.leave.create(body);
  }

  @Get('today')
  today() {
    return this.leave.today();
  }
}
