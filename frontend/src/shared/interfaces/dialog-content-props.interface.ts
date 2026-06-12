import type * as React from 'react';
import type { Dialog as DialogPrimitive } from 'radix-ui';

export interface DialogContentProps extends React.ComponentProps<
  typeof DialogPrimitive.Content
> {
  showCloseButton?: boolean;
  overlayClassName?: string;
}
