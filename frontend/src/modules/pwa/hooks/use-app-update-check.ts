import { useEffect, useState } from 'react';

import {
  APP_UPDATE_CHECK_INTERVAL_MS,
  APP_VERSION_MANIFEST_PATH,
  RUNNING_BUILD_ID,
} from '../constants/pwa.constants';
import type { VersionManifest } from '../interfaces/version-manifest.interface';

export function useAppUpdateCheck(): boolean {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    if (updateAvailable) return undefined;

    let cancelled = false;

    const check = async (): Promise<void> => {
      try {
        const response = await fetch(APP_VERSION_MANIFEST_PATH, {
          cache: 'no-store',
        });
        if (!response.ok || cancelled) return;
        const manifest = (await response.json()) as Partial<VersionManifest>;
        if (cancelled) return;
        if (
          typeof manifest.id === 'string' &&
          manifest.id.length > 0 &&
          manifest.id !== RUNNING_BUILD_ID
        ) {
          setUpdateAvailable(true);
        }
      } catch {}
    };

    void check();

    const handleVisibility = (): void => {
      if (document.visibilityState === 'visible') void check();
    };
    const handlePageShow = (event: PageTransitionEvent): void => {
      if (event.persisted || document.visibilityState === 'visible') {
        void check();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    const intervalId = window.setInterval((): void => {
      void check();
    }, APP_UPDATE_CHECK_INTERVAL_MS);

    return (): void => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
      window.clearInterval(intervalId);
    };
  }, [updateAvailable]);

  return updateAvailable;
}
