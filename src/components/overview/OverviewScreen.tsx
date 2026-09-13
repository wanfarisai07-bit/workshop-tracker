import { BAY_COUNT, STAGES, stageByKey } from '../../domain/constants';
import { dur } from '../../domain/format';
import { isOverdue } from '../../domain/derive';
import { useAppState } from '../../state/AppStateContext';
import { useWorkshopData } from '../../state/WorkshopDataContext';

export function OverviewScreen() {
  const { vehicles } = useWorkshopData();
  const { openVehicle } = useAppState();

  const active = vehicles.filter((v) => v.stage !== 'booked' && v.stage !== 'closed');
  const overdueList = vehicles.filter(isOverdue);
  const inBay = vehicles.filter((v) => v.stage === 'inbay');
  const ready = vehicles.filter((v) => v.stage === 'ready');

  const stats = [
    { value: String(active.length), label: 'Vehicles in workshop', color: '#fff' },
    { value: inBay.length + ' / ' + BAY_COUNT, label: 'Bays occupied', color: '#fff' },
    { value: String(overdueList.length), label: 'Over stage target', color: 'var(--amber-400)' },
    { value: String(ready.length), label: 'Ready for collection', color: '#fff' },
  ];

  const max = Math.max(1, ...STAGES.map((st) => vehicles.filter((v) => v.stage === st.key).length));
  const distribution = STAGES.map((st) => {
    const n = vehicles.filter((v) => v.stage === st.key).length;
    return { label: st.label, count: n, width: Math.round((n / max) * 100) + '%', color: st.color };
  });

  const longest = active
    .slice()
    .sort((a, b) => (a.checkin ?? a.at) - (b.checkin ?? b.at))
    .slice(0, 3)
    .map((v) => ({
      id: v.id, plate: v.plate, stageLabel: stageByKey(v.stage).label,
      total: dur(v.checkin ?? v.at), overdue: isOverdue(v),
    }));

  return (
    <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1060 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: 'var(--blue-900)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <span style={{ display: 'block', font: '800 30px/1 var(--font-display)', color: s.color }}>{s.value}</span>
            <span style={{ display: 'block', font: '600 9.5px/1.3 var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--blue-300)', marginTop: 8 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
          <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 12 }}>
            Where vehicles are now
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {distribution.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 130, flex: 'none', font: '400 11.5px/1.3 var(--font-body)', color: 'var(--fg2)' }}>{d.label}</span>
                <span style={{ flex: 1, height: 9, background: 'var(--bg-muted)', display: 'block' }}>
                  <span style={{ display: 'block', height: '100%', width: d.width, background: d.color }} />
                </span>
                <span style={{ width: 18, flex: 'none', textAlign: 'right', font: '600 12px/1 var(--font-mono)', color: 'var(--fg1)' }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
          <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 4 }}>
            Longest in workshop
          </div>
          <div style={{ font: '400 11.5px/1.4 var(--font-body)', color: 'var(--fg3)', marginBottom: 6 }}>Total time since check-in.</div>
          {longest.map((l) => (
            <button
              key={l.id}
              type="button"
              className="wt-hover-subtle"
              onClick={() => openVehicle(l.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: '1px solid var(--border)', padding: '11px 1px', cursor: 'pointer' }}
            >
              <span>
                <span style={{ display: 'block', font: '700 16px/1 var(--font-display)', color: 'var(--fg1)' }}>{l.plate}</span>
                <span style={{ display: 'block', font: '400 11px/1.3 var(--font-body)', color: 'var(--fg3)', marginTop: 4 }}>{l.stageLabel}</span>
              </span>
              <span style={{ marginLeft: 'auto', font: '600 13px/1 var(--font-mono)', color: l.overdue ? 'var(--amber-600)' : 'var(--fg1)' }}>{l.total}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
