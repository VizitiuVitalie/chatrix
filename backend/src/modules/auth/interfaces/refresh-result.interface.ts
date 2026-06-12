import { JwtTokensResponseDto } from '../dto/jwt-tokens-response.dto';

export interface RefreshResult {
  dto: JwtTokensResponseDto;
  refreshToken: string;
}
