import { createContext } from 'react';

import type { ThemeContextValue } from '../interfaces/theme-context-value.interface';

export const ThemeContext = createContext<ThemeContextValue | null>(null);
