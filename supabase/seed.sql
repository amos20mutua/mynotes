insert into public.profiles (id, role, full_name, email, phone, default_location)
values
  ('11111111-1111-1111-1111-111111111111', 'buyer', 'Amani Kariuki', 'amani@nairobi-pulse.test', '+254700111111', 'South B'),
  ('22222222-2222-2222-2222-222222222222', 'seller', 'Kevin Maina', 'kevin@westlandswave.test', '+254700222222', 'Westlands'),
  ('33333333-3333-3333-3333-333333333333', 'seller', 'Shiko Wanjiru', 'shiko@kilimaniedit.test', '+254700333333', 'Kilimani'),
  ('44444444-4444-4444-4444-444444444444', 'seller', 'Brian Otis', 'brian@cbdsupply.test', '+254700444444', 'CBD'),
  ('55555555-5555-5555-5555-555555555555', 'operator', 'Janet Wambui', 'janet@pulseops.test', '+254700555555', 'Upper Hill')
on conflict (id) do nothing;

insert into public.sellers (id, profile_id, verification_status, verified_at, rating, reviews_count, response_time_minutes)
values
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '22222222-2222-2222-2222-222222222222', 'verified', timezone('utc', now()), 4.90, 412, 4),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '33333333-3333-3333-3333-333333333333', 'verified', timezone('utc', now()), 4.80, 268, 7),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '44444444-4444-4444-4444-444444444444', 'pending', null, 4.60, 194, 12)
on conflict (id) do nothing;

insert into public.shops (id, seller_id, slug, name, logo_url, hero_image_url, description, contact_phone, location_area)
values
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'westlands-wave', 'Westlands Wave', null, null, 'Creator tech and city-ready accessories.', '+254700222222', 'Westlands'),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'kilimani-edit', 'Kilimani Edit', null, null, 'Street-style pieces with premium curation.', '+254700333333', 'Kilimani'),
  ('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'cbd-supply-house', 'CBD Supply House', null, null, 'Quick turnover essentials for city living.', '+254700444444', 'CBD')
on conflict (id) do nothing;

insert into public.products (
  id, seller_id, shop_id, slug, name, category, description, short_description, price, compare_at_price,
  stock, availability, rating, reviews_count, location_area, status, featured, popularity_score, seen_today
)
values
  (
    'ccccccc1-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'anker-soundcore-rush-mini', 'Anker Soundcore Rush Mini', 'electronics',
    'Portable speaker tuned for rooftop sessions, office desks, and matatu commutes.',
    'Compact city speaker with deep bass and 12-hour battery.', 7200, 8500, 18, 'in_stock', 4.8, 123, 'Westlands', 'published', true, 94, 51
  ),
  (
    'ccccccc2-cccc-cccc-cccc-ccccccccccc2', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'kilimani-night-runner', 'Kilimani Night Runner', 'fashion',
    'Low-profile sneaker built for long city days and quick evening plans.',
    'Reflective urban sneaker with all-day comfort.', 9800, 11200, 7, 'low_stock', 4.9, 89, 'Kilimani', 'published', true, 87, 28
  ),
  (
    'ccccccc3-cccc-cccc-cccc-ccccccccccc3', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'cbd-smart-kettle-pro', 'CBD Smart Kettle Pro', 'home',
    'A clean-lined electric kettle with temperature presets for coffee, tea, and gifting.',
    'Fast-boil kettle with precision temperature presets.', 5600, null, 24, 'in_stock', 4.6, 61, 'CBD', 'published', false, 71, 19
  ),
  (
    'ccccccc4-cccc-cccc-cccc-ccccccccccc4', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'nairobi-glow-serum', 'Nairobi Glow Serum', 'beauty',
    'Niacinamide-focused serum for brightening and calming skin under city weather.',
    'Brightening serum designed for daily city wear.', 3400, null, 12, 'in_stock', 4.7, 140, 'CBD', 'published', false, 78, 37
  )
on conflict (id) do nothing;

insert into public.product_images (product_id, image_url, alt_text, position)
values
  ('ccccccc1-cccc-cccc-cccc-ccccccccccc1', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80', 'Speaker hero', 0),
  ('ccccccc2-cccc-cccc-cccc-ccccccccccc2', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80', 'Sneaker hero', 0),
  ('ccccccc3-cccc-cccc-cccc-ccccccccccc3', 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80', 'Kettle hero', 0),
  ('ccccccc4-cccc-cccc-cccc-ccccccccccc4', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80', 'Serum hero', 0)
on conflict do nothing;

insert into public.conversations (id, product_id, buyer_profile_id, seller_id, last_message_preview, last_message_at)
values
  ('ddddddd1-dddd-dddd-dddd-ddddddddddd1', 'ccccccc1-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Can you do dropoff in South B this evening?', timezone('utc', now())),
  ('ddddddd2-dddd-dddd-dddd-ddddddddddd2', 'ccccccc2-cccc-cccc-cccc-ccccccccccc2', '11111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Size 42 is available and I can share more photos.', timezone('utc', now()))
on conflict (id) do nothing;

insert into public.messages (id, conversation_id, sender_profile_id, body, created_at)
values
  ('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', 'ddddddd1-dddd-dddd-dddd-ddddddddddd1', '11111111-1111-1111-1111-111111111111', 'Hi, is the speaker still sealed?', timezone('utc', now()) - interval '12 minutes'),
  ('eeeeeee2-eeee-eeee-eeee-eeeeeeeeeee2', 'ddddddd1-dddd-dddd-dddd-ddddddddddd1', '22222222-2222-2222-2222-222222222222', 'Yes, sealed and comes with receipt.', timezone('utc', now()) - interval '10 minutes'),
  ('eeeeeee3-eeee-eeee-eeee-eeeeeeeeeee3', 'ddddddd1-dddd-dddd-dddd-ddddddddddd1', '11111111-1111-1111-1111-111111111111', 'Can you do dropoff in South B this evening?', timezone('utc', now()) - interval '9 minutes')
on conflict (id) do nothing;

insert into public.delivery_requests (
  id, product_id, seller_id, buyer_profile_id, pickup_shop_id, customer_name, customer_phone, dropoff_area, notes, fee_estimate, eta_text, status
)
values
  (
    'fffffff1-ffff-ffff-ffff-fffffffffff1', 'ccccccc1-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '11111111-1111-1111-1111-111111111111', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Amani Kariuki', '+254700111111',
    'South B', 'Call on arrival. Office gate opposite the mini mart.', 450, 'Today, 7:00 PM', 'in_transit'
  ),
  (
    'fffffff2-ffff-ffff-ffff-fffffffffff2', 'ccccccc3-cccc-cccc-cccc-ccccccccccc3', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    '11111111-1111-1111-1111-111111111111', 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'Grace Njeri', '+254711222333',
    'Roysambu', 'Need careful handling for gift wrap.', 620, 'Tomorrow, 11:00 AM', 'confirmed'
  )
on conflict (id) do nothing;

insert into public.reviews (id, product_id, reviewer_profile_id, seller_id, rating, comment)
values
  ('99999991-9999-9999-9999-999999999991', 'ccccccc1-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 5, 'Delivery was same day and the sound quality feels way above the price.'),
  ('99999992-9999-9999-9999-999999999992', 'ccccccc2-cccc-cccc-cccc-ccccccccccc2', '11111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 5, 'Actually comfortable enough for a full day in town.')
on conflict (id) do nothing;

insert into public.favorites (profile_id, product_id)
values
  ('11111111-1111-1111-1111-111111111111', 'ccccccc2-cccc-cccc-cccc-ccccccccccc2'),
  ('11111111-1111-1111-1111-111111111111', 'ccccccc1-cccc-cccc-cccc-ccccccccccc1')
on conflict (profile_id, product_id) do nothing;

insert into public.notifications (profile_id, title, body, metadata)
values
  ('11111111-1111-1111-1111-111111111111', 'Delivery update', 'Your Soundcore Rush Mini is now in transit.', '{"delivery_request_id":"fffffff1-ffff-ffff-ffff-fffffffffff1"}'),
  ('22222222-2222-2222-2222-222222222222', 'New lead', 'A buyer opened a conversation on the Rush Mini speaker.', '{"conversation_id":"ddddddd1-dddd-dddd-dddd-ddddddddddd1"}')
on conflict do nothing;

insert into public.admin_actions (operator_profile_id, action_type, target_table, target_id, note, metadata)
values
  ('55555555-5555-5555-5555-555555555555', 'delivery_update', 'delivery_requests', 'fffffff1-ffff-ffff-ffff-fffffffffff1', 'Marked request as in transit for live demo.', '{"status":"in_transit"}')
on conflict do nothing;
