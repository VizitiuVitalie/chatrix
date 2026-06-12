import type { ReactElement } from 'react';

export interface CopyableInfoRowProps {
  icon: ReactElement;
  label: string;
  value: string;
  multiline?: boolean;
}
