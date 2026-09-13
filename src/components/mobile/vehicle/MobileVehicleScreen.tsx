import { STAGES, stageIndex } from '../../../domain/constants';
import { dur } from '../../../domain/format';
import { canAdvanceTo, isOverdue, vehicleTimeline } from '../../../domain/derive';
import { useWorkshopData } from '../../../state/WorkshopDataContext';

const JOB_STATUS = [
  { status: 'Pending', bg: 'var(--bg-muted)', fg: 'var(--fg2)' },
  { status: 'In progress', bg: 'var(--warning-bg)', fg: 'var(--amber-600)' },
  { status: 'Done', bg: 'var(--success-bg)', fg: 'var(--success)' },
] as const;

export function MobileVehicleScreen({ vehicleId }: { vehicleId: number }) {
  const { vehicles, advanceVehicle, cycleJob } = useWorkshopData();
  const v = vehicles.find((x) => x.id === vehicleId);
  if (!v) return null;

  const si = stageIndex(v.stage);
  const st = STAGES[si];
  const over = isOverdue(v);
  const timeline = vehicleTimeline(v);
  const canAdvance = si < STAGES.length - 1;
  const nextStage = canAdvance ? STAGES[si + 1] : null;
  const blockedByJobs = !!nextStage && !canAdvanceTo(v, nextStage.key);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--brand)', borderRadius: 'var(--radius-md)', padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ font: '800 32px/1 var(--font-display)', letterSpacing: '0.01em', color: 'var(--fg1)' }}>{v.plate}</span>
          <span style={{ marginLeft: 'auto', font: '500 11px/1 var(--font-mono)', color: 'var(--brand)' }}>{v.sheet}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: '7px 10px', marginTop: 13, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <span style={labelStyle}>Vehicle</span>
          <span style={valueStyle}>{v.type}</span>
          <span style={labelStyle}>Customer</span>
          <span style={valueStyle}>{v.customer}</span>
          <span style={labelStyle}>Promised</span>
          <span style={valueStyle}>{v.promised}</span>
          <span style={labelStyle}>Odometer</span>
          <span style={{ ...valueStyle, font: '500 13.5px/1.4 var(--font-mono)' }}>{v.odo} km</span>
        </div>
      </div>

      <div style={{ background: 'var(--blue-50)', borderLeft: '3px solid ' + st.color, padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ display: 'block' }}>
          <span style={{ display: 'block', font: '600 10px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg3)' }}>Current stage</span>
          <span style={{ display: 'block', font: '600 15px/1.3 var(--font-body)', color: 'var(--fg1)', marginTop: 5 }}>{st.label}</span>
        </span>
        <span style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <span style={{ display: 'block', font: '700 19px/1 var(--font-display)', color: 'var(--fg1)', fontVariantNumeric: 'tabular-nums' }}>
            {v.stage === 'booked' ? 'Not in yet' : dur(v.at)}
          </span>
          <span style={{ display: 'block', font: '500 9.5px/1 var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: over ? 'var(--amber-600)' : 'var(--fg3)', marginTop: 5 }}>
            {st.sla === 0 ? 'no target' : (over ? 'over ' + st.sla + 'm target' : 'target ' + st.sla + 'm')}
          </span>
        </span>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14 }}>
        <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 13 }}>
          Status progress
        </div>
        {timeline.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 11 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', boxSizing: 'border-box', background: t.dotBg, border: '2px solid ' + t.dotBorder }} />
              {t.hasLine && <span style={{ flex: 1, width: 2, minHeight: 20, background: 'var(--border)' }} />}
            </div>
            <div style={{ paddingBottom: 14 }}>
              <div style={{ font: '600 13.5px/1.3 var(--font-body)', color: t.labelColor }}>{t.label}</div>
              <div style={{ font: '500 11px/1.4 var(--font-mono)', color: 'var(--fg3)', marginTop: 3 }}>{t.timeText}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14 }}>
        <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 4 }}>
          Service &amp; repair jobs
        </div>
        <div style={{ font: '400 11.5px/1.4 var(--font-body)', color: 'var(--fg3)', marginBottom: 10 }}>Tap a job to move it on.</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {v.jobs.map((j, i) => {
            const badge = JOB_STATUS[j.state];
            return (
              <button
                key={i}
                type="button"
                className="wt-hover-subtle"
                onClick={() => cycleJob(v.id, i)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: '1px solid var(--border)', padding: '11px 1px', cursor: 'pointer' }}
              >
                <span style={{ font: '400 13.5px/1.35 var(--font-body)', color: 'var(--fg1)' }}>{j.name}</span>
                <span style={{ marginLeft: 'auto', flex: 'none', font: '600 9.5px/1 var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 7px', borderRadius: 'var(--radius-xs)', background: badge.bg, color: badge.fg }}>
                  {badge.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {canAdvance && nextStage && (
        blockedByJobs ? (
          <>
            <div style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-muted)', color: 'var(--grey-400)', font: '700 15px/1 var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: 16, borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              Move to {nextStage.label}
            </div>
            <div style={{ textAlign: 'center', font: '400 11.5px/1.4 var(--font-body)', color: 'var(--fg3)' }}>
              All jobs must be marked Done before closing this job sheet.
            </div>
          </>
        ) : (
          <button
            type="button"
            className="wt-hover-accent wt-active-press"
            onClick={() => advanceVehicle(v.id)}
            style={{ width: '100%', background: 'var(--accent)', border: 'none', color: '#fff', font: '700 15px/1 var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: 16, borderRadius: 'var(--radius-sm)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
          >
            Move to {nextStage.label}
          </button>
        )
      )}
      {!canAdvance && (
        <div style={{ textAlign: 'center', font: '500 11px/1.4 var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg3)', padding: 6 }}>
          Job sheet closed
        </div>
      )}
    </div>
  );
}

const labelStyle = { font: '600 10px/1.4 var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--fg3)' };
const valueStyle = { font: '400 13.5px/1.4 var(--font-body)', color: 'var(--fg1)' };
