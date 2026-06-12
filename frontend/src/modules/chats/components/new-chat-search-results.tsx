import { Check, Loader2, Users } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { USER_SEARCH_MIN_QUERY_LENGTH } from '@/modules/users/constants/users.constants';
import { initials } from '@/shared/helpers/initials.helper';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

import type { NewChatSearchResultsProps } from '../interfaces/new-chat-search-results-props.interface';

export function NewChatSearchResults({
  data,
  isFetching,
  isError,
  isBelowMinLength,
  debouncedQuery,
  mode,
  selectedIds,
  onSelect,
  isMutating,
}: NewChatSearchResultsProps): ReactElement {
  const { t } = useTranslation();

  if (isBelowMinLength) {
    return (
      <p className="text-muted-foreground py-3 text-center text-sm">
        {t('chats.newChatDialog.typeMore', {
          min: USER_SEARCH_MIN_QUERY_LENGTH,
        })}
      </p>
    );
  }

  if (isFetching && (data === undefined || data.length === 0)) {
    return (
      <div className="flex items-center justify-center gap-2 py-3">
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        <span className="text-muted-foreground text-sm">
          {t('chats.newChatDialog.searching')}
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-destructive py-3 text-center text-sm">
        {t('chats.newChatDialog.searchError')}
      </p>
    );
  }

  if (data === undefined || data.length === 0) {
    return (
      <p className="text-muted-foreground py-3 text-center text-sm">
        {t('chats.newChatDialog.noResults', { query: debouncedQuery })}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {data.map((user) => {
        const isSelected = selectedIds.has(user.id);
        const avatarSrc = user.thumbnailUrl ?? user.avatarUrl;
        return (
          <li key={user.id}>
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => {
                onSelect(user);
              }}
              disabled={isMutating}
              className={`hover:bg-secondary flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected ? 'bg-secondary' : ''
              }`}
            >
              <Avatar className="h-9 w-9 shrink-0">
                {avatarSrc !== null && (
                  <AvatarImage src={avatarSrc} alt={user.nickname} />
                )}
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                  {user.nickname.length > 0 ? initials(user.nickname) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">
                  {user.nickname}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  @{user.username}
                </p>
              </div>
              {mode === 'group' && (
                <span
                  aria-hidden
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
              )}
              {mode === 'direct' && (
                <Users className="text-muted-foreground h-4 w-4 shrink-0" />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
