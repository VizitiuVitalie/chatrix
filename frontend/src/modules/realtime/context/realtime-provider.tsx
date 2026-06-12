import {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { io, type Socket } from 'socket.io-client';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import { tokenStore } from '@/shared/api/token-store';

import type { RealtimeContextValue } from '../interfaces/realtime-context-value.interface';
import { RealtimeContext } from './realtime-context';

export function RealtimeProvider({
  children,
}: PropsWithChildren): ReactElement {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (userId === null) return;

    const instance = io({
      path: '/socket.io',
      auth: (cb) => {
        cb({ token: tokenStore.get() ?? '' });
      },
      transports: ['polling', 'websocket'],
    });

    const handleConnect = (): void => {
      setSocket(instance);
      setIsConnected(true);
    };
    const handleDisconnect = (): void => {
      setIsConnected(false);
    };
    const handleConnectError = (): void => {
      setIsConnected(false);
    };

    instance.on('connect', handleConnect);
    instance.on('disconnect', handleDisconnect);
    instance.on('connect_error', handleConnectError);

    return (): void => {
      instance.disconnect();
      instance.off('connect', handleConnect);
      instance.off('disconnect', handleDisconnect);
      instance.off('connect_error', handleConnectError);
    };
  }, [userId]);

  const value = useMemo<RealtimeContextValue>(
    () => ({ socket, isConnected }),
    [socket, isConnected],
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}
