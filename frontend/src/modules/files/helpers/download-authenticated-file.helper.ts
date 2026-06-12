import { apiClient } from '@/shared/api/client';

import { toApiClientPath } from './to-api-client-path.helper';

export async function downloadAuthenticatedFile(
  remoteUrl: string,
  filename: string,
): Promise<void> {
  const path = toApiClientPath(remoteUrl);
  const response = await apiClient.get<Blob>(path, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  }
}
