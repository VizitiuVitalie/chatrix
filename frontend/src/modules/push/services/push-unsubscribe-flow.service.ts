import { unsubscribePushRequest } from '../api/push.api';
import { unsubscribeBrowserFromPush } from './push-unsubscribe.service';

export async function attemptUnsubscribe(
  swallowErrors: boolean = false,
): Promise<void> {
  try {
    const endpoint = await unsubscribeBrowserFromPush();
    if (endpoint !== null) {
      await unsubscribePushRequest(endpoint);
    }
  } catch (err) {
    if (swallowErrors) {
      console.error('[push] attemptUnsubscribe failed (swallowed)', err);
      return;
    }
    throw err;
  }
}
