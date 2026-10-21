import { Request } from 'express';

export interface UserPayload {
  userId: string;
  userType: string;
  organizationId: string | null;
}

export type AuthenticatedRequest = Request & {
  user: UserPayload;
};
