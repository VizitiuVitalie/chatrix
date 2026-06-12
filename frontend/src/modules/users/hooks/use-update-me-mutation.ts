import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import type { User } from '@/modules/auth/interfaces/user.interface';
import { CHATS_QUERY_KEY } from '@/modules/chats/constants/chats.constants';
import type { Chat } from '@/modules/chats/interfaces/chat.interface';

import { updateMeRequest } from '../api/users.api';
import type { UpdateUserVariables } from '../interfaces/update-user-variables.interface';

export function useUpdateMeMutation(): UseMutationResult<
  User,
  Error,
  UpdateUserVariables
> {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation<User, Error, UpdateUserVariables>({
    mutationFn: (variables) => updateMeRequest(variables),

    onSuccess: (updated) => {
      setUser(updated);
      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return chats;
        let touched = false;
        const next = chats.map((c) => {
          let memberTouched = false;
          const members = c.members.map((m) => {
            if (m.user.id !== updated.id) return m;
            memberTouched = true;
            return { ...m, user: { ...m.user, ...updated } };
          });
          if (!memberTouched) return c;
          touched = true;
          return { ...c, members };
        });
        return touched ? next : chats;
      });
    },
  });
}
