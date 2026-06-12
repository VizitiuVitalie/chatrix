export type ActivityType = 'typing' | 'attachment';
export type ActivityState = 'start' | 'stop';

export interface UserActivityPayload {
  userId: number;
  chatId: number;
  type: ActivityType;
  state: ActivityState;
}

export interface UserActivityClientPayload {
  chatId: number;
  type: ActivityType;
  state: ActivityState;
}
