# Supabase Setup

## Required environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database setup
Apply:
- [003_connected_notes.sql](/c:/Users/Admin/Desktop/obsidian/supabase/migrations/003_connected_notes.sql)

This creates the expected:
- `notes`
- `links`

## Deployment on Netlify
After you push the web app online:
1. Open your Netlify site dashboard.
2. Go to `Site configuration -> Environment variables`.
3. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy the site.

## Storage behavior
- The app saves notes locally in the browser first.
- When Supabase is configured, the app also syncs a copy to the database.
- If Supabase is unavailable, the app continues working locally.

## iPhone and Android install
- Android: browser install prompt or browser menu install
- iPhone/iPad: Share -> Add to Home Screen

## Notes
- This app does not need the database hardcoded before deployment.
- Netlify only needs the environment variables after the app is online.
