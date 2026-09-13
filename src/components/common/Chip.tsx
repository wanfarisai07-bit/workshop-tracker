import type { CSSProperties } from 'react';

/**
 * The pill-shaped selectable button used for job/type/brand/bay/customer-type
 * pickers. Two visual variants, both ported from the prototype:
 *  - "solid": selected = solid brand fill, white text (type/brand/bay/customer-type chips)
 *  - "soft":  selected = pale blue fill, brand-colored text (job chips)
 */
export function Chip({
  label, selected, disabled, onClick, mono = false, variant = 'solid',
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  /** Bay chips use mono numerals instead of body text. */
  mono?: boolean;
  variant?: 'solid' | 'soft';
}) {
  const selectedBg = variant === 'soft' ? 'var(--blue-50)' : 'var(--brand)';
  const selectedFg = variant === 'soft' ? 'var(--brand)' : '#fff';
  const style: CSSProperties = {
    font: mono ? '600 12px/1.25 var(--font-mono)' : '500 12px/1.25 var(--font-body)',
    padding: '7px 10px',
    borderRadius: 'var(--radius-pill)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
    background: selected ? selectedBg : (disabled ? 'var(--bg-muted)' : 'var(--bg)'),
    color: selected ? selectedFg : (disabled ? 'var(--grey-400)' : 'var(--fg2)'),
    border: '1px solid ' + (selected ? 'var(--brand)' : 'var(--border)'),
  };
  return (
    <button type="button" disabled={disabled} onClick={onClick} style={style}>
      {label}
    </button>
  );
}
