import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { MY_STORAGE_QUERY_KEY } from '@/modules/users/hooks/use-my-storage-query';

import { deleteFileRequest } from '../api/files.api';
import { MY_FILES_QUERY_KEY } from './use-my-files-query';

export function useDeleteFileMutation(): UseMutationResult<
  void,
  Error,
  number
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (fileId) => deleteFileRequest(fileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_FILES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: MY_STORAGE_QUERY_KEY });
    },
  });
}
