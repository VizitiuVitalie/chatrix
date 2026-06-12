import type { FileSort } from './file-sort.type';

export interface ListMyFilesVariables {
  page: number;
  limit: number;
  sort: FileSort;
}
