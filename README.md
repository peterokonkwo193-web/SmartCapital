# SmartCapital

A premium market intelligence and live trading platform. SmartCapital pairs real-time market data across stocks, crypto, ETFs, commodities, and indices with live trading execution, portfolio analytics, trader-strategy browsing, and editorial investing education — all wrapped in an original "premium market intelligence" visual identity (deep emerald, champagne gold, Manrope + IBM Plex Mono).


## Stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · shadcn-style components on Radix primitives · Supabase (Auth/Postgres/Realtime) · React Router · Zod · Recharts · Sonner · Lucide

## Getting started

```bash
npm install
npm run dev
```

The app runs fully in **local demo mode** out of the box — no Supabase project required. Auth, watchlist, paper trading, support tickets, and activity are all backed by a local persistence layer (`src/lib/demo-store.ts`) scoped to your browser.

Every demo signup starts as a regular user — there is no special admin email. To explore the `/admin` panel in demo mode, sign up normally, then go to **Profile → Security → Demo Mode: Admin Access** and click "Grant Admin Access (local only)". This is a visible, self-service, local-only simulation with no effect once Supabase is connected — real admin roles there are granted server-side via the `user_roles` table (see below), never a client-side toggle.

## Connecting real Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) — it creates every table, index, and Row Level Security policy the app expects.
3. Copy `.env.example` to `.env.local` and fill in your project URL and anon key:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart the dev server. The app automatically switches from demo mode to Supabase-backed auth/data — no code changes required.

Access control is enforced by Postgres Row Level Security, not the frontend — see the policies at the bottom of `supabase/schema.sql`.

## Project structure

```
src/
├── components/   # ui/ primitives, layout/, dashboard/, markets/, trading/, common/
├── pages/        # route-level components
├── layouts/      # app shell, protected/admin route guards
├── hooks/        # auth, watchlist, paper trading, support tickets, admin data
├── lib/          # supabase client, demo-store, validation schemas, nav config
├── services/     # (reserved for future server-side integrations)
├── types/        # shared TypeScript types
├── utils/        # formatting helpers
└── data/         # demo market/trader/education/portfolio data generators
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run lint` — lint with oxlint
