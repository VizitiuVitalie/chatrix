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
import { ChatEntity } from '../../chats/entities/chat.entity';
import { FileEntity } from '../../files/entities/file.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('messages')
@Index('IX_messages_chat_id_id', ['chatId', 'id'])
@Index('UQ_messages_sender_id_client_id', ['senderId', 'clientId'], {
  unique: true,
})
export class MessageEntity extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'chat_id', type: 'int' })
  chatId: number;

  @ManyToOne(() => ChatEntity, (chat) => chat.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: ChatEntity;

  @Column({ name: 'sender_id', type: 'int' })
  senderId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: UserEntity;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({
    name: 'edited_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  editedAt: Date | null;

  @Column({ name: 'client_id', type: 'varchar', length: 64, nullable: true })
  clientId: string | null;

  @OneToMany(() => FileEntity, (file) => file.message)
  files: FileEntity[];
}
