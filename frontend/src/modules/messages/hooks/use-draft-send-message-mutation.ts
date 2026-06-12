import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useNavigate, type NavigateFunction } from 'react-router-dom';

import { createDirectChatRequest } from '@/modules/chats/api/chats.api';
import type { Chat } from '@/modules/chats/interfaces/chat.interface';

import { sendMessageRequest } from '../api/messages.api';
import type { DraftSendMessageResult } from '../interfaces/draft-send-message-result.interface';
import type { DraftSendMessageVariables } from '../interfaces/draft-send-message-variables.interface';
import type { MessagesPage } from '../interfaces/messages-page.interface';
import { messagesQueryKey } from './use-messages-query';
import {
  CHATS_QUERY_KEY,
  FOCUS_COMPOSER_STATE_KEY,
  KEYBOARD_HANDOFF_ATTRIBUTE,
  KEYBOARD_HANDOFF_COMPOSER,
} from '@/modules/chats/constants/chats.constants';

export function useDraftSendMessageMutation(): UseMutationResult<
  DraftSendMessageResult,
  Error,
  DraftSendMessageVariables
> {
  const queryClient = useQueryClient();
  const navigate: NavigateFunction = useNavigate();

  return useMutation<DraftSendMessageResult, Error, DraftSendMessageVariables>({
    mutationFn: async ({ peerUserId, content, fileIds, clientId }) => {
      const chat = await createDirectChatRequest(peerUserId);
      const message = await sendMessageRequest({
        chatId: chat.id,
        content,
        fileIds,
        clientId,
      });
      return { chat, message };
    },

    onSuccess: ({ chat, message }) => {
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        messagesQueryKey(chat.id),
        {
          pages: [{ items: [message], nextCursor: null }],
          pageParams: [undefined],
        },
      );

      queryClient.setQueryData<Chat[]>(CHATS_QUERY_KEY, (chats) => {
        if (!chats) return [chat];
        if (chats.some((c) => c.id === chat.id)) return chats;
        return [chat, ...chats];
      });

      const shouldFocusComposer =
        document.activeElement instanceof HTMLTextAreaElement &&
        document.activeElement.hasAttribute('data-composer-textarea');
      if (shouldFocusComposer) {
        document.documentElement.setAttribute(
          KEYBOARD_HANDOFF_ATTRIBUTE,
          KEYBOARD_HANDOFF_COMPOSER,
        );
      }

      void navigate(`/chats/${chat.id}`, {
        state: { [FOCUS_COMPOSER_STATE_KEY]: shouldFocusComposer },
      });
    },
  });
}
