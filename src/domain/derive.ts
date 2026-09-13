// Pure, presentation-agnostic derivations from raw Vehicle records —
// ported from the prototype's Component methods (isOverdue, card, jobSummary,
// weekCalendar) so every screen computes "overdue", "time in stage" etc. the
// same way.
import { ALL_BAY_IDS, stageByKey, stageIndex, STAGES } from './constants';
import { bayLabel, clock, dur, mins } from './format';
import type { Vehicle } from './types';

export function isOverdue(v: Vehicle): boolean {
  const st = stageByKey(v.stage);
  return st.sla > 0 && mins(v.at) > st.sla;
}

/** True once every job on the sheet is marked Done (vacuously true if there are no jobs at all). Gates closing the job sheet — see `canCloseJobSheet`. */
export function allJobsDone(v: Vehicle): boolean {
  return v.jobs.every((j) => j.state === 2);
}

/** Whether advancing `v` to `nextStageKey` is allowed: the only rule right now is you can't close a job sheet (move into "closed") with jobs still pending/in-progress. */
export function canAdvanceTo(v: Vehicle, nextStageKey: string): boolean {
  return nextStageKey !== 'closed' || allJobsDone(v);
}

export function jobSummary(v: Vehicle): string {
  const names = v.jobs.map((j) => j.name.split(' (')[0]);
  if (names.length <= 2) return names.join('  ·  ');
  return names.slice(0, 2).join('  ·  ') + '  ·  +' + (names.length - 2);
}

export function timeLabel(v: Vehicle): string {
  let time: string;
  if (v.stage === 'booked') time = 'Due ' + v.promised;
  else if (v.stage === 'closed') time = 'Closed ' + dur(v.at) + ' ago';
  else time = dur(v.at) + ' in stage';
  return isOverdue(v) ? time + ' · over target' : time;
}

export interface TimelineStep {
  label: string;
  timeText: string;
  hasLine: boolean;
  dotBg: string;
  dotBorder: string;
  labelColor: string;
}

/** The "Status progress" timeline on a vehicle's job sheet — one row per stage, showing what's done, current, and upcoming. */
export function vehicleTimeline(v: Vehicle): TimelineStep[] {
  const si = stageIndex(v.stage);
  return STAGES.map((t, i) => {
    const done = i < si;
    const cur = i === si;
    let timeText = '—';
    if (done) timeText = 'Completed ' + clock(v.at - (si - i) * 34 * 60000);
    if (cur) timeText = v.stage === 'booked' ? 'Scheduled ' + v.promised : 'Since ' + clock(v.at) + '  ·  ' + dur(v.at);
    return {
      label: t.label,
      timeText,
      hasLine: i < STAGES.length - 1,
      dotBg: done ? 'var(--brand)' : (cur ? 'var(--accent)' : 'var(--bg)'),
      dotBorder: done ? 'var(--brand)' : (cur ? 'var(--accent)' : 'var(--border-strong)'),
      labelColor: cur ? 'var(--fg1)' : (done ? 'var(--fg2)' : 'var(--grey-400)'),
    };
  });
}

export interface BaySlot {
  bay: number;
  label: string;
  occupied: boolean;
  vehicle: Vehicle | null;
  job: string;
  elapsed: string;
  overdue: boolean;
}

/** One slot per bay — the numbered bays plus the named special ones (see `ALL_BAY_IDS`) — occupied or free. */
export function computeBays(vehicles: Vehicle[]): BaySlot[] {
  const inBay = vehicles.filter((v) => v.stage === 'inbay');
  return ALL_BAY_IDS.map((i) => {
    const v = inBay.find((o) => o.bay === i) ?? null;
    return {
      bay: i,
      label: bayLabel(i),
      occupied: !!v,
      vehicle: v,
      job: v ? (v.jobs.map((j) => j.name.split(' (')[0])[0] ?? '') : '',
      elapsed: v ? dur(v.at) + ' in bay' : '',
      overdue: v ? isOverdue(v) : false,
    };
  });
}

export interface CalendarDay {
  dayLabel: string;
  dateLabel: string;
  dayColor: string;
  borderColor: string;
  empty: boolean;
  items: { time: string; plate: string; customer: string; color: string }[];
}

export function weekCalendar(vehicles: Vehicle[]): CalendarDay[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dowMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const today = new Date();
  const todayIdx = today.getDay();
  const week: { date: Date; items: CalendarDay['items'] }[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    week.push({ date: d, items: [] });
  }
  vehicles.forEach((v) => {
    const m = (v.promised || '').match(/^(Today|Tomorrow|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*(\d{1,2}:\d{2})?/i);
    if (!m) return;
    const tag = m[1].toLowerCase();
    let offset: number;
    if (tag === 'today') offset = 0;
    else if (tag === 'tomorrow') offset = 1;
    else {
      offset = (dowMap[tag] - todayIdx + 7) % 7;
      if (offset === 0) offset = 7;
    }
    if (offset > 6) return;
    const st = stageByKey(v.stage);
    week[offset].items.push({ time: m[2] || '—', plate: v.plate, customer: v.customer, color: st.color });
  });
  return week.map((w, i) => {
    w.items.sort((a, b) => a.time.localeCompare(b.time));
    return {
      dayLabel: dayNames[w.date.getDay()],
      dateLabel: w.date.getDate() + ' ' + w.date.toLocaleString('en', { month: 'short' }),
      dayColor: i === 0 ? 'var(--brand)' : 'var(--fg2)',
      borderColor: i === 0 ? 'var(--brand)' : 'var(--border)',
      empty: w.items.length === 0,
      items: w.items,
    };
  });
}
