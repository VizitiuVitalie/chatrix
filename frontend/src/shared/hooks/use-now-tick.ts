import { useEffect, useState } from 'react';

export function useNowTick(intervalMs: number): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, intervalMs);
    return (): void => {
      window.clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}
