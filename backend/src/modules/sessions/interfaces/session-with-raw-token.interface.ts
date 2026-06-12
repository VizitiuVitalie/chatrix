import { SessionEntity } from '../entities/session.entity';

export interface SessionWithRawToken {
  session: SessionEntity;
  rawRefreshToken: string;
}
