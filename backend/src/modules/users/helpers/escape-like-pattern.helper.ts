export function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (match) => `\\${match}`);
}
