import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import sumaiMark from '../assets/sumai-mark.svg';
import { PrimaryButton } from './common/PrimaryButton';
import { Field } from './common/Field';

export function LoginScreen({ onLogin }: { onLogin: (staffId: string, password: string) => Promise<string | null> }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const doLogin = async () => {
    if (submitting || !id.trim() || !pw) return;
    setSubmitting(true);
    setError('');
    const message = await onLogin(id.trim(), pw);
    setSubmitting(false);
    if (message) setError(message);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') void doLogin();
  };

  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--blue-900)', fontFamily: 'var(--font-body)',
    }}
    >
      <div style={{
        width: 380, background: 'var(--surface)', borderRadius: 'var(--radius-md)',
        padding: '36px 32px', boxShadow: 'var(--shadow-lg)',
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 26 }}>
          <img src={sumaiMark} alt="SUMAI" style={{ height: 26, width: 'auto', display: 'block' }} />
          <span style={{ font: '700 15px/1.2 var(--font-display)', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--fg1)' }}>
            Workshop Tracker
          </span>
        </div>
        <div style={{ font: '600 20px/1.3 var(--font-body)', color: 'var(--fg1)', marginBottom: 4 }}>Sign in</div>
        <div style={{ font: '400 13px/1.4 var(--font-body)', color: 'var(--fg3)', marginBottom: 22 }}>
          Internal workshop staff access only.
        </div>
        <div style={{ marginBottom: 14 }}>
          <Field label="Staff ID" value={id} onChange={(e) => setId(e.target.value)} onKeyDown={onKeyDown} placeholder="e.g. sasbworkshop" />
        </div>
        <div style={{ marginBottom: error ? 10 : 22 }}>
          <Field label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={onKeyDown} placeholder="••••••••" />
        </div>
        {error && (
          <div style={{
            font: '600 12px/1.4 var(--font-body)', color: 'var(--danger)', background: 'var(--danger-bg)',
            borderRadius: 'var(--radius-sm)', padding: '9px 11px', marginBottom: 14,
          }}
          >
            {error}
          </div>
        )}
        <PrimaryButton onClick={() => void doLogin()} disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </PrimaryButton>
        <div style={{ font: '400 12px/1.4 var(--font-body)', color: 'var(--fg3)', textAlign: 'center', marginTop: 14 }}>
          Use the shared workshop Staff ID and password.
        </div>
      </div>
    </div>
  );
}
