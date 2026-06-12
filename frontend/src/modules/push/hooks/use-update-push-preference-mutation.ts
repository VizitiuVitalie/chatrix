import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import type { User } from '@/modules/auth/interfaces/user.interface';
import { updateMeRequest } from '@/modules/users/api/users.api';

export function useUpdatePushPreferenceMutation(): UseMutationResult<
  User,
  Error,
  boolean
> {
  const { setUser } = useAuth();
  return useMutation<User, Error, boolean>({
    mutationFn: (enabled) => updateMeRequest({ pushEnabled: enabled }),
    onSuccess: (updated) => {
      setUser(updated);
    },
  });
}
