import { useEffect, useState } from 'react';

/** Forces a re-render every `intervalMs` so relative-time labels ("42m in stage") stay fresh. */
export function useTick(intervalMs = 15000): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
