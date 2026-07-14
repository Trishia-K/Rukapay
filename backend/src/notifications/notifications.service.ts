import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private logger = new Logger('Notifications');
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.EMAIL_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      this.transporter.verify((err) => {
        if (err) {
          this.logger.error(`Email is configured but the connection failed: ${err.message}`);
        } else {
          this.logger.log('Email is configured correctly and ready to send.');
        }
      });
    } else {
      this.logger.warn('EMAIL_HOST is not set in .env - meeting invite emails are turned off.');
    }
  }

  async sendMeetingInvite(recipients: { fullName: string; email: string | null }[], meeting: {
    title: string; date: Date; type: string; mode: string; location?: string | null; meetingLink?: string | null;
  }) {
    if (!this.transporter) {
      this.logger.warn('Skipping meeting invite emails - EMAIL_HOST is not set.');
      return;
    }

    const whenText = new Date(meeting.date).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' });
    const whereText = meeting.mode === 'online'
      ? `Online - join link: ${meeting.meetingLink}`
      : `In person - ${meeting.location || 'location to be confirmed'}`;

    const toSend = recipients.filter((r) => r.email);
    if (toSend.length === 0) {
      this.logger.warn('No recipients had an email on file - nothing was sent.');
      return;
    }

    for (const person of toSend) {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: person.email as string,
        subject: `RukaTrack: ${meeting.title}`,
        text: `Hi ${person.fullName.split(' ')[0]},\n\nYou've been invited to a ${meeting.type} meeting.\n\n${meeting.title}\nWhen: ${whenText}\nWhere: ${whereText}\n\nSee you there.`,
      });
    }
    this.logger.log(`Sent ${toSend.length} meeting invite email(s) for "${meeting.title}"`);
  }
}
