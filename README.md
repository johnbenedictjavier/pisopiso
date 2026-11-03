# PisoPiso

PisoPiso is a manual Philippine peso tracker built around one idea: every peso has a place. It is intentionally not a banking integration. It never asks for bank passwords, bank PINs, or OTPs.

## Run locally

```bash
npm install
npm run dev
```

After signing in with Supabase, wallets and movements start empty and are persisted in browser storage scoped to that account. They can be cleared from Settings. The app does not ship with demo wallets or demo movements.

The production build is installable as a standalone web app on supported phones and browsers.

When the Supabase variables are configured, `/login` creates and signs into accounts with an email and six-digit PIN. Turn off **Confirm email** under Supabase Authentication > Providers > Email so a new account can enter the app immediately without email verification.

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
4. Copy `.env.example` to `.env.local` and add the public project URL and publishable key. Legacy projects may use the JWT anon key variable instead.
5. Under Authentication > Providers > Email, disable **Confirm email** for the PIN-based signup flow.

The migration enables row-level security for profile-owned records, creates private `receipts` and `wallet-logos` buckets, and exposes `create_wallet_transfer` for atomic paired ledger entries. Never put a service-role key in a `VITE_` variable or in browser code.

## Vercel

Import the repository as a Vite project and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for Preview and Production environments. `vercel.json` rewrites client-side routes to `index.html` so wallet detail URLs work on direct access.

## Product structure

- `src/context/FinanceContext.tsx` contains the account-scoped local adapter and the user-facing ledger operations.
- `src/lib/ledger.ts` contains the pure balance and overdraft rules shared by tests and the adapter.
- `src/data/` contains the empty account defaults and category catalog.
- `src/pages/` contains the Overview, Wallets, Transactions, Dashboard, Settings, and email/PIN auth entry points.
- Wallets accept user-provided logos with a saved display-size adjustment and use a local initials fallback when no logo is attached.
