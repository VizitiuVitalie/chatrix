import type { InfiniteData } from '@tanstack/react-query';

import type { Message } from '../interfaces/message.interface';
import type { MessagesPage } from '../interfaces/messages-page.interface';

export function upsertMessageIntoPages(
  data: InfiniteData<MessagesPage> | undefined,
  message: Message,
): InfiniteData<MessagesPage> | undefined {
  if (!data) return data;

  const matches = (candidate: Message): boolean =>
    (message.clientId != null && candidate.clientId === message.clientId) ||
    candidate.id === message.id;

  let replaced = false;
  const pages = data.pages.map((page) => {
    if (replaced) return page;
    const index = page.items.findIndex(matches);
    if (index === -1) return page;
    replaced = true;
    const items = page.items.slice();
    items[index] = message;
    return { ...page, items };
  });
  if (replaced) return { ...data, pages };

  const [firstPage, ...rest] = data.pages;
  if (!firstPage) {
    return { ...data, pages: [{ items: [message], nextCursor: null }] };
  }
  return {
    ...data,
    pages: [{ ...firstPage, items: [message, ...firstPage.items] }, ...rest],
  };
}
