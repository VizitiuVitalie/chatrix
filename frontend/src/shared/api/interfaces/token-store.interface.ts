export interface TokenStore {
  get(): string | null;
  set(token: string | null): void;
  clear(): void;
}
