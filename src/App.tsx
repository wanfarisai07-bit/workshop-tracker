import { useEffect } from 'react';
import { AppStateProvider, useAppState } from './state/AppStateContext';
import { WorkshopDataProvider } from './state/WorkshopDataContext';
import { useTick } from './state/useTick';
import { useIsMobile } from './state/useIsMobile';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BoardScreen } from './components/board/BoardScreen';
import { VehicleScreen } from './components/vehicle/VehicleScreen';
import { BaysScreen } from './components/bays/BaysScreen';
import { OverviewScreen } from './components/overview/OverviewScreen';
import { RegisterScreen } from './components/register/RegisterScreen';
import { AppointmentScreen } from './components/appointment/AppointmentScreen';
import { CustomersScreen } from './components/customers/CustomersScreen';
import { MasterScreen } from './components/master/MasterScreen';
import { MasterExitButton } from './components/master/MasterExitButton';
import { MobileApp } from './components/mobile/MobileApp';
import { BackendErrorBanner } from './components/common/BackendErrorBanner';

function Workspace() {
  const { authed, authLoading, login, screen, selId, exitMaster } = useAppState();
  const isMobile = useIsMobile();
  // Relative-time labels ("42m in stage") across every screen refresh on this tick.
  useTick(15000);

  useEffect(() => {
    if (screen !== 'master') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') exitMaster(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, exitMaster]);

  // Login gates both layouts — a shared Supabase Auth account, checked once
  // up front (authLoading) so an already-persisted session doesn't flash
  // the login screen on reload.
  if (authLoading) {
    return <div style={{ height: '100%', background: 'var(--blue-900)' }} />;
  }

  if (!authed) return <LoginScreen onLogin={login} />;

  if (isMobile) return <MobileApp />;

  if (screen === 'master') {
    return (
      <div style={{ height: '100%', position: 'relative' }}>
        <MasterExitButton onExit={exitMaster} />
        <div style={{ height: '100%', overflow: 'auto' }}><MasterScreen /></div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)' }}>
      <BackendErrorBanner />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-subtle)' }}>
          <Header />
          <div style={{ flex: 1, overflow: 'auto' }}>
            {screen === 'board' && <BoardScreen />}
            {screen === 'vehicle' && selId != null && <VehicleScreen key={selId} vehicleId={selId} />}
            {screen === 'bays' && <BaysScreen />}
            {screen === 'overview' && <OverviewScreen />}
            {screen === 'register' && <RegisterScreen />}
            {screen === 'appointment' && <AppointmentScreen />}
            {screen === 'customers' && <CustomersScreen />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <WorkshopDataProvider>
        <div style={{ height: '100vh', width: '100vw' }}>
          <Workspace />
        </div>
      </WorkshopDataProvider>
    </AppStateProvider>
  );
}
