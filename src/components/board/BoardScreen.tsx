import { STAGES } from '../../domain/constants';
import { isOverdue } from '../../domain/derive';
import { useAppState } from '../../state/AppStateContext';
import { useWorkshopData } from '../../state/WorkshopDataContext';
import { VehicleCard } from './VehicleCard';
import { WeekCalendar } from './WeekCalendar';

export function BoardScreen() {
  const { vehicles } = useWorkshopData();
  const { overdueOnly, openVehicle } = useAppState();

  return (
    <>
      <div style={{ padding: '22px 26px', display: 'grid', gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))', gap: 14, alignItems: 'start' }}>
        {STAGES.map((stage) => {
          let items = vehicles.filter((v) => v.stage === stage.key);
          if (overdueOnly) items = items.filter(isOverdue);
          const count = items.length;
          // The "Delivered / closed" column only ever grows, so cap it to the
          // most recent 10 here — the header's "Delivered" pill opens the
          // full history instead.
          const displayItems = stage.key === 'closed'
            ? [...items].sort((a, b) => b.at - a.at).slice(0, 10)
            : items;
          return (
            <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: stage.bg, borderRadius: 'var(--radius-sm)', padding: '9px 10px' }}>
                <span style={{ width: 8, height: 8, flex: 'none', background: stage.color }} />
                <span style={{ font: '600 10.5px/1.2 var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg2)', minWidth: 0 }}>{stage.label}</span>
                <span style={{ marginLeft: 'auto', font: '700 11px/1 var(--font-mono)', color: 'var(--fg3)' }}>{count}</span>
              </div>
              {count === 0 && (
                <div style={{ font: '400 12px/1.4 var(--font-body)', color: 'var(--grey-400)', padding: '6px 2px' }}>No vehicles.</div>
              )}
              {displayItems.map((v) => (
                <VehicleCard key={v.id} vehicle={v} stage={stage} onOpen={() => openVehicle(v.id)} />
              ))}
              {stage.key === 'closed' && count > displayItems.length && (
                <div style={{ font: '400 11px/1.4 var(--font-body)', color: 'var(--fg3)', padding: '2px 2px 0' }}>
                  Showing latest {displayItems.length} of {count} — see "Delivered" above for all.
                </div>
              )}
            </div>
          );
        })}
      </div>
      <WeekCalendar vehicles={vehicles} />
    </>
  );
}
