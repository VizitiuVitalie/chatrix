import { useCallback, useEffect, useRef } from 'react';

import { RealtimeEvent } from '../constants/realtime-events.constants';
import {
  ACTIVITY_REFRESH_MS,
  TYPING_IDLE_MS,
} from '../constants/activity.constants';
import type { ChatActivityEmitter } from '../interfaces/chat-activity-emitter.interface';
import type {
  ActivityState,
  ActivityType,
  UserActivityClientPayload,
} from '../interfaces/user-activity-payload.interface';
import { useSocket } from './use-socket';

export function useChatActivityEmitter(
  chatId: number | null,
): ChatActivityEmitter {
  const { socket } = useSocket();
  const socketRef = useRef(socket);
  const chatIdRef = useRef(chatId);
  const refreshTimersRef = useRef<Map<ActivityType, number>>(new Map());
  const idleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);
  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  const emit = useCallback((type: ActivityType, state: ActivityState): void => {
    const socketInstance = socketRef.current;
    const id = chatIdRef.current;
    if (!socketInstance || id === null) return;
    const payload: UserActivityClientPayload = { chatId: id, type, state };
    socketInstance.emit(RealtimeEvent.USER_ACTIVITY, payload);
  }, []);

  const startActivity = useCallback(
    (type: ActivityType): void => {
      if (chatIdRef.current === null) return;
      if (refreshTimersRef.current.has(type)) return;
      emit(type, 'start');
      const timer = window.setInterval(() => {
        emit(type, 'start');
      }, ACTIVITY_REFRESH_MS);
      refreshTimersRef.current.set(type, timer);
    },
    [emit],
  );

  const stopActivity = useCallback(
    (type: ActivityType): void => {
      const timer = refreshTimersRef.current.get(type);
      if (timer === undefined) return;
      window.clearInterval(timer);
      refreshTimersRef.current.delete(type);
      emit(type, 'stop');
    },
    [emit],
  );

  const notifyTyping = useCallback((): void => {
    startActivity('typing');
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = window.setTimeout(() => {
      idleTimerRef.current = null;
      stopActivity('typing');
    }, TYPING_IDLE_MS);
  }, [startActivity, stopActivity]);

  const stopTyping = useCallback((): void => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    stopActivity('typing');
  }, [stopActivity]);

  const setUploading = useCallback(
    (uploading: boolean): void => {
      if (uploading) startActivity('attachment');
      else stopActivity('attachment');
    },
    [startActivity, stopActivity],
  );

  useEffect(() => {
    const refreshTimers = refreshTimersRef.current;
    const idleTimer = idleTimerRef;
    return (): void => {
      if (idleTimer.current !== null) {
        window.clearTimeout(idleTimer.current);
        idleTimer.current = null;
      }
      for (const [type, timer] of refreshTimers) {
        window.clearInterval(timer);
        emit(type, 'stop');
      }
      refreshTimers.clear();
    };
  }, [emit]);

  return { notifyTyping, stopTyping, setUploading };
}
