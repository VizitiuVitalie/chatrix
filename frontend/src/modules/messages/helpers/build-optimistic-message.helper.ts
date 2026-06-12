import type { BuildOptimisticMessageInput } from '../interfaces/build-optimistic-message-input.interface';
import type { Message } from '../interfaces/message.interface';

export function buildOptimisticMessage(
  input: BuildOptimisticMessageInput,
): Message {
  const nowIso = new Date().toISOString();
  return {
    id: input.tempId,
    chatId: input.chatId,
    senderId: input.sender.id,
    content: input.content,
    editedAt: null,
    sender: input.sender,
    files: input.files ?? [],
    createdAt: nowIso,
    updatedAt: nowIso,
    deletedAt: null,
    clientId: input.clientId,
    status: 'pending',
  };
}
