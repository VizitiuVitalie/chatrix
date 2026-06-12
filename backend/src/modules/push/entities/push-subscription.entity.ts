import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SessionEntity } from '../../sessions/entities/session.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('push_subscriptions')
export class PushSubscriptionEntity extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.pushSubscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'session_id' })
  sessionId: number;

  @ManyToOne(() => SessionEntity, (session) => session.pushSubscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: SessionEntity;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 1024 })
  endpoint: string;

  @Column({ type: 'varchar', length: 255 })
  p256dh: string;

  @Column({ type: 'varchar', length: 255 })
  auth: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;
}
