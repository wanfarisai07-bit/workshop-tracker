import { useState } from 'react';
import { STAGES } from '../../../domain/constants';
import { isOverdue } from '../../../domain/derive';
import { fmtMins, mins } from '../../../domain/format';
import type { StageKey } from '../../../domain/types';
import { useAppState } from '../../../state/AppStateContext';
import { useWorkshopData } from '../../../state/WorkshopDataContext';
import { MobileVehicleCard } from './MobileVehicleCard';

export function MobileBoardScreen() {
  const { vehicles } = useWorkshopData();
  const { overdueOnly, toggleOverdue, openVehicle } = useAppState();
  const [collapsed, setCollapsed] = useState<Partial<Record<StageKey, boolean>>>({});

  const inBay = vehicles.filter((v) => v.stage === 'inbay');
  const avg = inBay.length ? Math.round(inBay.reduce((a, v) => a + mins(v.at), 0) / inBay.length) : 0;
  const overdueCount = vehicles.filter(isOverdue).length;

  const groups = STAGES.map((stage) => {
    let items = vehicles.filter((v) => v.stage === stage.key);
    if (overdueOnly) items = items.filter(isOverdue);
    const count = items.length;
    // "Delivered / closed" only ever grows — cap it to the most recent 10.
    if (stage.key === 'closed') items = [...items].sort((a, b) => b.at - a.at).slice(0, 10);
    const open = !collapsed[stage.key];
    return { stage, items: open ? items : [], count, open };
  }).filter((g) => !overdueOnly || g.count > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        <button
          type="button"
          className={overdueOnly ? undefined : 'wt-hover-border-strong'}
          onClick={toggleOverdue}
          style={{
            background: overdueOnly ? 'var(--amber-500)' : 'var(--surface)',
            border: '1px solid ' + (overdueOnly ? 'var(--amber-600)' : 'var(--border)'),
            color: overdueOnly ? '#fff' : 'var(--fg2)',
            font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '8px 10px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
          }}
        >
          Overdue only · {overdueCount}
        </button>
        <span style={{ marginLeft: 'auto', font: '500 11px/1 var(--font-mono)', color: 'var(--fg3)' }}>Avg {fmtMins(avg)} in bay</span>
      </div>

      {groups.map(({ stage, items, count, open }) => (
        <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <button
            type="button"
            onClick={() => setCollapsed((c) => ({ ...c, [stage.key]: !c[stage.key] }))}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: stage.bg, border: 'none',
              borderBottom: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 9px', cursor: 'pointer',
              position: 'sticky', top: 0, zIndex: 2,
            }}
          >
            <span style={{ width: 9, height: 9, flex: 'none', background: stage.color }} />
            <span style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg2)' }}>{stage.label}</span>
            <span style={{ marginLeft: 'auto', font: '600 10.5px/1 var(--font-mono)', color: 'var(--fg3)' }}>{count}{open ? '' : ' · hidden'}</span>
          </button>
          {open && count === 0 && (
            <div style={{ font: '400 12.5px/1.4 var(--font-body)', color: 'var(--grey-400)', padding: '2px 2px 4px' }}>No vehicles at this stage.</div>
          )}
          {items.map((v) => (
            <MobileVehicleCard key={v.id} vehicle={v} stage={stage} onOpen={() => openVehicle(v.id)} />
          ))}
        </div>
      ))}
    </div>
  );
}
