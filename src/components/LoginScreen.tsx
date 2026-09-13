import { useState } from 'react';
import sumaiMark from '../assets/sumai-mark.svg';
import { PrimaryButton } from './common/PrimaryButton';
import { Field } from './common/Field';

export function LoginScreen({ onLogin }: { onLogin: (staffId: string) => void }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');

  const doLogin = () => {
    if (id.trim()) onLogin(id.trim());
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
            SA Workshop Progress
          </span>
        </div>
        <div style={{ font: '600 20px/1.3 var(--font-body)', color: 'var(--fg1)', marginBottom: 4 }}>Sign in</div>
        <div style={{ font: '400 13px/1.4 var(--font-body)', color: 'var(--fg3)', marginBottom: 22 }}>
          Internal workshop staff access only.
        </div>
        <div style={{ marginBottom: 14 }}>
          <Field label="Staff ID" value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. sa.advisor01" />
        </div>
        <div style={{ marginBottom: 22 }}>
          <Field label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
        </div>
        <PrimaryButton onClick={doLogin}>Sign in</PrimaryButton>
        <div style={{ font: '400 12px/1.4 var(--font-body)', color: 'var(--fg3)', textAlign: 'center', marginTop: 14 }}>
          Demo access — any Staff ID and password works.
        </div>
      </div>
    </div>
  );
}
