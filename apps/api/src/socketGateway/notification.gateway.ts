import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/PrismaConfig/prisma.service';

// 1. Define the shape of your verified JWT payload
// interface JwtPayload {
//   userId: string;
//   userType: string;
//   organizationId: string | null;
// }

// 2. Define the shape of the custom metadata you want to attach to the socket
interface SocketData {
  userId: string;
  organizationId: string | null;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket<any, any, any, SocketData>) {
    try {
      const rawCookies = client.handshake.headers.cookie;

      const tokenCookie = rawCookies
        ?.split(';')
        ?.find((c) => c.trim().startsWith('token='));

      const token = tokenCookie ? tokenCookie.split('=')[1] : undefined;

      // const authHeader = client.handshake.headers?.authorization;

      // const token =
      //   (client.handshake.auth?.token as string) ||
      //   (authHeader?.startsWith('Bearer ')
      //     ? authHeader.split(' ')[1]
      //     : undefined);

      if (!token) {
        client.emit('exception', {
          success: false,
          message: 'Authentication token missing.',
        });
        client.disconnect();
        return;
      }

      const session = await this.prisma.session.findUnique({
        where: { token },
        include: {
          user: { select: { id: true, role: true, organizationId: true } },
        },
      });
      if (!session || !session.isValid || session.expiresAt < new Date()) {
        throw new Error('Invalid session');
      }

      const { id: userId, role, organizationId } = session.user;

      client.data.userId = userId;

      const orgId = organizationId;
      if (orgId) {
        await client.join(`org:${orgId}`);
        console.log(`Client ${client.id} joined room -> org:${orgId}`);

        await client.join(`org:${orgId}:${role.toLowerCase()}`);
      }

      await client.join(`user:${userId}`);

      client.data.userId = userId;
      client.data.organizationId = orgId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Invalid token context';

      client.emit('exception', {
        success: false,
        message: `Connection unauthorized: ${errorMessage}`,
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket<any, any, any, SocketData>) {
    console.log(`Client disconnected safely: ${client.id}`);
  }

  emitToOrg(orgId: string, event: string, data: unknown) {
    this.server.to(`org:${orgId}`).emit(event, data);
  }

  testSocket(orgId: string, event: string, data: unknown) {
    this.server.to(`org:${orgId}`).emit(event, data);
  }
}
