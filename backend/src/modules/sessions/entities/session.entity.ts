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
import { PushSubscriptionEntity } from '../../push/entities/push-subscription.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('sessions')
export class SessionEntity extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Index('IDX_sessions_refresh_token_hash')
  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 128 })
  refreshTokenHash: string;

  @Index('IDX_sessions_previous_refresh_token_hash')
  @Column({
    name: 'previous_refresh_token_hash',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  previousRefreshTokenHash: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt: Date;

  @Column({
    name: 'last_used_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  lastUsedAt: Date | null;

  @OneToMany(
    () => PushSubscriptionEntity,
    (subscription) => subscription.session,
  )
  pushSubscriptions: PushSubscriptionEntity[];
}
