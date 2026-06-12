import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { FileEntity } from '../../files/entities/file.entity';
import { PushSubscriptionEntity } from '../../push/entities/push-subscription.entity';
import { SessionEntity } from '../../sessions/entities/session.entity';
import { Theme } from '../enums/theme.enum';

@Entity('users')
@Check('CHK_users_email_lowercase', 'email IS NULL OR email = LOWER(email)')
export class UserEntity extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 32, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 64 })
  nickname: string;

  @Column({ name: 'avatar_file_id', type: 'int', nullable: true })
  avatarFileId: number | null;

  @ManyToOne(() => FileEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'avatar_file_id' })
  avatarFile: FileEntity | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'push_enabled', type: 'boolean', default: true })
  pushEnabled: boolean;

  @Column({
    name: 'theme',
    type: 'enum',
    enum: Theme,
    default: Theme.SYSTEM,
  })
  theme: Theme;

  @Column({
    name: 'storage_used_bytes',
    type: 'bigint',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  storageUsedBytes: number;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  @OneToMany(() => SessionEntity, (session) => session.user)
  sessions: SessionEntity[];

  @OneToMany(() => PushSubscriptionEntity, (subscription) => subscription.user)
  pushSubscriptions: PushSubscriptionEntity[];
}
