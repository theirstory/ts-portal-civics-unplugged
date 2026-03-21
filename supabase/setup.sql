-- Supabase setup for TheirStory Portal auth
-- Run this in the Supabase SQL Editor to set up the profiles table and avatars storage.

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  username text not null,
  avatar_url text,
  auth_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),

  constraint profiles_username_unique unique (username)
);

-- Indexes for fast lookups
create index if not exists profiles_username_lower_idx on public.profiles (lower(username));
create index if not exists profiles_auth_token_idx on public.profiles (auth_token);

-- 2. Enable Row Level Security (allow all via anon key for simplicity —
--    auth is handled at the application layer via auth_token cookie)
alter table public.profiles enable row level security;

create policy "Allow all operations for anon" on public.profiles
  for all
  using (true)
  with check (true);

-- 3. Create avatars storage bucket (public so avatar URLs work directly)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow public read access to avatars
create policy "Public read access for avatars" on storage.objects
  for select
  using (bucket_id = 'avatars');

-- Allow authenticated uploads (via anon key)
create policy "Allow avatar uploads" on storage.objects
  for insert
  with check (bucket_id = 'avatars');

create policy "Allow avatar updates" on storage.objects
  for update
  using (bucket_id = 'avatars');

create policy "Allow avatar deletes" on storage.objects
  for delete
  using (bucket_id = 'avatars');
