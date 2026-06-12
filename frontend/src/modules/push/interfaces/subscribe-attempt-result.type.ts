export type SubscribeAttemptResult =
  | 'subscribed'
  | 'denied'
  | 'dismissed'
  | 'unsupported'
  | 'skipped'
  | 'error';
