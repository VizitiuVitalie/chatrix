import { QueryFailedError } from 'typeorm';

interface PgUniqueViolationFields {
  code: string;
  detail?: string;
}

interface DriverErrorShape {
  code?: unknown;
  detail?: unknown;
}

function extractPgError(err: unknown): PgUniqueViolationFields | null {
  if (!(err instanceof QueryFailedError)) return null;
  const driverError = (err as { driverError?: DriverErrorShape }).driverError;
  if (driverError === undefined || driverError === null) return null;
  const code = driverError.code;
  if (typeof code !== 'string') return null;
  const detail = driverError.detail;
  return {
    code,
    detail: typeof detail === 'string' ? detail : undefined,
  };
}

export function isUniqueViolation(err: unknown): boolean {
  return extractPgError(err)?.code === '23505';
}

export function uniqueViolationIsOn(err: unknown, column: string): boolean {
  const pg = extractPgError(err);
  if (pg?.code !== '23505') return false;
  if (pg.detail === undefined) return false;
  return pg.detail.toLowerCase().includes(`(${column.toLowerCase()})=`);
}
