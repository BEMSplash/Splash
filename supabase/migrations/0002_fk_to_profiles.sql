-- Re-target FKs from auth.users to public.profiles so PostgREST can embed profile fields,
-- and default user_id columns to auth.uid() so RLS-protected inserts don't need to send user_id.

-- ===== FKs =====
alter table public.statuses
  drop constraint if exists statuses_user_id_fkey;
alter table public.statuses
  add constraint statuses_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.reactions
  drop constraint if exists reactions_user_id_fkey;
alter table public.reactions
  add constraint reactions_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.follows
  drop constraint if exists follows_follower_id_fkey;
alter table public.follows
  add constraint follows_follower_id_fkey
  foreign key (follower_id) references public.profiles(id) on delete cascade;

alter table public.follows
  drop constraint if exists follows_followed_id_fkey;
alter table public.follows
  add constraint follows_followed_id_fkey
  foreign key (followed_id) references public.profiles(id) on delete cascade;

-- ===== Defaults =====
alter table public.statuses alter column user_id set default auth.uid();
alter table public.reactions alter column user_id set default auth.uid();
alter table public.contacts alter column user_id set default auth.uid();
alter table public.follows alter column follower_id set default auth.uid();
