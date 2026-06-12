import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';

import { detectIOS } from '../helpers/detect-ios.helper';
import { detectStandalone } from '../helpers/detect-standalone.helper';
import type { BeforeInstallPromptEvent } from '../interfaces/before-install-prompt-event.interface';
import type { InstallPlatform } from '../interfaces/install-platform.type';
import type { InstallPromptContextValue } from '../interfaces/install-prompt-context-value.interface';
import type { InstallPromptProviderProps } from '../interfaces/install-prompt-provider-props.interface';
import { InstallPromptContext } from './install-prompt-context';

export function InstallPromptProvider({
  children,
}: InstallPromptProviderProps): ReactElement {
  const [savedEvent, setSavedEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isStandalone, setIsStandalone] = useState<boolean>(detectStandalone);

  useEffect(() => {
    function handleBeforeInstall(event: Event): void {
      event.preventDefault();
      setSavedEvent(event as BeforeInstallPromptEvent);
    }
    function handleInstalled(): void {
      setSavedEvent(null);
      setIsStandalone(true);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return (): void => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<
    'accepted' | 'dismissed' | null
  > => {
    if (savedEvent === null) return null;
    await savedEvent.prompt();
    const result = await savedEvent.userChoice;
    setSavedEvent(null);
    return result.outcome;
  }, [savedEvent]);

  const value = useMemo<InstallPromptContextValue>(() => {
    let platform: InstallPlatform;
    if (isStandalone) {
      platform = 'installed';
    } else if (savedEvent !== null) {
      platform = 'installable';
    } else if (detectIOS()) {
      platform = 'ios';
    } else {
      platform = 'unsupported';
    }
    return { platform, install };
  }, [isStandalone, savedEvent, install]);

  return (
    <InstallPromptContext.Provider value={value}>
      {children}
    </InstallPromptContext.Provider>
  );
}
