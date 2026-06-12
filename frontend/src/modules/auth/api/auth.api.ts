import { apiClient } from '@/shared/api/client';

import type { LoginRequest } from '../interfaces/login-request.interface';
import type { LoginResponse } from '../interfaces/login-response.interface';
import type { RegisterRequest } from '../interfaces/register-request.interface';
import type { User } from '../interfaces/user.interface';

export async function loginRequest(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', payload);
  return response.data;
}

export async function registerRequest(
  payload: RegisterRequest,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    '/auth/register',
    payload,
  );
  return response.data;
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function meRequest(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}
