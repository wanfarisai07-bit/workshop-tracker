import { VEHICLE_BRANDS, VEHICLE_TYPES } from '../../domain/constants';
import { Chip } from '../common/Chip';
import { Field } from '../common/Field';
import { PlainInput } from '../common/PlainInput';
import { PrimaryButton } from '../common/PrimaryButton';

export interface VehFormState {
  plate: string; chassis: string; brand: string; brandOther: string; type: string; typeOther: string;
}

/** "Add vehicle to this company" / "Edit vehicle" — registration plate, chassis, brand and type pickers. */
export function VehicleForm({
  title, form, onChange, onSubmit, submitLabel, isEditing, onCancelEdit,
}: {
  title: string;
  form: VehFormState;
  onChange: (patch: Partial<VehFormState>) => void;
  onSubmit: () => void;
  submitLabel: string;
  isEditing: boolean;
  onCancelEdit: () => void;
}) {
  const canSubmit = !!(form.plate.trim() && form.type);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ font: '600 10.5px/1 var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>{title}</div>
        {isEditing && (
          <button type="button" onClick={onCancelEdit} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--fg3)', font: '600 11px/1 var(--font-body)', cursor: 'pointer', textDecoration: 'underline' }}>
            Cancel
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Registration plate" value={form.plate} onChange={(e) => onChange({ plate: e.target.value })} placeholder="e.g. WTB 4412" inputStyle={{ font: '700 16px/1.1 var(--font-display)' }} />
        <Field label="Chassis number" value={form.chassis} onChange={(e) => onChange({ chassis: e.target.value })} placeholder="e.g. MHFRA1234567890" inputStyle={{ font: '500 13.5px/1.3 var(--font-mono)' }} />
      </div>
      <div>
        <span style={{ display: 'block', font: '600 10px/1 var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg3)', marginBottom: 7 }}>Vehicle brand</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {VEHICLE_BRANDS.map((b) => (
            <Chip key={b} label={b === 'Other' ? 'Other : please state' : b} selected={form.brand === b} onClick={() => onChange({ brand: b })} />
          ))}
        </div>
        {form.brand === 'Other' && (
          <PlainInput value={form.brandOther} onChange={(e) => onChange({ brandOther: e.target.value })} placeholder="Please state brand" style={{ marginTop: 8 }} />
        )}
      </div>
      <div>
        <span style={{ display: 'block', font: '600 10px/1 var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg3)', marginBottom: 7 }}>Vehicle type</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {VEHICLE_TYPES.map((t) => (
            <Chip key={t} label={t === 'Other' ? 'Other : please state' : t} selected={form.type === t} onClick={() => onChange({ type: t })} />
          ))}
        </div>
        {form.type === 'Other' && (
          <PlainInput value={form.typeOther} onChange={(e) => onChange({ typeOther: e.target.value })} placeholder="Please state vehicle type" style={{ marginTop: 8 }} />
        )}
      </div>
      {canSubmit ? (
        <PrimaryButton size="lg" onClick={onSubmit}>{submitLabel}</PrimaryButton>
      ) : (
        <>
          <PrimaryButton size="lg" disabled>{submitLabel}</PrimaryButton>
          <div style={{ font: '400 11.5px/1.4 var(--font-body)', color: 'var(--fg3)', textAlign: 'center', marginTop: -4 }}>
            Registration plate and vehicle type are required.
          </div>
        </>
      )}
    </div>
  );
}
