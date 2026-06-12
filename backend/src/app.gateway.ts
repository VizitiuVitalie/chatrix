import { UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppLogger } from './common/logger/app-logger.service';
import { ClientEvent, type UserPresencePayload } from './events/client-events';
import type { AuthenticatedUser } from './modules/auth/interfaces/authenticated-user.interface';
import { ChatsService } from './modules/chats/chats.service';
import { ActivityClientDto } from './modules/users/dto/activity-client.dto';
import { UsersService } from './modules/users/users.service';
import { SocketAuthService } from './sockets/services/socket-auth.service';
import { SocketIoServerHolder } from './sockets/services/socket-io-server.holder';
import { SocketRoomRegistry } from './sockets/services/socket-room-registry.service';
import { WsEmitter } from './sockets/services/ws-emitter.service';

@WebSocketGateway({
  cors: {
    origin: (process.env.FRONTEND_ORIGIN ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0),
    credentials: true,
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server!: Server;

  constructor(
    private readonly socketAuth: SocketAuthService,
    private readonly roomRegistry: SocketRoomRegistry,
    private readonly serverHolder: SocketIoServerHolder,
    private readonly chatsService: ChatsService,
    private readonly usersService: UsersService,
    private readonly wsEmitter: WsEmitter,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AppGateway.name);
  }

  public afterInit(server: Server): void {
    this.serverHolder.set(server);

    server.use((socket, next) => {
      this.socketAuth
        .verifyHandshake(socket)
        .then((user) => {
          (socket.data as { user: AuthenticatedUser }).user = user;
          next();
        })
        .catch((err: Error) => next(err));
    });

    this.logger.info(
      'afterInit',
      {},
      'Socket.io server initialized with auth middleware',
    );
  }

  public async handleConnection(socket: Socket): Promise<void> {
    const user = (socket.data as { user?: AuthenticatedUser }).user;

    if (!user) {
      socket.disconnect(true);
      return;
    }

    void socket.join(`user:${user.id}`);

    const chatIds = await this.chatsService.findChatIdsForUser(user.id);

    for (const id of chatIds) {
      void socket.join(`chat:${id}`);
    }

    this.roomRegistry.register(user.id, socket);

    this.logger.info(
      'handleConnection',
      { userId: user.id, socketId: socket.id, joinedChats: chatIds.length },
      'WS connected',
    );

    const totalSockets = this.roomRegistry.getSocketsForUser(user.id).size;
    if (totalSockets === 1) {
      const payload: UserPresencePayload = {
        userId: user.id,
        isOnline: true,
      };

      for (const chatId of chatIds) {
        this.wsEmitter.toChatRoom(chatId, ClientEvent.USER_PRESENCE, payload);
      }
    }
  }

  public async handleDisconnect(socket: Socket): Promise<void> {
    const user = (socket.data as { user?: AuthenticatedUser }).user;
    if (!user) return;

    this.roomRegistry.unregister(user.id, socket);
    this.usersService.drainActivitiesOnDisconnect(socket.id, user.id);

    this.logger.info(
      'handleDisconnect',
      { userId: user.id, socketId: socket.id },
      'WS disconnected',
    );

    const totalSockets = this.roomRegistry.getSocketsForUser(user.id).size;

    if (totalSockets === 0) {
      const lastSeenAt = new Date();
      await this.usersService.markOffline(user.id, lastSeenAt);
      const chatIds = await this.chatsService.findChatIdsForUser(user.id);
      const payload: UserPresencePayload = {
        userId: user.id,
        isOnline: false,
        lastSeenAt,
      };

      for (const chatId of chatIds) {
        this.wsEmitter.toChatRoom(chatId, ClientEvent.USER_PRESENCE, payload);
      }
    }
  }

  @SubscribeMessage(ClientEvent.USER_ACTIVITY)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  public handleUserActivity(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: ActivityClientDto,
  ): void {
    const user = (socket.data as { user?: AuthenticatedUser }).user;
    if (!user) return;

    if (!socket.rooms.has(`chat:${body.chatId}`)) {
      this.logger.warn(
        'handleUserActivity',
        { userId: user.id, chatId: body.chatId },
        'Socket not in chat room, dropping activity',
      );

      return;
    }

    this.usersService.recordUserActivity(socket.id, user.id, body);
  }
}
