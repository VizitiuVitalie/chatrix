import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketIoServerHolder {
  private server: Server | null = null;

  public set(server: Server): void {
    this.server = server;
  }

  public get(): Server {
    if (!this.server) {
      throw new InternalServerErrorException(
        'Socket.io server has not been initialized yet — AppGateway.afterInit must run before any emit',
      );
    }

    return this.server;
  }
}
