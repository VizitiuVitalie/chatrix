import axios, { AxiosError, AxiosHeaders } from 'axios';

import { env } from '@/shared/config/env';

import { AUTH_NO_RETRY_PATTERN } from './constants/api.constants';
import { AUTH_FAILURE_EVENT, authEvents } from './events';
import { classifyError } from './helpers/api-error.helper';
import type { RefreshResponse } from './interfaces/refresh-response.interface';
import type { RetryableRequestConfig } from './interfaces/retryable-request-config.interface';
import { tokenStore } from './token-store';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = axios
    .post<RefreshResponse>(
      `${env.apiUrl}/auth/refresh`,
      {},
      { withCredentials: true },
    )
    .then((response) => {
      tokenStore.set(response.data.accessToken);
      return response.data.accessToken;
    })
    .catch((error: unknown) => {
      if (classifyError(error) === 'auth') {
        tokenStore.clear();
        authEvents.dispatchEvent(new Event(AUTH_FAILURE_EVENT));
      }
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const url = config?.url ?? '';

    const isAuthEntryPoint = AUTH_NO_RETRY_PATTERN.test(url);
    const shouldAttemptRefresh =
      status === 401 && config && !config._retry && !isAuthEntryPoint;

    if (!shouldAttemptRefresh || !config) {
      return Promise.reject(error);
    }

    config._retry = true;
    const newToken = await refreshAccessToken();
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    config.headers.set('Authorization', `Bearer ${newToken}`);
    try {
      return await apiClient(config);
    } catch (retryError: unknown) {
      if (classifyError(retryError) === 'auth') {
        tokenStore.clear();
        authEvents.dispatchEvent(new Event(AUTH_FAILURE_EVENT));
      }
      throw retryError;
    }
  },
);
