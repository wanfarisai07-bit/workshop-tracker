import { useEffect } from 'react';
import { useAppState } from '../../state/AppStateContext';
import { MobileHeader } from './MobileHeader';
import { MobileTabBar } from './MobileTabBar';
import { MobileBoardScreen } from './board/MobileBoardScreen';
import { MobileVehicleScreen } from './vehicle/MobileVehicleScreen';
import { MobileBaysScreen } from './bays/MobileBaysScreen';
import { MobileOverviewScreen } from './overview/MobileOverviewScreen';
import { MobileRegisterScreen } from './register/MobileRegisterScreen';
import { BackendErrorBanner } from '../common/BackendErrorBanner';

const MOBILE_SCREENS = new Set(['board', 'bays', 'overview', 'register', 'vehicle']);

/**
 * The mobile layout has no login gate and only four tabs (Check in / Board /
 * Bays / Overview) — that's the source design (`Workshop Tracker.dc.html`),
 * not an oversight: Customers and Master Display are desktop-only.
 */
export function MobileApp() {
  const { screen, selId, navigate } = useAppState();

  // If the window was resized down mid-session from a desktop-only screen
  // (Customers, Master), land somewhere the mobile nav can actually show.
  useEffect(() => {
    if (!MOBILE_SCREENS.has(screen)) navigate('board');
  }, [screen, navigate]);

  const activeScreen = MOBILE_SCREENS.has(screen) ? screen : 'board';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-subtle)', fontFamily: 'var(--font-body)' }}>
      <MobileHeader />
      <BackendErrorBanner />
      <div style={{ flex: 1, overflow: 'auto', padding: '13px 13px 22px' }}>
        {activeScreen === 'board' && <MobileBoardScreen />}
        {activeScreen === 'vehicle' && selId != null && <MobileVehicleScreen vehicleId={selId} />}
        {activeScreen === 'bays' && <MobileBaysScreen />}
        {activeScreen === 'overview' && <MobileOverviewScreen />}
        {activeScreen === 'register' && <MobileRegisterScreen />}
      </div>
      <MobileTabBar />
    </div>
  );
}
