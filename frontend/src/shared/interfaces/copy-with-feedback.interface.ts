export interface CopyWithFeedback {
  isCopied: boolean;
  copy: (text: string) => Promise<void>;
}
