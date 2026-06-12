import { ChatMemberDto } from '../modules/chat-members/dto/chat-member.dto';
import { ChatLastMessageDto } from '../modules/chats/dto/chat-last-message.dto';
import { ChatDto } from '../modules/chats/dto/chat.dto';
import { MessageDto } from '../modules/messages/dto/message.dto';
import { UserDto } from '../modules/users/dto/user.dto';
import { ActivityState } from '../modules/users/enums/activity-state.enum';
import { ActivityType } from '../modules/users/enums/activity-type.enum';

export const ClientEvent = {
  MESSAGE_CREATED: 'message:created',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_DELETED: 'message:deleted',
  CHAT_CREATED: 'chat:created',
  CHAT_UPDATED: 'chat:updated',
  CHAT_DELETED: 'chat:deleted',
  CHAT_MEMBER_ADDED: 'chat-member:added',
  CHAT_MEMBER_REMOVED: 'chat-member:removed',
  CHAT_MEMBER_ROLE_CHANGED: 'chat-member:role-changed',
  CHAT_MEMBER_READ: 'chat-member:read',
  USER_UPDATED: 'user:updated',
  USER_PRESENCE: 'user:presence',
  USER_ACTIVITY: 'user:activity',
} as const;

export interface ActivityPayload {
  userId: number;
  chatId: number;
  type: ActivityType;
  state: ActivityState;
}

export type MessageCreatedPayload = MessageDto;

export type MessageEditedPayload = MessageDto;

export interface MessageDeletedPayload {
  chatId: number;
  messageId: number;
  newLastMessage: ChatLastMessageDto | null;
}

export type ChatCreatedPayload = ChatDto;

export type ChatUpdatedPayload = ChatDto;

export interface ChatDeletedPayload {
  chatId: number;
}

export type ChatMemberAddedPayload = ChatMemberDto;

export interface ChatMemberRemovedPayload {
  chatId: number;
  userId: number;
}

export type ChatMemberRoleChangedPayload = ChatMemberDto;

export type ChatMemberReadPayload = ChatMemberDto;

export type UserUpdatedPayload = UserDto;

export interface UserPresencePayload {
  userId: number;
  isOnline: boolean;
  lastSeenAt?: Date;
}
