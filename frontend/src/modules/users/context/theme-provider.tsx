import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';

import { useAuth } from '@/modules/auth/hooks/use-auth';

import {
  DARK_MEDIA_QUERY,
  THEME_STORAGE_KEY,
} from '../constants/users.constants';
import { useUpdateThemeMutation } from '../hooks/use-update-theme-mutation';
import type { ThemeContextValue } from '../interfaces/theme-context-value.interface';
import type { ThemeProviderProps } from '../interfaces/theme-provider-props.interface';
import type { ResolvedTheme, Theme } from '../interfaces/theme.type';
import { ThemeContext } from './theme-context';

function readSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(DARK_MEDIA_QUERY).matches;
}

function readStoredThemeFromCache(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    return null;
  }
  return null;
}

function resolveTheme(
  stored: Theme,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (stored === 'light') return 'light';
  if (stored === 'dark') return 'dark';
  return systemPrefersDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: ThemeProviderProps): ReactElement {
  const { user } = useAuth();
  const updateMutation = useUpdateThemeMutation();
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
    readSystemPrefersDark,
  );
  const [bootstrapTheme] = useState<Theme | null>(readStoredThemeFromCache);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia(DARK_MEDIA_QUERY);
    function handleChange(event: MediaQueryListEvent): void {
      setSystemPrefersDark(event.matches);
    }
    media.addEventListener('change', handleChange);
    return (): void => {
      media.removeEventListener('change', handleChange);
    };
  }, []);

  const storedTheme: Theme = user?.theme ?? bootstrapTheme ?? 'system';
  const resolvedTheme = resolveTheme(storedTheme, systemPrefersDark);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user) return;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, storedTheme);
    } catch {
      return;
    }
  }, [user, storedTheme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  const { mutateAsync: updateThemeAsync } = updateMutation;
  const setTheme = useCallback(
    async (next: Theme): Promise<void> => {
      if (next === storedTheme) return;
      await updateThemeAsync(next);
    },
    [storedTheme, updateThemeAsync],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: storedTheme,
      resolvedTheme,
      setTheme,
      isUpdating: updateMutation.isPending,
    }),
    [storedTheme, resolvedTheme, setTheme, updateMutation.isPending],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
