export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, index);
  const rounded =
    value >= 100 || index === 0
      ? Math.round(value)
      : Math.round(value * 10) / 10;
  return `${rounded} ${units[index]}`;
}
