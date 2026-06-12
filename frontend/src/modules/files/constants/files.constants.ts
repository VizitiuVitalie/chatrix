export const MAX_FILES_PER_MESSAGE = 5;

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/avif',
] as const;

export const ALLOWED_AUDIO_MIME = [
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
] as const;

export const ALLOWED_VIDEO_MIME = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/3gpp',
] as const;

export const ALLOWED_DOC_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
] as const;

export const ALLOWED_ARCHIVE_MIME = [
  'application/zip',
  'application/x-7z-compressed',
  'application/vnd.rar',
  'application/gzip',
  'application/x-tar',
] as const;

export const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set<string>([
  ...ALLOWED_IMAGE_MIME,
  ...ALLOWED_AUDIO_MIME,
  ...ALLOWED_VIDEO_MIME,
  ...ALLOWED_DOC_MIME,
  ...ALLOWED_ARCHIVE_MIME,
]);

export const ALLOWED_MIME_ACCEPT_ATTR =
  Array.from(ALLOWED_MIME_TYPES).join(',');

export const VIEWER_ZOOM_MIN = 0.25;
export const VIEWER_ZOOM_MAX = 4;
export const VIEWER_ZOOM_STEP = 0.25;

export const VIDEO_ZOOM_MIN = 0.5;
export const VIDEO_ZOOM_MAX = 2;

export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export function isImageMime(mime: string): boolean {
  return (ALLOWED_IMAGE_MIME as readonly string[]).includes(mime);
}

export function isVideoMime(mime: string): boolean {
  return (
    (ALLOWED_VIDEO_MIME as readonly string[]).includes(mime) ||
    mime.startsWith('video/')
  );
}
