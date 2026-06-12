import { apiClient } from '@/shared/api/client';

import type { User } from '@/modules/auth/interfaces/user.interface';

import type { UpdateUserVariables } from '../interfaces/update-user-variables.interface';
import type { UserStorage } from '../interfaces/user-storage.interface';

export async function searchUsersRequest(
  query: string,
  limit: number,
): Promise<User[]> {
  const response = await apiClient.get<User[]>('/users/search', {
    params: { q: query, limit },
  });
  return response.data;
}

export async function updateMeRequest(
  variables: UpdateUserVariables,
): Promise<User> {
  const response = await apiClient.patch<User>('/users/me', variables);
  return response.data;
}

export async function fetchMyStorageRequest(): Promise<UserStorage> {
  const response = await apiClient.get<UserStorage>('/users/me/storage');
  return response.data;
}
