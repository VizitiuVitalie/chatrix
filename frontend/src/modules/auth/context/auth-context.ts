import { createContext } from 'react';

import type { AuthContextValue } from '../interfaces/auth-context-value.interface';

export const AuthContext = createContext<AuthContextValue | null>(null);
