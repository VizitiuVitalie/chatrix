import { ALLOWED_AVATAR_EXTENSIONS } from '../constants/users.constants';

export function extensionFromUrl(url: string): string {
  let pathname: string;
  try {
    pathname = new URL(url, window.location.origin).pathname;
  } catch {
    return '';
  }
  const lastDot = pathname.lastIndexOf('.');
  if (lastDot === -1) return '';
  const rawExt = pathname.slice(lastDot + 1).toLowerCase();
  if (!ALLOWED_AVATAR_EXTENSIONS.has(rawExt)) return '';
  return `.${rawExt}`;
}
