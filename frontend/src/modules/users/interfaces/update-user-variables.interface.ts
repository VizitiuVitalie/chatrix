import type { Theme } from './theme.type';

export interface UpdateUserVariables {
  nickname?: string;
  bio?: string | null;
  pushEnabled?: boolean;
  theme?: Theme;
}
