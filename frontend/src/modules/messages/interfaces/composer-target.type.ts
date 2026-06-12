export type ComposerTarget =
  | { kind: 'chat'; chatId: number }
  | { kind: 'draft'; peerUserId: number };
