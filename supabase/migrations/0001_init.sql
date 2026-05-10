-- Splash MVP — initial schema
-- Apply via Supabase Dashboard → SQL Editor → New query → paste → Run.

-- ============================================================
-- profiles: one row per registered user, mirrors auth.users.id
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (length(username) between 1 and 40),
  email text,
  phone text,
  birthday date,
  gender text check (gender in ('female','male','unspecified')),
  country text,
  city text,
  language text not null default 'en',
  notifications_pref text not null default 'both'
    check (notifications_pref in ('off','familiar','both')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (lower(username));

-- Auto-update updated_at on row changes
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS: anyone signed-in can read profiles; users can only mutate their own
alter table public.profiles enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles
  for select using (true);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

-- ============================================================
-- statuses: short text "thoughts", expire 12h after creation
-- ============================================================
create table if not exists public.statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) between 1 and 500),
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours')
);

create index if not exists statuses_user_idx on public.statuses (user_id);
create index if not exists statuses_expires_idx on public.statuses (expires_at);

alter table public.statuses enable row level security;

drop policy if exists "statuses read active" on public.statuses;
create policy "statuses read active" on public.statuses
  for select using (expires_at > now());

drop policy if exists "statuses insert own" on public.statuses;
create policy "statuses insert own" on public.statuses
  for insert with check (auth.uid() = user_id);

drop policy if exists "statuses delete own" on public.statuses;
create policy "statuses delete own" on public.statuses
  for delete using (auth.uid() = user_id);

-- ============================================================
-- reactions: drop (like) or star (follow) on a status
-- ============================================================
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  status_id uuid not null references public.statuses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('drop','star')),
  created_at timestamptz not null default now(),
  unique (status_id, user_id, kind)
);

create index if not exists reactions_status_idx on public.reactions (status_id);

alter table public.reactions enable row level security;

drop policy if exists "reactions read" on public.reactions;
create policy "reactions read" on public.reactions
  for select using (true);

drop policy if exists "reactions insert own" on public.reactions;
create policy "reactions insert own" on public.reactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "reactions delete own" on public.reactions;
create policy "reactions delete own" on public.reactions
  for delete using (auth.uid() = user_id);

-- ============================================================
-- contacts: synced phone contacts, used to build "Familiar thoughts"
-- ============================================================
create table if not exists public.contacts (
  user_id uuid not null references auth.users(id) on delete cascade,
  phone text not null,
  display_name text,
  created_at timestamptz not null default now(),
  primary key (user_id, phone)
);

alter table public.contacts enable row level security;

drop policy if exists "contacts read own" on public.contacts;
create policy "contacts read own" on public.contacts
  for select using (auth.uid() = user_id);

drop policy if exists "contacts insert own" on public.contacts;
create policy "contacts insert own" on public.contacts
  for insert with check (auth.uid() = user_id);

drop policy if exists "contacts delete own" on public.contacts;
create policy "contacts delete own" on public.contacts
  for delete using (auth.uid() = user_id);

-- ============================================================
-- follows: explicit "star" follow relationship between users
-- ============================================================
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

alter table public.follows enable row level security;

drop policy if exists "follows read" on public.follows;
create policy "follows read" on public.follows
  for select using (true);

drop policy if exists "follows insert own" on public.follows;
create policy "follows insert own" on public.follows
  for insert with check (auth.uid() = follower_id);

drop policy if exists "follows delete own" on public.follows;
create policy "follows delete own" on public.follows
  for delete using (auth.uid() = follower_id);
