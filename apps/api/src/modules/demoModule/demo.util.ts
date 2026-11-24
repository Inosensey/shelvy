import { ForbiddenException } from '@nestjs/common';
import { DEMO } from './demo.data';

const DEMO_USER_IDS: readonly string[] = Object.values(DEMO.users).map(
  (u) => u.id,
);

export const isDemoUser = (userId?: string | null): boolean =>
  !!userId && DEMO_USER_IDS.includes(userId);

/** Call at the top of any action the public demo must not perform. */
export function assertNotDemo(userId?: string | null): void {
  if (isDemoUser(userId)) {
    throw new ForbiddenException('This action is disabled in the demo.');
  }
}
