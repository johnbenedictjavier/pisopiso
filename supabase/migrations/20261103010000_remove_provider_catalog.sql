do $$
begin
  if to_regclass('public.wallets') is not null and to_regclass('public.piso_wallet') is null then
    alter table public.wallets rename to piso_wallet;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'piso_wallet' and column_name = 'provider_id'
  ) then
    alter table public.piso_wallet drop constraint if exists wallets_provider_id_fkey;
    alter table public.piso_wallet drop constraint if exists piso_wallet_provider_id_fkey;
    alter table public.piso_wallet drop column provider_id;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'financial_providers'
  ) then
    drop table public.financial_providers;
  end if;

  if exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'provider_type') then
    drop type public.provider_type;
  end if;
end
$$;

alter table public.piso_wallet add column if not exists card_theme text not null default 'emerald';
alter table public.piso_wallet add column if not exists logo_path text;
alter table public.piso_wallet add column if not exists logo_name text;

alter table public.piso_wallet drop constraint if exists piso_wallet_card_theme_check;
alter table public.piso_wallet add constraint piso_wallet_card_theme_check check (card_theme in ('emerald', 'ocean', 'sunset', 'violet', 'midnight', 'sand'));

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
