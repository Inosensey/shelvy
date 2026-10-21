// guards/auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/PrismaConfig/prisma.service';

//types
import { AuthenticatedRequest } from 'src/types/request';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.token as string;

    if (!token)
      throw new UnauthorizedException('No authentication token found');

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException('Server configuration error');

    let userId: string;
    try {
      ({ userId } = jwt.verify(token, secret) as { userId: string });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, organizationId: true },
    });

    if (!user) throw new UnauthorizedException('User no longer exists');

    (request as AuthenticatedRequest).user = {
      userId: user.id,
      userType: user.role,
      organizationId: user.organizationId, // may be null
    };

    return true;
  }
}
