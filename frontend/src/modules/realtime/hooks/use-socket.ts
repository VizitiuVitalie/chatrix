import { useContext } from 'react';

import { RealtimeContext } from '../context/realtime-context';
import type { RealtimeContextValue } from '../interfaces/realtime-context-value.interface';

export function useSocket(): RealtimeContextValue {
  const value = useContext(RealtimeContext);
  if (value === null) {
    throw new Error('useSocket must be used inside <RealtimeProvider>');
  }
  return value;
}
