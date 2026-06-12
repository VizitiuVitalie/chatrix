import { AtSign, Info, Mail } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useAttachmentViewer } from '@/modules/files/hooks/use-attachment-viewer';
import { userAvatarAsFile } from '@/modules/users/helpers/user-avatar-as-file.helper';
import { initials } from '@/shared/helpers/initials.helper';
import { AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { AvatarWithPresence } from '@/shared/ui/avatar-with-presence';

import { CopyableInfoRow } from './copyable-info-row';
import type { ChatInfoMemberProfileProps } from '../interfaces/chat-info-member-profile-props.interface';

export function ChatInfoMemberProfile({
  chat,
  userId,
}: ChatInfoMemberProfileProps): ReactElement {
  const { t } = useTranslation();
  const { openViewer } = useAttachmentViewer();

  const member = chat.members.find((m) => m.user.id === userId) ?? null;

  if (member === null) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-sm">
        {t('chats.info.memberProfile.notFound')}
      </div>
    );
  }

  const user = member.user;
  const displayName = user.nickname.length > 0 ? user.nickname : user.username;
  const canViewAvatar = user.avatarUrl !== null;
  const openAvatarViewer = (): void => {
    if (!canViewAvatar) return;
    openViewer(userAvatarAsFile(user));
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
              key={user.avatarUrl ?? 'no-avatar'}
              className="h-24 w-24"
              isOnline={user.isOnline}
              dotClassName="bottom-2 right-2 h-3 w-3 ring-[3px]"
            >
              {user.avatarUrl !== null && (
                <AvatarImage src={user.avatarUrl} alt={displayName} />
              )}
              <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl font-semibold">
                {displayName.length > 0 ? initials(displayName) : '?'}
              </AvatarFallback>
            </AvatarWithPresence>
          </button>
        ) : (
          <AvatarWithPresence
            key={user.avatarUrl ?? 'no-avatar'}
            className="h-24 w-24"
            isOnline={user.isOnline}
            dotClassName="bottom-2 right-2 h-3 w-3 ring-[3px]"
          >
            {user.avatarUrl !== null && (
              <AvatarImage src={user.avatarUrl} alt={displayName} />
            )}
            <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl font-semibold">
              {displayName.length > 0 ? initials(displayName) : '?'}
            </AvatarFallback>
          </AvatarWithPresence>
        )}
        <h3 className="text-foreground text-lg font-semibold">{displayName}</h3>
        <p className="text-muted-foreground text-sm">@{user.username}</p>
        {member.role !== 'member' && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              member.role === 'owner'
                ? 'bg-primary/15 text-primary'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {t(`chats.info.role.${member.role}`)}
          </span>
        )}
      </section>

      <section className="border-border space-y-1 border-t p-4">
        <CopyableInfoRow
          icon={<AtSign className="h-4 w-4" />}
          label={t('chats.info.username')}
          value={user.username}
        />
        {user.email !== null && (
          <CopyableInfoRow
            icon={<Mail className="h-4 w-4" />}
            label={t('chats.info.email')}
            value={user.email}
          />
        )}
        {user.bio !== null && user.bio.length > 0 && (
          <CopyableInfoRow
            icon={<Info className="h-4 w-4" />}
            label={t('chats.info.bio')}
            value={user.bio}
            multiline
          />
        )}
      </section>
    </>
  );
}
