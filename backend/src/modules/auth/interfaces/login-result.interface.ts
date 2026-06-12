import { LoginResponseDto } from '../dto/login-response.dto';

export interface LoginResult {
  dto: LoginResponseDto;
  refreshToken: string;
}
