import { apiClient } from '@/shared/api/client';

import type { FetchMessagesParams } from '../interfaces/fetch-messages-params.interface';
import type { Message } from '../interfaces/message.interface';
import type { MessagesPage } from '../interfaces/messages-page.interface';
import type { SendMessageRequest } from '../interfaces/send-message-request.interface';
import type { UpdateMessageRequest } from '../interfaces/update-message-request.interface';

export async function fetchMessagesRequest(
  params: FetchMessagesParams,
): Promise<MessagesPage> {
  const response = await apiClient.get<MessagesPage>('/messages', {
    params: {
      chatId: params.chatId,
      ...(params.before !== undefined ? { before: params.before } : {}),
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
    },
  });
  return response.data;
}

export async function sendMessageRequest(
  body: SendMessageRequest,
): Promise<Message> {
  const response = await apiClient.post<Message>('/messages', body);
  return response.data;
}

export async function editMessageRequest(
  messageId: number,
  body: UpdateMessageRequest,
): Promise<Message> {
  const response = await apiClient.patch<Message>(
    `/messages/${messageId}`,
    body,
  );
  return response.data;
}

export async function deleteMessageRequest(messageId: number): Promise<void> {
  await apiClient.delete(`/messages/${messageId}`);
}
