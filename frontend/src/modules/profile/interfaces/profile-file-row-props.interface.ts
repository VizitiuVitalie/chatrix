import type { FileResource } from '@/modules/files/interfaces/file.interface';

export interface ProfileFileRowProps {
  file: FileResource;
  isPending: boolean;
  onRequestDelete: (file: FileResource) => void;
}
