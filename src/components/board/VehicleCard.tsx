import { jobSummary, isOverdue, timeLabel } from '../../domain/derive';
import { bayLabel } from '../../domain/format';
import type { Vehicle } from '../../domain/types';
import type { Stage } from '../../domain/types';

/** One vehicle summary card on the status board (and the "longest in workshop" list target). */
export function VehicleCard({ vehicle, stage, onOpen }: { vehicle: Vehicle; stage: Stage; onOpen: () => void }) {
  const over = isOverdue(vehicle);
  return (
    <button
      type="button"
      className="wt-hover-card"
      onClick={onOpen}
      style={{
        textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', gap: 5,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderLeft: '3px solid ' + stage.color, borderRadius: 'var(--radius-sm)',
        padding: '10px 11px', boxShadow: 'var(--shadow-xs)', cursor: 'pointer',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ font: '700 16px/1 var(--font-display)', color: 'var(--fg1)' }}>{vehicle.plate}</span>
      </span>
      <span style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--fg3)' }}>{vehicle.sheet}</span>
      <span style={{ font: '400 11.5px/1.3 var(--font-body)', color: 'var(--fg2)' }}>{vehicle.customer}  ·  {vehicle.type}</span>
      <span style={{ font: '400 11px/1.3 var(--font-body)', color: 'var(--grey-400)' }}>{jobSummary(vehicle)}</span>
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
        {vehicle.bay != null && (
          <span style={{ font: '600 9.5px/1 var(--font-mono)', background: 'var(--blue-50)', color: 'var(--brand)', padding: '3px 6px', borderRadius: 'var(--radius-xs)' }}>
            {bayLabel(vehicle.bay)}
          </span>
        )}
        {over ? (
          <span style={{ font: '600 9.5px/1 var(--font-mono)', textTransform: 'uppercase', background: 'var(--warning-bg)', color: 'var(--amber-600)', padding: '3px 6px', borderRadius: 'var(--radius-xs)' }}>
            {timeLabel(vehicle)}
          </span>
        ) : (
          <span style={{ font: '500 9.5px/1 var(--font-mono)', color: 'var(--fg3)' }}>{timeLabel(vehicle)}</span>
        )}
      </span>
    </button>
  );
}
