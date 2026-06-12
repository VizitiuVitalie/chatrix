import type { FileResource } from './file.interface';

export interface ImageViewerOverlayProps {
  file: FileResource;
  onClose: () => void;
}
