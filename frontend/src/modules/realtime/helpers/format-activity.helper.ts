import type { TFunction } from 'i18next';

import type { ChatActivityRecord } from '../interfaces/chat-activity-record.interface';

export function formatActivity(
  records: ChatActivityRecord[],
  isGroup: boolean,
  nameByUserId: Map<number, string>,
  t: TFunction,
): string | null {
  if (records.length === 0) return null;

  const typing = records.filter((r) => r.type === 'typing');
  const active = typing.length > 0 ? typing : records;
  const verb = typing.length > 0 ? 'typing' : 'attachment';

  if (!isGroup) {
    return t(`activity.${verb}.direct`);
  }

  const names = [
    ...new Set(
      active
        .map((r) => nameByUserId.get(r.userId) ?? '')
        .filter((name) => name.length > 0),
    ),
  ];
  if (names.length === 0) return t(`activity.${verb}.direct`);
  if (names.length === 1) return t(`activity.${verb}.one`, { name: names[0] });
  if (names.length === 2) {
    return t(`activity.${verb}.two`, { a: names[0], b: names[1] });
  }
  return t(`activity.${verb}.many`, { count: names.length });
}
