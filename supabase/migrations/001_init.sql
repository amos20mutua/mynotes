create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('buyer', 'seller', 'operator');
  end if;
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'product_availability') then
    create type product_availability as enum ('in_stock', 'low_stock', 'preorder');
  end if;
  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type delivery_status as enum ('pending', 'confirmed', 'picked', 'in_transit', 'delivered', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'admin_action_type') then
    create type admin_action_type as enum ('approve_listing', 'reject_listing', 'verify_seller', 'delivery_update', 'report_review');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  role app_role not null default 'buyer',
  full_name text not null,
  email text unique,
  phone text,
  avatar_url text,
  default_location text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  verification_status verification_status not null default 'pending',
  verified_at timestamptz,
  rating numeric(3,2) not null default 0,
  reviews_count integer not null default 0,
  response_time_minutes integer not null default 15,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null unique references public.sellers (id) on delete cascade,
  slug text not null unique,
  name text not null,
  logo_url text,
  hero_image_url text,
  description text not null,
  contact_phone text,
  location_area text not null,
  city text not null default 'Nairobi',
  delivery_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  shop_id uuid not null references public.shops (id) on delete cascade,
  slug text not null unique,
  name text not null,
  category text not null,
  description text not null,
  short_description text,
  price numeric(12,2) not null,
  compare_at_price numeric(12,2),
  stock integer not null default 0,
  availability product_availability not null default 'in_stock',
  rating numeric(3,2) not null default 0,
  reviews_count integer not null default 0,
  location_area text not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived', 'flagged')),
  featured boolean not null default false,
  popularity_score integer not null default 0,
  seen_today integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url text not null,
  alt_text text,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  buyer_profile_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.sellers (id) on delete cascade,
  last_message_preview text,
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_profile_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.delivery_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  seller_id uuid not null references public.sellers (id) on delete cascade,
  buyer_profile_id uuid not null references public.profiles (id) on delete cascade,
  pickup_shop_id uuid references public.shops (id) on delete set null,
  customer_name text not null,
  customer_phone text,
  dropoff_area text not null,
  notes text,
  fee_estimate numeric(12,2) not null default 0,
  eta_text text,
  status delivery_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  reviewer_profile_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.sellers (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (profile_id, product_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  operator_profile_id uuid not null references public.profiles (id) on delete cascade,
  action_type admin_action_type not null,
  target_table text not null,
  target_id uuid,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_sellers_profile_id on public.sellers(profile_id);
create index if not exists idx_shops_slug on public.shops(slug);
create index if not exists idx_products_seller_id on public.products(seller_id);
create index if not exists idx_products_shop_id on public.products(shop_id);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_location_area on public.products(location_area);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_popularity on public.products(popularity_score desc);
create index if not exists idx_product_images_product_id on public.product_images(product_id, position);
create index if not exists idx_conversations_buyer on public.conversations(buyer_profile_id, last_message_at desc);
create index if not exists idx_conversations_seller on public.conversations(seller_id, last_message_at desc);
create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at asc);
create index if not exists idx_delivery_requests_status on public.delivery_requests(status, created_at desc);
create index if not exists idx_delivery_requests_buyer on public.delivery_requests(buyer_profile_id, created_at desc);
create index if not exists idx_reviews_product on public.reviews(product_id, created_at desc);
create index if not exists idx_notifications_profile on public.notifications(profile_id, created_at desc);

create or replace function public.current_profile_id()
returns uuid
language sql
stable
as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.current_role()
returns app_role
language sql
stable
as $$
  select role from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

alter table public.profiles enable row level security;
alter table public.sellers enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.delivery_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_actions enable row level security;

create policy "profiles self or operator select" on public.profiles
for select using (id = public.current_profile_id() or public.current_role() = 'operator');

create policy "profiles self update" on public.profiles
for update using (id = public.current_profile_id()) with check (id = public.current_profile_id());

create policy "public sellers readable" on public.sellers
for select using (true);

create policy "seller owns seller row" on public.sellers
for all using (profile_id = public.current_profile_id() or public.current_role() = 'operator')
with check (profile_id = public.current_profile_id() or public.current_role() = 'operator');

create policy "public shops readable" on public.shops
for select using (true);

create policy "seller manages own shop" on public.shops
for all using (
  seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
  or public.current_role() = 'operator'
)
with check (
  seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
  or public.current_role() = 'operator'
);

create policy "published products readable" on public.products
for select using (
  status = 'published'
  or seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
  or public.current_role() = 'operator'
);

create policy "seller manages products" on public.products
for all using (
  seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
  or public.current_role() = 'operator'
)
with check (
  seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
  or public.current_role() = 'operator'
);

create policy "product images readable by visible products" on public.product_images
for select using (
  exists (
    select 1 from public.products
    where public.products.id = product_images.product_id
      and (
        public.products.status = 'published'
        or public.products.seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
        or public.current_role() = 'operator'
      )
  )
);

create policy "seller manages product images" on public.product_images
for all using (
  exists (
    select 1 from public.products
    where public.products.id = product_images.product_id
      and (
        public.products.seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
        or public.current_role() = 'operator'
      )
  )
)
with check (
  exists (
    select 1 from public.products
    where public.products.id = product_images.product_id
      and (
        public.products.seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
        or public.current_role() = 'operator'
      )
  )
);

create policy "conversation participants or operator" on public.conversations
for select using (
  buyer_profile_id = public.current_profile_id()
  or seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
  or public.current_role() = 'operator'
);

create policy "buyer can create conversations" on public.conversations
for insert with check (
  buyer_profile_id = public.current_profile_id()
  or public.current_role() = 'operator'
);

create policy "participants update conversations" on public.conversations
for update using (
  buyer_profile_id = public.current_profile_id()
  or seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
  or public.current_role() = 'operator'
);

create policy "participants read messages" on public.messages
for select using (
  exists (
    select 1 from public.conversations
    where public.conversations.id = messages.conversation_id
      and (
        public.conversations.buyer_profile_id = public.current_profile_id()
        or public.conversations.seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
        or public.current_role() = 'operator'
      )
  )
);

create policy "participants send messages" on public.messages
for insert with check (
  sender_profile_id = public.current_profile_id()
  and exists (
    select 1 from public.conversations
    where public.conversations.id = messages.conversation_id
      and (
        public.conversations.buyer_profile_id = public.current_profile_id()
        or public.conversations.seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
      )
  )
);

create policy "delivery visible to related parties" on public.delivery_requests
for select using (
  buyer_profile_id = public.current_profile_id()
  or seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
  or public.current_role() = 'operator'
);

create policy "buyer creates delivery requests" on public.delivery_requests
for insert with check (
  buyer_profile_id = public.current_profile_id()
  or public.current_role() = 'operator'
);

create policy "seller or operator updates delivery requests" on public.delivery_requests
for update using (
  seller_id in (select id from public.sellers where profile_id = public.current_profile_id())
  or public.current_role() = 'operator'
);

create policy "reviews readable" on public.reviews
for select using (true);

create policy "buyers create reviews" on public.reviews
for insert with check (
  reviewer_profile_id = public.current_profile_id()
  and public.current_role() in ('buyer', 'operator')
);

create policy "favorites self access" on public.favorites
for all using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

create policy "notifications self or operator" on public.notifications
for select using (profile_id = public.current_profile_id() or public.current_role() = 'operator');

create policy "notifications self update" on public.notifications
for update using (profile_id = public.current_profile_id() or public.current_role() = 'operator');

create policy "operator manages notifications" on public.notifications
for insert with check (public.current_role() = 'operator');

create policy "operator only admin actions" on public.admin_actions
for all using (public.current_role() = 'operator')
with check (public.current_role() = 'operator');

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists sellers_set_updated_at on public.sellers;
create trigger sellers_set_updated_at before update on public.sellers for each row execute function public.set_updated_at();
drop trigger if exists shops_set_updated_at on public.shops;
create trigger shops_set_updated_at before update on public.shops for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at before update on public.conversations for each row execute function public.set_updated_at();
drop trigger if exists delivery_requests_set_updated_at on public.delivery_requests;
create trigger delivery_requests_set_updated_at before update on public.delivery_requests for each row execute function public.set_updated_at();

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations') then
    alter publication supabase_realtime add table public.conversations;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'delivery_requests') then
    alter publication supabase_realtime add table public.delivery_requests;
  end if;
end $$;
