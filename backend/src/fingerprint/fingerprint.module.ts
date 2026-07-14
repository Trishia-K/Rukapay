import { Module } from '@nestjs/common';
import { FingerprintController } from './fingerprint.controller';
import { FingerprintService } from './fingerprint.service';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [AttendanceModule],
  controllers: [FingerprintController],
  providers: [FingerprintService],
})
export class FingerprintModule {}
