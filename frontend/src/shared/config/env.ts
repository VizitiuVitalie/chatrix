import type { EnvConfig } from './interfaces/env-config.interface';

function readApiUrl(): string {
  const value = import.meta.env.VITE_API_URL;
  return value && value.length > 0 ? value : '/api';
}

export const env: EnvConfig = {
  apiUrl: readApiUrl(),
};
