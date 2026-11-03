alter table public.piso_wallet
  add column if not exists logo_scale numeric(3, 2) not null default 1;

alter table public.piso_wallet
  drop constraint if exists piso_wallet_logo_scale_check;

alter table public.piso_wallet
  add constraint piso_wallet_logo_scale_check check (logo_scale between 0.5 and 1.5);
