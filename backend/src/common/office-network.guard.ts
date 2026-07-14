import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';

// This is the actual "can someone sign in from home" control. It only works
// once RukaTrack is running somewhere reachable from the internet with a
// real domain - on your laptop over localhost/LAN it has nothing meaningful
// to check yet, since every request looks like it's from the same network.
//
// How it works once deployed: set OFFICE_ALLOWED_IPS in .env to your
// office's public IP address(es) - find it by visiting whatismyip.com from
// an office computer. Any request whose IP isn't in that list is rejected
// before it ever reaches the fingerprint check, so someone at home can't
// even attempt to sign in, regardless of what device or sensor they use.
@Injectable()
export class OfficeNetworkGuard implements CanActivate {
  private logger = new Logger('OfficeNetworkGuard');
  private warnedOnce = false;

  canActivate(context: ExecutionContext): boolean {
    const allowed = (process.env.OFFICE_ALLOWED_IPS || '')
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean);

    if (allowed.length === 0) {
      if (!this.warnedOnce) {
        this.logger.warn('OFFICE_ALLOWED_IPS is not set - sign-in is reachable from any network. See .env.example.');
        this.warnedOnce = true;
      }
      return true; // nothing configured yet - don't block during local testing
    }

    const request = context.switchToHttp().getRequest();
    const requestIp = (request.headers['x-forwarded-for'] || request.ip || '').toString().split(',')[0].trim();

    if (!allowed.includes(requestIp)) {
      throw new ForbiddenException('Sign-in is only available from the office network.');
    }
    return true;
  }
}
