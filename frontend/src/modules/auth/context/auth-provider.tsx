import { useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { AUTH_FAILURE_EVENT, authEvents } from '@/shared/api/events';
import {
  classifyError,
  getErrorMessage,
} from '@/shared/api/helpers/api-error.helper';
import { tokenStore } from '@/shared/api/token-store';

import {
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
} from '../api/auth.api';
import type { AuthContextValue } from '../interfaces/auth-context-value.interface';
import type { LoginRequest } from '../interfaces/login-request.interface';
import type { RegisterRequest } from '../interfaces/register-request.interface';
import type { User } from '../interfaces/user.interface';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: PropsWithChildren): ReactElement {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap(): Promise<void> {
      try {
        const profile = await meRequest();
        if (!cancelled) {
          setUser(profile);
          setBootError(null);
        }
      } catch (error) {
        if (cancelled) return;
        const kind = classifyError(error);
        if (kind === 'auth') {
          tokenStore.clear();
          setBootError(null);
        } else {
          setBootError(getErrorMessage(error));
        }
        setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return (): void => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleAuthFailure(): void {
      tokenStore.clear();
      setUser(null);

      queryClient.clear();
      try {
        window.localStorage.removeItem('chatrix.theme');
      } catch {}
    }
    authEvents.addEventListener(AUTH_FAILURE_EVENT, handleAuthFailure);
    return (): void => {
      authEvents.removeEventListener(AUTH_FAILURE_EVENT, handleAuthFailure);
    };
  }, [queryClient]);

  const login = useCallback(
    async (request: LoginRequest): Promise<void> => {
      const response = await loginRequest(request);
      queryClient.clear();
      tokenStore.set(response.accessToken);
      setUser(response.user);
      setBootError(null);
    },
    [queryClient],
  );

  const register = useCallback(
    async (request: RegisterRequest): Promise<void> => {
      const response = await registerRequest(request);
      queryClient.clear();
      tokenStore.set(response.accessToken);
      setUser(response.user);
      setBootError(null);
    },
    [queryClient],
  );

  const replaceUser = useCallback((next: User): void => {
    setUser(next);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutRequest();
    } finally {
      tokenStore.clear();
      setUser(null);
      queryClient.clear();
      try {
        window.localStorage.removeItem('chatrix.theme');
      } catch {}
    }
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      bootError,
      login,
      register,
      logout,
      setUser: replaceUser,
    }),
    [user, isLoading, bootError, login, register, logout, replaceUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
