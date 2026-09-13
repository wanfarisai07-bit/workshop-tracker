import type { Stage } from './types';

export const STAGES: Stage[] = [
  { key: 'booked', label: 'Appointment booked', color: '#8A97A3', bg: '#EDEFF1', sla: 0 },
  { key: 'arrived', label: 'Check-in & job sheet', color: '#2566C0', bg: '#DCE6F7', sla: 90 },
  { key: 'inbay', label: 'In bay — work in progress', color: '#ED8B00', bg: '#FCEFD9', sla: 240 },
  { key: 'ready', label: 'Ready for collection', color: '#2E7D52', bg: '#E1F0E7', sla: 120 },
  { key: 'closed', label: 'Delivered / closed', color: '#8A97A3', bg: '#E9EDF1', sla: 0 },
];

export const stageByKey = (key: string): Stage => STAGES.find((s) => s.key === key) ?? STAGES[0];
export const stageIndex = (key: string): number => STAGES.findIndex((s) => s.key === key);

export const JOB_CATALOG = [
  'Service minor', 'Service major', 'Engine', 'Body fabrication & welding', 'Hydraulic system repair',
  'Electrical & wiring', 'Brakes & suspension', 'Tyres', 'Painting & finishing', 'Aircond',
  'Puspakom', 'Pump clutch top', 'Pump clutch bottom', 'Gearbox', 'Clutch set', 'Other',
];

export const VEHICLE_TYPES = ['Tipper trailer', 'Compactor truck', 'Cargo body truck', 'Car', 'Lorry skylift', 'Water Tanker', 'Bas', 'Other'];

export const VEHICLE_BRANDS = ['Hino', 'Isuzu', 'UD Truck', 'Foton', 'Scania', 'Man', 'Other'];

export const CUSTOMER_TYPES = ['Individual', 'Company', 'Government'] as const;

/** The numbered bays (BAY 01..BAY 10) — the ones auto-assigned during check-in / advancing to "In bay". */
export const BAY_COUNT = 10;

/** Named, non-numbered bays — assigned manually only (from the Bay box on a job sheet, or picked at check-in/appointment), never auto-assigned. */
export interface SpecialBay { id: number; label: string; }
export const SPECIAL_BAYS: SpecialBay[] = [
  { id: BAY_COUNT + 1, label: 'SERVICE BAY' },
  { id: BAY_COUNT + 2, label: 'OPEN BAY' },
  { id: BAY_COUNT + 3, label: 'PAINTING BAY' },
];

/** Every selectable bay id, in display order: BAY 01..BAY 10, then the special bays. */
export const ALL_BAY_IDS: number[] = [
  ...Array.from({ length: BAY_COUNT }, (_, i) => i + 1),
  ...SPECIAL_BAYS.map((b) => b.id),
];

export const NAV_KEYS = ['customers', 'appointment', 'register', 'board', 'bays', 'overview', 'master'] as const;
export type NavKey = (typeof NAV_KEYS)[number];

export const NAV_LABELS: Record<NavKey, string> = {
  customers: 'Customers', appointment: 'Appointment', register: 'Check in', board: 'Board', bays: 'Bays', overview: 'Overview', master: 'Master Display',
};

export const SCREEN_TITLES: Record<string, string> = {
  board: 'Status board', vehicle: 'Job sheet', register: 'Register vehicle', customers: 'Customers',
  appointment: 'New appointment', bays: 'Workshop bays', overview: 'Overview', master: 'Master Display',
};
