import { MoreVertical, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsLg } from '@/shared/hooks/use-is-lg';
import { cn } from '@/shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { getCurrentUserRole } from '../helpers/get-current-user-role.helper';
import type { ChatHeaderActionsMenuProps } from '../interfaces/chat-header-actions-menu-props.interface';
import type { MobileChatHeaderActionsMenuProps } from '../interfaces/mobile-chat-header-actions-menu-props.interface';

function blurActiveTextControl(): void {
  const active = document.activeElement;
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement
  ) {
    active.blur();
  }
}

export function ChatHeaderActionsMenu({
  chat,
  currentUserId,
  onRequestDelete,
}: ChatHeaderActionsMenuProps): ReactElement | null {
  const { t } = useTranslation();
  const isLg = useIsLg();

  const currentRole = getCurrentUserRole(chat, currentUserId);
  const hasDestructiveActions =
    chat.type === 'direct' || currentRole === 'owner';
  if (!hasDestructiveActions) return null;

  const triggerLabel =
    chat.type === 'direct'
      ? t('chats.rowMenu.deleteDirect')
      : t('chats.rowMenu.deleteGroup');

  if (!isLg) {
    return (
      <MobileChatHeaderActionsMenu
        label={triggerLabel}
        openLabel={t('chats.headerMenu.openLabel')}
        onRequestDelete={onRequestDelete}
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('chats.headerMenu.openLabel')}
          className="text-muted-foreground hover:bg-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            onRequestDelete();
          }}
        >
          <Trash2 />
          {triggerLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileChatHeaderActionsMenu({
  label,
  openLabel,
  onRequestDelete,
}: MobileChatHeaderActionsMenuProps): ReactElement {
  const [open, setOpen] = useState<boolean>(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: PointerEvent): void => {
      const root = rootRef.current;
      if (root !== null && event.target instanceof Node) {
        if (root.contains(event.target)) return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, {
      capture: true,
    });
    document.addEventListener('keydown', handleKeyDown);
    return (): void => {
      document.removeEventListener('pointerdown', handlePointerDown, {
        capture: true,
      });
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={openLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        data-keyboard-dismiss-control
        onPointerDown={blurActiveTextControl}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className="text-muted-foreground hover:bg-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      <div
        role="menu"
        className={cn(
          'bg-popover text-popover-foreground ring-foreground/10 absolute top-10 right-0 z-50 min-w-44 rounded-lg p-1 shadow-md ring-1',
          open ? 'block' : 'hidden',
        )}
      >
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onRequestDelete();
          }}
          className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm"
        >
          <Trash2 className="h-4 w-4" />
          {label}
        </button>
      </div>
    </div>
  );
}
