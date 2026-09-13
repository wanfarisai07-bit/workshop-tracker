// Small time-formatting helpers ported from the prototype's Component class.
import { SPECIAL_BAYS } from './constants';

export function mins(at: number): number {
  return Math.max(0, Math.round((Date.now() - at) / 60000));
}

export function fmtMins(m: number): string {
  if (m < 60) return m + 'm';
  return Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm';
}

export function dur(at: number): string {
  const m = mins(at);
  if (m < 1) return 'just now';
  return fmtMins(m);
}

export function clock(at: number): string {
  const d = new Date(at);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

/** "14 Sep, 00:15" — a calendar date + time for records where the actual moment matters more than "X ago" (e.g. the delivered/closed history). */
export function dateTime(at: number): string {
  const d = new Date(at);
  return `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}, ${clock(at)}`;
}

export function bayLabel(bay: number): string {
  const special = SPECIAL_BAYS.find((b) => b.id === bay);
  return special ? special.label : 'BAY ' + String(bay).padStart(2, '0');
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Turns a calendar date (from a native `<input type="date">`, "YYYY-MM-DD")
 * plus an optional time ("HH:MM") into the "Today 17:00" / "Thu 12:00" style
 * string the rest of the app (the board's weekly calendar, job sheets)
 * already parses and displays — so a real date picker can drive the same
 * `promised` field without changing anything downstream.
 */
export function formatPromisedFromDate(dateISO: string, time?: string): string {
  if (!dateISO) return time ?? '';
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  const label = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : DAY_NAMES[date.getDay()];
  return time ? `${label} ${time}` : label;
}
