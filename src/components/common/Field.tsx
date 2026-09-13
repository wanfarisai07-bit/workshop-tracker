import type { CSSProperties, InputHTMLAttributes } from 'react';

const labelStyle: CSSProperties = {
  display: 'block', font: '600 10px/1 var(--font-mono)', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--fg3)', marginBottom: 6,
};

const baseInputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--fg1)', background: 'var(--bg)',
};

/** A labeled text input — the "Staff ID / Password / Customer / Promised / ..." pattern used throughout the app. */
export function Field({
  label, inputStyle, ...inputProps
}: {
  label: string;
  inputStyle?: CSSProperties;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: 'block' }}>
      <span style={labelStyle}>{label}</span>
      <input className="wt-input" style={{ ...baseInputStyle, font: '400 14px/1.3 var(--font-body)', ...inputStyle }} {...inputProps} />
    </label>
  );
}
