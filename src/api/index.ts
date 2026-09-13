import { SupabaseWorkshopApi } from './supabaseApi';
import type { WorkshopApi } from './workshopApi';

// The app's one data source. `SupabaseWorkshopApi` talks to the Supabase
// project configured in `.env` (see .env.example and supabase/schema.sql for
// the tables it expects) — every screen, desktop and mobile alike, reads and
// writes through this same instance.
export const workshopApi: WorkshopApi = new SupabaseWorkshopApi();

export type { WorkshopApi } from './workshopApi';
