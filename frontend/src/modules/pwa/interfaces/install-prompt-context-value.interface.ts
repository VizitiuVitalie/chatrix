import type { InstallPlatform } from './install-platform.type';

export interface InstallPromptContextValue {
  platform: InstallPlatform;
  install(): Promise<'accepted' | 'dismissed' | null>;
}
