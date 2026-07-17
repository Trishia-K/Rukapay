import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-admin-key'];
    if (!process.env.ADMIN_PASSWORD || key !== process.env.ADMIN_PASSWORD) {
      throw new UnauthorizedException('Incorrect admin password.');
    }
    return true;
  }
}