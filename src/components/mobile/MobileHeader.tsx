import sumaiMark from '../../assets/sumai-mark.svg';
import { SCREEN_TITLES } from '../../domain/constants';
import { useAppState } from '../../state/AppStateContext';
import { useWorkshopData } from '../../state/WorkshopDataContext';

export function MobileHeader() {
  const { screen, navigate, logout } = useAppState();
  const { vehicles } = useWorkshopData();
  const active = vehicles.filter((v) => v.stage !== 'booked' && v.stage !== 'closed');
  const showBack = screen === 'vehicle';

  return (
    <div style={{ flex: 'none', background: 'var(--blue-900)', padding: '52px 16px 13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <img src={sumaiMark} alt="SUMAI" style={{ height: 20, width: 'auto', display: 'block', filter: 'brightness(1.25)' }} />
        <span style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--blue-300)' }}>
          Workshop Tracker
        </span>
        <span style={{ marginLeft: 'auto', font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.1em', color: '#fff', background: 'rgba(255,255,255,0.12)', padding: '5px 7px', borderRadius: 'var(--radius-xs)' }}>
          {active.length} IN WORKSHOP
        </span>
        <button
          type="button"
          className="wt-hover-white20"
          onClick={logout}
          aria-label="Sign out"
          style={{ flex: 'none', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: 'var(--radius-xs)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 11 }}>
        {showBack && (
          <button
            type="button"
            className="wt-hover-white20"
            onClick={() => navigate('board')}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>
        )}
        <span style={{ font: '700 27px/1.05 var(--font-display)', letterSpacing: '0.005em', textTransform: 'uppercase', color: '#fff' }}>
          {SCREEN_TITLES[screen] ?? ''}
        </span>
      </div>
    </div>
  );
}
