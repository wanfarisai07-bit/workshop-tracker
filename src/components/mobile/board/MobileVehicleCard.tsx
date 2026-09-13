import { isOverdue, jobSummary, timeLabel } from '../../../domain/derive';
import { bayLabel } from '../../../domain/format';
import type { Stage, Vehicle } from '../../../domain/types';

export function MobileVehicleCard({ vehicle, stage, onOpen }: { vehicle: Vehicle; stage: Stage; onOpen: () => void }) {
  const over = isOverdue(vehicle);
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', gap: 5,
        background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid ' + stage.color,
        borderRadius: 'var(--radius-md)', padding: '11px 12px', boxShadow: 'var(--shadow-xs)', cursor: 'pointer',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ font: '700 21px/1 var(--font-display)', letterSpacing: '0.01em', color: 'var(--fg1)' }}>{vehicle.plate}</span>
        <span style={{ marginLeft: 'auto', font: '500 10.5px/1 var(--font-mono)', color: 'var(--fg3)' }}>{vehicle.sheet}</span>
      </span>
      <span style={{ font: '400 13px/1.35 var(--font-body)', color: 'var(--fg2)' }}>{vehicle.customer}  ·  {vehicle.type}</span>
      <span style={{ font: '400 12.5px/1.35 var(--font-body)', color: 'var(--grey-400)' }}>{jobSummary(vehicle)}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
        {vehicle.bay != null && (
          <span style={{ font: '600 10px/1 var(--font-mono)', letterSpacing: '0.1em', background: 'var(--blue-50)', color: 'var(--brand)', padding: '4px 6px', borderRadius: 'var(--radius-xs)' }}>
            {bayLabel(vehicle.bay)}
          </span>
        )}
        {over ? (
          <span style={{ font: '600 10px/1 var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'var(--warning-bg)', color: 'var(--amber-600)', padding: '4px 6px', borderRadius: 'var(--radius-xs)' }}>
            {timeLabel(vehicle)}
          </span>
        ) : (
          <span style={{ font: '500 10.5px/1 var(--font-mono)', letterSpacing: '0.06em', color: 'var(--fg3)' }}>{timeLabel(vehicle)}</span>
        )}
      </span>
    </button>
  );
}
