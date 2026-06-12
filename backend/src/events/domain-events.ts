import { ChatMemberDto } from '../modules/chat-members/dto/chat-member.dto';
import { ChatLastMessageDto } from '../modules/chats/dto/chat-last-message.dto';
import { ChatDto } from '../modules/chats/dto/chat.dto';
import { MessageDto } from '../modules/messages/dto/message.dto';
import { UserDto } from '../modules/users/dto/user.dto';

export const DomainEvent = {
  MESSAGE_CREATED: 'message.created',
  MESSAGE_EDITED: 'message.edited',
  MESSAGE_DELETED: 'message.deleted',
  CHAT_CREATED: 'chat.created',
  CHAT_UPDATED: 'chat.updated',
  CHAT_DELETED: 'chat.deleted',
  CHAT_MEMBER_ADDED: 'chat-member.added',
  CHAT_MEMBER_REMOVED: 'chat-member.removed',
  CHAT_MEMBER_ROLE_CHANGED: 'chat-member.role-changed',
  CHAT_MEMBER_READ: 'chat-member.read',
  USER_UPDATED: 'user.updated',
  SESSION_REVOKED: 'session.revoked',
  SESSIONS_REVOKED_ALL: 'sessions.revoked-all',
} as const;

export interface MessageCreatedEvent {
  chatId: number;
  message: MessageDto;
}

export interface MessageEditedEvent {
  chatId: number;
  message: MessageDto;
}

export interface MessageDeletedEvent {
  chatId: number;
  messageId: number;
  newLastMessage: ChatLastMessageDto | null;
}

export interface ChatCreatedEvent {
  chat: ChatDto;
}

export interface ChatUpdatedEvent {
  chat: ChatDto;
}

export interface ChatDeletedEvent {
  chatId: number;
}

export interface ChatMemberAddedEvent {
  chatId: number;
  member: ChatMemberDto;
}

export interface ChatMemberRemovedEvent {
  chatId: number;
  removedUserId: number;
}

export interface ChatMemberRoleChangedEvent {
  chatId: number;
  member: ChatMemberDto;
}

export interface ChatMemberReadEvent {
  chatId: number;
  member: ChatMemberDto;
}

export interface UserUpdatedEvent {
  user: UserDto;
}

export interface SessionRevokedEvent {
  sessionId: number;
  userId: number;
}

export interface SessionsRevokedAllEvent {
  userId: number;
}
