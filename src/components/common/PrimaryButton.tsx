import type { CSSProperties, ReactNode } from 'react';

/** The amber "call to action" button (Sign in, Advance stage, Register & check in, Save vehicle, ...), with its disabled look-alike. */
export function PrimaryButton({
  children, onClick, disabled, size = 'md',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const font = { sm: '700 13px/1', md: '700 13.5px/1', lg: '700 14px/1' }[size];
  const padding = { sm: 12, md: 13, lg: 14 }[size];
  const style: CSSProperties = {
    width: '100%', border: 'none', color: '#fff',
    font: font + ' var(--font-display)',
    letterSpacing: '0.05em', textTransform: 'uppercase',
    padding, borderRadius: 'var(--radius-sm)',
  };
  if (disabled) {
    return (
      <div style={{ ...style, boxSizing: 'border-box', background: 'var(--bg-muted)', color: 'var(--grey-400)', textAlign: 'center' }}>
        {children}
      </div>
    );
  }
  return (
    <button
      type="button"
      className="wt-hover-accent"
      onClick={onClick}
      style={{ ...style, background: 'var(--accent)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
    >
      {children}
    </button>
  );
}
