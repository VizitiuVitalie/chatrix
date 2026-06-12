import { useEffect, useState, type ReactElement, type ReactNode } from 'react';

import { useAuth } from '@/modules/auth/hooks/use-auth';

import {
  ACTIVITY_SWEEP_MS,
  ACTIVITY_TTL_MS,
} from '../constants/activity.constants';
import { RealtimeEvent } from '../constants/realtime-events.constants';
import { useSocket } from '../hooks/use-socket';
import type { ChatActivityRecord } from '../interfaces/chat-activity-record.interface';
import type { UserActivityPayload } from '../interfaces/user-activity-payload.interface';
import { ChatActivityContext } from './chat-activity-context';

export function ChatActivityProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const { socket } = useSocket();
  const { user } = useAuth();
  const currentUserId = user?.id ?? -1;
  const [recordsByChat, setRecordsByChat] = useState<
    Map<number, ChatActivityRecord[]>
  >(new Map());

  useEffect(() => {
    if (!socket) return undefined;
    const handler = (payload: UserActivityPayload): void => {
      if (payload.userId === currentUserId) return;
      setRecordsByChat((prev) => {
        const current = prev.get(payload.chatId) ?? [];
        const others = current.filter(
          (r) => !(r.userId === payload.userId && r.type === payload.type),
        );
        const nextForChat =
          payload.state === 'start'
            ? [
                ...others,
                { userId: payload.userId, type: payload.type, at: Date.now() },
              ]
            : others;
        const next = new Map(prev);
        if (nextForChat.length > 0) next.set(payload.chatId, nextForChat);
        else next.delete(payload.chatId);
        return next;
      });
    };
    socket.on(RealtimeEvent.USER_ACTIVITY, handler);
    return (): void => {
      socket.off(RealtimeEvent.USER_ACTIVITY, handler);
    };
  }, [socket, currentUserId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const cutoff = Date.now() - ACTIVITY_TTL_MS;
      setRecordsByChat((prev) => {
        let changed = false;
        const next = new Map<number, ChatActivityRecord[]>();
        for (const [chatId, records] of prev) {
          const kept = records.filter((r) => r.at >= cutoff);
          if (kept.length !== records.length) changed = true;
          if (kept.length > 0) next.set(chatId, kept);
        }
        return changed ? next : prev;
      });
    }, ACTIVITY_SWEEP_MS);
    return (): void => {
      window.clearInterval(id);
    };
  }, []);

  return (
    <ChatActivityContext.Provider value={recordsByChat}>
      {children}
    </ChatActivityContext.Provider>
  );
}
