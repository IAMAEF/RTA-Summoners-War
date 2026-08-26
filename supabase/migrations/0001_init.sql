-- ============================================================
-- SW RTA Trainer — Phase 1 schema
-- Run this once in Supabase Dashboard → SQL Editor → New query
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- SHARED: monster knowledge base ----------

create table if not exists monsters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  element text not null check (element in ('Fire','Water','Wind','Light','Dark')),
  stars int not null default 5 check (stars between 1 and 6),
  meta boolean not null default false,
  image_url text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists monster_tags (
  monster_id uuid not null references monsters(id) on delete cascade,
  tag text not null check (tag in ('Strip','Damage','Support','CC')),
  primary key (monster_id, tag)
);

create table if not exists monster_counters (
  monster_id uuid not null references monsters(id) on delete cascade,
  counters_monster_id uuid not null references monsters(id) on delete cascade,
  relation text not null check (relation in ('weak_against','strong_against')),
  primary key (monster_id, counters_monster_id, relation)
);

create index if not exists idx_monsters_element on monsters(element);
create index if not exists idx_monster_tags_tag on monster_tags(tag);

-- ---------- PERSONAL: per-user data ----------

create table if not exists match_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  played_at timestamptz not null default now(),
  mode text not null check (mode in ('solo','bot')),
  team_a jsonb not null default '[]',
  team_b jsonb not null default '[]',
  played_as text not null default 'A' check (played_as in ('A','B')),
  result text not null default 'unset' check (result in ('win','loss','draw','unset')),
  opponent_name text,
  tags text[] not null default '{}',
  notes text
);

create index if not exists idx_match_history_user on match_history(user_id, played_at desc);

create table if not exists owned_monsters (
  user_id uuid not null references auth.users(id) on delete cascade,
  monster_id uuid not null references monsters(id) on delete cascade,
  awaken_level text,
  added_at timestamptz not null default now(),
  primary key (user_id, monster_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table monsters enable row level security;
alter table monster_tags enable row level security;
alter table monster_counters enable row level security;
alter table match_history enable row level security;
alter table owned_monsters enable row level security;

-- monsters: everyone (incl. anonymous) can read; only logged-in users can write
create policy "monsters_public_read" on monsters
  for select using (true);
create policy "monsters_auth_insert" on monsters
  for insert to authenticated with check (true);
create policy "monsters_auth_update" on monsters
  for update to authenticated using (true);
create policy "monsters_auth_delete" on monsters
  for delete to authenticated using (true);

-- monster_tags: same pattern
create policy "monster_tags_public_read" on monster_tags
  for select using (true);
create policy "monster_tags_auth_write" on monster_tags
  for all to authenticated using (true) with check (true);

-- monster_counters: same pattern
create policy "monster_counters_public_read" on monster_counters
  for select using (true);
create policy "monster_counters_auth_write" on monster_counters
  for all to authenticated using (true) with check (true);

-- match_history: strictly per-user
create policy "match_history_owner_select" on match_history
  for select to authenticated using (auth.uid() = user_id);
create policy "match_history_owner_insert" on match_history
  for insert to authenticated with check (auth.uid() = user_id);
create policy "match_history_owner_update" on match_history
  for update to authenticated using (auth.uid() = user_id);
create policy "match_history_owner_delete" on match_history
  for delete to authenticated using (auth.uid() = user_id);

-- owned_monsters: strictly per-user
create policy "owned_monsters_owner_select" on owned_monsters
  for select to authenticated using (auth.uid() = user_id);
create policy "owned_monsters_owner_insert" on owned_monsters
  for insert to authenticated with check (auth.uid() = user_id);
create policy "owned_monsters_owner_update" on owned_monsters
  for update to authenticated using (auth.uid() = user_id);
create policy "owned_monsters_owner_delete" on owned_monsters
  for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- Storage bucket for monster images
-- ============================================================

insert into storage.buckets (id, name, public)
values ('monster-images', 'monster-images', true)
on conflict (id) do nothing;

create policy "monster_images_public_read" on storage.objects
  for select using (bucket_id = 'monster-images');
create policy "monster_images_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'monster-images');
create policy "monster_images_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'monster-images');
create policy "monster_images_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'monster-images');
