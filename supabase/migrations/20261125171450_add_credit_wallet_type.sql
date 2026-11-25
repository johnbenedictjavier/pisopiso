alter type public.wallet_type add value if not exists 'credit';

alter table public.piso_wallet
  drop constraint if exists piso_wallet_card_theme_check;

alter table public.piso_wallet
  add constraint piso_wallet_card_theme_check check (
    card_theme in ('emerald', 'ocean', 'sunset', 'violet', 'midnight', 'sand', 'rose', 'lavender', 'sky', 'citrus', 'berry', 'terracotta')
  );

insert into public.piso_category (name, type, color, icon)
select 'Interest', 'income', '#b98b3f', 'trending-up'
where not exists (
  select 1 from public.piso_category where user_id is null and name = 'Interest' and type = 'income'
);

insert into public.piso_category (name, type, color, icon)
select 'Scholar', 'income', '#687cb0', 'book'
where not exists (
  select 1 from public.piso_category where user_id is null and name = 'Scholar' and type = 'income'
);
