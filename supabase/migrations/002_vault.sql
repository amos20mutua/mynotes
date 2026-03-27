create table if not exists public.vault_notes (
  id text primary key,
  title text not null,
  content text not null default '',
  folder text not null default 'Vault',
  tags jsonb not null default '[]'::jsonb,
  is_pinned boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  graph_x double precision,
  graph_y double precision,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vault_links (
  source_note_id text not null references public.vault_notes (id) on delete cascade,
  target_note_id text not null references public.vault_notes (id) on delete cascade,
  link_label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (source_note_id, target_note_id, link_label)
);

create index if not exists idx_vault_notes_updated_at on public.vault_notes(updated_at desc);
create index if not exists idx_vault_notes_title on public.vault_notes(lower(title));
create index if not exists idx_vault_links_source on public.vault_links(source_note_id);
create index if not exists idx_vault_links_target on public.vault_links(target_note_id);

alter table public.vault_notes enable row level security;
alter table public.vault_links enable row level security;

drop policy if exists "vault notes readable" on public.vault_notes;
create policy "vault notes readable" on public.vault_notes
for select using (true);

drop policy if exists "vault notes writable" on public.vault_notes;
create policy "vault notes writable" on public.vault_notes
for all using (true)
with check (true);

drop policy if exists "vault links readable" on public.vault_links;
create policy "vault links readable" on public.vault_links
for select using (true);

drop policy if exists "vault links writable" on public.vault_links;
create policy "vault links writable" on public.vault_links
for all using (true)
with check (true);

drop trigger if exists vault_notes_set_updated_at on public.vault_notes;
create trigger vault_notes_set_updated_at
before update on public.vault_notes
for each row
execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'vault_notes'
  ) then
    alter publication supabase_realtime add table public.vault_notes;
  end if;
end $$;
