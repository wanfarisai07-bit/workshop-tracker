// Domain types shared between the UI and the API layer.
// Kept deliberately plain (no class instances) so a real backend can
// serialize/deserialize these as JSON without any translation layer.

export type StageKey = 'booked' | 'arrived' | 'inbay' | 'ready' | 'closed';

export interface Stage {
  key: StageKey;
  label: string;
  color: string;
  bg: string;
  /** Minutes a vehicle is expected to spend in this stage before it's "overdue". 0 = no target. */
  sla: number;
}

export interface JobItem {
  name: string;
  /** 0 = pending, 1 = in progress, 2 = done */
  state: 0 | 1 | 2;
}

export interface Vehicle {
  id: number;
  plate: string;
  sheet: string;
  type: string;
  customer: string;
  stage: StageKey;
  bay: number | null;
  /** Timestamp (ms) this vehicle entered its current stage. */
  at: number;
  /** Timestamp (ms) the vehicle was checked in, or null if only booked. */
  checkin: number | null;
  promised: string;
  odo: string;
  jobs: JobItem[];
}

export type CustomerType = 'Individual' | 'Company' | 'Government';

export interface Company {
  id: string;
  name: string;
  phone: string;
  type: CustomerType | '';
  pic: string;
  address: string;
}

export interface RegisteredVehicle {
  id: string;
  companyId: string;
  plate: string;
  chassis: string;
  brand: string;
  type: string;
}

export interface CheckInPayload {
  plate: string;
  type: string;
  customer: string;
  odo: string;
  jobs: string[];
  bay: number | null;
}

/**
 * A future booking — lighter than a check-in (no odometer, no bay, since the
 * vehicle hasn't physically arrived yet). Creates a vehicle in the "booked"
 * stage, the same stage the status board's first column and the weekly
 * calendar already show.
 */
export interface AppointmentPayload {
  plate: string;
  type: string;
  customer: string;
  promised: string;
  jobs: string[];
}

export interface CompanyPayload {
  type: CustomerType | '';
  name: string;
  phone: string;
  pic: string;
  address: string;
}

export interface RegisteredVehiclePayload {
  companyId: string;
  plate: string;
  chassis: string;
  brand: string;
  type: string;
}
