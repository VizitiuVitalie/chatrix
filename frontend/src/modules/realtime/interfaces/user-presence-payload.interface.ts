export interface UserPresencePayload {
  userId: number;
  isOnline: boolean;
  lastSeenAt?: string;
}
