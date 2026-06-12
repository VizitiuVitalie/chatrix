import { Check, Pencil, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';

import { getErrorMessage } from '@/shared/api/helpers/api-error.helper';

import { GROUP_NAME_MAX_LENGTH } from '../constants/chats.constants';
import { useRenameChatMutation } from '../hooks/use-rename-chat-mutation';
import type { ChatInfoGroupRenameProps } from '../interfaces/chat-info-group-rename-props.interface';

export function ChatInfoGroupRename({
  chatId,
  currentName,
  canRename,
}: ChatInfoGroupRenameProps): ReactElement {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draftName, setDraftName] = useState<string>(currentName);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const mutation = useRenameChatMutation();
  const { mutate, isPending } = mutation;

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleStart = useCallback(() => {
    setDraftName(currentName);
    setErrorMessage(null);
    setIsEditing(true);
  }, [currentName]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setErrorMessage(null);
  }, []);

  const submit = useCallback(() => {
    const trimmed = draftName.trim();
    if (trimmed.length === 0) {
      setErrorMessage(t('chats.info.rename.errorBlank'));
      return;
    }
    if (trimmed === currentName) {
      setIsEditing(false);
      setErrorMessage(null);
      return;
    }
    setErrorMessage(null);
    mutate(
      { chatId, name: trimmed },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
        },
      },
    );
  }, [chatId, draftName, currentName, mutate, t]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
    },
    [handleCancel],
  );

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <h3 className="text-foreground text-lg font-semibold">{currentName}</h3>
        {canRename && (
          <button
            type="button"
            onClick={handleStart}
            aria-label={t('chats.info.rename.editLabel')}
            className="text-muted-foreground hover:bg-secondary inline-flex h-7 w-7 items-center justify-center rounded-full"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex w-full max-w-[280px] flex-col items-stretch gap-2"
    >
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draftName}
          onChange={(e) => {
            setDraftName(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          maxLength={GROUP_NAME_MAX_LENGTH}
          className="bg-secondary text-foreground focus:ring-ring focus:bg-card h-9 flex-1 rounded-lg border-0 px-3 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending}
          aria-label={t('common.save')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          aria-label={t('common.cancel')}
          className="text-muted-foreground hover:bg-secondary inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {errorMessage !== null && (
        <p className="text-destructive text-xs">{errorMessage}</p>
      )}
    </form>
  );
}
