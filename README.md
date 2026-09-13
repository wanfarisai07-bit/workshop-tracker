# Workshop Tracker

A React + TypeScript + Vite implementation of the **Workshop Tracker Desktop**
design (SUMAI Engineering's internal vehicle-tracking tool), built from the
Claude Design handoff bundle at the project root.

## Running it

```bash
npm install
npm run dev
```

Sign in with the shared workshop Staff ID / password (real Supabase Auth — see `supabase/` for setup).

## Installable (PWA)

The app is a Progressive Web App (`vite-plugin-pwa`, see `vite.config.ts`):
staff can install it to a phone's home screen — Android Chrome prompts
automatically ("Install app"); on iOS, use Safari's Share sheet → "Add to
Home Screen". Once installed, the app shell (not live workshop data, which
still needs a connection to Supabase) is cached and opens even with no
signal. Placeholder icons live in `public/icons/`; swap `icon-source.svg`
for a real logo and run `node scripts/generate-icons.mjs` to regenerate every
size from it.

## Backend: Supabase

The app's data (vehicles, companies, registered vehicles) lives in Supabase —
desktop and mobile both read/write the same project through the same
`workshopApi` singleton (see Architecture below).

**One-time setup:**
1. Copy `.env.example` to `.env` and fill in your Supabase project's URL and
   anon/public key (Supabase dashboard → Project Settings → API). `.env` is
   gitignored — never commit real credentials.
2. Open your project's **SQL Editor** in the Supabase dashboard, paste the
   entire contents of [`supabase/schema.sql`](supabase/schema.sql), and run
   it. This creates the `vehicles`, `companies`, and `registered_vehicles`
   tables, enables Row Level Security with policies that allow the app's
   anon key full access (see the security note in that file), turns on
   Realtime for all three tables, and seeds the same fleet/customer data the
   mock API used to ship with.
3. `npm run dev`. If the app can't reach the tables yet, it shows a banner
   at the top of the screen telling you so instead of failing silently —
   that's your sign step 2 still needs to run (or hasn't finished yet).

Because Realtime is turned on, two open tabs/devices — e.g. a desktop
browser and a phone — see each other's changes within about a second, with
no manual refresh.

## What's here

- **Status board** — a 5-stage kanban (booked → arrived → in bay → ready →
  closed) with a weekly booking calendar underneath.
- **Job sheet** (per vehicle) — a status timeline, a clickable service/repair
  job checklist, and a "move to next stage" action that auto-assigns a free
  bay when a vehicle enters "in bay".
- **Bays** — bay utilisation + a grid of the 10 bays and the service bay.
- **Overview** — headline stats, a stage-distribution chart, and the 3
  longest-parked vehicles.
- **Master Display** — a big, read-only "TV board" view for the workshop
  floor (Esc or the Exit button returns to the Board).
- **Check in** — look up a pre-registered vehicle by plate or customer name,
  then fill in odometer/promised time/jobs/bay and check it onto the board.
  (By design, only pre-registered vehicles can be checked in — an unmatched
  search links out to Customers to register one first.)
- **Customers** — the company/vehicle CRM: search, add/edit/delete
  companies, and add/edit/delete each company's registered vehicles.

## Mobile

The app also implements the companion mobile design (`Workshop Tracker.dc.html`,
an iPhone-frame mockup) as a responsive layout of this **same** app — same
`workshopApi` data, same domain logic — not a separate project. It switches
in automatically below a 700px-wide viewport (`useIsMobile`), matching the
source mockup's own 402px design width.

The mobile layout intentionally differs from desktop, because the source
design differs:
- **No login gate** — the mobile mockup has no auth screen at all, so the
  mobile layout bypasses `authed` entirely (this is a deliberate parity
  choice, not an oversight).
- Only 4 tabs (Check in / Board / Bays / Overview) in a bottom tab bar —
  **no Customers CRM, no Master Display** on mobile.
- **Check-in** has a "Pre-registered vehicle" search (by plate or customer
  name, same data as desktop) that auto-fills plate/brand/chassis/type/
  customer from a match — but unlike desktop, mobile's form stays fully
  editable either way, so a technician can also fill in a walk-in vehicle
  by hand when there's no match.
- Board stages are collapsible (tap a stage header to hide/show its cards).

One behavioral fix applied consistently on both layouts: picking "Other :
please state" for a job or vehicle type and typing free text now actually
carries that text through to the saved record. In the original prototype
this text was captured but silently discarded on submit — clearly a gap
rather than an intended real-app behavior, so both Register screens resolve
it properly here.

## Architecture

- `src/domain/` — plain types, constants (stages, job/vehicle catalogs),
  formatting helpers, and pure derivations (`isOverdue`, `jobSummary`,
  `computeBays`, `vehicleTimeline`, ...) shared by every screen.
- `src/api/` — **`WorkshopApi`** is the one interface every screen talks to.
  `SupabaseWorkshopApi` (`supabaseApi.ts`) is today's implementation,
  backed by the Supabase project configured in `.env` — see `supabase/schema.sql`
  for the tables it expects. `MockWorkshopApi` (`mockApi.ts`) is the earlier
  in-memory implementation (in-memory seed data, ported 1:1 from the
  prototype); it's kept around for offline dev and still works if you swap
  it back in in `src/api/index.ts` — that one line is the only thing any
  future backend swap needs to touch. `WorkshopApi.subscribeToChanges` is an
  optional hook a backend can implement for live cross-tab/device sync
  (Supabase does, via Realtime; Mock doesn't need to).
- `src/state/` — two React contexts:
  - `WorkshopDataContext` — the shared cache of vehicles/companies/registered
    vehicles, backed by `workshopApi`.
  - `AppStateContext` — client-only UI state (logged-in staff ID, current
    screen, selected vehicle, the overdue-only filter). Never touches the API.
  Screen-local state (form drafts, search text, edit-mode flags) lives in the
  screen components themselves.
- `src/components/` — one folder per screen, plus `common/` for the shared
  `Chip`, `Field`, `PlainInput`, and `PrimaryButton` building blocks.

## Notes on the port from the `.dc.html` prototype

- The prototype's `browser-window.jsx` (`ChromeWindow`) is a decorative
  fake-browser frame used only to preview the design at a fixed 1360×860 —
  it's not part of the app, so the real app fills the actual viewport
  instead of floating inside a mock window.
- Visuals (colors, spacing, type, radii, shadows) come straight from
  `_ds/.../colors_and_type.css`, imported as `src/styles/tokens.css` and
  referenced via the same `var(--token)` names throughout.
