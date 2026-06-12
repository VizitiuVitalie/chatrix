import { AtSign, Info, Mail, X } from 'lucide-react';
import { useEffect, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useAttachmentViewer } from '@/modules/files/hooks/use-attachment-viewer';
import { userAvatarAsFile } from '@/modules/users/helpers/user-avatar-as-file.helper';
import { initials } from '@/shared/helpers/initials.helper';
import { AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { AvatarWithPresence } from '@/shared/ui/avatar-with-presence';

import type { DraftPeerInfoPaneProps } from '../interfaces/draft-peer-info-pane-props.interface';
import { CopyableInfoRow } from './copyable-info-row';

export function DraftPeerInfoPane({
  peer,
  onClose,
}: DraftPeerInfoPaneProps): ReactElement {
  const { t } = useTranslation();
  const { openViewer } = useAttachmentViewer();

  const displayName = peer.nickname.length > 0 ? peer.nickname : peer.username;
  const avatarUrl = peer.thumbnailUrl ?? peer.avatarUrl;
  const canViewAvatar = peer.avatarUrl !== null;

  function openAvatarViewer(): void {
    if (!canViewAvatar) return;
    openViewer(userAvatarAsFile(peer));
  }

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.history.pushState({ chatrixDraftPeerInfoOpen: true }, '');
    const handlePopState = (event: PopStateEvent): void => {
      const state = event.state as {
        chatrixDraftPeerInfoOpen?: boolean;
      } | null;
      if (state?.chatrixDraftPeerInfoOpen === true) return;
      onClose();
    };
    window.addEventListener('popstate', handlePopState);
    return (): void => {
      window.removeEventListener('popstate', handlePopState);
      const state = window.history.state as {
        chatrixDraftPeerInfoOpen?: boolean;
      } | null;
      if (state?.chatrixDraftPeerInfoOpen === true) {
        window.history.back();
      }
    };
  }, [onClose]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-border bg-card flex h-16 shrink-0 items-center justify-between border-b px-4 lg:px-6">
        <h2 className="text-foreground truncate text-base font-semibold">
          {t('chats.info.titleDirect')}
        </h2>
        <button
          type="button"
          aria-label={t('common.cancel')}
          onClick={onClose}
          className="text-muted-foreground hover:bg-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
        >
          <X className="h-5 w-5" />
        </button>
      </header>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <section className="flex flex-col items-center gap-3 p-6">
          {canViewAvatar ? (
            <button
              type="button"
              onClick={openAvatarViewer}
              aria-label={t('chats.info.viewAvatar')}
              className="focus-visible:ring-primary inline-flex cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2"
            >
              <AvatarWithPresence
                key={avatarUrl ?? 'no-avatar'}
                className="h-24 w-24"
                isOnline={peer.isOnline}
                dotClassName="bottom-2 right-2 h-3 w-3 ring-[3px]"
              >
                {avatarUrl !== null && (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                )}
                <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl font-semibold">
                  {displayName.length > 0 ? initials(displayName) : '?'}
                </AvatarFallback>
              </AvatarWithPresence>
            </button>
          ) : (
            <AvatarWithPresence
              key={avatarUrl ?? 'no-avatar'}
              className="h-24 w-24"
              isOnline={peer.isOnline}
              dotClassName="bottom-2 right-2 h-3 w-3 ring-[3px]"
            >
              {avatarUrl !== null && (
                <AvatarImage src={avatarUrl} alt={displayName} />
              )}
              <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl font-semibold">
                {displayName.length > 0 ? initials(displayName) : '?'}
              </AvatarFallback>
            </AvatarWithPresence>
          )}
          <h3 className="text-foreground text-lg font-semibold">
            {displayName}
          </h3>
          {peer.username !== '' && (
            <p className="text-muted-foreground text-sm">@{peer.username}</p>
          )}
        </section>

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
      </div>
    </div>
  );
}
