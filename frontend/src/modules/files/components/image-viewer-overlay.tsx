import { Download, Loader2, X, ZoomIn, ZoomOut } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';

import { suspendPageZoomLock } from '@/shared/hooks/use-page-zoom-lock';

import { downloadAuthenticatedFile } from '../helpers/download-authenticated-file.helper';
import { downloadPublicFile } from '../helpers/download-public-file.helper';
import { useAuthenticatedBlobUrl } from '../hooks/use-authenticated-blob-url';
import type { ImageViewerOverlayProps } from '../interfaces/image-viewer-overlay-props.interface';
import {
  VIEWER_ZOOM_MAX,
  VIEWER_ZOOM_MIN,
  VIEWER_ZOOM_STEP,
} from '../constants/files.constants';

export function ImageViewerOverlay({
  file,
  onClose,
}: ImageViewerOverlayProps): ReactElement {
  const { t } = useTranslation();
  const requiresAuth = file.kind === 'message_attachment';
  const blob = useAuthenticatedBlobUrl(requiresAuth ? file.downloadUrl : null);
  const url = requiresAuth ? blob.url : file.downloadUrl;
  const isLoading = requiresAuth ? blob.isLoading : false;
  const error = requiresAuth ? blob.error : null;
  const [scale, setScale] = useState<number>(1);

  useEffect(() => suspendPageZoomLock(), []);

  const stopBubble = useCallback((event: ReactMouseEvent): void => {
    event.stopPropagation();
  }, []);

  const handleZoomIn = useCallback((): void => {
    setScale((current) =>
      Math.min(VIEWER_ZOOM_MAX, current + VIEWER_ZOOM_STEP),
    );
  }, []);
  const handleZoomOut = useCallback((): void => {
    setScale((current) =>
      Math.max(VIEWER_ZOOM_MIN, current - VIEWER_ZOOM_STEP),
    );
  }, []);

  const handleDownload = useCallback((): void => {
    const task = requiresAuth
      ? downloadAuthenticatedFile(file.downloadUrl, file.originalName)
      : downloadPublicFile(file.downloadUrl, file.originalName);

    task.catch((err: unknown) => {
      console.error('Attachment viewer download failed', err);
    });
  }, [requiresAuth, file.downloadUrl, file.originalName]);

  const canZoomIn = scale < VIEWER_ZOOM_MAX;
  const canZoomOut = scale > VIEWER_ZOOM_MIN;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={file.originalName}
      data-state="open"
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-auto bg-black/90"
    >
      {/* Toolbar pinned to the viewport's top-right via `fixed`,
          NOT to the scrollable backdrop's top — otherwise the
          buttons would scroll out of view once the user pans a
          zoomed image. */}
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

      {/* Centering wrapper. `min-h-full min-w-full` ensures the
          image area covers the viewport even when its content is
          small (so flex centering works), and grows beyond the
          viewport when the image is zoomed up (so the backdrop's
          overflow-auto kicks in). */}
      <div className="flex min-h-full min-w-full items-center justify-center p-4">
        {isLoading && <Loader2 className="h-12 w-12 animate-spin text-white" />}
        {error !== null && !isLoading && (
          <div className="text-sm text-white" onClick={stopBubble}>
            {t('chat.viewer.loadError')}
          </div>
        )}
        {url !== null && (
          <div
            style={{
              width: `${scale * 90}vw`,
              height: `${scale * 90}vh`,
              transition: 'width 150ms ease, height 150ms ease',
            }}
            className="flex shrink-0 items-center justify-center"
            onClick={stopBubble}
          >
            <img
              src={url}
              alt={file.originalName}
              className="block h-full w-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
