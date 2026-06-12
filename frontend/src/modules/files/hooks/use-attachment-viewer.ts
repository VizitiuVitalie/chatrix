import { useContext } from 'react';

import { AttachmentViewerContext } from '../context/attachment-viewer-context';
import type { AttachmentViewerContextValue } from '../interfaces/attachment-viewer-context-value.interface';

export function useAttachmentViewer(): AttachmentViewerContextValue {
  const value = useContext(AttachmentViewerContext);
  if (value === null) {
    throw new Error(
      'useAttachmentViewer must be used inside <AttachmentViewerProvider>',
    );
  }
  return value;
}
