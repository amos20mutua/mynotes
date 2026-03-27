# Nairobi Pulse Market Implementation Plan

## Product direction
- Build a premium Nairobi-first marketplace that feels alive, local, trustworthy, and fast.
- Prioritize buyer confidence, seller usability, and operator clarity over generic ecommerce patterns.
- Ship a complete demo-capable MVP that gracefully upgrades to live Supabase behavior when environment keys are added.

## Experience pillars
- Discovery-first UX with strong search, comparison-friendly cards, filters, and trust signals.
- Human commerce flows through seller profiles, realtime-ready chat, and visible delivery coordination.
- Cinematic dark mode, polished light mode, and motion used to reinforce hierarchy instead of adding noise.

## Build plan
1. Establish a strong app shell with reusable shadcn-style primitives, responsive navigation, theming, and brand system.
2. Ship the landing page, discovery route, product detail route, seller directory, and clear trust indicators.
3. Add seller workspace, buyer-seller messaging, delivery request flow, auth entry, and operator dashboard.
4. Define a Supabase-native schema with RLS, indexes, seed data, and realtime-ready tables.
5. Support local development through demo fallbacks, route gating, seeded content, setup docs, and README guidance.
