import { BAY_COUNT } from '../../../domain/constants';
import { computeBays } from '../../../domain/derive';
import { fmtMins, mins } from '../../../domain/format';
import { useAppState } from '../../../state/AppStateContext';
import { useWorkshopData } from '../../../state/WorkshopDataContext';

export function MobileBaysScreen() {
  const { vehicles } = useWorkshopData();
  const { openVehicle } = useAppState();
  const bays = computeBays(vehicles);
  const inBay = vehicles.filter((v) => v.stage === 'inbay');
  const avg = inBay.length ? Math.round(inBay.reduce((a, v) => a + mins(v.at), 0) / inBay.length) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--blue-900)', padding: 14, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <span>
          <span style={{ display: 'block', font: '600 10px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--blue-300)', whiteSpace: 'nowrap' }}>
            Bay utilisation
          </span>
          <span style={{ display: 'block', font: '800 34px/1 var(--font-display)', color: '#fff', marginTop: 7 }}>{inBay.length} / {BAY_COUNT}</span>
        </span>
        <span style={{ marginLeft: 'auto', textAlign: 'right', flex: 'none' }}>
          <span style={{ display: 'block', font: '500 11px/1.4 var(--font-mono)', color: 'var(--blue-200)', whiteSpace: 'nowrap' }}>{BAY_COUNT - inBay.length} bays free</span>
          <span style={{ display: 'block', font: '500 11px/1.4 var(--font-mono)', color: 'var(--blue-300)', whiteSpace: 'nowrap', marginTop: 2 }}>Avg {fmtMins(avg)} per vehicle</span>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {bays.map((b) => (
          <div key={b.bay}>
            {b.occupied && b.vehicle ? (
              <button
                type="button"
                className="wt-hover-shadow-md"
                onClick={() => openVehicle(b.vehicle!.id)}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 5,
                  background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--amber-500)',
                  borderRadius: 'var(--radius-sm)', padding: 11, cursor: 'pointer', boxShadow: 'var(--shadow-xs)',
                }}
              >
                <span style={{ font: '600 9.5px/1 var(--font-mono)', letterSpacing: '0.14em', color: 'var(--fg3)' }}>{b.label}</span>
                <span style={{ font: '700 19px/1 var(--font-display)', letterSpacing: '0.01em', color: 'var(--fg1)' }}>{b.vehicle.plate}</span>
                <span style={{ font: '400 11.5px/1.3 var(--font-body)', color: 'var(--fg2)', minHeight: 29 }}>{b.job}</span>
                <span style={{ font: '500 10.5px/1 var(--font-mono)', color: b.overdue ? 'var(--amber-600)' : 'var(--fg3)' }}>{b.elapsed}</span>
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 11, background: 'rgba(255,255,255,0.4)' }}>
                <span style={{ font: '600 9.5px/1 var(--font-mono)', letterSpacing: '0.14em', color: 'var(--fg3)' }}>{b.label}</span>
                <span style={{ font: '700 19px/1 var(--font-display)', letterSpacing: '0.04em', color: 'var(--grey-400)' }}>FREE</span>
                <span style={{ font: '400 11.5px/1.3 var(--font-body)', color: 'var(--grey-400)', minHeight: 29 }}>Available for next check-in.</span>
                <span style={{ font: '500 10.5px/1 var(--font-mono)', color: 'var(--grey-400)' }}>—</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
