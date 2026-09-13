import { BAY_COUNT } from '../../domain/constants';
import { computeBays } from '../../domain/derive';
import { fmtMins, mins } from '../../domain/format';
import { useAppState } from '../../state/AppStateContext';
import { useWorkshopData } from '../../state/WorkshopDataContext';

export function BaysScreen() {
  const { vehicles } = useWorkshopData();
  const { openVehicle } = useAppState();
  const bays = computeBays(vehicles);
  const inBay = vehicles.filter((v) => v.stage === 'inbay');
  const avg = inBay.length ? Math.round(inBay.reduce((a, v) => a + mins(v.at), 0) / inBay.length) : 0;

  return (
    <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1060 }}>
      <div style={{ background: 'var(--blue-900)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 26 }}>
        <span>
          <span style={{ display: 'block', font: '600 10px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--blue-300)' }}>
            Bay utilisation
          </span>
          <span style={{ display: 'block', font: '800 32px/1 var(--font-display)', color: '#fff', marginTop: 6 }}>
            {inBay.length} / {BAY_COUNT}
          </span>
        </span>
        <span style={{ font: '500 12px/1.5 var(--font-mono)', color: 'var(--blue-200)' }}>
          {BAY_COUNT - inBay.length} bays free<br />Avg {fmtMins(avg)} per vehicle
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
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
                  borderRadius: 'var(--radius-sm)', padding: 12, cursor: 'pointer', boxShadow: 'var(--shadow-xs)',
                }}
              >
                <span style={{ font: '600 9.5px/1 var(--font-mono)', letterSpacing: '0.12em', color: 'var(--fg3)' }}>{b.label}</span>
                <span style={{ font: '700 18px/1 var(--font-display)', color: 'var(--fg1)' }}>{b.vehicle.plate}</span>
                <span style={{ font: '400 11px/1.3 var(--font-body)', color: 'var(--fg2)', minHeight: 28 }}>{b.job}</span>
                <span style={{ font: '500 10.5px/1 var(--font-mono)', color: b.overdue ? 'var(--amber-600)' : 'var(--fg3)' }}>{b.elapsed}</span>
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 12, background: 'rgba(255,255,255,0.4)' }}>
                <span style={{ font: '600 9.5px/1 var(--font-mono)', letterSpacing: '0.12em', color: 'var(--fg3)' }}>{b.label}</span>
                <span style={{ font: '700 18px/1 var(--font-display)', letterSpacing: '0.03em', color: 'var(--grey-400)' }}>FREE</span>
                <span style={{ font: '400 11px/1.3 var(--font-body)', color: 'var(--grey-400)', minHeight: 28 }}>Available for next check-in.</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
