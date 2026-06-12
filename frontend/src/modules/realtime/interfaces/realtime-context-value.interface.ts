import type { Socket } from 'socket.io-client';

export interface RealtimeContextValue {
  socket: Socket | null;
  isConnected: boolean;
}
