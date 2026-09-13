import { useState } from 'react';
import { ALL_BAY_IDS, JOB_CATALOG, STAGES, stageIndex } from '../../../domain/constants';
import { bayLabel, dur } from '../../../domain/format';
import { canAdvanceTo, isOverdue, vehicleTimeline } from '../../../domain/derive';
import { useWorkshopData } from '../../../state/WorkshopDataContext';
import { Chip } from '../../common/Chip';
import { PlainInput } from '../../common/PlainInput';
import { PrimaryButton } from '../../common/PrimaryButton';

const JOB_STATUS = [
  { status: 'Pending', bg: 'var(--bg-muted)', fg: 'var(--fg2)' },
  { status: 'In progress', bg: 'var(--warning-bg)', fg: 'var(--amber-600)' },
  { status: 'Done', bg: 'var(--success-bg)', fg: 'var(--success)' },
] as const;

const KNOWN_JOBS = new Set<string>(JOB_CATALOG);

export function MobileVehicleScreen({ vehicleId }: { vehicleId: number }) {
  const { vehicles, advanceVehicle, cycleJob, updateVehicleJobs, updateVehicleBay } = useWorkshopData();
  const [editingJobs, setEditingJobs] = useState(false);
  const [draftJobs, setDraftJobs] = useState<string[]>([]);
  const [draftOther, setDraftOther] = useState('');
  const v = vehicles.find((x) => x.id === vehicleId);
  if (!v) return null;

  const startEditJobs = () => {
    const custom = v.jobs.find((j) => !KNOWN_JOBS.has(j.name));
    setDraftJobs(v.jobs.map((j) => (KNOWN_JOBS.has(j.name) ? j.name : 'Other')));
    setDraftOther(custom ? custom.name : '');
    setEditingJobs(true);
  };
  const cancelEditJobs = () => setEditingJobs(false);
  const pickDraftJob = (name: string) => {
    setDraftJobs((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : prev.concat([name])));
  };
  const saveJobs = async () => {
    const finalNames = draftJobs.map((n) => (n === 'Other' ? (draftOther || 'Other') : n));
    await updateVehicleJobs(v.id, finalNames);
    setEditingJobs(false);
  };

  const si = stageIndex(v.stage);
  const st = STAGES[si];
  const over = isOverdue(v);
  const timeline = vehicleTimeline(v);
  const canAdvance = si < STAGES.length - 1;
  const nextStage = canAdvance ? STAGES[si + 1] : null;
  const blockedByJobs = !!nextStage && !canAdvanceTo(v, nextStage.key);

  const takenBays = vehicles.filter((o) => o.stage === 'inbay' && o.id !== v.id).map((o) => o.bay);
  const pickBay = (bay: number) => updateVehicleBay(v.id, v.bay === bay ? null : bay);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>
            Service &amp; repair jobs
          </div>
          <button
            type="button"
            className="wt-hover-underline"
            onClick={editingJobs ? cancelEditJobs : startEditJobs}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: editingJobs ? 'var(--fg3)' : 'var(--brand)', font: '600 11px/1 var(--font-body)', cursor: 'pointer', padding: 0 }}
          >
            {editingJobs ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editingJobs ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ font: '400 11.5px/1.4 var(--font-body)', color: 'var(--fg3)' }}>Select every job this vehicle is in for.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {JOB_CATALOG.map((n) => (
                <Chip key={n} variant="soft" label={n === 'Other' ? 'Other : please state' : n} selected={draftJobs.includes(n)} onClick={() => pickDraftJob(n)} />
              ))}
            </div>
            {draftJobs.includes('Other') && (
              <PlainInput value={draftOther} onChange={(e) => setDraftOther(e.target.value)} placeholder="Please state job" />
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <div style={{ flex: 1 }}><PrimaryButton size="sm" disabled={draftJobs.length === 0} onClick={saveJobs}>Save changes</PrimaryButton></div>
              <button
                type="button"
                onClick={cancelEditJobs}
                style={{ flex: 'none', background: 'none', border: '1px solid var(--border)', color: 'var(--fg2)', font: '600 12px/1 var(--font-body)', padding: '0 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
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
              {v.jobs.length === 0 && (
                <div style={{ font: '400 12px/1.4 var(--font-body)', color: 'var(--grey-400)', padding: '6px 0' }}>No jobs listed yet.</div>
              )}
            </div>
          </>
        )}
      </div>

      {v.stage === 'inbay' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14 }}>
          <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 4 }}>
            Bay
          </div>
          <div style={{ font: '400 11.5px/1.4 var(--font-body)', color: 'var(--fg3)', marginBottom: 11 }}>
            {v.bay != null ? 'Tap the current bay to unassign, or pick another to reassign.' : 'Not assigned to a bay yet — pick one below.'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALL_BAY_IDS.map((i) => {
              const busy = takenBays.includes(i);
              const on = v.bay === i;
              return (
                <Chip
                  key={i}
                  mono
                  label={bayLabel(i) + (busy ? ' · busy' : '')}
                  selected={on}
                  disabled={busy}
                  onClick={() => pickBay(i)}
                />
              );
            })}
          </div>
        </div>
      )}

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
