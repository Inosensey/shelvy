import { Request } from 'express';
import { Role } from 'generated/prisma/enums';

export interface UserPayload {
  userId: string;
  userType: Role;
  organizationId: string | null;
}

export type AuthenticatedRequest = Request & {
  user: UserPayload;
};
