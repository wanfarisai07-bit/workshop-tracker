import type { CSSProperties, InputHTMLAttributes } from 'react';

const baseStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '10px 12px', font: '400 13.5px/1.3 var(--font-body)',
  color: 'var(--fg1)', background: 'var(--bg)',
};

/** A bare, unlabeled text input — the "Please state ..." free-text fields that appear under an "Other" chip. */
export function PlainInput({ style, ...props }: { style?: CSSProperties } & InputHTMLAttributes<HTMLInputElement>) {
  return <input className="wt-input" style={{ ...baseStyle, ...style }} {...props} />;
}
