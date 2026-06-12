import type { User } from '@/modules/auth/interfaces/user.interface';

export interface DraftConversationViewProps {
  peer: User;
  currentUser: User;
}
