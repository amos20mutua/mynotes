# Obsidian Vault

Obsidian Vault is a local-first connected-notes web app with a spherical graph, installable PWA support, and optional Supabase sync.

## What the app does
- Opens into a graph-first personal vault
- Stores notes locally in the browser for offline-first use
- Syncs a copy to Supabase when environment variables are present
- Installs on Android through the browser install prompt
- Supports iPhone "Add to Home Screen"

## Local setup
1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open:

```text
http://127.0.0.1:3000
```

## Local-first storage
- Notes are saved locally in IndexedDB with localStorage fallback.
- If Supabase is configured, the app also writes a synced copy to your database.
- If Supabase is unavailable, the app still works locally.

## Supabase environment variables
The app only needs these public variables on the frontend:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Netlify deployment
1. Push this repo to GitHub.
2. Import the repo into Netlify.
3. In Netlify, open:
   `Site configuration -> Environment variables`
4. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
5. Trigger a new deploy.

After that, the deployed app will keep local device storage and also sync a copy to Supabase.

## Recommended Netlify values
- `NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>`
- `NEXT_PUBLIC_SITE_URL=https://<your-netlify-site>.netlify.app`

## Supabase setup
Apply the vault migration before connecting the live site:
- [003_connected_notes.sql](/c:/Users/Admin/Desktop/obsidian/supabase/migrations/003_connected_notes.sql)

More setup notes:
- [supabase-setup.md](/c:/Users/Admin/Desktop/obsidian/docs/supabase-setup.md)

## Tech stack
- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- Supabase
- PWA manifest + service worker

## Notes
- The app is intentionally local-first.
- Netlify is only responsible for hosting the web app and exposing environment variables.
- Supabase remains the database layer.
