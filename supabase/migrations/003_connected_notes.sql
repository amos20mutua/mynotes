create table if not exists public.notes (
  id text primary key,
  title text not null,
  content text not null default '',
  color_group text not null default 'Vault',
  x double precision,
  y double precision,
  z double precision,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.links (
  id text primary key,
  source_note_id text not null references public.notes (id) on delete cascade,
  target_note_id text not null references public.notes (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_notes_updated_at on public.notes(updated_at desc);
create index if not exists idx_notes_color_group on public.notes(color_group);
create index if not exists idx_links_source on public.links(source_note_id);
create index if not exists idx_links_target on public.links(target_note_id);

alter table public.notes enable row level security;
alter table public.links enable row level security;

drop policy if exists "notes readable" on public.notes;
create policy "notes readable" on public.notes
for select using (true);

drop policy if exists "notes writable" on public.notes;
create policy "notes writable" on public.notes
for all using (true)
with check (true);

drop policy if exists "links readable" on public.links;
create policy "links readable" on public.links
for select using (true);

drop policy if exists "links writable" on public.links;
create policy "links writable" on public.links
for all using (true)
with check (true);

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
before update on public.notes
for each row
execute function public.set_updated_at();
