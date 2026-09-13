import type {
  AppointmentPayload, CheckInPayload, Company, CompanyPayload, RegisteredVehicle, RegisteredVehiclePayload, Vehicle,
} from '../domain/types';

/**
 * The data-access contract for the whole app. Every screen talks to the
 * workshop only through this interface — never through a global store or
 * direct data mutation. `SupabaseWorkshopApi` (supabaseApi.ts) is today's
 * implementation, backed by the Supabase project configured in `.env` (see
 * supabase/schema.sql). `MockWorkshopApi` (mockApi.ts) is the earlier
 * in-memory implementation, kept around for offline dev/tests — swap either
 * one in from `src/api/index.ts`. Every method returns a Promise so the UI
 * is already written against async data.
 */
export interface WorkshopApi {
  // ---- Vehicles on the workshop floor ----
  listVehicles(): Promise<Vehicle[]>;
  /** Move a vehicle to the next stage (booked -> arrived -> inbay -> ready -> closed), auto-assigning a free bay when it enters "inbay". Rejects if the move would close the job sheet (-> "closed") while any job isn't marked Done — see `canAdvanceTo`. */
  advanceVehicle(id: number): Promise<Vehicle>;
  /** Cycle one job's status: pending -> in progress -> done -> pending. */
  cycleJob(vehicleId: number, jobIndex: number): Promise<Vehicle>;
  /** Replace a vehicle's job list wholesale (the job-sheet's "Edit" action) — jobs kept from before keep their pending/in-progress/done state; newly added ones start pending. */
  updateVehicleJobs(vehicleId: number, jobNames: string[]): Promise<Vehicle>;
  /** Manually (re)assign or clear a vehicle's bay from the job sheet — independent of the auto-assignment `advanceVehicle` does when a vehicle first enters "inbay". */
  updateVehicleBay(vehicleId: number, bay: number | null): Promise<Vehicle>;
  /** Register + check in a walk-in or pre-registered vehicle onto the board. */
  checkIn(payload: CheckInPayload): Promise<Vehicle>;
  /** Book a future appointment — creates a vehicle straight into the "booked" stage (desktop-only screen; no bay/odometer yet since it hasn't arrived). */
  createAppointment(payload: AppointmentPayload): Promise<Vehicle>;

  // ---- Customers (companies) ----
  listCompanies(): Promise<Company[]>;
  createCompany(payload: CompanyPayload): Promise<Company>;
  updateCompany(id: string, payload: CompanyPayload): Promise<Company>;
  deleteCompany(id: string): Promise<void>;

  // ---- Registered vehicles (a company's fleet, independent of the live board) ----
  listRegisteredVehicles(): Promise<RegisteredVehicle[]>;
  createRegisteredVehicle(payload: RegisteredVehiclePayload): Promise<RegisteredVehicle>;
  updateRegisteredVehicle(id: string, payload: RegisteredVehiclePayload): Promise<RegisteredVehicle>;
  deleteRegisteredVehicle(id: string): Promise<void>;

  /**
   * Optional: subscribe to changes made by *other* clients (e.g. Supabase
   * Realtime), so two open tabs/devices — desktop and mobile — stay in sync
   * without a manual refresh. Call `onChange` whenever workshop data changed
   * elsewhere; return an unsubscribe function. An implementation with no live
   * channel (or a test double) can simply omit this.
   */
  subscribeToChanges?(onChange: () => void): () => void;
}
