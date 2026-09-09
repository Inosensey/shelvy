import { Request } from 'express';

export interface UserPayload {
  userId: string;
  userType: string;
}

export type AuthenticatedRequest = Request & {
  user: UserPayload;
};
