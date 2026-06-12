export interface ChatDisplay {
  name: string;
  avatarUrl: string | null;
  isGroup: boolean;
  isOnline: boolean;
  lastSeenAt: string | null;
}
