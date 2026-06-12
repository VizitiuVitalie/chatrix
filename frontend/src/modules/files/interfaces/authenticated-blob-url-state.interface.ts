export interface AuthenticatedBlobUrlState {
  url: string | null;
  isLoading: boolean;
  error: Error | null;
}
