import type { LoginRequest } from './login-request.interface';
import type { RegisterRequest } from './register-request.interface';
import type { User } from './user.interface';

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  bootError: string | null;
  login(request: LoginRequest): Promise<void>;
  register(request: RegisterRequest): Promise<void>;
  logout(): Promise<void>;
  setUser(user: User): void;
}
