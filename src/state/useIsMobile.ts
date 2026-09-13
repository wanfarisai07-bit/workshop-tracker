import { useEffect, useState } from 'react';

const QUERY = '(max-width: 700px)';

/** True when the viewport matches the mobile layout's design width (the source mockup was authored for a 402px-wide phone). Reactive to resize, so the app switches layouts live. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false));

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
