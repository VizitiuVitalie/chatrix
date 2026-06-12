import { Injectable } from '@nestjs/common';
import { AppLogger } from '../../common/logger/app-logger.service';
import { SocketIoServerHolder } from './socket-io-server.holder';
import { SocketRoomRegistry } from './socket-room-registry.service';

@Injectable()
export class WsEmitter {
  constructor(
    private readonly serverHolder: SocketIoServerHolder,
    private readonly roomRegistry: SocketRoomRegistry,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(WsEmitter.name);
  }

  public toChatRoom(chatId: number, event: string, payload: unknown): void {
    this.serverHolder.get().to(`chat:${chatId}`).emit(event, payload);

    this.logger.debug(
      'toChatRoom',
      { chatId, event },
      'WS event sent to chat room',
    );
  }

  public toUser(userId: number, event: string, payload: unknown): void {
    this.serverHolder.get().to(`user:${userId}`).emit(event, payload);

    this.logger.debug(
      'toUser',
      { userId, event },
      'WS event sent to user room',
    );
  }

  public joinUserToChatRoom(userId: number, chatId: number): void {
    this.roomRegistry.joinUserToRoom(userId, `chat:${chatId}`);
  }

  public removeUserFromChatRoom(userId: number, chatId: number): void {
    this.roomRegistry.removeUserFromRoom(userId, `chat:${chatId}`);
  }
}
