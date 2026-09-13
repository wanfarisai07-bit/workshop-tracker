import { BAY_COUNT, stageIndex, STAGES } from '../domain/constants';
import { canAdvanceTo } from '../domain/derive';
import type {
  AppointmentPayload, CheckInPayload, Company, CompanyPayload, JobItem, RegisteredVehicle, RegisteredVehiclePayload,
  StageKey, Vehicle,
} from '../domain/types';
import { supabase } from './supabaseClient';
import type { WorkshopApi } from './workshopApi';

// ---- Row shapes as they come back from Postgres (see supabase/schema.sql) ----
interface VehicleRow {
  id: number; sheet: string; plate: string; type: string; customer: string; stage: StageKey;
  bay: number | null; at: number; checkin: number | null; promised: string; odo: string; jobs: JobItem[];
}
interface CompanyRow {
  id: string; name: string; phone: string; type: string; pic: string; address: string;
}
interface RegisteredVehicleRow {
  id: string; company_id: string; plate: string; chassis: string; brand: string; type: string;
}

const mapVehicle = (r: VehicleRow): Vehicle => ({
  id: r.id, sheet: r.sheet, plate: r.plate, type: r.type, customer: r.customer, stage: r.stage,
  bay: r.bay, at: Number(r.at), checkin: r.checkin == null ? null : Number(r.checkin),
  promised: r.promised, odo: r.odo, jobs: r.jobs,
});
const mapCompany = (r: CompanyRow): Company => ({
  id: r.id, name: r.name, phone: r.phone, type: r.type as Company['type'], pic: r.pic, address: r.address,
});
const mapRegisteredVehicle = (r: RegisteredVehicleRow): RegisteredVehicle => ({
  id: r.id, companyId: r.company_id, plate: r.plate, chassis: r.chassis, brand: r.brand, type: r.type,
});

function assertNoError<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/** Real backend: every method is a thin wrapper around a Supabase table/RPC call. See supabase/schema.sql for the tables this expects. */
export class SupabaseWorkshopApi implements WorkshopApi {
  async listVehicles(): Promise<Vehicle[]> {
    const res = await supabase.from('vehicles').select('*').order('id', { ascending: true });
    return assertNoError<VehicleRow[]>(res).map(mapVehicle);
  }

  async advanceVehicle(id: number): Promise<Vehicle> {
    const current = assertNoError<VehicleRow>(await supabase.from('vehicles').select('*').eq('id', id).single());
    const next = STAGES[Math.min(STAGES.length - 1, stageIndex(current.stage) + 1)];
    if (!canAdvanceTo(mapVehicle(current), next.key)) {
      throw new Error('All jobs must be marked Done before closing this job sheet.');
    }
    const now = Date.now();
    const patch: Partial<VehicleRow> = { stage: next.key, at: now };
    if (next.key === 'arrived' && !current.checkin) patch.checkin = now;
    if (next.key === 'inbay') {
      const occupied = assertNoError<{ bay: number | null }[]>(
        await supabase.from('vehicles').select('bay').eq('stage', 'inbay').neq('id', id),
      );
      const taken = new Set(occupied.map((o) => o.bay).filter((b): b is number => b != null));
      let free: number | null = null;
      for (let i = 1; i <= BAY_COUNT; i += 1) { if (!taken.has(i)) { free = i; break; } }
      patch.bay = free;
    } else {
      patch.bay = null;
    }
    const updated = assertNoError<VehicleRow>(await supabase.from('vehicles').update(patch).eq('id', id).select('*').single());
    return mapVehicle(updated);
  }

  async cycleJob(vehicleId: number, jobIndex: number): Promise<Vehicle> {
    const current = assertNoError<{ jobs: JobItem[] }>(await supabase.from('vehicles').select('jobs').eq('id', vehicleId).single());
    const jobs = current.jobs.map((j, k) => (k !== jobIndex ? j : { name: j.name, state: ((j.state + 1) % 3) as 0 | 1 | 2 }));
    const updated = assertNoError<VehicleRow>(await supabase.from('vehicles').update({ jobs }).eq('id', vehicleId).select('*').single());
    return mapVehicle(updated);
  }

  async updateVehicleJobs(vehicleId: number, jobNames: string[]): Promise<Vehicle> {
    const current = assertNoError<{ jobs: JobItem[] }>(await supabase.from('vehicles').select('jobs').eq('id', vehicleId).single());
    const jobs = jobNames.map((name) => current.jobs.find((j) => j.name === name) ?? { name, state: 0 as const });
    const updated = assertNoError<VehicleRow>(await supabase.from('vehicles').update({ jobs }).eq('id', vehicleId).select('*').single());
    return mapVehicle(updated);
  }

  async updateVehicleBay(vehicleId: number, bay: number | null): Promise<Vehicle> {
    const updated = assertNoError<VehicleRow>(await supabase.from('vehicles').update({ bay }).eq('id', vehicleId).select('*').single());
    return mapVehicle(updated);
  }

  async checkIn(payload: CheckInPayload): Promise<Vehicle> {
    const seq = assertNoError<number>(await supabase.rpc('next_counter', { counter_key: 'vehicle_seq' }));
    const now = Date.now();
    const row = {
      sheet: 'SA-2026-' + String(seq).padStart(4, '0'),
      plate: payload.plate.toUpperCase(),
      type: payload.type,
      customer: payload.customer || 'Walk-in',
      stage: payload.bay ? 'inbay' : 'arrived',
      bay: payload.bay || null,
      at: now,
      checkin: now,
      promised: 'To be confirmed',
      odo: payload.odo || '—',
      jobs: payload.jobs.map((n) => ({ name: n, state: 0 as const })),
    };
    const created = assertNoError<VehicleRow>(await supabase.from('vehicles').insert(row).select('*').single());
    return mapVehicle(created);
  }

  async createAppointment(payload: AppointmentPayload): Promise<Vehicle> {
    const seq = assertNoError<number>(await supabase.rpc('next_counter', { counter_key: 'vehicle_seq' }));
    const now = Date.now();
    const row = {
      sheet: 'SA-2026-' + String(seq).padStart(4, '0'),
      plate: payload.plate.toUpperCase(),
      type: payload.type,
      customer: payload.customer || 'Walk-in',
      stage: 'booked' as const,
      bay: null,
      at: now,
      checkin: null,
      promised: payload.promised || 'To be confirmed',
      odo: '—',
      jobs: payload.jobs.map((n) => ({ name: n, state: 0 as const })),
    };
    const created = assertNoError<VehicleRow>(await supabase.from('vehicles').insert(row).select('*').single());
    return mapVehicle(created);
  }

  async listCompanies(): Promise<Company[]> {
    const res = await supabase.from('companies').select('*').order('seq', { ascending: true });
    return assertNoError<CompanyRow[]>(res).map(mapCompany);
  }

  async createCompany(payload: CompanyPayload): Promise<Company> {
    const pic = payload.type === 'Individual' ? '' : (payload.pic.trim() || '—');
    const row = { name: payload.name.trim(), phone: payload.phone.trim() || '—', type: payload.type, pic, address: payload.address.trim() || '—' };
    const created = assertNoError<CompanyRow>(await supabase.from('companies').insert(row).select('*').single());
    return mapCompany(created);
  }

  async updateCompany(id: string, payload: CompanyPayload): Promise<Company> {
    const pic = payload.type === 'Individual' ? '' : (payload.pic.trim() || '—');
    const row = { name: payload.name.trim(), phone: payload.phone.trim() || '—', type: payload.type, pic, address: payload.address.trim() || '—' };
    const updated = assertNoError<CompanyRow>(await supabase.from('companies').update(row).eq('id', id).select('*').single());
    return mapCompany(updated);
  }

  async deleteCompany(id: string): Promise<void> {
    // registered_vehicles has `on delete cascade` on its company_id FK, so this
    // removes the company's fleet too — matching the mock API's behavior.
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async listRegisteredVehicles(): Promise<RegisteredVehicle[]> {
    const res = await supabase.from('registered_vehicles').select('*').order('seq', { ascending: true });
    return assertNoError<RegisteredVehicleRow[]>(res).map(mapRegisteredVehicle);
  }

  async createRegisteredVehicle(payload: RegisteredVehiclePayload): Promise<RegisteredVehicle> {
    const row = { company_id: payload.companyId, plate: payload.plate.toUpperCase().trim(), chassis: payload.chassis.trim() || '—', brand: payload.brand, type: payload.type };
    const created = assertNoError<RegisteredVehicleRow>(await supabase.from('registered_vehicles').insert(row).select('*').single());
    return mapRegisteredVehicle(created);
  }

  async updateRegisteredVehicle(id: string, payload: RegisteredVehiclePayload): Promise<RegisteredVehicle> {
    const row = { company_id: payload.companyId, plate: payload.plate.toUpperCase().trim(), chassis: payload.chassis.trim() || '—', brand: payload.brand, type: payload.type };
    const updated = assertNoError<RegisteredVehicleRow>(await supabase.from('registered_vehicles').update(row).eq('id', id).select('*').single());
    return mapRegisteredVehicle(updated);
  }

  async deleteRegisteredVehicle(id: string): Promise<void> {
    const { error } = await supabase.from('registered_vehicles').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  subscribeToChanges(onChange: () => void): () => void {
    const channel = supabase
      .channel('workshop-data-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registered_vehicles' }, onChange)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }
}
