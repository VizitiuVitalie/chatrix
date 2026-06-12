export async function downloadPublicFile(
  remoteUrl: string,
  filename: string,
): Promise<void> {
  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${String(response.status)}`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
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
  } catch (err) {
    window.open(remoteUrl, '_blank', 'noopener,noreferrer');
    throw err instanceof Error
      ? err
      : new Error('Failed to download file (unknown error)');
  }
}
