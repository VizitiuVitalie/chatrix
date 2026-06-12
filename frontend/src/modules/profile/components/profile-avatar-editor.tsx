import { Camera, Loader2, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useAttachmentViewer } from '@/modules/files/hooks/use-attachment-viewer';
import { userAvatarAsFile } from '@/modules/users/helpers/user-avatar-as-file.helper';
import { initials } from '@/shared/helpers/initials.helper';
import { AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { AvatarWithPresence } from '@/shared/ui/avatar-with-presence';

import type { ProfileAvatarEditorProps } from '../interfaces/profile-avatar-editor-props.interface';

export function ProfileAvatarEditor({
  user,
  pendingTarget,
  onPendingChange,
  isSaving,
}: ProfileAvatarEditorProps): ReactElement {
  const { t } = useTranslation();
  const { openViewer } = useAttachmentViewer();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!(pendingTarget instanceof File)) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingTarget);
    setPreviewUrl(url);
    return (): void => {
      URL.revokeObjectURL(url);
    };
  }, [pendingTarget]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const displayName = user.nickname.length > 0 ? user.nickname : user.username;
  const fallbackText = initials(displayName) || '?';

  const renderedAvatarUrl: string | null =
    pendingTarget === 'clear'
      ? null
      : previewUrl !== null
        ? previewUrl
        : user.avatarUrl;

  const avatarKey = renderedAvatarUrl ?? 'no-avatar';

  const showActionButton =
    pendingTarget !== 'unchanged' || user.avatarUrl !== null;
  const isUndoable = pendingTarget !== 'unchanged';

  const canViewAvatar =
    pendingTarget === 'unchanged' && user.avatarUrl !== null;

  const avatarNode = (
    <AvatarWithPresence
      key={avatarKey}
      className="h-32 w-32"
      isOnline={user.isOnline}
      dotClassName="bottom-3 right-3 h-4 w-4 ring-[3px]"
    >
      {renderedAvatarUrl !== null && (
        <AvatarImage src={renderedAvatarUrl} alt={displayName} />
      )}
      <AvatarFallback className="bg-secondary text-secondary-foreground text-3xl font-semibold">
        {fallbackText}
      </AvatarFallback>
    </AvatarWithPresence>
  );

  return (
    <div className="group/avatar relative">
      {canViewAvatar ? (
        <button
          type="button"
          onClick={() => {
            openViewer(userAvatarAsFile(user));
          }}
          aria-label={t('profile.avatar.viewLabel')}
          className="focus-visible:ring-primary inline-flex cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2"
        >
          {avatarNode}
        </button>
      ) : (
        avatarNode
      )}

      <button
        type="button"
        onClick={() => {
          fileInputRef.current?.click();
        }}
        disabled={isSaving}
        aria-label={t('profile.avatar.uploadLabel')}
        className="bg-primary text-primary-foreground hover:bg-primary/90 ring-card absolute bottom-1 right-1 inline-flex h-10 w-10 items-center justify-center rounded-full shadow-md ring-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </button>

      {showActionButton && (
        <button
          type="button"
          onClick={() => {
            if (isUndoable) {
              onPendingChange('unchanged');
            } else {
              onPendingChange('clear');
            }
          }}
          disabled={isSaving}
          aria-label={
            isUndoable
              ? t('profile.avatar.undoLabel')
              : t('profile.avatar.clearLabel')
          }
          className={`bg-card text-muted-foreground border-border ring-card absolute top-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-sm ring-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isUndoable
              ? 'hover:border-primary/40 hover:text-primary'
              : 'hover:border-destructive/40 hover:text-destructive'
          }`}
        >
          {isUndoable ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          onPendingChange(file);
        }}
      />
    </div>
  );
}
