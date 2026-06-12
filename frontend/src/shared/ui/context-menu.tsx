import { ContextMenu as ContextMenuPrimitive } from 'radix-ui';
import { composeEventHandlers } from 'radix-ui/internal';
import * as React from 'react';

import { useContextMenuLongPress } from '@/shared/hooks/use-context-menu-long-press';
import { cn } from '@/shared/lib/utils';

function ContextMenu({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Root>): React.ReactElement {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuTrigger({
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ...props
}: React.ComponentProps<
  typeof ContextMenuPrimitive.Trigger
>): React.ReactElement {
  const longPress = useContextMenuLongPress();
  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      onPointerDown={composeEventHandlers(
        onPointerDown,
        longPress.onPointerDown,
      )}
      onPointerMove={composeEventHandlers(
        onPointerMove,
        longPress.onPointerMove,
      )}
      onPointerUp={composeEventHandlers(onPointerUp, longPress.onPointerUp)}
      onPointerCancel={composeEventHandlers(
        onPointerCancel,
        longPress.onPointerCancel,
      )}
      {...props}
    />
  );
}

function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content> & {
  onOpenAutoFocus?: (event: Event) => void;
}): React.ReactElement {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        collisionPadding={16}
        sticky="partial"
        className={cn(
          'bg-popover text-popover-foreground ring-foreground/10 z-50 min-w-44 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg p-1 shadow-md ring-1',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className,
        )}
        {...(props as React.ComponentProps<
          typeof ContextMenuPrimitive.Content
        >)}
      />
    </ContextMenuPrimitive.Portal>
  );
}

function ContextMenuItem({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  variant?: 'default' | 'destructive';
}): React.ReactElement {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-variant={variant}
      className={cn(
        'focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none',
        'data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive',
        'data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentProps<
  typeof ContextMenuPrimitive.Separator
>): React.ReactElement {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

export {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
};
