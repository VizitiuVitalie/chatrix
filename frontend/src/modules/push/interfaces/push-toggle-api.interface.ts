import type { PushToggleError } from './push-toggle-error.type';
import type { PushToggleState } from './push-toggle-state.type';

export interface PushToggleApi {
  state: PushToggleState;
  toggle: () => Promise<void>;
  lastError: PushToggleError | null;
  dismissError: () => void;
}
