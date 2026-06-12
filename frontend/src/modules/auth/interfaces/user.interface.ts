import type { Theme } from '@/modules/users/interfaces/theme.type';

export interface User {
  id: number;
  username: string;
  email: string | null;
  nickname: string;
  avatarUrl: string | null;
  thumbnailUrl: string | null;
  bio: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
  pushEnabled: boolean;
  theme: Theme;
  createdAt: string;
  updatedAt: string;
}
