export const MAX_FILES_PER_MESSAGE = 5;

export const ORPHAN_FILE_TTL_MS = 60 * 60 * 1000;

export const THUMBNAIL_MAX_SIZE_PX = 1280;

export const AVATAR_CACHE_CONTROL = 'public, max-age=31536000, immutable';

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

export const ALLOWED_MIME = new Set<string>([
  ...ALLOWED_IMAGE_MIME,
  ...ALLOWED_AUDIO_MIME,
  ...ALLOWED_VIDEO_MIME,
  ...ALLOWED_DOC_MIME,
  ...ALLOWED_ARCHIVE_MIME,
]);

export const isImageMime = (mime: string): boolean =>
  (ALLOWED_IMAGE_MIME as readonly string[]).includes(mime);

export const isAudioMime = (mime: string): boolean =>
  (ALLOWED_AUDIO_MIME as readonly string[]).includes(mime);

export const isVideoMime = (mime: string): boolean =>
  (ALLOWED_VIDEO_MIME as readonly string[]).includes(mime);

export const needsImageTranscode = (mime: string): boolean =>
  mime === 'image/heic' || mime === 'image/heif';
