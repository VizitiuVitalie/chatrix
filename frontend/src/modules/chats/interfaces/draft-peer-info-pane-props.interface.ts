import type { User } from '@/modules/auth/interfaces/user.interface';

export interface DraftPeerInfoPaneProps {
  peer: User;
  onClose: () => void;
}
