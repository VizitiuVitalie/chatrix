import type { FileResource } from './file.interface';

export interface AttachmentViewerContextValue {
  openViewer: (file: FileResource) => void;
}
