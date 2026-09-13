import { useWorkshopData } from '../../state/WorkshopDataContext';

/**
 * Shown instead of silently rendering an empty board when the Supabase
 * tables haven't been created yet (or the project is unreachable). Renders
 * nothing once `workshopApi` starts answering normally.
 */
export function BackendErrorBanner() {
  const { error } = useWorkshopData();
  if (!error) return null;

  const missingTable = /Could not find the table/i.test(error);

  return (
    <div
      style={{
        flex: 'none', background: 'var(--danger-bg)', borderBottom: '1px solid var(--danger)',
        color: 'var(--danger)', padding: '10px 16px', font: '500 12.5px/1.5 var(--font-body)',
      }}
    >
      <strong>Couldn&apos;t reach the workshop database.</strong>{' '}
      {missingTable
        ? <>Its tables haven&apos;t been created yet — run <code>supabase/schema.sql</code> in your Supabase project&apos;s SQL Editor, then reload this page.</>
        : <>{error}</>}
    </div>
  );
}
