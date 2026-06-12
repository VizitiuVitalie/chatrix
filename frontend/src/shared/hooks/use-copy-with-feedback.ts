import { useCallback, useEffect, useState } from 'react';

import { COPIED_HINT_MS } from '../constants/copy.constants';
import type { CopyWithFeedback } from '../interfaces/copy-with-feedback.interface';

export function useCopyWithFeedback(): CopyWithFeedback {
  const [copiedAt, setCopiedAt] = useState<number | null>(null);

  useEffect(() => {
    if (copiedAt === null) return;
    const handle = window.setTimeout(() => {
      setCopiedAt(null);
    }, COPIED_HINT_MS);
    return (): void => {
      window.clearTimeout(handle);
    };
  }, [copiedAt]);

  const copy = useCallback(async (text: string): Promise<void> => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
    setCopiedAt(Date.now());
  }, []);

  return { isCopied: copiedAt !== null, copy };
}
