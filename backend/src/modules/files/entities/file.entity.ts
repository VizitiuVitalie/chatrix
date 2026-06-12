import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { MessageEntity } from '../../messages/entities/message.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { FileKind } from '../enums/file-kind.enum';

@Entity('files')
@Index('IX_files_message_id', ['messageId'])
@Index('IX_files_uploaded_by_id', ['uploadedById'])
export class FileEntity extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: FileKind })
  kind: FileKind;

  @Column({ name: 'storage_key', type: 'varchar', length: 500 })
  storageKey: string;

  @Column({
    name: 'thumbnail_storage_key',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  thumbnailStorageKey: string | null;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes: number;

  @Column({ name: 'width', type: 'int', nullable: true })
  width: number | null;

  @Column({ name: 'height', type: 'int', nullable: true })
  height: number | null;

  @Column({ name: 'message_id', type: 'int', nullable: true })
  messageId: number | null;

  @ManyToOne(() => MessageEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'message_id' })
  message: MessageEntity | null;

  @Column({ name: 'uploaded_by_id', type: 'int' })
  uploadedById: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: UserEntity;
}
