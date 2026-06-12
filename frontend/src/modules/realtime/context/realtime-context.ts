import { createContext } from 'react';

import type { RealtimeContextValue } from '../interfaces/realtime-context-value.interface';

export const RealtimeContext = createContext<RealtimeContextValue | null>(null);
