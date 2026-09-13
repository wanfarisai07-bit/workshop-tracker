import { useState } from 'react';
import { SCREEN_TITLES } from '../domain/constants';
import { jobSummary } from '../domain/derive';
import { dateTime } from '../domain/format';
import { useAppState } from '../state/AppStateContext';
import { useWorkshopData } from '../state/WorkshopDataContext';

export function Header() {
  const { screen, openVehicle } = useAppState();
  const { vehicles } = useWorkshopData();
  const [showDelivered, setShowDelivered] = useState(false);

  const active = vehicles.filter((v) => v.stage !== 'booked' && v.stage !== 'closed');
  const deliveredVehicles = vehicles.filter((v) => v.stage === 'closed').sort((a, b) => b.at - a.at);

  return (
    <>
      <div style={{
        flex: 'none', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '16px 26px', display: 'flex', alignItems: 'center', gap: 14,
      }}
      >
        <span style={{ font: '700 21px/1.1 var(--font-display)', letterSpacing: '0.01em', textTransform: 'uppercase', color: 'var(--fg1)' }}>
          {SCREEN_TITLES[screen] ?? ''}
        </span>
        <span style={{
          marginLeft: 'auto', font: '600 11px/1 var(--font-mono)', letterSpacing: '0.08em',
          color: 'var(--brand)', background: 'var(--blue-50)', padding: '6px 10px', borderRadius: 'var(--radius-xs)',
        }}
        >
          {active.length} IN WORKSHOP
        </span>
        <button
          type="button"
          className="wt-hover-border-strong"
          onClick={() => setShowDelivered(true)}
          style={{
            background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg2)',
            font: '600 11px/1 var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '8px 11px', borderRadius: 'var(--radius-pill)', cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none',
          }}
        >
          Delivered · {deliveredVehicles.length}
        </button>
      </div>

      {showDelivered && (
        <div
          onClick={() => setShowDelivered(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(20,26,31,0.45)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
              width: '100%', maxWidth: 640, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border)', flex: 'none' }}>
              <span style={{ font: '700 15px/1 var(--font-display)', letterSpacing: '0.01em', textTransform: 'uppercase', color: 'var(--fg1)' }}>
                Delivered / closed
              </span>
              <span style={{ font: '600 11px/1 var(--font-mono)', color: 'var(--fg3)' }}>{deliveredVehicles.length} total</span>
              <button
                type="button"
                onClick={() => setShowDelivered(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--fg3)', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {deliveredVehicles.length === 0 ? (
                <div style={{ font: '400 12.5px/1.4 var(--font-body)', color: 'var(--grey-400)', padding: 20 }}>
                  Nothing delivered yet.
                </div>
              ) : (
                deliveredVehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className="wt-hover-subtle"
                    onClick={() => { openVehicle(v.id); setShowDelivered(false); }}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 4, width: '100%', textAlign: 'left',
                      background: 'none', border: 'none', borderTop: '1px solid var(--border)', padding: '12px 20px', cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ font: '700 16px/1 var(--font-display)', color: 'var(--fg1)' }}>{v.plate}</span>
                      <span style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--fg3)' }}>{v.sheet}</span>
                      <span style={{ marginLeft: 'auto', font: '500 11px/1 var(--font-mono)', color: 'var(--fg3)' }}>Closed {dateTime(v.at)}</span>
                    </span>
                    <span style={{ font: '400 12px/1.3 var(--font-body)', color: 'var(--fg2)' }}>{v.customer}  ·  {v.type}</span>
                    <span style={{ font: '400 11.5px/1.3 var(--font-body)', color: 'var(--grey-400)' }}>{jobSummary(v)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
