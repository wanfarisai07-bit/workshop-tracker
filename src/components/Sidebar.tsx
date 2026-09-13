import sumaiMark from '../assets/sumai-mark.svg';
import { NAV_ICONS } from '../domain/icons';
import { NAV_KEYS, NAV_LABELS } from '../domain/constants';
import { useAppState } from '../state/AppStateContext';

export function Sidebar() {
  const { screen, navigate, staffId, logout } = useAppState();

  return (
    <div style={{ flex: 'none', width: 210, background: 'var(--blue-900)', display: 'flex', flexDirection: 'column', padding: '20px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 6px 20px' }}>
        <img src={sumaiMark} alt="SUMAI" style={{ height: 22, width: 'auto', display: 'block', filter: 'brightness(1.25)' }} />
        <span style={{ font: '700 11.5px/1.2 var(--font-display)', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff' }}>
          Workshop<br />Progress
        </span>
      </div>

      {NAV_KEYS.map((key) => {
        const active = screen === key;
        const Icon = NAV_ICONS[key];
        return (
          <button
            key={key}
            type="button"
            className="wt-hover-nav"
            onClick={() => navigate(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              background: active ? 'rgba(255,255,255,0.14)' : 'transparent', border: 'none',
              borderRadius: 'var(--radius-sm)', color: active ? '#fff' : 'var(--blue-200)',
              padding: '10px 11px', marginBottom: 3, cursor: 'pointer', font: '600 12.5px/1 var(--font-body)',
            }}
          >
            <span style={{ width: 16, height: 16, flex: 'none', display: 'flex' }}><Icon /></span>
            {NAV_LABELS[key]}
          </button>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '12px 6px 0', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <div style={{ font: '600 12px/1.3 var(--font-body)', color: '#fff' }}>{staffId}</div>
        <button
          type="button"
          className="wt-hover-white"
          onClick={logout}
          style={{ background: 'none', border: 'none', color: 'var(--blue-300)', font: '500 11px/1.4 var(--font-body)', padding: 0, marginTop: 4, cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
