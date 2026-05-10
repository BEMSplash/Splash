-- Storage bucket for user avatars
-- Public read (avatars are visible to all signed-in users in the feed),
-- write restricted to the owner via path prefix.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

-- Anyone can read avatar files
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

-- A user can upload/update/delete only files under their own user-id prefix
-- (e.g. "avatars/<auth.uid>/photo.jpg")
drop policy if exists "avatars own write" on storage.objects;
create policy "avatars own write" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars own update" on storage.objects;
create policy "avatars own update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars own delete" on storage.objects;
create policy "avatars own delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
