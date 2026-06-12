import type { FileResource } from './file.interface';

export interface FilesPage {
  items: FileResource[];
  total: number;
  page: number;
  limit: number;
}
