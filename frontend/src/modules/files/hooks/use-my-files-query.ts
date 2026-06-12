import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { listMyFilesRequest } from '../api/files.api';
import type { FilesPage } from '../interfaces/files-page.interface';
import type { ListMyFilesVariables } from '../interfaces/list-my-files-variables.interface';

export const MY_FILES_QUERY_KEY = ['files', 'mine'] as const;
export const myFilesQueryKey = (
  variables: ListMyFilesVariables,
): readonly [...typeof MY_FILES_QUERY_KEY, ListMyFilesVariables] => [
  ...MY_FILES_QUERY_KEY,
  variables,
];

export function useMyFilesQuery(
  variables: ListMyFilesVariables,
): UseQueryResult<FilesPage, Error> {
  return useQuery({
    queryKey: myFilesQueryKey(variables),
    queryFn: () => listMyFilesRequest(variables),
    staleTime: 10_000,
  });
}
