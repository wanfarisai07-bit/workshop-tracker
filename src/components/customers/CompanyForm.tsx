import { CUSTOMER_TYPES } from '../../domain/constants';
import type { CompanyPayload } from '../../domain/types';
import { Chip } from '../common/Chip';
import { Field } from '../common/Field';
import { PrimaryButton } from '../common/PrimaryButton';

/** Shared "customer type / name / phone / PIC / address" fields — used both for the "New customer" card and for inline company-detail editing. */
export function CompanyForm({
  title, form, onChange, onSubmit, onCancel, submitLabel,
}: {
  title: string;
  form: CompanyPayload;
  onChange: (patch: Partial<CompanyPayload>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const showPic = form.type !== 'Individual';
  const canSubmit = !!(form.name.trim() && form.type);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}>
      <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>{title}</div>
      <div>
        <span style={{ display: 'block', font: '600 10px/1 var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg3)', marginBottom: 7 }}>
          Customer type
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CUSTOMER_TYPES.map((t) => (
            <Chip key={t} label={t} selected={form.type === t} onClick={() => onChange({ type: t })} />
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Customer name" value={form.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="e.g. MPKT Fleet" />
        <Field label="Phone" value={form.phone} onChange={(e) => onChange({ phone: e.target.value })} placeholder="e.g. 09-773 5590" />
      </div>
      {showPic && (
        <Field label="PIC name" value={form.pic} onChange={(e) => onChange({ pic: e.target.value })} placeholder="e.g. Ahmad Zaki" />
      )}
      <Field label="Address" value={form.address} onChange={(e) => onChange({ address: e.target.value })} placeholder="e.g. Lot 22, Kawasan Perindustrian Kemaman" />
      {canSubmit ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><PrimaryButton size="sm" onClick={onSubmit}>{submitLabel}</PrimaryButton></div>
          <CancelButton onClick={onCancel} />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}><PrimaryButton size="sm" disabled>{submitLabel}</PrimaryButton></div>
            <CancelButton onClick={onCancel} />
          </div>
          <div style={{ font: '400 11.5px/1.4 var(--font-body)', color: 'var(--fg3)', marginTop: 2 }}>Customer type and name are required.</div>
        </>
      )}
    </div>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ flex: 'none', background: 'none', border: '1px solid var(--border)', color: 'var(--fg2)', font: '600 12px/1 var(--font-body)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
    >
      Cancel
    </button>
  );
}
