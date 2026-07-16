import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { PeopleService } from './people.service';
import { DEPARTMENTS } from '../common/departments';

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

  @Post()
  create(@Body() body: { fullName: string; department?: string; role?: string; email?: string }) {
    return this.people.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.people.remove(id);
  }
}
