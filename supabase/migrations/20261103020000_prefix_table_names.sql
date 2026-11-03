do $$
begin
  if to_regclass('public.profiles') is not null and to_regclass('public.piso_account') is null then
    alter table public.profiles rename to piso_account;
  end if;
  if to_regclass('public.wallets') is not null and to_regclass('public.piso_wallet') is null then
    alter table public.wallets rename to piso_wallet;
  end if;
  if to_regclass('public.categories') is not null and to_regclass('public.piso_category') is null then
    alter table public.categories rename to piso_category;
  end if;
  if to_regclass('public.transactions') is not null and to_regclass('public.piso_transaction') is null then
    alter table public.transactions rename to piso_transaction;
  end if;
  if to_regclass('public.transaction_attachments') is not null and to_regclass('public.piso_transaction_attachment') is null then
    alter table public.transaction_attachments rename to piso_transaction_attachment;
  end if;
end
$$;

alter table public.piso_wallet drop constraint if exists wallets_provider_id_fkey;
alter table public.piso_wallet drop constraint if exists piso_wallet_provider_id_fkey;
alter table public.piso_wallet drop column if exists provider_id;
alter table public.piso_wallet add column if not exists card_theme text not null default 'emerald';
alter table public.piso_wallet add column if not exists logo_path text;
alter table public.piso_wallet add column if not exists logo_name text;
alter table public.piso_wallet drop constraint if exists wallets_card_theme_check;
alter table public.piso_wallet drop constraint if exists piso_wallet_card_theme_check;
alter table public.piso_wallet add constraint piso_wallet_card_theme_check check (card_theme in ('emerald', 'ocean', 'sunset', 'violet', 'midnight', 'sand'));

alter index if exists public.wallets_user_id_idx rename to piso_wallet_user_id_idx;
alter index if exists public.transactions_user_occurred_idx rename to piso_transaction_user_occurred_idx;
alter index if exists public.transactions_wallet_idx rename to piso_transaction_wallet_idx;
alter index if exists public.transactions_transfer_group_idx rename to piso_transaction_transfer_group_idx;
alter index if exists public.attachments_transaction_idx rename to piso_transaction_attachment_transaction_idx;

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

drop policy if exists profiles_select_own on public.piso_account;
drop policy if exists profiles_update_own on public.piso_account;
drop policy if exists piso_account_select_own on public.piso_account;
create policy piso_account_select_own on public.piso_account for select using (id = auth.uid());
drop policy if exists piso_account_update_own on public.piso_account;
create policy piso_account_update_own on public.piso_account for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists wallets_own_all on public.piso_wallet;
drop policy if exists piso_wallet_own_all on public.piso_wallet;
create policy piso_wallet_own_all on public.piso_wallet for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists categories_read_available on public.piso_category;
drop policy if exists categories_own_write on public.piso_category;
drop policy if exists piso_category_read_available on public.piso_category;
create policy piso_category_read_available on public.piso_category for select using (user_id is null or user_id = auth.uid());
drop policy if exists piso_category_own_write on public.piso_category;
create policy piso_category_own_write on public.piso_category for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists transactions_own_all on public.piso_transaction;
drop policy if exists piso_transaction_own_all on public.piso_transaction;
create policy piso_transaction_own_all on public.piso_transaction for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists attachments_own_all on public.piso_transaction_attachment;
drop policy if exists piso_transaction_attachment_own_all on public.piso_transaction_attachment;
create policy piso_transaction_attachment_own_all on public.piso_transaction_attachment for all using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and exists (select 1 from public.piso_transaction t where t.id = transaction_id and t.user_id = auth.uid())
);
