import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  @Post('login')
  login(@Body() body: { password: string }) {
    if (!process.env.ADMIN_PASSWORD || body.password !== process.env.ADMIN_PASSWORD) {
      throw new UnauthorizedException('Incorrect password');
    }
    return { success: true };
  }
}