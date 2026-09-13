import type { JSX } from 'react';
import type { NavKey } from './constants';

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export type NavIcon = (props: { size?: number }) => JSX.Element;

export const NAV_ICONS: Record<NavKey, NavIcon> = {
  board: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="4" width="6" height="6" rx="1" />
      <rect x="3" y="14" width="6" height="6" rx="1" />
      <path d="M13 6h8" />
      <path d="M13 10h5" />
      <path d="M13 16h8" />
      <path d="M13 20h5" />
    </svg>
  ),
  bays: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  register: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M12 9v6" />
      <path d="M9 12h6" />
    </svg>
  ),
  overview: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <path d="M3 21h18" />
      <rect x="5" y="11" width="4" height="7" />
      <rect x="12" y="6" width="4" height="12" />
      <rect x="19" y="14" width="2" height="4" />
    </svg>
  ),
  master: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <rect x="2" y="4" width="20" height="13" rx="1.5" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  ),
  customers: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M5 17c0-2 2-3 4-3s4 1 4 3" />
      <path d="M15 9h4" />
      <path d="M15 13h4" />
    </svg>
  ),
  appointment: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M8.5 13.5l2 2 4-4" />
    </svg>
  ),
};

export function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
