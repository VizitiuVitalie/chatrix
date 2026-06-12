import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import type { User } from '@/modules/auth/interfaces/user.interface';
import { updateMeRequest } from '@/modules/users/api/users.api';

import type { Theme } from '../interfaces/theme.type';

export function useUpdateThemeMutation(): UseMutationResult<
  User,
  Error,
  Theme
> {
  const { setUser } = useAuth();
  return useMutation<User, Error, Theme>({
    mutationFn: (theme) => updateMeRequest({ theme }),
    onSuccess: (updated) => {
      setUser(updated);
    },
  });
}
