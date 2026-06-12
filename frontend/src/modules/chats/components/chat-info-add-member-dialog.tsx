import { Search } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';

import type { User } from '@/modules/auth/interfaces/user.interface';
import { useAddChatMemberMutation } from '@/modules/chat-members/hooks/use-add-chat-member-mutation';
import { useUserSearchQuery } from '@/modules/users/hooks/use-user-search-query';
import { getErrorMessage } from '@/shared/api/helpers/api-error.helper';
import { useIsLg } from '@/shared/hooks/use-is-lg';
import { useKeyboardAwareDialogStyle } from '@/shared/hooks/use-keyboard-aware-dialog-style';
import { cn } from '@/shared/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

import type { ChatInfoAddMemberDialogProps } from '../interfaces/chat-info-add-member-dialog-props.interface';
import { NewChatSearchResults } from './new-chat-search-results';

export function ChatInfoAddMemberDialog({
  chat,
  open,
  onOpenChange,
}: ChatInfoAddMemberDialogProps): ReactElement {
  const { t } = useTranslation();
  const isLg = useIsLg();
  const dialogStyle = useKeyboardAwareDialogStyle(open && !isLg);
  const [query, setQuery] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    query: searchResult,
    debouncedQuery,
    isBelowMinLength,
  } = useUserSearchQuery(query);

  const mutation = useAddChatMemberMutation();
  const { mutate, isPending } = mutation;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) {
      setQuery('');
      setSubmitError(null);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const existingMemberIds = useMemo(
    () => new Set(chat.members.map((m) => m.userId)),
    [chat.members],
  );

  const filteredResults = useMemo(() => {
    if (!searchResult.data) return undefined;
    return searchResult.data.filter((u) => !existingMemberIds.has(u.id));
  }, [searchResult.data, existingMemberIds]);

  const handleSelect = useCallback(
    (user: User): void => {
      setSubmitError(null);
      mutate(
        { chatId: chat.id, userId: user.id },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
          onError: (error) => {
            setSubmitError(getErrorMessage(error));
          },
        },
      );
    },
    [chat.id, mutate, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={dialogStyle}
        className={cn(isLg ? 'max-h-[80vh] gap-3' : 'flex flex-col gap-2 p-4')}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
        onOpenAutoFocus={(e) => {
          if (!isLg) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('chats.info.addMember.title')}</DialogTitle>
          <DialogDescription>
            {t('chats.info.addMember.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            placeholder={t('chats.info.addMember.searchPlaceholder')}
            disabled={isPending}
            className="pl-9"
          />
        </div>

        <div
          className={cn(
            'overflow-y-auto',
            isLg ? 'max-h-[40vh] min-h-[120px]' : 'min-h-0',
          )}
        >
          <NewChatSearchResults
            data={filteredResults}
            isFetching={searchResult.isFetching}
            isError={searchResult.isError}
            isBelowMinLength={isBelowMinLength}
            debouncedQuery={debouncedQuery}
            mode="direct"
            selectedIds={new Set()}
            onSelect={handleSelect}
            isMutating={isPending}
          />
        </div>

        {submitError !== null && (
          <p className="text-destructive text-sm">{submitError}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
