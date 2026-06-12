import type { FileResource } from './file.interface';

export interface VideoPlayerOverlayProps {
  file: FileResource;
  onClose: () => void;
}
