import type { ActivityType } from './user-activity-payload.interface';

export interface ChatActivityRecord {
  userId: number;
  type: ActivityType;
  at: number;
}
