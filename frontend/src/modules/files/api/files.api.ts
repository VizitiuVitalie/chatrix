import { apiClient } from '@/shared/api/client';

import type { User } from '@/modules/auth/interfaces/user.interface';
import type { Chat } from '@/modules/chats/interfaces/chat.interface';

import type { FileResource } from '../interfaces/file.interface';
import type { FilesPage } from '../interfaces/files-page.interface';
import type { ListMyFilesVariables } from '../interfaces/list-my-files-variables.interface';
import type { UploadFileOptions } from '../interfaces/upload-file-options.interface';

export async function uploadFileRequest({
  file,
  onProgress,
  signal,
}: UploadFileOptions): Promise<FileResource> {
  const form = new FormData();
  form.append('file', file);

  const response = await apiClient.post<FileResource>('/files', form, {
    onUploadProgress: (event) => {
      if (!onProgress) return;
      const total = event.total ?? file.size;
      if (total <= 0) return;
      const fraction = Math.min(1, event.loaded / total);
      onProgress(fraction);
    },
    signal,
  });
  return response.data;
}

export async function uploadMyAvatarRequest(file: File): Promise<User> {
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.put<User>('/files/avatar/me', form);
  return response.data;
}

export async function clearMyAvatarRequest(): Promise<User> {
  const response = await apiClient.delete<User>('/files/avatar/me');
  return response.data;
}

export async function uploadChatAvatarRequest(
  chatId: number,
  file: File,
): Promise<Chat> {
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.put<Chat>(
    `/files/avatar/chat/${String(chatId)}`,
    form,
  );
  return response.data;
}

export async function clearChatAvatarRequest(chatId: number): Promise<Chat> {
  const response = await apiClient.delete<Chat>(
    `/files/avatar/chat/${String(chatId)}`,
  );
  return response.data;
}

export async function listMyFilesRequest(
  variables: ListMyFilesVariables,
): Promise<FilesPage> {
  const response = await apiClient.get<FilesPage>('/files/mine', {
    params: variables,
  });
  return response.data;
}

export async function deleteFileRequest(fileId: number): Promise<void> {
  await apiClient.delete(`/files/${fileId}`);
}
