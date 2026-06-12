import { useContext } from 'react';

import { AuthContext } from '../context/auth-context';
import type { AuthContextValue } from '../interfaces/auth-context-value.interface';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
}
