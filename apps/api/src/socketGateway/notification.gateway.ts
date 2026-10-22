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
      const ticket = client.handshake.auth?.token as string | undefined;

      if (!ticket) {
        console.warn('Socket rejected: no ticket');
        client.emit('exception', {
          success: false,
          message: 'Authentication token missing.',
        });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<{
        userId: string;
        purpose?: string;
      }>(ticket, {
        secret: process.env.JWT_SECRET,
      });
      if (payload.purpose !== 'socket') throw new Error('Wrong token type');

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true, organizationId: true },
      });
      if (!user) throw new Error('User not found');

      const { id: userId, role, organizationId: orgId } = user;
      client.data.userId = userId;
      client.data.organizationId = orgId;

      if (orgId) {
        await client.join(`org:${orgId}`);
        console.log(`Client ${client.id} joined room -> org:${orgId}`);
        await client.join(`org:${orgId}:${role.toLowerCase()}`);
      }
      await client.join(`user:${userId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Invalid token context';
      console.warn('Socket auth failed:', errorMessage); // new: shows up in Render logs
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
