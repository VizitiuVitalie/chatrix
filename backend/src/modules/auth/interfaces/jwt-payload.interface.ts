export interface JwtPayload {
  sub: number;
  sessionId: number;
  iat?: number;
  exp?: number;
}
