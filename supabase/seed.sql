insert into public.piso_category (name, type, color, icon)
values
  ('Food & dining', 'expense', '#df865c', 'utensils'),
  ('Transport', 'expense', '#4789a7', 'car'),
  ('Shopping', 'expense', '#a56b9f', 'shopping-bag'),
  ('Bills & utilities', 'expense', '#d6a04f', 'receipt'),
  ('Health', 'expense', '#cf6d78', 'heart-pulse'),
  ('Home', 'expense', '#6f8f77', 'house'),
  ('Education', 'expense', '#687cb0', 'book-open'),
  ('Entertainment', 'expense', '#8b78ba', 'sparkles'),
  ('Personal care', 'expense', '#bd7c9f', 'heart'),
  ('Subscriptions', 'expense', '#718698', 'repeat'),
  ('Other expense', 'expense', '#7f8a83', 'more-horizontal'),
  ('Salary', 'income', '#4f8a59', 'briefcase-business'),
  ('Freelance', 'income', '#3c8d8a', 'laptop'),
  ('Business', 'income', '#4b77a2', 'store'),
  ('Investment income', 'income', '#b98b3f', 'trending-up'),
  ('Gift', 'income', '#b46d97', 'gift'),
  ('Other income', 'income', '#6f9d79', 'plus-circle')
on conflict do nothing;
