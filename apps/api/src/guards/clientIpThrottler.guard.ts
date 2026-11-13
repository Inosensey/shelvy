import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { timingSafeEqual } from 'crypto';

type TrackerRequest = {
  ip?: string;
  path?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: { email?: unknown };
};

// Constant-time comparison so the key can't be guessed by timing
const safeEqual = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: TrackerRequest): Promise<string> {
    const internalKey = process.env.INTERNAL_API_KEY;
    const providedKey = req.headers['x-internal-key'];
    const forwardedIp = req.headers['x-client-ip'];

    // Only trust x-client-ip when it comes with the shared secret
    const ip =
      internalKey &&
      typeof providedKey === 'string' &&
      safeEqual(providedKey, internalKey) &&
      typeof forwardedIp === 'string'
        ? forwardedIp
        : (req.ip ?? 'unknown');

    // Sign-in: limit per IP + target account, so one account can't be brute-forced
    const email = req.body?.email;
    if (req.path?.endsWith('/auth/sign-in') && typeof email === 'string') {
      return Promise.resolve(`${ip}|${email.toLowerCase().trim()}`);
    }

    return Promise.resolve(ip);
  }
}
