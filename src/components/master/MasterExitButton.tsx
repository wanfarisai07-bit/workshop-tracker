import { CloseIcon } from '../../domain/icons';

export function MasterExitButton({ onExit }: { onExit: () => void }) {
  return (
    <button
      type="button"
      className="wt-hover-brand-border"
      onClick={onExit}
      style={{
        position: 'absolute', top: 16, right: 16, zIndex: 10,
        background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--fg1)',
        font: '700 11px/1 var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase',
        padding: '10px 14px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
        boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 7,
      }}
    >
      <CloseIcon />
      Exit (Esc)
    </button>
  );
}
