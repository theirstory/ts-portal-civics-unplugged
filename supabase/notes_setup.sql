-- Supabase setup for Notes feature
-- Run this in the Supabase SQL Editor to set up notes and folders tables.

-- 1. Create note_folders table
create table if not exists public.note_folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  parent_id uuid references public.note_folders(id) on delete cascade,
  color text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 2. Create notes table
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Untitled',
  content jsonb not null default '{}',
  content_markdown text not null default '',
  folder_id uuid references public.note_folders(id) on delete set null,
  color text,
  is_public boolean not null default false,
  public_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Indexes
create index if not exists notes_owner_idx on public.notes(owner_id);
create index if not exists notes_folder_idx on public.notes(folder_id);
create index if not exists notes_public_slug_idx on public.notes(public_slug) where public_slug is not null;
create index if not exists note_folders_owner_idx on public.note_folders(owner_id);

-- 4. Enable Row Level Security (allow all via anon key for simplicity —
--    auth is handled at the application layer via auth_token cookie)
alter table public.notes enable row level security;
alter table public.note_folders enable row level security;

create policy "Allow all notes" on public.notes
  for all
  using (true)
  with check (true);

create policy "Allow all folders" on public.note_folders
  for all
  using (true)
  with check (true);
