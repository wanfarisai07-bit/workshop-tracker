import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { NavKey } from '../domain/constants';

export type Screen = NavKey | 'vehicle';

/**
 * Ephemeral, client-only UI state: who's "logged in" (a demo gate, not real
 * auth), which screen is showing, which vehicle is open, and the board's
 * overdue-only filter. None of this is ever persisted or sent to
 * `workshopApi` — it's navigation, not workshop data.
 */
interface AppStateValue {
  authed: boolean;
  staffId: string;
  login: (staffId: string) => void;
  logout: () => void;
  screen: Screen;
  selId: number | null;
  overdueOnly: boolean;
  navigate: (screen: NavKey) => void;
  openVehicle: (id: number) => void;
  exitMaster: () => void;
  toggleOverdue: () => void;
  /** Set once by `goToNewCustomer` and cleared by whoever consumes it (CustomersScreen) — tells the Customers screen to open its "new customer" form immediately instead of landing on the plain list. */
  openNewCustomerForm: boolean;
  /** Jump to Customers and have it open the "new customer" form straight away — used by "+ Add customer/vehicle" shortcuts elsewhere (e.g. the Appointment screen's lookup box). */
  goToNewCustomer: () => void;
  clearNewCustomerFlag: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [screen, setScreen] = useState<Screen>('board');
  const [selId, setSelId] = useState<number | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [openNewCustomerForm, setOpenNewCustomerForm] = useState(false);

  const login = useCallback((id: string) => {
    setStaffId(id);
    setAuthed(true);
  }, []);

  const logout = useCallback(() => {
    setAuthed(false);
    setStaffId('');
    setScreen('board');
    setSelId(null);
  }, []);

  const navigate = useCallback((next: NavKey) => {
    setScreen(next);
    setSelId(null);
  }, []);

  const openVehicle = useCallback((id: number) => {
    setScreen('vehicle');
    setSelId(id);
  }, []);

  const exitMaster = useCallback(() => navigate('board'), [navigate]);
  const toggleOverdue = useCallback(() => setOverdueOnly((v) => !v), []);

  const goToNewCustomer = useCallback(() => {
    setScreen('customers');
    setSelId(null);
    setOpenNewCustomerForm(true);
  }, []);
  const clearNewCustomerFlag = useCallback(() => setOpenNewCustomerForm(false), []);

  const value = useMemo<AppStateValue>(() => ({
    authed, staffId, login, logout, screen, selId, overdueOnly, navigate, openVehicle, exitMaster, toggleOverdue,
    openNewCustomerForm, goToNewCustomer, clearNewCustomerFlag,
  }), [
    authed, staffId, login, logout, screen, selId, overdueOnly, navigate, openVehicle, exitMaster, toggleOverdue,
    openNewCustomerForm, goToNewCustomer, clearNewCustomerFlag,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
}
