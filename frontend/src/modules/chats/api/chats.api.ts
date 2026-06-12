import { apiClient } from '@/shared/api/client';

import type { Chat } from '../interfaces/chat.interface';
import type { ChatMember } from '../interfaces/chat-member.interface';
import type { DeleteChatScope } from '../interfaces/delete-chat-scope.type';

export async function fetchChatsRequest(): Promise<Chat[]> {
  const response = await apiClient.get<Chat[]>('/chats');
  return response.data;
}

export async function markChatReadRequest(chatId: number): Promise<ChatMember> {
  const response = await apiClient.post<ChatMember>(`/chats/${chatId}/read`);
  return response.data;
}

export async function createDirectChatRequest(
  targetUserId: number,
): Promise<Chat> {
  const response = await apiClient.post<Chat>('/chats/direct', {
    targetUserId,
  });
  return response.data;
}

export async function createGroupChatRequest(
  name: string,
  memberIds: number[],
): Promise<Chat> {
  const response = await apiClient.post<Chat>('/chats/groups', {
    name,
    memberIds,
  });
  return response.data;
}

export async function updateChatRequest(
  chatId: number,
  patch: { name: string },
): Promise<Chat> {
  const response = await apiClient.patch<Chat>(`/chats/${chatId}`, patch);
  return response.data;
}

export async function deleteChatRequest(
  chatId: number,
  scope: DeleteChatScope,
): Promise<void> {
  await apiClient.delete(`/chats/${chatId}`, { params: { scope } });
}
