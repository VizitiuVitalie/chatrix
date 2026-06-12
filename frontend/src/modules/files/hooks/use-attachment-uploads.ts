import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import { uploadFileRequest } from '../api/files.api';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILES_PER_MESSAGE,
  MAX_UPLOAD_SIZE_BYTES,
} from '../constants/files.constants';
import type { PendingFile } from '../interfaces/pending-file.interface';
import type { AttachmentError } from '../interfaces/attachment-error.interface';
import type { AttachmentUploadsApi } from '../interfaces/attachment-uploads-api.interface';

export type { AttachmentUploadsApi } from '../interfaces/attachment-uploads-api.interface';

export function useAttachmentUploads(): AttachmentUploadsApi {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [recentError, setRecentError] = useState<AttachmentError | null>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const pendingFilesRef = useRef<PendingFile[]>([]);
  useEffect(() => {
    pendingFilesRef.current = pendingFiles;
  }, [pendingFiles]);

  const startUpload = useCallback((entry: PendingFile): void => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setPendingFiles((prev) =>
        prev.map((p) =>
          p.clientId === entry.clientId
            ? { ...p, status: 'failed' as const, errorMessage: null }
            : p,
        ),
      );
      setRecentError({
        key: 'chat.composer.attachments.offline',
        params: {},
      });
      return;
    }

    const controller = new AbortController();
    abortControllersRef.current.set(entry.clientId, controller);

    void uploadFileRequest({
      file: entry.file,
      signal: controller.signal,
      onProgress: (fraction) => {
        setPendingFiles((prev) =>
          prev.map((p) =>
            p.clientId === entry.clientId ? { ...p, progress: fraction } : p,
          ),
        );
      },
    })
      .then((resource) => {
        abortControllersRef.current.delete(entry.clientId);
        setPendingFiles((prev) =>
          prev.map((p) =>
            p.clientId === entry.clientId
              ? {
                  ...p,
                  status: 'uploaded' as const,
                  progress: 1,
                  fileId: resource.id,
                  resource,
                }
              : p,
          ),
        );
      })
      .catch((err: unknown) => {
        abortControllersRef.current.delete(entry.clientId);

        if (axios.isCancel(err)) return;
        setPendingFiles((prev) =>
          prev.map((p) =>
            p.clientId === entry.clientId
              ? {
                  ...p,
                  status: 'failed' as const,
                  errorMessage: null,
                }
              : p,
          ),
        );
      });
  }, []);

  const addFiles = useCallback(
    (files: readonly File[]): void => {
      const current = pendingFilesRef.current;
      const remainingCapacity = MAX_FILES_PER_MESSAGE - current.length;

      let firstRejection: AttachmentError | null = null;
      const acceptedEntries: PendingFile[] = [];

      if (remainingCapacity <= 0) {
        firstRejection = {
          key: 'chat.composer.attachments.maxFiles',
          params: { max: MAX_FILES_PER_MESSAGE },
        };
      } else {
        for (const file of files) {
          if (acceptedEntries.length >= remainingCapacity) {
            firstRejection ??= {
              key: 'chat.composer.attachments.maxFiles',
              params: { max: MAX_FILES_PER_MESSAGE },
            };
            break;
          }
          if (!ALLOWED_MIME_TYPES.has(file.type)) {
            firstRejection ??= {
              key: 'chat.composer.attachments.unsupported',
              params: { name: file.name },
            };
            continue;
          }
          if (file.size > MAX_UPLOAD_SIZE_BYTES) {
            firstRejection ??= {
              key: 'chat.composer.attachments.tooLarge',
              params: {
                name: file.name,
                sizeMb: Math.round(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)),
              },
            };
            continue;
          }
          const clientId = crypto.randomUUID();
          acceptedEntries.push({
            clientId,
            file,
            status: 'uploading',
            progress: 0,
            fileId: null,
            resource: null,
            objectUrl: file.type.startsWith('image/')
              ? URL.createObjectURL(file)
              : null,
            errorMessage: null,
          });
        }
      }

      if (acceptedEntries.length > 0) {
        setPendingFiles((prev) => [...prev, ...acceptedEntries]);
      }
      if (firstRejection !== null) {
        setRecentError(firstRejection);
      }
      for (const entry of acceptedEntries) {
        startUpload(entry);
      }
    },
    [startUpload],
  );

  const removeFile = useCallback((clientId: string): void => {
    const controller = abortControllersRef.current.get(clientId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(clientId);
    }
    setPendingFiles((prev) => {
      const target = prev.find((p) => p.clientId === clientId);
      if (target?.objectUrl) {
        URL.revokeObjectURL(target.objectUrl);
      }
      return prev.filter((p) => p.clientId !== clientId);
    });
  }, []);

  const retryFile = useCallback(
    (clientId: string): void => {
      const current = pendingFilesRef.current;
      const target = current.find((p) => p.clientId === clientId);
      if (target === undefined || target.status !== 'failed') return;
      const next: PendingFile = {
        ...target,
        status: 'uploading',
        progress: 0,
        errorMessage: null,
      };
      setPendingFiles((prev) =>
        prev.map((p) => (p.clientId === clientId ? next : p)),
      );
      startUpload(next);
    },
    [startUpload],
  );

  const clearAll = useCallback((): void => {
    abortControllersRef.current.forEach((c) => {
      c.abort();
    });
    abortControllersRef.current.clear();
    setPendingFiles((prev) => {
      for (const entry of prev) {
        if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
      }
      return [];
    });
  }, []);

  const clearRecentError = useCallback((): void => {
    setRecentError(null);
  }, []);

  useEffect(() => {
    const controllers = abortControllersRef.current;
    return (): void => {
      controllers.forEach((c) => {
        c.abort();
      });
      controllers.clear();
      for (const entry of pendingFilesRef.current) {
        if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleOffline = (): void => {
      abortControllersRef.current.forEach((c) => {
        c.abort();
      });
      abortControllersRef.current.clear();
      setPendingFiles((prev) =>
        prev.map((p) =>
          p.status === 'uploading'
            ? { ...p, status: 'failed' as const, errorMessage: null }
            : p,
        ),
      );
      setRecentError({
        key: 'chat.composer.attachments.offline',
        params: {},
      });
    };
    const handleOnline = (): void => {
      setRecentError((current) =>
        current?.key === 'chat.composer.attachments.offline' ? null : current,
      );
      const failed = pendingFilesRef.current.filter(
        (p) => p.status === 'failed',
      );
      for (const entry of failed) {
        retryFile(entry.clientId);
      }
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return (): void => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [retryFile]);

  const isAnyUploading = pendingFiles.some((p) => p.status === 'uploading');
  const hasFailed = pendingFiles.some((p) => p.status === 'failed');

  return {
    pendingFiles,
    addFiles,
    removeFile,
    retryFile,
    clearAll,
    isAnyUploading,
    hasFailed,
    recentError,
    clearRecentError,
  };
}
