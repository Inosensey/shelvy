// guards/alreadyAuth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AlreadyAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.token as string;

    if (token) {
      try {
        const secret = process.env.JWT_SECRET!;
        jwt.verify(token, secret);
        throw new BadRequestException(
          'You are already logged in. Please log out first.',
        );
      } catch (error) {
        throw new BadRequestException(error);
      }
    }

    return true;
  }
}
