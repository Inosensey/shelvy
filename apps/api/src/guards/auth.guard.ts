// guards/auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

//types
import { AuthenticatedRequest } from 'src/types/request';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const token = request.cookies?.token as string;

    if (!token) {
      throw new UnauthorizedException('No authentication token found');
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new UnauthorizedException('Server configuration error');
      }
      const decoded = jwt.verify(token, secret) as {
        userId: string;
        userType: string;
      };

      (request as AuthenticatedRequest).user = decoded;

      return true;
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Invalid token',
      );
    }
  }
}
