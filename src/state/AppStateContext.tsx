import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { NavKey } from '../domain/constants';
import { supabase } from '../api/supabaseClient';
import { SHARED_STAFF_ID, signIn, signOut } from './auth';

export type Screen = NavKey | 'vehicle';

/**
 * Ephemeral, client-only UI state: which screen is showing, which vehicle
 * is open, and the board's overdue-only filter (none of this is ever
 * persisted or sent to `workshopApi` — it's navigation, not workshop data),
 * plus who's logged in — which *is* real, persisted Supabase Auth state
 * (see ./auth.ts), mirrored here via `supabase.auth.onAuthStateChange` so
 * every screen can just read `authed` / `staffId` without touching
 * Supabase directly.
 */
interface AppStateValue {
  authed: boolean;
  /** True until the initial `supabase.auth.getSession()` check resolves — avoids flashing the login screen for an already-persisted session. */
  authLoading: boolean;
  staffId: string;
  login: (staffId: string, password: string) => Promise<string | null>;
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
  const [authLoading, setAuthLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('board');
  const [selId, setSelId] = useState<number | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [openNewCustomerForm, setOpenNewCustomerForm] = useState(false);

  // Mirror Supabase Auth's own (persisted, cross-tab) session state. This is
  // what makes "stay logged in until you sign out" and "multiple people
  // signed in at once with no conflict" work for free — each browser/device
  // just has its own session token, all pointing at the same shared account.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthed(!!data.session);
      setAuthLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const staffId = authed ? SHARED_STAFF_ID : '';

  const login = useCallback((id: string, password: string) => signIn(id, password), []);

  const logout = useCallback(() => {
    void signOut();
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
    authed, authLoading, staffId, login, logout, screen, selId, overdueOnly, navigate, openVehicle, exitMaster, toggleOverdue,
    openNewCustomerForm, goToNewCustomer, clearNewCustomerFlag,
  }), [
    authed, authLoading, staffId, login, logout, screen, selId, overdueOnly, navigate, openVehicle, exitMaster, toggleOverdue,
    openNewCustomerForm, goToNewCustomer, clearNewCustomerFlag,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
}
