import type { PushToggleError } from './push-toggle-error.type';
import type { PushToggleState } from './push-toggle-state.type';

export interface SubscribeFailureMapping {
  state: PushToggleState;
  error: PushToggleError | null;
}
