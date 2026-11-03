create extension if not exists pgcrypto;

do $$ begin
  create type public.wallet_type as enum ('bank', 'digital_bank', 'e_wallet', 'cash', 'savings', 'emergency_fund', 'investment', 'custom');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.transaction_type as enum ('expense', 'income', 'transfer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.transfer_direction as enum ('out', 'in');
exception when duplicate_object then null;
end $$;

create table if not exists public.piso_account (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'PisoPiso user',
  currency text not null default 'PHP' check (currency = 'PHP'),
  theme text not null default 'light' check (theme in ('light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.piso_wallet (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.piso_account(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  type public.wallet_type not null,
  opening_balance numeric(14, 2) not null default 0,
  allow_overdraft boolean not null default false,
  color text not null default '#5f8068' check (color ~ '^#[0-9a-fA-F]{6}$'),
  card_theme text not null default 'emerald' check (card_theme in ('emerald', 'ocean', 'sunset', 'violet', 'midnight', 'sand')),
  logo_path text,
  logo_name text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.piso_category (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.piso_account(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  type text not null check (type in ('expense', 'income', 'both')),
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.piso_transaction (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.piso_account(id) on delete cascade,
  wallet_id uuid not null references public.piso_wallet(id) on delete restrict,
  type public.transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  category_id uuid references public.piso_category(id) on delete set null,
  merchant text not null default '' check (char_length(merchant) <= 80),
  note text not null default '' check (char_length(note) <= 240),
  occurred_at date not null default current_date,
  transfer_group_id uuid,
  transfer_direction public.transfer_direction,
  related_wallet_id uuid references public.piso_wallet(id) on delete restrict,
  receipt_name text,
  receipt_url text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint transfer_fields_are_consistent check (
    (type <> 'transfer' and transfer_group_id is null and transfer_direction is null)
    or (type = 'transfer' and transfer_group_id is not null and transfer_direction is not null and related_wallet_id is not null)
  )
);

create table if not exists public.piso_transaction_attachment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.piso_account(id) on delete cascade,
  transaction_id uuid not null references public.piso_transaction(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size integer not null check (byte_size > 0 and byte_size <= 8388608),
  created_at timestamptz not null default now()
);

create index if not exists piso_wallet_user_id_idx on public.piso_wallet(user_id);
create index if not exists piso_transaction_user_occurred_idx on public.piso_transaction(user_id, occurred_at desc);
create index if not exists piso_transaction_wallet_idx on public.piso_transaction(wallet_id, occurred_at desc);
create index if not exists piso_transaction_transfer_group_idx on public.piso_transaction(transfer_group_id);
create index if not exists piso_transaction_attachment_transaction_idx on public.piso_transaction_attachment(transaction_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.piso_account (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.wallet_balance(target_wallet_id uuid)
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select w.opening_balance + coalesce(sum(
        case
          when t.type = 'income' then t.amount
          when t.type = 'expense' then -t.amount
          when t.transfer_direction = 'in' then t.amount
          else -t.amount
        end
      ), 0)
       from public.piso_wallet w
       left join public.piso_transaction t
        on t.wallet_id = w.id and t.deleted_at is null
      where w.id = target_wallet_id and w.user_id = auth.uid()
      group by w.opening_balance
    ),
    0
  );
$$;

create or replace function public.create_wallet_transfer(
  from_wallet_id uuid,
  to_wallet_id uuid,
  transfer_amount numeric,
  transfer_date date default current_date,
  transfer_note text default ''
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  source_wallet public.piso_wallet%rowtype;
  destination_wallet public.piso_wallet%rowtype;
  group_id uuid := gen_random_uuid();
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;
  if from_wallet_id = to_wallet_id then
    raise exception 'Source and destination wallets must be different';
  end if;
  if transfer_amount is null or transfer_amount <= 0 then
    raise exception 'Transfer amount must be greater than zero';
  end if;

  select * into source_wallet
  from public.piso_wallet
  where id = from_wallet_id and user_id = auth.uid() and not is_archived
  for update;

  select * into destination_wallet
  from public.piso_wallet
  where id = to_wallet_id and user_id = auth.uid() and not is_archived
  for update;

  if source_wallet.id is null or destination_wallet.id is null then
    raise exception 'Both wallets must belong to the current profile and be active';
  end if;
  if not source_wallet.allow_overdraft and public.wallet_balance(from_wallet_id) < transfer_amount then
    raise exception 'The source wallet does not have enough available balance';
  end if;

  insert into public.piso_transaction (
    user_id, wallet_id, type, amount, merchant, note, occurred_at,
    transfer_group_id, transfer_direction, related_wallet_id
  ) values
    (auth.uid(), from_wallet_id, 'transfer', transfer_amount, 'Wallet transfer', transfer_note, transfer_date, group_id, 'out', to_wallet_id),
    (auth.uid(), to_wallet_id, 'transfer', transfer_amount, 'Wallet transfer', transfer_note, transfer_date, group_id, 'in', from_wallet_id);

  return group_id;
end;
$$;

alter table public.piso_account enable row level security;
alter table public.piso_wallet enable row level security;
alter table public.piso_category enable row level security;
alter table public.piso_transaction enable row level security;
alter table public.piso_transaction_attachment enable row level security;

drop policy if exists piso_account_select_own on public.piso_account;
create policy piso_account_select_own on public.piso_account for select using (id = auth.uid());
drop policy if exists piso_account_update_own on public.piso_account;
create policy piso_account_update_own on public.piso_account for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists piso_wallet_own_all on public.piso_wallet;
create policy piso_wallet_own_all on public.piso_wallet for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists piso_category_read_available on public.piso_category;
create policy piso_category_read_available on public.piso_category for select using (user_id is null or user_id = auth.uid());
drop policy if exists piso_category_own_write on public.piso_category;
create policy piso_category_own_write on public.piso_category for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists piso_transaction_own_all on public.piso_transaction;
create policy piso_transaction_own_all on public.piso_transaction for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists piso_transaction_attachment_own_all on public.piso_transaction_attachment;
create policy piso_transaction_attachment_own_all on public.piso_transaction_attachment for all using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and exists (select 1 from public.piso_transaction t where t.id = transaction_id and t.user_id = auth.uid())
);

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set public = false;

drop policy if exists receipt_objects_select_own on storage.objects;
create policy receipt_objects_select_own on storage.objects for select to authenticated using (
  bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists receipt_objects_insert_own on storage.objects;
create policy receipt_objects_insert_own on storage.objects for insert to authenticated with check (
  bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists receipt_objects_delete_own on storage.objects;
create policy receipt_objects_delete_own on storage.objects for delete to authenticated using (
  bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
);

insert into storage.buckets (id, name, public)
values ('wallet-logos', 'wallet-logos', false)
on conflict (id) do update set public = false;

drop policy if exists wallet_logo_objects_select_own on storage.objects;
create policy wallet_logo_objects_select_own on storage.objects for select to authenticated using (
  bucket_id = 'wallet-logos' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists wallet_logo_objects_insert_own on storage.objects;
create policy wallet_logo_objects_insert_own on storage.objects for insert to authenticated with check (
  bucket_id = 'wallet-logos' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists wallet_logo_objects_update_own on storage.objects;
create policy wallet_logo_objects_update_own on storage.objects for update to authenticated using (
  bucket_id = 'wallet-logos' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'wallet-logos' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists wallet_logo_objects_delete_own on storage.objects;
create policy wallet_logo_objects_delete_own on storage.objects for delete to authenticated using (
  bucket_id = 'wallet-logos' and (storage.foldername(name))[1] = auth.uid()::text
);
