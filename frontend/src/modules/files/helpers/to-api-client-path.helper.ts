export function toApiClientPath(absoluteOrRelativeUrl: string): string {
  let path = absoluteOrRelativeUrl;
  try {
    const parsed = new URL(absoluteOrRelativeUrl, window.location.origin);
    path = parsed.pathname;
  } catch {}
  if (path.startsWith('/api/')) {
    path = path.slice(4);
  }
  return path;
}
