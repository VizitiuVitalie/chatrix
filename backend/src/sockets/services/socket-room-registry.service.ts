import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AppLogger } from '../../common/logger/app-logger.service';

@Injectable()
export class SocketRoomRegistry {
  private readonly userSockets = new Map<number, Set<Socket>>();

  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(SocketRoomRegistry.name);
  }

  public register(userId: number, socket: Socket): void {
    let set = this.userSockets.get(userId);

    if (!set) {
      set = new Set();
      this.userSockets.set(userId, set);
    }

    set.add(socket);

    this.logger.debug(
      'register',
      { userId, socketId: socket.id, totalForUser: set.size },
      'Socket registered',
    );
  }

  public unregister(userId: number, socket: Socket): void {
    const set = this.userSockets.get(userId);

    if (!set) return;

    set.delete(socket);

    if (set.size === 0) {
      this.userSockets.delete(userId);
    }

    this.logger.debug(
      'unregister',
      { userId, socketId: socket.id, remaining: set.size },
      'Socket unregistered',
    );
  }

  public getSocketsForUser(userId: number): Set<Socket> {
    return this.userSockets.get(userId) ?? new Set();
  }

  public isUserOnline(userId: number): boolean {
    const set = this.userSockets.get(userId);
    return set !== undefined && set.size > 0;
  }

  public joinUserToRoom(userId: number, room: string): void {
    for (const socket of this.getSocketsForUser(userId)) {
      void socket.join(room);
    }
  }

  public removeUserFromRoom(userId: number, room: string): void {
    for (const socket of this.getSocketsForUser(userId)) {
      void socket.leave(room);
    }
  }
}
