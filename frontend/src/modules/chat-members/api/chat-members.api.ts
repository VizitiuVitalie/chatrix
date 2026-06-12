import { apiClient } from '@/shared/api/client';

import type { ChatMember } from '@/modules/chats/interfaces/chat-member.interface';
import type { ChatMemberRole } from '@/modules/chats/interfaces/chat-member-role.type';

import type { AddChatMemberVariables } from '../interfaces/add-chat-member-variables.interface';

export async function addChatMemberRequest(
  variables: AddChatMemberVariables,
): Promise<ChatMember> {
  const response = await apiClient.post<ChatMember>('/chat-members', variables);
  return response.data;
}

export async function removeChatMemberRequest(memberId: number): Promise<void> {
  await apiClient.delete(`/chat-members/${memberId}`);
}

export async function updateChatMemberRoleRequest(
  memberId: number,
  role: ChatMemberRole,
): Promise<ChatMember> {
  const response = await apiClient.patch<ChatMember>(
    `/chat-members/${memberId}`,
    { role },
  );
  return response.data;
}
