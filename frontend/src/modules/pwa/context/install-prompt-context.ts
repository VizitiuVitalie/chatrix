import { createContext } from 'react';

import type { InstallPromptContextValue } from '../interfaces/install-prompt-context-value.interface';

export const InstallPromptContext =
  createContext<InstallPromptContextValue | null>(null);
