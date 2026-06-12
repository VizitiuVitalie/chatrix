import { GIB, KIB, MIB } from '@/shared/constants/byte-units.constants';

export function formatBytes(bytes: number): string {
  if (bytes < KIB) return `${bytes} B`;
  if (bytes < MIB) return `${(bytes / KIB).toFixed(1)} KB`;
  if (bytes < GIB) return `${(bytes / MIB).toFixed(1)} MB`;
  return `${(bytes / GIB).toFixed(1)} GB`;
}
