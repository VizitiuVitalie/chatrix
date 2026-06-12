import { useEffect, useState } from 'react';

import { apiClient } from '@/shared/api/client';

import { toApiClientPath } from '../helpers/to-api-client-path.helper';
import type { AuthenticatedBlobUrlState } from '../interfaces/authenticated-blob-url-state.interface';

export function useAuthenticatedBlobUrl(
  remoteUrl: string | null,
): AuthenticatedBlobUrlState {
  const [state, setState] = useState<{
    url: string | null;
    error: Error | null;
  }>({ url: null, error: null });

  useEffect(() => {
    if (remoteUrl === null) return;

    let cancelled = false;
    let activeObjectUrl: string | null = null;

    const path = toApiClientPath(remoteUrl);

    apiClient
      .get<Blob>(path, { responseType: 'blob' })
      .then((response) => {
        if (cancelled) return;
        activeObjectUrl = URL.createObjectURL(response.data);
        setState({ url: activeObjectUrl, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          url: null,
          error: err instanceof Error ? err : new Error('Failed to load file'),
        });
      });

    return (): void => {
      cancelled = true;
      if (activeObjectUrl !== null) {
        URL.revokeObjectURL(activeObjectUrl);
      }
    };
  }, [remoteUrl]);

  return {
    url: state.url,
    isLoading: remoteUrl !== null && state.url === null && state.error === null,
    error: state.error,
  };
}
