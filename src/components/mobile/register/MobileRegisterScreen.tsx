import { useMemo, useState } from 'react';
import { ALL_BAY_IDS, JOB_CATALOG, VEHICLE_BRANDS, VEHICLE_TYPES } from '../../../domain/constants';
import { bayLabel } from '../../../domain/format';
import { useAppState } from '../../../state/AppStateContext';
import { useWorkshopData } from '../../../state/WorkshopDataContext';
import { Chip } from '../../common/Chip';
import { Field } from '../../common/Field';
import { PlainInput } from '../../common/PlainInput';

type SearchMode = 'plate' | 'name';

interface FormState {
  plate: string; type: string; typeOther: string; brand: string; brandOther: string; chassis: string;
  customer: string; odo: string; jobs: string[]; jobOther: string; bay: number | null;
}

const EMPTY_FORM: FormState = {
  plate: '', type: '', typeOther: '', brand: '', brandOther: '', chassis: '',
  customer: '', odo: '', jobs: [], jobOther: '', bay: null,
};

/**
 * Mobile check-in: search a pre-registered vehicle/customer by plate or name
 * to auto-fill its details, or skip the search and fill everything in by
 * hand — either path lands in the same form below.
 */
export function MobileRegisterScreen() {
  const { vehicles, companies, regVehicles, checkIn } = useWorkshopData();
  const { openVehicle } = useAppState();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [searchMode, setSearchMode] = useState<SearchMode>('plate');
  const [lookup, setLookup] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'found' | 'notfound'>('idle');
  const [lookupName, setLookupName] = useState('');

  const takenBays = vehicles.filter((v) => v.stage === 'inbay').map((v) => v.bay);
  const ok = form.plate.trim().length > 0 && !!form.type && form.jobs.length > 0;

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
    const brandKnown = (VEHICLE_BRANDS as readonly string[]).includes(rec.brand);
    const typeKnown = (VEHICLE_TYPES as readonly string[]).includes(rec.type);
    setForm((f) => ({
      ...f,
      plate: rec.plate, chassis: rec.chassis === '—' ? '' : rec.chassis, customer: rec.name,
      brand: brandKnown ? rec.brand : 'Other', brandOther: brandKnown ? '' : rec.brand,
      type: typeKnown ? rec.type : 'Other', typeOther: typeKnown ? '' : rec.type,
    }));
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

  const submit = async () => {
    const finalType = form.type === 'Other' ? (form.typeOther || 'Other') : form.type;
    const finalJobs = form.jobs.map((j) => (j === 'Other' ? (form.jobOther || 'Other') : j));
    const created = await checkIn({
      plate: form.plate, type: finalType, customer: form.customer, odo: form.odo,
      jobs: finalJobs, bay: form.bay,
    });
    setForm(EMPTY_FORM);
    setLookup('');
    setLookupStatus('idle');
    openVehicle(created.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>
          Pre-registered vehicle
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
            Pull
          </button>
        </div>

        {lookup.trim().length > 0 && matches.length > 0 && (
          <>
            {matches.length > 1 && (
              <div style={{ font: '600 11px/1.3 var(--font-body)', color: 'var(--fg2)' }}>
                {matches.length} vehicles found — tap the one checking in today.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {matches.map((sug) => (
                <button
                  key={sug.id}
                  type="button"
                  className="wt-hover-blue50"
                  onClick={() => selectCustomer(sug)}
                  style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--bg)', border: 'none', borderBottom: '1px solid var(--border)', padding: '9px 10px', cursor: 'pointer' }}
                >
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ font: '700 13px/1 var(--font-display)', color: 'var(--fg1)' }}>{sug.plate}</span>
                    <span style={{ marginLeft: 'auto', font: '400 10.5px/1.2 var(--font-body)', color: 'var(--fg3)', whiteSpace: 'nowrap' }}>{sug.brand}  ·  {sug.type}</span>
                  </span>
                  <span style={{ font: '500 11.5px/1.2 var(--font-body)', color: 'var(--fg2)' }}>{sug.name}</span>
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
            No match found. Fill in the details manually below.
          </div>
        )}
      </div>

      {lookupStatus === 'found' && (
        <div style={{ background: 'var(--blue-50)', border: '1px solid var(--brand)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ font: '600 10px/1 var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)' }}>Registered vehicle</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ font: '700 18px/1 var(--font-display)', color: 'var(--fg1)' }}>{form.plate}</span>
            <span style={{ font: '500 11.5px/1.2 var(--font-mono)', color: 'var(--fg3)' }}>{form.chassis}</span>
          </div>
          <div style={{ font: '400 12.5px/1.4 var(--font-body)', color: 'var(--fg2)' }}>
            {[form.customer, form.brand === 'Other' ? (form.brandOther || 'Other') : form.brand, form.type === 'Other' ? (form.typeOther || 'Other') : form.type].filter(Boolean).join('  ·  ')}
          </div>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>Vehicle</div>
        <Field label="Registration plate" value={form.plate} onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))} placeholder="e.g. WTB 4412" inputStyle={{ padding: '11px 12px', font: '700 18px/1.1 var(--font-display)', letterSpacing: '0.02em' }} />
        <div>
          <span style={chipLabelStyle}>Vehicle brand</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {VEHICLE_BRANDS.map((b) => (
              <Chip key={b} label={b === 'Other' ? 'Other : please state' : b} selected={form.brand === b} onClick={() => setForm((f) => ({ ...f, brand: b }))} />
            ))}
          </div>
          {form.brand === 'Other' && (
            <PlainInput value={form.brandOther} onChange={(e) => setForm((f) => ({ ...f, brandOther: e.target.value }))} placeholder="Please state brand" style={{ marginTop: 8 }} />
          )}
        </div>
        <Field label="Chassis number" value={form.chassis} onChange={(e) => setForm((f) => ({ ...f, chassis: e.target.value }))} placeholder="e.g. MHFRA1234567890" inputStyle={{ font: '500 14px/1.3 var(--font-mono)' }} />
        <div>
          <span style={chipLabelStyle}>Vehicle type</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {VEHICLE_TYPES.map((t) => (
              <Chip key={t} label={t === 'Other' ? 'Other : please state' : t} selected={form.type === t} onClick={() => setForm((f) => ({ ...f, type: t }))} />
            ))}
          </div>
          {form.type === 'Other' && (
            <PlainInput value={form.typeOther} onChange={(e) => setForm((f) => ({ ...f, typeOther: e.target.value }))} placeholder="Please state vehicle type" style={{ marginTop: 8 }} />
          )}
        </div>
        <Field label="Customer / owner" value={form.customer} onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))} placeholder="e.g. MPKT Fleet" inputStyle={{ font: '400 15px/1.3 var(--font-body)' }} />
        <Field label="Odometer (km)" value={form.odo} onChange={(e) => setForm((f) => ({ ...f, odo: e.target.value }))} placeholder="128 400" inputStyle={{ font: '500 15px/1.3 var(--font-mono)' }} />
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14 }}>
        <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>Service / repair jobs</div>
        <div style={{ font: '400 11.5px/1.4 var(--font-body)', color: 'var(--fg3)', margin: '5px 0 11px' }}>
          {form.jobs.length ? form.jobs.length + ' job(s) selected — tap to remove.' : 'Select every job this vehicle came in for.'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {JOB_CATALOG.map((n) => (
            <Chip key={n} variant="soft" label={n === 'Other' ? 'Other : please state' : n} selected={form.jobs.includes(n)} onClick={() => pickJob(n)} />
          ))}
        </div>
        {form.jobs.includes('Other') && (
          <PlainInput value={form.jobOther} onChange={(e) => setForm((f) => ({ ...f, jobOther: e.target.value }))} placeholder="Please state job" style={{ marginTop: 8 }} />
        )}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14 }}>
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
        <button
          type="button"
          className="wt-hover-accent wt-active-press"
          onClick={submit}
          style={{ width: '100%', background: 'var(--accent)', border: 'none', color: '#fff', font: '700 15px/1 var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: 16, borderRadius: 'var(--radius-sm)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
        >
          Register &amp; check in
        </button>
      ) : (
        <>
          <div style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-muted)', color: 'var(--grey-400)', font: '700 15px/1 var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: 16, borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            Register &amp; check in
          </div>
          <div style={{ font: '400 11.5px/1.4 var(--font-body)', color: 'var(--fg3)', textAlign: 'center' }}>
            Plate, vehicle type and at least one job are required.
          </div>
        </>
      )}
    </div>
  );
}

const chipLabelStyle = { display: 'block', font: '600 10px/1 var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--fg3)', marginBottom: 7 };

function modeButtonStyle(active: boolean) {
  return {
    flex: 1, font: '700 11px/1 var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    padding: 8, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
    background: active ? 'var(--brand)' : 'var(--bg)', color: active ? '#fff' : 'var(--fg2)',
    border: '1px solid ' + (active ? 'var(--brand)' : 'var(--border)'),
  };
}
