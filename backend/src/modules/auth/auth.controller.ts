import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseIntPipe,
  Post,
  Res,
  SerializeOptions,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import ms, { StringValue } from 'ms';
import { AppLogger } from '../../common/logger/app-logger.service';
import { SessionDto } from '../sessions/dto/session.dto';
import { OwnUserDto } from '../users/dto/own-user.dto';
import { AuthService } from './auth.service';
import { Cookies } from './decorators/cookies.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtTokensResponseDto } from './dto/jwt-tokens-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

const REFRESH_COOKIE_NAME = 'refresh_token';
const COOKIE_PATH = '/api/auth';

@SerializeOptions({ excludeExtraneousValues: true })
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthController.name);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 5 * 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user (auto-login on success)' })
  @ApiResponse({ status: 201, description: 'Created', type: LoginResponseDto })
  @ApiResponse({ status: 409, description: 'Username or email already taken' })
  public async register(
    @Body() dto: RegisterDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    this.logger.info(
      'register',
      { username: dto.username },
      'Register request',
    );

    const result = await this.authService.register(dto, userAgent ?? null, ip);

    this.setRefreshCookie(res, result.refreshToken);

    return result.dto;
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with username + password' })
  @ApiResponse({
    status: 200,
    description: 'Logged in',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  public async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    this.logger.info('login', { username: dto.username }, 'Login request');

    const result = await this.authService.login(dto, userAgent ?? null, ip);

    this.setRefreshCookie(res, result.refreshToken);

    return result.dto;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_COOKIE_NAME)
  @ApiOperation({
    summary: 'Rotate the refresh token and issue a new access token',
  })
  @ApiResponse({ status: 200, type: JwtTokensResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
  @ApiResponse({ status: 403, description: 'Refresh token reuse detected' })
  public async refresh(
    @Cookies(REFRESH_COOKIE_NAME) refreshToken: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<JwtTokensResponseDto> {
    this.clearLegacyDomainCookie(res);

    if (!refreshToken) {
      this.logger.warn('refresh', {}, 'Refresh request without cookie');
      throw new UnauthorizedException('Refresh token cookie missing');
    }

    this.logger.info('refresh', {}, 'Refresh request');

    const result = await this.authService.refresh(
      refreshToken,
      userAgent ?? null,
      ip,
    );

    this.setRefreshCookie(res, result.refreshToken);

    return result.dto;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth(REFRESH_COOKIE_NAME)
  @ApiOperation({
    summary: 'Revoke the current session and clear the refresh cookie',
  })
  @ApiResponse({ status: 204, description: 'Logged out' })
  public async logout(
    @Cookies(REFRESH_COOKIE_NAME) refreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    this.clearRefreshCookie(res);

    if (refreshToken === undefined) {
      this.logger.info('logout', {}, 'Logout request without refresh cookie');
      return;
    }

    this.logger.info('logout', {}, 'Logout request');

    await this.authService.logoutByRefreshToken(refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profile of the currently authenticated user' })
  @ApiResponse({ status: 200, type: OwnUserDto })
  public async me(@CurrentUser() user: AuthenticatedUser): Promise<OwnUserDto> {
    this.logger.debug('me', { userId: user.id }, 'Profile request');

    return this.authService.getProfile(user.id);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active sessions for current user' })
  @ApiResponse({ status: 200, type: SessionDto, isArray: true })
  public async listSessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SessionDto[]> {
    this.logger.debug(
      'listSessions',
      { userId: user.id },
      'Sessions list request',
    );

    return this.authService.listSessions(user.id);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session by id' })
  @ApiResponse({ status: 204, description: 'Revoked' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  public async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) sessionId: number,
  ): Promise<void> {
    this.logger.info(
      'revokeSession',
      { userId: user.id, sessionId },
      'Revoke session request',
    );

    await this.authService.revokeSession(sessionId, user.id);
  }

  private setRefreshCookie(res: Response, token: string): void {
    this.clearLegacyDomainCookie(res);

    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: this.config.get<boolean>('COOKIE_SECURE') === true,
      sameSite: 'lax',
      ...this.cookieDomainOption(),
      path: COOKIE_PATH,
      maxAge: ms(this.config.get<StringValue>('REFRESH_TTL')!),
    });
  }

  private clearRefreshCookie(res: Response): void {
    this.clearLegacyDomainCookie(res);

    res.clearCookie(REFRESH_COOKIE_NAME, {
      ...this.cookieDomainOption(),
      path: COOKIE_PATH,
    });
  }

  private cookieDomainOption(): { domain?: string } {
    const domain = this.config.get<string>('COOKIE_DOMAIN');
    return domain ? { domain } : {};
  }

  private clearLegacyDomainCookie(res: Response): void {
    const legacyDomain = this.config.get<string>('COOKIE_DOMAIN_LEGACY');

    if (!legacyDomain) {
      return;
    }

    res.clearCookie(REFRESH_COOKIE_NAME, {
      domain: legacyDomain,
      path: COOKIE_PATH,
    });
  }
}
