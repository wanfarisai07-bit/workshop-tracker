import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { workshopApi } from '../api';
import type {
  AppointmentPayload, CheckInPayload, Company, CompanyPayload, RegisteredVehicle, RegisteredVehiclePayload, Vehicle,
} from '../domain/types';

/**
 * Everything that ultimately lives on a server: the live board, the
 * customer/vehicle CRM. Loaded once from `workshopApi` and kept here so
 * every screen reads/writes the same cache instead of re-fetching.
 * Purely local UI state (which screen is showing, form drafts, search text)
 * stays in the components that own it — see `useAppState`.
 */
interface WorkshopDataValue {
  loading: boolean;
  /** Set when the backend couldn't be reached or queried (e.g. the Supabase tables haven't been created yet) — see supabase/schema.sql. Null when everything's fine. */
  error: string | null;
  vehicles: Vehicle[];
  companies: Company[];
  regVehicles: RegisteredVehicle[];
  advanceVehicle: (id: number) => Promise<Vehicle>;
  cycleJob: (vehicleId: number, jobIndex: number) => Promise<Vehicle>;
  updateVehicleJobs: (vehicleId: number, jobNames: string[]) => Promise<Vehicle>;
  updateVehicleBay: (vehicleId: number, bay: number | null) => Promise<Vehicle>;
  checkIn: (payload: CheckInPayload) => Promise<Vehicle>;
  createAppointment: (payload: AppointmentPayload) => Promise<Vehicle>;
  createCompany: (payload: CompanyPayload) => Promise<Company>;
  updateCompany: (id: string, payload: CompanyPayload) => Promise<Company>;
  deleteCompany: (id: string) => Promise<void>;
  createRegisteredVehicle: (payload: RegisteredVehiclePayload) => Promise<RegisteredVehicle>;
  updateRegisteredVehicle: (id: string, payload: RegisteredVehiclePayload) => Promise<RegisteredVehicle>;
  deleteRegisteredVehicle: (id: string) => Promise<void>;
}

const WorkshopDataContext = createContext<WorkshopDataValue | null>(null);

export function WorkshopDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [regVehicles, setRegVehicles] = useState<RegisteredVehicle[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [v, c, r] = await Promise.all([
        workshopApi.listVehicles(), workshopApi.listCompanies(), workshopApi.listRegisteredVehicles(),
      ]);
      setVehicles(v);
      setCompanies(c);
      setRegVehicles(r);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    refresh().then(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refresh]);

  // Cross-tab/cross-device sync: when the backend supports it (Supabase
  // Realtime), pick up changes another client made — e.g. a mobile check-in
  // showing up on a desktop tab without a manual refresh.
  useEffect(() => {
    if (!workshopApi.subscribeToChanges) return;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = workshopApi.subscribeToChanges(() => {
      clearTimeout(debounce);
      debounce = setTimeout(() => { void refresh(); }, 150);
    });
    return () => { clearTimeout(debounce); unsubscribe(); };
  }, [refresh]);

  const advanceVehicle = useCallback(async (id: number) => {
    const updated = await workshopApi.advanceVehicle(id);
    setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
    return updated;
  }, []);

  const cycleJob = useCallback(async (vehicleId: number, jobIndex: number) => {
    const updated = await workshopApi.cycleJob(vehicleId, jobIndex);
    setVehicles((prev) => prev.map((v) => (v.id === vehicleId ? updated : v)));
    return updated;
  }, []);

  const updateVehicleJobs = useCallback(async (vehicleId: number, jobNames: string[]) => {
    const updated = await workshopApi.updateVehicleJobs(vehicleId, jobNames);
    setVehicles((prev) => prev.map((v) => (v.id === vehicleId ? updated : v)));
    return updated;
  }, []);

  const updateVehicleBay = useCallback(async (vehicleId: number, bay: number | null) => {
    const updated = await workshopApi.updateVehicleBay(vehicleId, bay);
    setVehicles((prev) => prev.map((v) => (v.id === vehicleId ? updated : v)));
    return updated;
  }, []);

  const checkIn = useCallback(async (payload: CheckInPayload) => {
    const created = await workshopApi.checkIn(payload);
    setVehicles((prev) => [created, ...prev]);
    return created;
  }, []);

  const createAppointment = useCallback(async (payload: AppointmentPayload) => {
    const created = await workshopApi.createAppointment(payload);
    setVehicles((prev) => [created, ...prev]);
    return created;
  }, []);

  const createCompany = useCallback(async (payload: CompanyPayload) => {
    const created = await workshopApi.createCompany(payload);
    setCompanies((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateCompany = useCallback(async (id: string, payload: CompanyPayload) => {
    const updated = await workshopApi.updateCompany(id, payload);
    setCompanies((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const deleteCompany = useCallback(async (id: string) => {
    await workshopApi.deleteCompany(id);
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setRegVehicles((prev) => prev.filter((v) => v.companyId !== id));
  }, []);

  const createRegisteredVehicle = useCallback(async (payload: RegisteredVehiclePayload) => {
    const created = await workshopApi.createRegisteredVehicle(payload);
    setRegVehicles((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateRegisteredVehicle = useCallback(async (id: string, payload: RegisteredVehiclePayload) => {
    const updated = await workshopApi.updateRegisteredVehicle(id, payload);
    setRegVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
    return updated;
  }, []);

  const deleteRegisteredVehicle = useCallback(async (id: string) => {
    await workshopApi.deleteRegisteredVehicle(id);
    setRegVehicles((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const value = useMemo<WorkshopDataValue>(() => ({
    loading, error, vehicles, companies, regVehicles,
    advanceVehicle, cycleJob, updateVehicleJobs, updateVehicleBay, checkIn, createAppointment,
    createCompany, updateCompany, deleteCompany,
    createRegisteredVehicle, updateRegisteredVehicle, deleteRegisteredVehicle,
  }), [
    loading, error, vehicles, companies, regVehicles,
    advanceVehicle, cycleJob, updateVehicleJobs, updateVehicleBay, checkIn, createAppointment,
    createCompany, updateCompany, deleteCompany,
    createRegisteredVehicle, updateRegisteredVehicle, deleteRegisteredVehicle,
  ]);

  return <WorkshopDataContext.Provider value={value}>{children}</WorkshopDataContext.Provider>;
}

export function useWorkshopData(): WorkshopDataValue {
  const ctx = useContext(WorkshopDataContext);
  if (!ctx) throw new Error('useWorkshopData must be used within a WorkshopDataProvider');
  return ctx;
}
