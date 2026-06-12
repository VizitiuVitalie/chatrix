import { createContext } from 'react';

import type { AttachmentViewerContextValue } from '../interfaces/attachment-viewer-context-value.interface';

export const AttachmentViewerContext =
  createContext<AttachmentViewerContextValue | null>(null);
