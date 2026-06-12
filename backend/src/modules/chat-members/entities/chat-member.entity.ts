import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { ChatEntity } from '../../chats/entities/chat.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ChatMemberRole } from '../enums/chat-member-role.enum';

@Entity('chat_members')
@Unique('UQ_chat_members_chat_id_user_id', ['chatId', 'userId'])
export class ChatMemberEntity extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'chat_id', type: 'int' })
  chatId: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => ChatEntity, (chat) => chat.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: ChatEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: ChatMemberRole,
    default: ChatMemberRole.MEMBER,
  })
  role: ChatMemberRole;

  @Column({
    name: 'last_read_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  lastReadAt: Date | null;

  @Column({
    name: 'chat_history_cleared_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  chatHistoryClearedAt: Date | null;
}
