import { useEffect, useState } from 'react';

import { useSocket } from '@/modules/realtime/hooks/use-socket';

import type { BackendHealthStatus } from '../interfaces/backend-health-status.type';

export function useBackendHealth(): BackendHealthStatus {
  const { isConnected } = useSocket();
  const [browserOnline, setBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = (): void => {
      setBrowserOnline(true);
    };
    const handleOffline = (): void => {
      setBrowserOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return (): void => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!browserOnline) return 'offline';
  return isConnected ? 'online' : 'offline';
}
