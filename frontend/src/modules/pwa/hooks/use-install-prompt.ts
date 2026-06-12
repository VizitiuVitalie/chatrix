import { useContext } from 'react';

import { InstallPromptContext } from '../context/install-prompt-context';
import type { InstallPromptContextValue } from '../interfaces/install-prompt-context-value.interface';

export function useInstallPrompt(): InstallPromptContextValue {
  const ctx = useContext(InstallPromptContext);
  if (ctx === null) {
    throw new Error(
      'useInstallPrompt must be used within <InstallPromptProvider>',
    );
  }
  return ctx;
}
