# PisoPiso

PisoPiso is a manual Philippine peso tracker built around one idea: every peso has a place. It is intentionally not a banking integration. It never asks for bank passwords, PINs, or OTPs.

## Run locally

```bash
npm install
npm run dev
```

The app starts with a persistent local development adapter when Supabase credentials are absent. Demo data is persisted in browser storage, and can be reset from Settings. The same domain model is used by the Supabase schema in `supabase/migrations/`.

## Checks

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Supabase setup

1. Create a Supabase project.
2. Apply all files in `supabase/migrations/` in filename order. The schema uses `piso_account`, `piso_wallet`, `piso_category`, `piso_transaction`, and `piso_transaction_attachment`.
3. Apply `supabase/seed.sql` for the category defaults.
4. Copy `.env.example` to `.env.local` and add the public project URL and anon key.

The migration enables row-level security for profile-owned records, creates private `receipts` and `wallet-logos` buckets, and exposes `create_wallet_transfer` for atomic paired ledger entries. Never put a service-role key in a `VITE_` variable or in browser code.

## Vercel

Import the repository as a Vite project and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Preview and Production environments. `vercel.json` rewrites client-side routes to `index.html` so wallet detail URLs work on direct access.

## Product structure

- `src/context/FinanceContext.tsx` contains the persistent local adapter and the user-facing ledger operations.
- `src/lib/ledger.ts` contains the pure balance and overdraft rules shared by tests and the adapter.
- `src/data/` contains the local seed state and category catalog.
- `src/pages/` contains the Overview, Wallets, Transactions, Reports, Settings, and local auth entry points.
- Wallets accept user-provided logos and use a local initials fallback when no logo is attached.
