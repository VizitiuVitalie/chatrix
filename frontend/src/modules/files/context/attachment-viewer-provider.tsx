import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { isVideoMime } from '../constants/files.constants';
import type { FileResource } from '../interfaces/file.interface';
import { ImageViewerOverlay } from '../components/image-viewer-overlay';
import { VideoPlayerOverlay } from '../components/video-player-overlay';
import { AttachmentViewerContext } from './attachment-viewer-context';
import type { AttachmentViewerContextValue } from '../interfaces/attachment-viewer-context-value.interface';

function dropActiveFocus(): void {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== document.body) {
    active.blur();
  }
}

export function AttachmentViewerProvider({
  children,
}: PropsWithChildren): ReactElement {
  const [viewingFile, setViewingFile] = useState<FileResource | null>(null);

  const openViewer = useCallback((file: FileResource): void => {
    dropActiveFocus();
    setViewingFile(file);
  }, []);
  const closeViewer = useCallback((): void => {
    setViewingFile(null);
    dropActiveFocus();
  }, []);

  useEffect(() => {
    if (viewingFile === null) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeViewer();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return (): void => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [viewingFile, closeViewer]);

  useEffect(() => {
    if (viewingFile === null) return;
    const handleFullscreenChange = (): void => {
      if (document.fullscreenElement !== null) return;
      dropActiveFocus();
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return (): void => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [viewingFile]);

  useEffect(() => {
    if (viewingFile === null) return;
    if (typeof window === 'undefined') return;
    window.history.pushState({ chatrixViewerOpen: true }, '');
    const handlePopState = (event: PopStateEvent): void => {
      const state = event.state as { chatrixViewerOpen?: boolean } | null;
      if (state?.chatrixViewerOpen === true) return;
      closeViewer();
    };
    window.addEventListener('popstate', handlePopState);
    return (): void => {
      window.removeEventListener('popstate', handlePopState);
      const state = window.history.state as {
        chatrixViewerOpen?: boolean;
      } | null;
      if (state?.chatrixViewerOpen === true) {
        window.history.back();
      }
    };
  }, [viewingFile, closeViewer]);

  const value = useMemo<AttachmentViewerContextValue>(
    () => ({ openViewer }),
    [openViewer],
  );

  return (
    <AttachmentViewerContext.Provider value={value}>
      {children}
      {viewingFile !== null &&
        (isVideoMime(viewingFile.mimeType) ? (
          <VideoPlayerOverlay file={viewingFile} onClose={closeViewer} />
        ) : (
          <ImageViewerOverlay file={viewingFile} onClose={closeViewer} />
        ))}
    </AttachmentViewerContext.Provider>
  );
}
