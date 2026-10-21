-- ─────────────────────────────────────────────────────────────────────────────
-- Meant offer prices (APPLIED to the live database 2026-10-20 as meants_07)
--
-- The owner's set prices beyond the three tiers (2026-10-20): Holiday $14.99,
-- Promo $11.99, and the Note & Story add-on to a BUG at $0.99. There is no
-- $9.99. The owner created the three Stripe prices on 2026-10-20 and their
-- ids were linked live the same day (seeded below). Additive only.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.meant_offer_prices (
  offer            text primary key check (offer in ('HOLIDAY', 'PROMO', 'NOTE_AND_STORY')),
  price_cents      integer not null,
  currency         text not null default 'usd' check (currency = 'usd'),
  -- The tier an add-on attaches to. Null = sold on its own.
  add_on_to_tier   text check (add_on_to_tier in ('HUG', 'TUG', 'BUG')),
  stripe_price_id  text unique,
  constraint meant_offer_prices_set
    check ((offer = 'HOLIDAY' and price_cents = 1499 and add_on_to_tier is null)
           or (offer = 'PROMO' and price_cents = 1199 and add_on_to_tier is null)
           or (offer = 'NOTE_AND_STORY' and price_cents = 99 and add_on_to_tier = 'BUG'))
);

insert into public.meant_offer_prices (offer, price_cents, add_on_to_tier, stripe_price_id) values
  ('HOLIDAY',        1499, null,  'price_1USkbnRBP1Y9IAbLoyDeqLrg'),
  ('PROMO',          1199, null,  'price_1USkd9RBP1Y9IAbLYaD6GuYX'),
  ('NOTE_AND_STORY',   99, 'BUG', 'price_1USketRBP1Y9IAbLxwlnvBZT')
on conflict (offer) do update set stripe_price_id = excluded.stripe_price_id;

comment on table public.meant_offer_prices is
  'Set offer prices: Holiday 14.99, Promo 11.99, Note & Story BUG add-on 0.99. Mirrors OFFER_PRICE_CENTS in lib/kf/meants/meant.ts.';

alter table public.meant_offer_prices enable row level security;
