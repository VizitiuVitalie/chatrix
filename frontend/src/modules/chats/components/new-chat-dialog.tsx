import { Loader2, Search, X } from 'lucide-react';
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactElement,
} from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import type { User } from '@/modules/auth/interfaces/user.interface';
import { USER_SEARCH_MIN_QUERY_LENGTH } from '@/modules/users/constants/users.constants';
import { useUserSearchQuery } from '@/modules/users/hooks/use-user-search-query';
import { getErrorMessage } from '@/shared/api/helpers/api-error.helper';
import { initials } from '@/shared/helpers/initials.helper';
import { useIsLg } from '@/shared/hooks/use-is-lg';
import { useKeyboardAwareDialogStyle } from '@/shared/hooks/use-keyboard-aware-dialog-style';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

import { useAuth } from '@/modules/auth/hooks/use-auth';

import {
  GROUP_NAME_MAX_LENGTH,
  INSTANT_DIALOG_CLOSE_CLASS,
  IOS_KEYBOARD_CLOSE_BEFORE_NAVIGATION_TIMEOUT_MS,
  IOS_KEYBOARD_CLOSED_STABLE_FRAMES,
  IS_IOS,
  VISUAL_VIEWPORT_STABLE_EPSILON_PX,
} from '../constants/chats.constants';
import { KEYBOARD_OPEN_DELTA_PX } from '@/shared/constants/ios-keyboard-viewport.constants';
import { findExistingDirectChat } from '../helpers/find-existing-direct-chat.helper';
import { useChatsLayoutContext } from '../hooks/use-chats-layout-context';
import { useChatsQuery } from '../hooks/use-chats-query';
import { useCreateGroupChatMutation } from '../hooks/use-create-group-chat-mutation';
import type { NewChatDialogProps } from '../interfaces/new-chat-dialog-props.interface';
import { NewChatSearchResults } from './new-chat-search-results';

function getActiveTextControl(): HTMLInputElement | HTMLTextAreaElement | null {
  const active = document.activeElement;
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement
  ) {
    return active;
  }
  return null;
}

function isVisualKeyboardOpen(): boolean {
  const viewport = window.visualViewport;
  if (viewport === null) return false;
  return window.innerHeight - viewport.height > KEYBOARD_OPEN_DELTA_PX;
}

function runWhenVisualKeyboardClosed(action: () => void): void {
  const viewport = window.visualViewport;
  if (viewport === null) {
    window.setTimeout(action, 0);
    return;
  }

  let stableFrames = 0;
  let done = false;
  let frameId: number | null = null;
  let timeoutId: number | null = null;
  let lastViewportHeight = viewport.height;

  const cleanup = (): void => {
    viewport.removeEventListener('resize', scheduleCheck);
    viewport.removeEventListener('scroll', scheduleCheck);
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const finish = (): void => {
    if (done) return;
    done = true;
    cleanup();
    action();
  };

  const check = (): void => {
    frameId = null;
    const nextViewportHeight = viewport.height;
    const heightIsStable =
      Math.abs(nextViewportHeight - lastViewportHeight) <=
      VISUAL_VIEWPORT_STABLE_EPSILON_PX;
    lastViewportHeight = nextViewportHeight;
    stableFrames =
      !isVisualKeyboardOpen() && heightIsStable ? stableFrames + 1 : 0;
    if (stableFrames >= IOS_KEYBOARD_CLOSED_STABLE_FRAMES) {
      finish();
      return;
    }
    scheduleCheck();
  };

  function scheduleCheck(): void {
    if (frameId !== null || done) return;
    frameId = window.requestAnimationFrame(check);
  }

  viewport.addEventListener('resize', scheduleCheck, { passive: true });
  viewport.addEventListener('scroll', scheduleCheck, { passive: true });
  timeoutId = window.setTimeout(
    finish,
    IOS_KEYBOARD_CLOSE_BEFORE_NAVIGATION_TIMEOUT_MS,
  );
  scheduleCheck();
}

export function NewChatDialog({
  mode,
  onClose,
}: NewChatDialogProps): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isLg = useIsLg();
  const [query, setQuery] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState(mode);
  const [instantClose, setInstantClose] = useState<boolean>(false);

  const {
    query: searchResult,
    debouncedQuery,
    isBelowMinLength,
  } = useUserSearchQuery(query);

  const groupMutation = useCreateGroupChatMutation();
  const { mutate: groupMutate, isPending: isGroupMutationPending } =
    groupMutation;
  const { startDraft } = useChatsLayoutContext();
  const { user } = useAuth();
  const chatsQuery = useChatsQuery();

  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (mode === null) return;
    setDisplayMode(mode);
    setQuery('');
    setGroupName('');
    setSelectedMembers([]);
    setSubmitError(null);
    setInstantClose(false);
  }, [mode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const selectedIds = useMemo(
    () => new Set(selectedMembers.map((m) => m.id)),
    [selectedMembers],
  );

  const runAfterKeyboardDismiss = useCallback(
    (action: () => void): void => {
      if (!IS_IOS || isLg) {
        action();
        return;
      }

      const activeTextControl = getActiveTextControl();
      const shouldWaitForKeyboard = isVisualKeyboardOpen();
      if (activeTextControl !== null) {
        activeTextControl.blur();
      }
      if (!shouldWaitForKeyboard) {
        action();
        return;
      }
      runWhenVisualKeyboardClosed(action);
    },
    [isLg],
  );

  const closeForNavigation = useCallback((): void => {
    flushSync(() => {
      setInstantClose(true);
      onClose();
    });
  }, [onClose]);

  const hideForNavigation = useCallback((): void => {
    flushSync(() => {
      setInstantClose(true);
    });
  }, []);

  const handleSelectUser = useCallback(
    (picked: User): void => {
      if (mode === 'direct') {
        setSubmitError(null);
        hideForNavigation();

        if (user !== null) {
          const existing = findExistingDirectChat(
            chatsQuery.data,
            picked.id,
            user.id,
          );
          if (existing) {
            runAfterKeyboardDismiss(() => {
              closeForNavigation();
              void navigate(`/chats/${existing.id}`);
            });
            return;
          }
        }
        runAfterKeyboardDismiss(() => {
          closeForNavigation();
          startDraft(picked);
        });
        return;
      }
      if (mode === 'group') {
        setSelectedMembers((prev) => {
          if (prev.some((m) => m.id === picked.id)) {
            return prev.filter((m) => m.id !== picked.id);
          }
          return [...prev, picked];
        });
      }
    },
    [
      mode,
      user,
      runAfterKeyboardDismiss,
      closeForNavigation,
      hideForNavigation,
      chatsQuery.data,
      startDraft,
      navigate,
    ],
  );

  const handleRemoveMember = useCallback((userId: number): void => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId));
  }, []);

  const trimmedGroupName = groupName.trim();
  const canSubmitGroup =
    mode === 'group' &&
    trimmedGroupName.length > 0 &&
    trimmedGroupName.length <= GROUP_NAME_MAX_LENGTH &&
    selectedMembers.length > 0 &&
    !isGroupMutationPending;

  const handleSubmitGroup = useCallback((): void => {
    if (!canSubmitGroup) return;
    setSubmitError(null);
    groupMutate(
      {
        name: trimmedGroupName,
        memberIds: selectedMembers.map((m) => m.id),
      },
      {
        onSuccess: (chat) => {
          hideForNavigation();
          runAfterKeyboardDismiss(() => {
            closeForNavigation();
            void navigate(`/chats/${chat.id}`);
          });
        },
        onError: (error) => {
          setSubmitError(getErrorMessage(error));
        },
      },
    );
  }, [
    canSubmitGroup,
    groupMutate,
    trimmedGroupName,
    selectedMembers,
    runAfterKeyboardDismiss,
    closeForNavigation,
    hideForNavigation,
    navigate,
  ]);

  const isOpen = mode !== null;

  const renderedMode = mode ?? displayMode ?? 'direct';

  const dialogStyle = useKeyboardAwareDialogStyle(isOpen && !isLg);
  const trimmedQuery = query.trim();
  const isDebounceCatchingUp = trimmedQuery !== debouncedQuery;
  const isCurrentQueryBelowMin =
    trimmedQuery.length < USER_SEARCH_MIN_QUERY_LENGTH;
  const canShowSearchData = !isCurrentQueryBelowMin && !isDebounceCatchingUp;
  const isDirect = renderedMode === 'direct';
  const title = isDirect
    ? t('chats.newChatDialog.directTitle')
    : t('chats.newChatDialog.groupTitle');
  const description = isDirect
    ? t('chats.newChatDialog.directDescription')
    : t('chats.newChatDialog.groupDescription');

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        style={dialogStyle}
        className={cn(
          !isLg && 'flex flex-col gap-2 p-4',
          instantClose && INSTANT_DIALOG_CLOSE_CLASS,
        )}
        overlayClassName={cn(instantClose && INSTANT_DIALOG_CLOSE_CLASS)}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
        onOpenAutoFocus={(event) => {
          if (!isLg) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {renderedMode === 'group' && (
          <Input
            value={groupName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setGroupName(e.target.value);
            }}
            placeholder={t('chats.newChatDialog.groupNamePlaceholder')}
            maxLength={GROUP_NAME_MAX_LENGTH}
            className="h-10"
          />
        )}

        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setQuery(e.target.value);
            }}
            placeholder={t('chats.newChatDialog.searchPlaceholder')}
            className="h-10 pl-9"
          />
        </div>

        {renderedMode === 'group' && selectedMembers.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium">
              {t('chats.newChatDialog.selected', {
                count: selectedMembers.length,
              })}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    handleRemoveMember(member.id);
                  }}
                  aria-label={t('chats.newChatDialog.removeMember', {
                    name: member.nickname,
                  })}
                  className="bg-secondary hover:bg-secondary/80 text-foreground inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs"
                >
                  <Avatar className="h-5 w-5">
                    {(member.thumbnailUrl ?? member.avatarUrl) !== null && (
                      <AvatarImage
                        src={member.thumbnailUrl ?? member.avatarUrl ?? ''}
                        alt={member.nickname}
                      />
                    )}
                    <AvatarFallback className="text-[9px]">
                      {initials(member.nickname)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[10rem] truncate">
                    {member.nickname}
                  </span>
                  <X className="h-3 w-3 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`overflow-y-auto ${isLg ? 'max-h-72' : 'min-h-0'}`}>
          <NewChatSearchResults
            data={canShowSearchData ? searchResult.data : undefined}
            isFetching={
              !isCurrentQueryBelowMin &&
              (isDebounceCatchingUp || searchResult.isFetching)
            }
            isError={searchResult.isError}
            isBelowMinLength={isBelowMinLength || isCurrentQueryBelowMin}
            debouncedQuery={canShowSearchData ? debouncedQuery : trimmedQuery}
            mode={renderedMode}
            selectedIds={selectedIds}
            onSelect={handleSelectUser}
            isMutating={false}
          />
        </div>

        {submitError !== null && (
          <p className="text-destructive text-xs">{submitError}</p>
        )}

        {renderedMode === 'group' && (
          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="bg-card text-foreground border-border hover:bg-secondary inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
              }}
              onClick={handleSubmitGroup}
              disabled={!canSubmitGroup}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGroupMutationPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('chats.newChatDialog.submitGroup')
              )}
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
