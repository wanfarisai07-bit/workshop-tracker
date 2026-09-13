import { NAV_ICONS } from '../../domain/icons';
import type { NavKey } from '../../domain/constants';
import { useAppState } from '../../state/AppStateContext';

const TABS: { key: NavKey; label: string }[] = [
  { key: 'register', label: 'Check in' },
  { key: 'board', label: 'Board' },
  { key: 'bays', label: 'Bays' },
  { key: 'overview', label: 'Overview' },
];

export function MobileTabBar() {
  const { screen, navigate } = useAppState();

  return (
    <div style={{ flex: 'none', background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '7px 4px 27px' }}>
      {TABS.map(({ key, label }) => {
        const Icon = NAV_ICONS[key];
        const active = screen === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => navigate(key)}
            style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '5px 0', cursor: 'pointer', color: active ? 'var(--brand)' : 'var(--grey-400)' }}
          >
            <span style={{ width: 21, height: 21, display: 'flex' }}><Icon size={21} /></span>
            <span style={{ font: '600 9px/1 var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
