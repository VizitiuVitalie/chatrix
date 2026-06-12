import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppGateway } from '../app.gateway';
import { ChatsModule } from '../modules/chats/chats.module';
import { UsersModule } from '../modules/users/users.module';
import { SocketAuthService } from './services/socket-auth.service';
import { SocketIoServerHolder } from './services/socket-io-server.holder';
import { SocketRoomRegistry } from './services/socket-room-registry.service';
import { WsEmitter } from './services/ws-emitter.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
      }),
      inject: [ConfigService],
    }),
    ChatsModule,
    UsersModule,
  ],
  providers: [
    AppGateway,
    SocketAuthService,
    SocketIoServerHolder,
    SocketRoomRegistry,
    WsEmitter,
  ],
  exports: [WsEmitter, SocketRoomRegistry, SocketIoServerHolder],
})
export class SocketsModule {}
