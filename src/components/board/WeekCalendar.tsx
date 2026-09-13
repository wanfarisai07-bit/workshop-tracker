import type { Vehicle } from '../../domain/types';
import { weekCalendar } from '../../domain/derive';

export function WeekCalendar({ vehicles }: { vehicles: Vehicle[] }) {
  const week = weekCalendar(vehicles);
  return (
    <div style={{ padding: '0 26px 22px' }}>
      <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg3)', marginBottom: 10 }}>
        This week
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(150px, 1fr))', gap: 10 }}>
        {week.map((d, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, background: 'var(--surface)', border: '1px solid ' + d.borderColor, borderRadius: 'var(--radius-sm)', minHeight: 130 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, padding: '9px 10px 0' }}>
              <span style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', color: d.dayColor }}>{d.dayLabel}</span>
              <span style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--fg3)' }}>{d.dateLabel}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0 8px 9px', flex: 1 }}>
              {d.empty && <div style={{ font: '400 11px/1.4 var(--font-body)', color: 'var(--grey-400)', padding: '4px 2px' }}>No bookings.</div>}
              {d.items.map((it, k) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2, borderLeft: '3px solid ' + it.color, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', padding: '5px 7px' }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ font: '700 11.5px/1 var(--font-mono)', color: 'var(--fg1)' }}>{it.time}</span>
                    <span style={{ font: '700 12px/1 var(--font-display)', color: 'var(--fg1)' }}>{it.plate}</span>
                  </span>
                  <span style={{ font: '400 10.5px/1.3 var(--font-body)', color: 'var(--fg3)' }}>{it.customer}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
