import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useCallback, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useDeleteFileMutation } from '@/modules/files/hooks/use-delete-file-mutation';
import { useMyFilesQuery } from '@/modules/files/hooks/use-my-files-query';
import type { FileResource } from '@/modules/files/interfaces/file.interface';
import type { FileSort } from '@/modules/files/interfaces/file-sort.type';
import { getErrorMessage } from '@/shared/api/helpers/api-error.helper';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

import { MY_FILES_PAGE_SIZE } from '../constants/profile.constants';
import { ProfileFileRow } from './profile-file-row';

export function ProfileFilesList(): ReactElement {
  const { t } = useTranslation();
  const [page, setPage] = useState<number>(1);
  const [sort, setSort] = useState<FileSort>('size_desc');
  const [pendingDelete, setPendingDelete] = useState<FileResource | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filesQuery = useMyFilesQuery({ page, limit: MY_FILES_PAGE_SIZE, sort });
  const deleteMutation = useDeleteFileMutation();
  const { mutate: deleteFile, isPending: isDeletePending } = deleteMutation;

  const handleRequestDelete = useCallback((file: FileResource): void => {
    setDeleteError(null);
    setPendingDelete(file);
  }, []);

  const closeConfirm = useCallback((): void => {
    setPendingDelete(null);
    setDeleteError(null);
  }, []);

  const confirmDelete = useCallback((): void => {
    if (!pendingDelete) return;
    setDeleteError(null);
    deleteFile(pendingDelete.id, {
      onSuccess: () => {
        if (filesQuery.data && filesQuery.data.items.length === 1 && page > 1) {
          setPage(page - 1);
        }
        closeConfirm();
      },
      onError: (error) => {
        setDeleteError(getErrorMessage(error));
      },
    });
  }, [closeConfirm, deleteFile, filesQuery.data, page, pendingDelete]);

  const totalPages = filesQuery.data
    ? Math.max(1, Math.ceil(filesQuery.data.total / MY_FILES_PAGE_SIZE))
    : 1;

  return (
    <section className="bg-card border-border rounded-2xl border p-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-foreground text-sm font-semibold">
          {t('profile.files.heading')}
        </h3>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as FileSort);
            setPage(1);
          }}
          className="bg-secondary text-foreground border-border focus:ring-ring h-9 cursor-pointer rounded-lg border px-2 text-xs focus:outline-none focus:ring-2"
        >
          <option value="size_desc">{t('profile.files.sort.sizeDesc')}</option>
          <option value="size_asc">{t('profile.files.sort.sizeAsc')}</option>
          <option value="created_desc">{t('profile.files.sort.newest')}</option>
          <option value="created_asc">{t('profile.files.sort.oldest')}</option>
        </select>
      </header>

      {filesQuery.isLoading && (
        <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading')}
        </div>
      )}

      {filesQuery.isError && (
        <p className="text-destructive py-4 text-sm">
          {t('profile.files.error')}
        </p>
      )}

      {filesQuery.data && filesQuery.data.items.length === 0 && (
        <p className="text-muted-foreground py-6 text-center text-sm">
          {t('profile.files.empty')}
        </p>
      )}

      {filesQuery.data && filesQuery.data.items.length > 0 && (
        <>
          <ul className="max-h-[260px] space-y-2 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 lg:flex-1">
            {filesQuery.data.items.map((file) => (
              <li key={file.id}>
                <ProfileFileRow
                  file={file}
                  isPending={isDeletePending && pendingDelete?.id === file.id}
                  onRequestDelete={handleRequestDelete}
                />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {t('profile.files.pageOf', { page, total: totalPages })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={page <= 1}
                  aria-label={t('profile.files.prevPage')}
                  className="text-muted-foreground hover:bg-secondary inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  disabled={page >= totalPages}
                  aria-label={t('profile.files.nextPage')}
                  className="text-muted-foreground hover:bg-secondary inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) closeConfirm();
        }}
      >
        <AlertDialogContent>
          {pendingDelete !== null && (
            <>
              <AlertDialogTitle>
                {t('profile.files.confirmDelete.title')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('profile.files.confirmDelete.description', {
                  name: pendingDelete.originalName,
                })}
              </AlertDialogDescription>
              {deleteError !== null && (
                <p className="text-destructive mt-3 text-sm">{deleteError}</p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletePending}>
                  {t('common.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    confirmDelete();
                  }}
                  disabled={isDeletePending}
                >
                  {t('profile.files.confirmDelete.confirmLabel')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
