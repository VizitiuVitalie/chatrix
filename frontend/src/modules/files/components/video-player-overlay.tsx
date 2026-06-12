import { Download, Gauge, Loader2, X, ZoomIn, ZoomOut } from 'lucide-react';
import {
  useCallback,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { downloadAuthenticatedFile } from '../helpers/download-authenticated-file.helper';
import { formatBytes } from '../helpers/format-bytes.helper';
import { useAuthenticatedBlobUrl } from '../hooks/use-authenticated-blob-url';
import {
  PLAYBACK_RATES,
  VIDEO_ZOOM_MAX,
  VIDEO_ZOOM_MIN,
  VIEWER_ZOOM_STEP,
} from '../constants/files.constants';
import type { PlaybackRate } from '../interfaces/playback-rate.type';
import type { VideoPlayerOverlayProps } from '../interfaces/video-player-overlay-props.interface';

export function VideoPlayerOverlay({
  file,
  onClose,
}: VideoPlayerOverlayProps): ReactElement {
  const { t } = useTranslation();

  const requiresAuth = file.kind === 'message_attachment';
  const blob = useAuthenticatedBlobUrl(requiresAuth ? file.downloadUrl : null);
  const url = requiresAuth ? blob.url : file.downloadUrl;
  const isLoading = requiresAuth ? blob.isLoading : false;
  const blobError = requiresAuth ? blob.error : null;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [rate, setRate] = useState<PlaybackRate>(1);

  const [playbackError, setPlaybackError] = useState<boolean>(false);

  const stopBubble = useCallback((event: ReactMouseEvent): void => {
    event.stopPropagation();
  }, []);

  const handleZoomIn = useCallback((): void => {
    setScale((current) => Math.min(VIDEO_ZOOM_MAX, current + VIEWER_ZOOM_STEP));
  }, []);
  const handleZoomOut = useCallback((): void => {
    setScale((current) => Math.max(VIDEO_ZOOM_MIN, current - VIEWER_ZOOM_STEP));
  }, []);

  const handleRateChange = useCallback((next: PlaybackRate): void => {
    setRate(next);
    const v = videoRef.current;
    if (v !== null) v.playbackRate = next;
  }, []);

  const handleLoadedMetadata = useCallback((): void => {
    const v = videoRef.current;
    if (v !== null) v.playbackRate = rate;
  }, [rate]);

  const handleDownload = useCallback((): void => {
    downloadAuthenticatedFile(file.downloadUrl, file.originalName).catch(
      (err: unknown) => {
        console.error('Video viewer download failed', err);
      },
    );
  }, [file.downloadUrl, file.originalName]);

  const canZoomIn = scale < VIDEO_ZOOM_MAX;
  const canZoomOut = scale > VIDEO_ZOOM_MIN;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={file.originalName}
      data-state="open"
      onClick={onClose}
      style={{ overscrollBehavior: 'contain' }}
      className="fixed inset-0 z-50 overflow-auto bg-black/90"
    >
      <div
        className="fixed top-4 right-4 z-10 flex items-center gap-2"
        onClick={stopBubble}
      >
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={!canZoomOut}
          aria-label={t('chat.viewer.zoomOut')}
          title={t('chat.viewer.zoomOut')}
          className="text-foreground bg-card/90 hover:bg-card inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={!canZoomIn}
          aria-label={t('chat.viewer.zoomIn')}
          title={t('chat.viewer.zoomIn')}
          className="text-foreground bg-card/90 hover:bg-card inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            aria-label={t('chat.viewer.speed')}
            title={t('chat.viewer.speed')}
            className="text-foreground bg-card/90 hover:bg-card inline-flex h-10 min-w-12 items-center justify-center gap-1 rounded-full px-2 transition-colors"
          >
            <Gauge className="h-4 w-4" />
            <span className="text-xs font-semibold">{rate}×</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            {PLAYBACK_RATES.map((r) => (
              <DropdownMenuItem
                key={r}
                onClick={() => {
                  handleRateChange(r);
                }}
                className={r === rate ? 'bg-secondary font-semibold' : ''}
              >
                {r}×
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={handleDownload}
          aria-label={t('chat.viewer.download')}
          title={t('chat.viewer.download')}
          className="text-foreground bg-card/90 hover:bg-card inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors"
        >
          <Download className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('chat.viewer.close')}
          title={t('chat.viewer.close')}
          className="text-foreground bg-card/90 hover:bg-card inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-h-full min-w-full items-center justify-center p-4">
        {isLoading && (
          <div
            className="flex select-none flex-col items-center gap-3 text-center text-white"
            onClick={stopBubble}
          >
            <Loader2 className="h-12 w-12 animate-spin" />
            <p className="text-sm">
              {t('chat.viewer.video.loading', {
                size: formatBytes(file.sizeBytes),
              })}
            </p>
          </div>
        )}
        {blobError !== null && !isLoading && (
          <div className="text-sm text-white" onClick={stopBubble}>
            {t('chat.viewer.loadError')}
          </div>
        )}
        {url !== null && !playbackError && (
          <div
            style={{
              width: `${scale * 90}vw`,
              height: `${scale * 90}vh`,
              transition: 'width 150ms ease, height 150ms ease',
            }}
            className="flex shrink-0 items-center justify-center"
            onClick={stopBubble}
          >
            <video
              ref={videoRef}
              src={url}
              controls
              autoPlay
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
              onError={() => {
                setPlaybackError(true);
              }}
              className="block h-full w-full object-contain"
            />
          </div>
        )}
        {playbackError && (
          <div
            className="bg-card flex max-w-md flex-col items-center gap-3 rounded-2xl p-6 text-center shadow-lg"
            onClick={stopBubble}
          >
            <p className="text-foreground text-base font-semibold">
              {t('chat.viewer.video.unsupported.title')}
            </p>
            <p className="text-muted-foreground text-sm">
              {t('chat.viewer.video.unsupported.description', {
                format: file.mimeType,
              })}
            </p>
            <button
              type="button"
              onClick={handleDownload}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"
            >
              <Download className="h-4 w-4" />
              {t('chat.viewer.download')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
