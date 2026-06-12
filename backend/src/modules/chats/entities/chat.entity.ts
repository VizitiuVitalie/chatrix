import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { ChatMemberEntity } from '../../chat-members/entities/chat-member.entity';
import { FileEntity } from '../../files/entities/file.entity';
import { MessageEntity } from '../../messages/entities/message.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ChatType } from '../enums/chat-type.enum';

@Entity('chats')
@Index('UQ_chats_direct_key', ['directKey'], {
  unique: true,
  where: '"direct_key" IS NOT NULL',
})
export class ChatEntity extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ChatType })
  type: ChatType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Column({ name: 'avatar_file_id', type: 'int', nullable: true })
  avatarFileId: number | null;

  @ManyToOne(() => FileEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'avatar_file_id' })
  avatarFile: FileEntity | null;

  @Column({ name: 'created_by_id', type: 'int', nullable: true })
  createdById: number | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: UserEntity | null;

  @Column({ name: 'direct_key', type: 'varchar', length: 32, nullable: true })
  directKey: string | null;

  @OneToMany(() => ChatMemberEntity, (member) => member.chat)
  members: ChatMemberEntity[];

  @OneToMany(() => MessageEntity, (message) => message.chat)
  messages: MessageEntity[];

  @Column({ name: 'last_message_id', type: 'int', nullable: true })
  lastMessageId: number | null;

  @ManyToOne(() => MessageEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'last_message_id' })
  lastMessage: MessageEntity | null;
}
