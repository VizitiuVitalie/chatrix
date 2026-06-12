import { Camera, Loader2, Users, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useClearChatAvatarMutation } from '@/modules/files/hooks/use-clear-chat-avatar-mutation';
import { useUploadChatAvatarMutation } from '@/modules/files/hooks/use-upload-chat-avatar-mutation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

import type { ChatAvatarHeroEditorProps } from '../interfaces/chat-avatar-hero-editor-props.interface';

export function ChatAvatarHeroEditor({
  chat,
  chatName,
  canEdit,
  onAvatarClick,
}: ChatAvatarHeroEditorProps): ReactElement {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState<boolean>(false);

  const uploadMutation = useUploadChatAvatarMutation(chat.id);
  const clearMutation = useClearChatAvatarMutation(chat.id);
  const isUploading = uploadMutation.isPending;
  const isClearing = clearMutation.isPending;
  const isBusy = isUploading || isClearing;

  const hasAvatar = chat.avatarUrl !== null;

  function handleCameraClick(): void {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    uploadMutation.mutate(file);
  }

  function handleConfirmClear(): void {
    clearMutation.mutate(undefined, {
      onSuccess: () => {
        setIsConfirmClearOpen(false);
      },
    });
  }

  return (
    <div className="relative">
      {hasAvatar && chat.avatarUrl !== null ? (
        <button
          type="button"
          onClick={onAvatarClick}
          aria-label={t('chats.info.viewAvatar')}
          className="inline-flex cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Avatar key={chat.avatarUrl} className="h-24 w-24 shrink-0">
            <AvatarImage src={chat.avatarUrl} alt={chatName} />
            <AvatarFallback className="bg-accent/60 text-foreground">
              <Users className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
        </button>
      ) : (
        <Avatar key="no-avatar" className="h-24 w-24 shrink-0">
          <AvatarFallback className="bg-accent/60 text-foreground">
            <Users className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
      )}

      {canEdit && (
        <>
          <button
            type="button"
            onClick={handleCameraClick}
            disabled={isBusy}
            aria-label={t('chats.info.changeAvatar')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 ring-card absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full shadow-md ring-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>

          {hasAvatar && (
            <button
              type="button"
              onClick={() => {
                setIsConfirmClearOpen(true);
              }}
              disabled={isBusy}
              aria-label={t('chats.info.removeAvatar')}
              className="bg-card text-muted-foreground border-border hover:border-destructive/40 hover:text-destructive ring-card absolute right-0 top-0 inline-flex h-7 w-7 items-center justify-center rounded-full border shadow-sm ring-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isClearing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileInputChange}
          />
        </>
      )}

      <AlertDialog
        open={isConfirmClearOpen}
        onOpenChange={setIsConfirmClearOpen}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {t('chats.info.removeAvatarConfirm.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('chats.info.removeAvatarConfirm.description')}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConfirmClear();
              }}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('chats.info.removeAvatarConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
