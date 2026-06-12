import { ArrowLeft, Users } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { PRESENCE_TICK_MS } from '@/shared/constants/presence.constants';
import { formatLastSeen } from '@/shared/helpers/date.helper';
import { initials } from '@/shared/helpers/initials.helper';
import { useNowTick } from '@/shared/hooks/use-now-tick';
import { AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { AvatarWithPresence } from '@/shared/ui/avatar-with-presence';

import type { ConversationHeaderProps } from '../interfaces/conversation-header-props.interface';

export function ConversationHeaderContent({
  name,
  avatarUrl,
  isGroup,
  isOnline,
  lastSeenAt,
  activityLabel,
  actions,
  onTitleClick,
  onBack,
}: ConversationHeaderProps): ReactElement {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const now = useNowTick(PRESENCE_TICK_MS);

  const hasActivity = activityLabel !== null && activityLabel !== undefined;
  let subtitle: string | null = null;
  if (hasActivity) {
    subtitle = activityLabel;
  } else if (!isGroup) {
    if (isOnline === true) {
      subtitle = t('presence.online');
    } else if (
      lastSeenAt !== null &&
      lastSeenAt !== undefined &&
      lastSeenAt !== ''
    ) {
      subtitle = formatLastSeen(new Date(lastSeenAt), now, i18n.language, t);
    }
  }

  const titleBlock: ReactElement = (
    <>
      <AvatarWithPresence
        key={avatarUrl ?? 'no-avatar'}
        className="h-10 w-10"
        isOnline={isOnline}
      >
        {avatarUrl !== null && <AvatarImage src={avatarUrl} alt={name} />}
        {isGroup ? (
          <AvatarFallback className="bg-accent/60 text-foreground">
            <Users className="h-5 w-5" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
            {name.length > 0 ? initials(name) : '?'}
          </AvatarFallback>
        )}
      </AvatarWithPresence>

      <div className="min-w-0 flex-1 text-left">
        <div className="text-foreground truncate text-base font-semibold">
          {name}
        </div>
        {subtitle !== null && (
          <div
            className={`truncate text-xs ${
              hasActivity || isOnline === true
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            {subtitle}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
      <button
        type="button"
        onClick={() => {
          if (onBack !== undefined) {
            onBack();
            return;
          }
          navigate('/chats');
        }}
        aria-label={t('common.back')}
        className="text-muted-foreground hover:bg-secondary focus-visible:ring-ring/40 -ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 lg:hidden"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {onTitleClick !== undefined ? (
        <button
          type="button"
          onClick={onTitleClick}
          className="hover:bg-secondary focus-visible:ring-ring/40 -ml-2 flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1 outline-none transition-colors focus-visible:ring-2"
        >
          {titleBlock}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {titleBlock}
        </div>
      )}

      {actions !== undefined && (
        <div className="ml-auto flex shrink-0 items-center">{actions}</div>
      )}
    </div>
  );
}

export function ConversationHeader(
  props: ConversationHeaderProps,
): ReactElement {
  return (
    <header className="bg-card/85 border-border/80 sticky top-0 z-10 shrink-0 border-b pt-[env(safe-area-inset-top)] shadow-[0_4px_16px_oklch(0.28_0.04_270/_0.04)] backdrop-blur-xl lg:pt-0">
      {/* The safe-area inset lives on the <header> so its background
          fills the notch strip when this bar is the topmost one (phones
          inside a conversation, where TopActionBar is hidden). On lg the
          TopActionBar above already owns the inset, hence `lg:pt-0`. */}
      <ConversationHeaderContent {...props} />
    </header>
  );
}
