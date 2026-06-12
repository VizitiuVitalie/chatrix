import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { uniqueViolationIsOn } from '../../common/helpers/is-unique-violation.helper';
import { AppLogger } from '../../common/logger/app-logger.service';
import { SessionDto } from '../sessions/dto/session.dto';
import { SessionsService } from '../sessions/sessions.service';
import { OwnUserDto } from '../users/dto/own-user.dto';
import { UserEntity } from '../users/entities/user.entity';
import { normalizeNickname } from '../users/helpers/normalize-nickname.helper';
import { UsersService } from '../users/users.service';
import { BCRYPT_ROUNDS } from './constants/auth.constants';
import { JwtTokensResponseDto } from './dto/jwt-tokens-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginResult } from './interfaces/login-result.interface';
import { RefreshResult } from './interfaces/refresh-result.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  public async register(
    dto: RegisterDto,
    userAgent: string | null,
    ipAddress: string | null,
  ): Promise<LoginResult> {
    const existingByUsername = await this.usersService.findByUsername(
      dto.username,
    );
    if (existingByUsername) {
      throw new ConflictException('Username already taken');
    }

    const normalizedEmail = dto.email?.toLowerCase().trim() || null;
    if (normalizedEmail) {
      const existingByEmail =
        await this.usersService.findByEmail(normalizedEmail);

      if (existingByEmail) {
        throw new ConflictException('Email already taken');
      }
    }

    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);

    let user: UserEntity;
    try {
      user = await this.usersService.create({
        username: dto.username,
        email: normalizedEmail,
        nickname: normalizeNickname(dto.nickname),
        password: passwordHash,
        bio: null,
      });
    } catch (err) {
      if (uniqueViolationIsOn(err, 'username')) {
        throw new ConflictException('Username already taken');
      }
      if (uniqueViolationIsOn(err, 'email')) {
        throw new ConflictException('Email already taken');
      }
      throw err;
    }

    this.logger.info(
      'register',
      { userId: user.id, username: user.username },
      'User registered',
    );

    const { session, rawRefreshToken } =
      await this.sessionsService.createSession(user.id, userAgent, ipAddress);

    const accessToken = await this.signAccessToken(user.id, session.id);

    return {
      dto: new LoginResponseDto({
        accessToken,
        user: this.usersService.toOwnDto(user),
      }),
      refreshToken: rawRefreshToken,
    };
  }

  public async login(
    dto: LoginDto,
    userAgent: string | null,
    ipAddress: string | null,
  ): Promise<LoginResult> {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) {
      this.logger.warn(
        'login',
        { username: dto.username },
        'Login failed — user not found',
      );

      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await compare(dto.password, user.password);

    if (!passwordOk) {
      this.logger.warn(
        'login',
        { userId: user.id },
        'Login failed — wrong password',
      );

      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.info('login', { userId: user.id }, 'User logged in');

    const { session, rawRefreshToken } =
      await this.sessionsService.createSession(user.id, userAgent, ipAddress);
    const accessToken = await this.signAccessToken(user.id, session.id);

    return {
      dto: new LoginResponseDto({
        accessToken,
        user: this.usersService.toOwnDto(user),
      }),
      refreshToken: rawRefreshToken,
    };
  }

  public async refresh(
    rawRefreshToken: string,
    userAgent: string | null,
    ipAddress: string | null,
  ): Promise<RefreshResult> {
    const { session, rawRefreshToken: newRaw } =
      await this.sessionsService.rotateRefreshToken(
        rawRefreshToken,
        ipAddress,
        userAgent,
      );

    const accessToken = await this.signAccessToken(session.userId, session.id);

    return {
      dto: new JwtTokensResponseDto({ accessToken }),
      refreshToken: newRaw,
    };
  }

  public async logoutByRefreshToken(rawRefreshToken: string): Promise<void> {
    await this.sessionsService.revokeByRefreshToken(rawRefreshToken);
    this.logger.info('logout', {}, 'User logged out');
  }

  public async getProfile(userId: number): Promise<OwnUserDto> {
    return await this.usersService.getOwnProfile(userId);
  }

  public async listSessions(userId: number): Promise<SessionDto[]> {
    return await this.sessionsService.listActiveSessions(userId);
  }

  public async revokeSession(sessionId: number, userId: number): Promise<void> {
    await this.sessionsService.revokeSession(sessionId, userId);
  }

  private async signAccessToken(
    userId: number,
    sessionId: number,
  ): Promise<string> {
    const payload: JwtPayload = { sub: userId, sessionId };
    return this.jwtService.signAsync(payload);
  }
}
