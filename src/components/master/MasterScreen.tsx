import { useEffect, useState } from 'react';
import { BAY_COUNT, STAGES } from '../../domain/constants';
import { computeBays, jobSummary, isOverdue, timeLabel } from '../../domain/derive';
import { bayLabel } from '../../domain/format';
import { useWorkshopData } from '../../state/WorkshopDataContext';

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

/** The big read-only "TV board" display for the workshop floor — display only, all updates flow from Board/Bays/Check-in. */
export function MasterScreen() {
  const { vehicles } = useWorkshopData();
  const clock = useClock();
  const inBayCount = vehicles.filter((v) => v.stage === 'inbay').length;
  const bays = computeBays(vehicles);

  return (
    <div style={{
      margin: 0, minHeight: '100%', background: '#ffffff',
      backgroundImage: [
        'radial-gradient(circle at 15% 0%, rgba(46,147,216,0.08), transparent 45%)',
        'radial-gradient(circle at 100% 100%, rgba(237,139,0,0.06), transparent 50%)',
        'repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 34px)',
        'repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 34px)',
      ].join(', '),
      padding: '26px 30px 34px', boxSizing: 'border-box', fontFamily: 'var(--font-body)',
    }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, paddingBottom: 18, borderBottom: '1px solid var(--border)', marginBottom: 22 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#1E9E5B', boxShadow: '0 0 10px 2px rgba(30,158,91,0.5)', flex: 'none' }} />
        <span style={{ font: '800 15px/1 var(--font-display)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg1)' }}>
          Live Workshop Reference
        </span>
        <span style={{ font: '500 11.5px/1 var(--font-mono)', letterSpacing: '0.08em', color: 'var(--fg3)' }}>
          Display only — updates flow from Board, Bays &amp; Check-in
        </span>
        <span style={{ marginLeft: 'auto', font: '700 13px/1 var(--font-mono)', letterSpacing: '0.06em', color: 'var(--fg2)' }}>{clock}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14, marginBottom: 22 }}>
        {STAGES.map((st) => {
          const items = vehicles.filter((v) => v.stage === st.key);
          return (
            <div key={st.key} style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderTop: '3px solid ' + st.color, borderRadius: 4, padding: 12, minHeight: 220, boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ font: '700 11.5px/1.2 var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--fg2)', minWidth: 0 }}>{st.label}</span>
                <span style={{ marginLeft: 'auto', font: '800 15px/1 var(--font-mono)', color: 'var(--fg1)' }}>{items.length}</span>
              </div>
              {items.map((v) => (
                <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 3, padding: '9px 10px' }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ font: '700 19px/1 var(--font-display)', letterSpacing: '0.01em', color: 'var(--fg1)' }}>{v.plate}</span>
                    <span style={{ marginLeft: 'auto', font: '500 10px/1 var(--font-mono)', color: 'var(--fg3)' }}>{v.sheet}</span>
                  </span>
                  <span style={{ font: '400 11px/1.3 var(--font-body)', color: 'var(--fg2)' }}>{v.customer}  ·  {v.type}</span>
                  <span style={{ font: '400 10.5px/1.3 var(--font-body)', color: 'var(--grey-400)' }}>{jobSummary(v)}</span>
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                    {v.bay != null && (
                      <span style={{ font: '700 9.5px/1 var(--font-mono)', background: 'var(--blue-50)', color: 'var(--brand)', padding: '3px 6px', borderRadius: 2 }}>
                        {bayLabel(v.bay)}
                      </span>
                    )}
                    {isOverdue(v) && (
                      <span style={{ font: '700 9.5px/1 var(--font-mono)', textTransform: 'uppercase', background: 'var(--warning-bg)', color: 'var(--amber-600)', padding: '3px 6px', borderRadius: 2 }}>
                        {timeLabel(v)}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '18px 20px', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
          <span style={{ font: '700 11px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg3)' }}>Bay occupancy</span>
          <span style={{ marginLeft: 'auto', font: '800 24px/1 var(--font-display)', color: 'var(--fg1)' }}>{inBayCount} / {BAY_COUNT}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {bays.map((b) => {
            const bg = b.occupied ? (b.overdue ? 'var(--warning-bg)' : 'var(--blue-50)') : 'var(--bg-muted)';
            const border = b.occupied ? (b.overdue ? 'var(--amber-500)' : 'var(--brand)') : 'var(--border)';
            return (
              <div key={b.bay} style={{ borderRadius: 3, padding: 9, background: bg, border: '1px solid ' + border }}>
                <span style={{ display: 'block', font: '700 9px/1 var(--font-mono)', letterSpacing: '0.05em', color: 'var(--fg3)' }}>{b.label}</span>
                <span style={{ display: 'block', font: '700 14px/1.4 var(--font-display)', color: 'var(--fg1)', marginTop: 3 }}>{b.vehicle ? b.vehicle.plate : '—'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
