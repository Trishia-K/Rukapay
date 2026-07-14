import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { FingerprintService } from './fingerprint.service';
import { OfficeNetworkGuard } from '../common/office-network.guard';

@Controller('fingerprint')
@UseGuards(OfficeNetworkGuard)
export class FingerprintController {
  constructor(private fingerprint: FingerprintService) {}

  @Post(':personId/register-options')
  registerOptions(@Param('personId') personId: string) {
    return this.fingerprint.registerOptions(personId);
  }

  @Post(':personId/register-verify')
  registerVerify(@Param('personId') personId: string, @Body() response: any) {
    return this.fingerprint.registerVerify(personId, response);
  }

  @Post(':personId/sign-in-options')
  signInOptions(@Param('personId') personId: string) {
    return this.fingerprint.signInOptions(personId);
  }

  @Post(':personId/sign-in-verify')
  signInVerify(@Param('personId') personId: string, @Body() response: any) {
    return this.fingerprint.signInVerify(personId, response);
  }
}
