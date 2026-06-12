import type { ResolvedTheme, Theme } from './theme.type';

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => Promise<void>;
  isUpdating: boolean;
}
