import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';

// These three have to match wherever the frontend is actually opened from.
// Plain "localhost" works for testing on your own laptop. Once you're on a
// phone via an ngrok HTTPS link, update these to match that link - see README.
const RP_NAME = process.env.WEBAUTHN_RP_NAME || 'RukaTrack';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173';

@Injectable()
export class FingerprintService {
  constructor(
    private prisma: PrismaService,
    private attendance: AttendanceService,
  ) {}

  // Step 1 of enrolling someone's fingerprint - called once per person, from the Team page.
  async registerOptions(personId: string) {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) throw new NotFoundException('Person not found');

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: person.fullName,
      userID: person.id,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'discouraged',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // the device's own sensor, not a USB security key
      },
    });

    await this.prisma.person.update({ where: { id: personId }, data: { currentChallenge: options.challenge } });
    return options;
  }

  // Step 2 of enrolling - the browser sends back what the fingerprint sensor produced.
  async registerVerify(personId: string, response: any) {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person?.currentChallenge) throw new BadRequestException('No registration in progress for this person');

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: person.currentChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Fingerprint could not be verified');
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
    await this.prisma.person.update({
      where: { id: personId },
      data: {
        webauthnCredentialId: isoBase64URL.fromBuffer(credentialID),
        webauthnPublicKey: isoBase64URL.fromBuffer(credentialPublicKey),
        webauthnCounter: counter,
        currentChallenge: null,
      },
    });

    return { success: true };
  }

  // Step 1 of signing in - called from the sign-in page once someone picks their name.
  async signInOptions(personId: string) {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) throw new NotFoundException('Person not found');
    if (!person.webauthnCredentialId) {
      throw new BadRequestException('No fingerprint registered for this person yet - set it up on the Team page first');
    }

    const challenge = isoBase64URL.fromBuffer(crypto.randomBytes(32));

    const finalOptions = {
      challenge,
      timeout: 60000,
      rpId: RP_ID,
      userVerification: 'preferred',
      allowCredentials: [
        { id: person.webauthnCredentialId, type: 'public-key' },
      ],
    };

    await this.prisma.person.update({ where: { id: personId }, data: { currentChallenge: challenge } });
    return finalOptions;
  }
  // Step 2 of signing in - verifies the scan, then logs the actual attendance.
  async signInVerify(personId: string, response: any) {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person?.currentChallenge || !person.webauthnPublicKey || !person.webauthnCredentialId) {
      throw new BadRequestException('No sign-in in progress for this person');
    }

    const verification = await verifyAuthenticationResponse({
  response,
  expectedChallenge: person.currentChallenge,
  expectedOrigin: ORIGIN,
  expectedRPID: RP_ID,
  authenticator: {
    credentialID: isoBase64URL.toBuffer(person.webauthnCredentialId),
    credentialPublicKey: isoBase64URL.toBuffer(person.webauthnPublicKey),

    // Ignore signature counter for Windows Hello
    counter: 0,
  },
});

    if (!verification.verified) throw new BadRequestException('Fingerprint did not match');

    await this.prisma.person.update({
      where: { id: personId },
      data: { webauthnCounter:
  verification.authenticationInfo.newCounter ?? 0, currentChallenge: null },
    });

    const log = await this.attendance.signInOrOut(personId, 'webauthn');
    return { success: true, log };
  }
}