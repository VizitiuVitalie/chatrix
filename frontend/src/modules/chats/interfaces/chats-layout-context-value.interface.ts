import type { User } from '@/modules/auth/interfaces/user.interface';

import type { NewChatMode } from './new-chat-mode.type';

export interface ChatsLayoutContextValue {
  newChatMode: NewChatMode;
  openNewChat: (mode: 'direct' | 'group') => void;
  closeNewChat: () => void;
  draftPeer: User | null;
  startDraft: (peer: User) => void;
  cancelDraft: () => void;
  isInfoPaneOpen: boolean;
  openInfoPane: () => void;
  closeInfoPane: () => void;
  infoPaneMemberUserId: number | null;
  openMemberProfile: (userId: number) => void;
  closeMemberProfile: () => void;
  isDraftPeerInfoOpen: boolean;
  openDraftPeerInfo: () => void;
  closeDraftPeerInfo: () => void;
}
