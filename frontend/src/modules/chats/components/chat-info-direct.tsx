import { AtSign, Info, Mail } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useAttachmentViewer } from '@/modules/files/hooks/use-attachment-viewer';
import { userAvatarAsFile } from '@/modules/users/helpers/user-avatar-as-file.helper';
import { initials } from '@/shared/helpers/initials.helper';
import { AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { AvatarWithPresence } from '@/shared/ui/avatar-with-presence';

import { displayChat } from '../helpers/display-chat.helper';
import type { ChatInfoViewProps } from '../interfaces/chat-info-view-props.interface';
import { CopyableInfoRow } from './copyable-info-row';

export function ChatInfoDirect({
  chat,
  currentUserId,
}: ChatInfoViewProps): ReactElement {
  const { t } = useTranslation();
  const display = displayChat(chat, currentUserId);
  const peer = chat.members.find((m) => m.user.id !== currentUserId)?.user;
  const { openViewer } = useAttachmentViewer();
  const canViewAvatar = peer !== undefined && peer.avatarUrl !== null;
  const openAvatarViewer = (): void => {
    if (!canViewAvatar) return;
    openViewer(userAvatarAsFile(peer));
  };

  return (
    <>
      <section className="flex flex-col items-center gap-3 p-6">
        {canViewAvatar ? (
          <button
            type="button"
            onClick={openAvatarViewer}
            aria-label={t('chats.info.viewAvatar')}
            className="inline-flex cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <AvatarWithPresence
              key={display.avatarUrl ?? 'no-avatar'}
              className="h-24 w-24"
              isOnline={display.isOnline}
              dotClassName="bottom-2 right-2 h-3 w-3 ring-[3px]"
            >
              {display.avatarUrl !== null && (
                <AvatarImage src={display.avatarUrl} alt={display.name} />
              )}
              <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl font-semibold">
                {display.name.length > 0 ? initials(display.name) : '?'}
              </AvatarFallback>
            </AvatarWithPresence>
          </button>
        ) : (
          <AvatarWithPresence
            key={display.avatarUrl ?? 'no-avatar'}
            className="h-24 w-24"
            isOnline={display.isOnline}
            dotClassName="bottom-2 right-2 h-3 w-3 ring-[3px]"
          >
            {display.avatarUrl !== null && (
              <AvatarImage src={display.avatarUrl} alt={display.name} />
            )}
            <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl font-semibold">
              {display.name.length > 0 ? initials(display.name) : '?'}
            </AvatarFallback>
          </AvatarWithPresence>
        )}
        <h3 className="text-foreground text-lg font-semibold">
          {display.name}
        </h3>
        {peer?.username && (
          <p className="text-muted-foreground text-sm">@{peer.username}</p>
        )}
      </section>

      {peer && (
        <section className="border-border space-y-1 border-t p-4">
          <CopyableInfoRow
            icon={<AtSign className="h-4 w-4" />}
            label={t('chats.info.username')}
            value={peer.username}
          />
          {peer.email !== null && (
            <CopyableInfoRow
              icon={<Mail className="h-4 w-4" />}
              label={t('chats.info.email')}
              value={peer.email}
            />
          )}
          {peer.bio !== null && peer.bio.length > 0 && (
            <CopyableInfoRow
              icon={<Info className="h-4 w-4" />}
              label={t('chats.info.bio')}
              value={peer.bio}
              multiline
            />
          )}
        </section>
      )}
    </>
  );
}
