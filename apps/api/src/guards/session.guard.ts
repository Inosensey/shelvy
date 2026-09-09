import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionService } from 'src/modules/authModule/session.service';
import { Request } from 'express';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = request.cookies?.token as string;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const isValid = await this.sessionService.validateSession(token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return true;
  }
}
