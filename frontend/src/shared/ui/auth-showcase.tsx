import { Check, Feather, MessageCircle, Search } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import {
  PEER_ONLINE_COUNT,
  PREVIEW_ROW_COUNT,
} from '@/shared/constants/auth-showcase.constants';

export function AuthShowcase(): ReactElement {
  const { t } = useTranslation();

  return (
    <div className="relative flex select-none flex-col items-center justify-center gap-6 px-12 py-16">
      <div
        aria-hidden
        className="bg-primary/25 absolute -left-24 top-12 h-72 w-72 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="bg-accent/25 absolute -right-12 bottom-16 h-80 w-80 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="bg-bubble-out/40 absolute left-1/3 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full blur-3xl"
      />

      <div className="relative z-10 mb-2 flex w-[360px] items-center justify-between gap-3 xl:w-[440px]">
        <div className="border-border/30 bg-card/90 dark:border-white/10 dark:bg-card/60 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-md backdrop-blur">
          <span className="flex items-center gap-0.5">
            <span className="bg-muted-foreground/70 h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:0ms]" />
            <span className="bg-muted-foreground/70 h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:150ms]" />
            <span className="bg-muted-foreground/70 h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:300ms]" />
          </span>
          <span className="text-foreground font-medium">Maya</span>
        </div>
        <div className="border-border/30 bg-card/90 dark:border-white/10 dark:bg-card/60 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-md backdrop-blur">
          <span className="bg-[color:var(--color-online)] inline-block h-2 w-2 rounded-full" />
          <span className="text-foreground font-medium">
            {t('auth.showcase.onlinePill', { count: PEER_ONLINE_COUNT })}
          </span>
        </div>
      </div>

      <div className="border-border/30 bg-card/70 dark:border-white/10 dark:bg-card/40 relative z-10 w-[360px] rounded-2xl border p-5 shadow-xl backdrop-blur-xl xl:w-[440px]">
        <div className="mb-4 flex items-center gap-2">
          <span className="bg-primary text-primary-foreground inline-flex h-8 w-8 items-center justify-center rounded-lg">
            <MessageCircle className="h-4 w-4" />
          </span>
          <span className="text-foreground text-sm font-bold">
            {t('common.appName')}
          </span>
        </div>

        <div className="relative mb-3">
          <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
          <div className="bg-secondary text-muted-foreground flex h-8 w-full items-center rounded-lg pl-8 text-xs">
            Search
          </div>
        </div>

        <div className="space-y-2">
          {Array.from({ length: PREVIEW_ROW_COUNT }, (_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-1.5 py-1.5">
              <span className="bg-accent/60 h-8 w-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="bg-foreground/70 h-2.5 w-24 rounded" />
                <div className="bg-foreground/30 h-2 w-32 rounded" />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card text-foreground dark:bg-card/90 absolute -right-12 top-16 hidden max-w-[180px] rounded-2xl rounded-tr-md px-3 py-2 text-xs shadow-md backdrop-blur xl:block">
          {t('auth.showcase.bubble1')}
        </div>
        <div className="absolute -left-14 top-32 hidden max-w-[180px] rounded-2xl rounded-tl-md bg-[var(--color-bubble-out)]/90 px-3 py-2 text-xs shadow-md backdrop-blur xl:block">
          {t('auth.showcase.bubble2')}
        </div>
        <div className="bg-card text-foreground dark:bg-card/90 absolute -right-16 top-52 hidden max-w-[180px] rounded-2xl rounded-tr-md px-3 py-2 text-xs shadow-md backdrop-blur xl:block">
          {t('auth.showcase.bubble3')}
        </div>
        <div className="absolute -left-20 bottom-10 hidden max-w-[180px] items-center gap-1.5 rounded-2xl rounded-tl-md bg-[var(--color-bubble-out)]/85 px-3 py-2 text-xs shadow-md backdrop-blur xl:inline-flex">
          <span>{t('auth.showcase.bubble4')}</span>
          <Check className="text-primary/90 h-3 w-3 shrink-0" />
        </div>
      </div>

      <div className="border-border/30 bg-card/80 dark:border-white/10 dark:bg-card/50 relative z-10 flex w-[360px] items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur xl:w-[440px]">
        <span className="bg-accent text-foreground inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <Feather className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-foreground text-sm font-semibold">
            {t('auth.showcase.title')}
          </div>
          <div className="text-muted-foreground mt-0.5 text-xs">
            {t('auth.showcase.subtitle')}
          </div>
        </div>
      </div>
    </div>
  );
}
