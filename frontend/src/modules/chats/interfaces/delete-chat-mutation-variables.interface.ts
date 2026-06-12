import type { DeleteChatScope } from './delete-chat-scope.type';

export interface DeleteChatMutationVariables {
  chatId: number;
  scope: DeleteChatScope;
  currentUserId: number;
}
