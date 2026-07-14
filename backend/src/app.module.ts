import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PeopleModule } from './people/people.module';
import { AttendanceModule } from './attendance/attendance.module';
import { MeetingsModule } from './meetings/meetings.module';
import { LeaveModule } from './leave/leave.module';
import { FingerprintModule } from './fingerprint/fingerprint.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    PeopleModule,
    AttendanceModule,
    MeetingsModule,
    LeaveModule,
    FingerprintModule,
  ],
})
export class AppModule {}
