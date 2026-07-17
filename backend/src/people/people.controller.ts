import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PeopleService } from './people.service';
import { DEPARTMENTS } from '../common/departments';
import { AdminGuard } from '../common/admin.guard';

@Controller('people')
export class PeopleController {
  constructor(private people: PeopleService) {}

  @Get('departments')
  departments() {
    return DEPARTMENTS;
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('department') department?: string) {
    return this.people.findAll(search, department);
  }

  @Get(':id/basic')
  findBasic(@Param('id') id: string) {
    return this.people.findBasic(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() body: { fullName: string; department?: string; role?: string; email?: string }) {
    return this.people.create(body);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.people.remove(id);
  }
}