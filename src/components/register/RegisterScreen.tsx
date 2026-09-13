import { useMemo, useState } from 'react';
import { ALL_BAY_IDS, JOB_CATALOG } from '../../domain/constants';
import { bayLabel } from '../../domain/format';
import { useAppState } from '../../state/AppStateContext';
import { useWorkshopData } from '../../state/WorkshopDataContext';
import { Chip } from '../common/Chip';
import { Field } from '../common/Field';
import { PlainInput } from '../common/PlainInput';
import { PrimaryButton } from '../common/PrimaryButton';

type SearchMode = 'plate' | 'name';

interface FormState {
  plate: string; type: string; chassis: string; brand: string;
  customer: string; odo: string; jobs: string[]; jobOther: string; bay: number | null;
}

const EMPTY_FORM: FormState = {
  plate: '', type: '', chassis: '', brand: '',
  customer: '', odo: '', jobs: [], jobOther: '', bay: null,
};

export function RegisterScreen() {
  const { companies, regVehicles, vehicles, checkIn } = useWorkshopData();
  const { openVehicle, goToNewCustomer } = useAppState();

  const [searchMode, setSearchMode] = useState<SearchMode>('plate');
  const [lookup, setLookup] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'found' | 'notfound'>('idle');
  const [lookupName, setLookupName] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const flatVehicles = useMemo(() => regVehicles.map((v) => {
    const co = companies.find((c) => c.id === v.companyId);
    return { id: v.id, name: co?.name ?? '—', plate: v.plate, chassis: v.chassis, brand: v.brand, type: v.type };
  }), [regVehicles, companies]);

  const matches = useMemo(() => {
    const q = lookup.trim().toLowerCase();
    if (!q) return [];
    return flatVehicles.filter((c) => (searchMode === 'plate' ? c.plate : c.name).toLowerCase().includes(q)).slice(0, 8);
  }, [flatVehicles, lookup, searchMode]);

  const selectCustomer = (rec: (typeof flatVehicles)[number]) => {
    setForm((f) => ({ ...f, plate: rec.plate, chassis: rec.chassis === '—' ? '' : rec.chassis, customer: rec.name, brand: rec.brand, type: rec.type }));
    setLookup('');
    setLookupStatus('found');
    setLookupName(rec.name);
  };

  const doLookup = () => {
    if (matches.length) selectCustomer(matches[0]);
    else setLookupStatus('notfound');
  };

  const setSearchModeAndReset = (m: SearchMode) => {
    setSearchMode(m);
    setLookupStatus('idle');
  };

  const pickJob = (name: string) => {
    setForm((f) => ({ ...f, jobs: f.jobs.includes(name) ? f.jobs.filter((n) => n !== name) : f.jobs.concat([name]) }));
  };

  const takenBays = vehicles.filter((v) => v.stage === 'inbay').map((v) => v.bay);

  const summaryLine = [form.customer, form.brand, form.type].filter(Boolean).join('  ·  ');
  const ok = form.plate.trim().length > 0 && !!form.type && form.jobs.length > 0;

  const submit = async () => {
    const finalJobs = form.jobs.map((j) => (j === 'Other' ? (form.jobOther || 'Other') : j));
    const created = await checkIn({
      plate: form.plate, type: form.type, customer: form.customer, odo: form.odo,
      jobs: finalJobs, bay: form.bay,
    });
    setForm(EMPTY_FORM);
    setLookup('');
    setLookupStatus('idle');
    openVehicle(created.id);
  };

  return (
    <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 640 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>
            Pre-registered customer
          </div>
          <button
            type="button"
            className="wt-hover-blue700"
            onClick={goToNewCustomer}
            style={{ marginLeft: 'auto', background: 'var(--brand)', border: 'none', color: '#fff', font: '700 11px/1 var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            + Add customer/vehicle
          </button>
        </div>
        <div style={{ font: '400 11.5px/1.4 var(--font-body)', color: 'var(--fg3)' }}>
          Search by plate or customer name — matching records appear as you type.
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => setSearchModeAndReset('plate')} style={modeButtonStyle(searchMode === 'plate')}>Plate number</button>
          <button type="button" onClick={() => setSearchModeAndReset('name')} style={modeButtonStyle(searchMode === 'name')}>Customer name</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="wt-input"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder={searchMode === 'plate' ? 'e.g. WTB 44 or WTB 4412' : 'e.g. MPKT or MPKT Fleet'}
            style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', font: '600 13.5px/1.3 var(--font-mono)', color: 'var(--fg1)', background: 'var(--bg)' }}
          />
          <button type="button" className="wt-hover-blue700" onClick={doLookup} style={{ flex: 'none', background: 'var(--brand)', border: 'none', color: '#fff', font: '700 12px/1 var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
            Pull details
          </button>
        </div>

        {lookup.trim().length > 0 && matches.length > 0 && (
          <>
            {matches.length > 1 && (
              <div style={{ font: '600 11px/1.3 var(--font-body)', color: 'var(--fg2)' }}>
                {matches.length} vehicles found — choose the one checking in today.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {matches.map((sug) => (
                <button
                  key={sug.id}
                  type="button"
                  className="wt-hover-blue50"
                  onClick={() => selectCustomer(sug)}
                  style={{ textAlign: 'left', width: '100%', display: 'flex', alignItems: 'baseline', gap: 8, background: 'var(--bg)', border: 'none', borderBottom: '1px solid var(--border)', padding: '9px 10px', cursor: 'pointer' }}
                >
                  <span style={{ font: '700 12.5px/1 var(--font-display)', color: 'var(--fg1)' }}>{sug.plate}</span>
                  <span style={{ font: '500 11.5px/1.2 var(--font-body)', color: 'var(--fg2)' }}>{sug.name}</span>
                  <span style={{ marginLeft: 'auto', font: '400 10.5px/1.2 var(--font-body)', color: 'var(--fg3)', whiteSpace: 'nowrap' }}>{sug.brand}  ·  {sug.type}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {lookupStatus === 'found' && (
          <div style={{ font: '600 12px/1.4 var(--font-body)', color: 'var(--success)' }}>Match found — {lookupName}. Details filled in below.</div>
        )}
        {lookup.trim().length > 0 && matches.length === 0 && (
          <div style={{ font: '500 12px/1.4 var(--font-body)', color: 'var(--amber-600)' }}>
            No match found. <a href="#register-no-match" onClick={(e) => { e.preventDefault(); goToNewCustomer(); }}>Register this customer</a> first, then come back to check them in.
          </div>
        )}
      </div>

      {lookupStatus === 'found' && (
        <div style={{ background: 'var(--blue-50)', border: '1px solid var(--brand)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ font: '600 10px/1 var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)' }}>Registered vehicle</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ font: '700 18px/1 var(--font-display)', color: 'var(--fg1)' }}>{form.plate}</span>
            <span style={{ font: '500 11.5px/1.2 var(--font-mono)', color: 'var(--fg3)' }}>{form.chassis}</span>
          </div>
          <div style={{ font: '400 12.5px/1.4 var(--font-body)', color: 'var(--fg2)' }}>{summaryLine}</div>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
        <Field label="Odometer at check-in (km)" value={form.odo} onChange={(e) => setForm((f) => ({ ...f, odo: e.target.value }))} placeholder="128 400" inputStyle={{ font: '700 16px/1.1 var(--font-mono)' }} />
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>Customer</div>
        <Field label="Customer" value={form.customer} onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))} placeholder="e.g. MPKT Fleet" inputStyle={{ padding: '9px 12px', font: '400 13.5px/1.3 var(--font-body)' }} />
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
        <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>Service / repair jobs</div>
        <div style={{ font: '400 11.5px/1.4 var(--font-body)', color: 'var(--fg3)', margin: '5px 0 11px' }}>
          {form.jobs.length ? form.jobs.length + ' job(s) selected — click to remove.' : 'Select every job this vehicle came in for.'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {JOB_CATALOG.map((n) => (
            <Chip key={n} variant="soft" label={n === 'Other' ? 'Other : please state' : n} selected={form.jobs.includes(n)} onClick={() => pickJob(n)} />
          ))}
        </div>
        {form.jobs.includes('Other') && (
          <PlainInput value={form.jobOther} onChange={(e) => setForm((f) => ({ ...f, jobOther: e.target.value }))} placeholder="Please state job" style={{ marginTop: 8, padding: '9px 12px' }} />
        )}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
        <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 4 }}>Bay number</div>
        <div style={{ font: '400 11.5px/1.4 var(--font-body)', color: 'var(--fg3)', marginBottom: 11 }}>Optional — leave unassigned if not ready for a bay yet.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ALL_BAY_IDS.map((i) => {
            const busy = takenBays.includes(i);
            const on = form.bay === i;
            return (
              <Chip
                key={i}
                mono
                label={bayLabel(i) + (busy ? ' · busy' : '')}
                selected={on}
                disabled={busy}
                onClick={() => setForm((f) => ({ ...f, bay: on ? null : i }))}
              />
            );
          })}
        </div>
      </div>

      {ok ? (
        <PrimaryButton size="lg" onClick={submit}>Register &amp; check in</PrimaryButton>
      ) : (
        <>
          <PrimaryButton size="lg" disabled>Register &amp; check in</PrimaryButton>
          <div style={{ font: '400 11.5px/1.4 var(--font-body)', color: 'var(--fg3)', textAlign: 'center', marginTop: 6 }}>
            Plate, vehicle type and at least one job are required.
          </div>
        </>
      )}
    </div>
  );
}

function modeButtonStyle(active: boolean) {
  return {
    flex: 1, font: '700 11px/1 var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    padding: 8, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
    background: active ? 'var(--brand)' : 'var(--bg)', color: active ? '#fff' : 'var(--fg2)',
    border: '1px solid ' + (active ? 'var(--brand)' : 'var(--border)'),
  };
}
