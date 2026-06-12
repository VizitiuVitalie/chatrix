import type { FileKind } from './file-kind.type';

export interface FileResource {
  id: number;
  kind: FileKind;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
