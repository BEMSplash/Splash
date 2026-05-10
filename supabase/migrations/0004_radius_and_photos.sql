-- Add radius (post reach in km) + optional photo to statuses.
-- Also create the status-photos storage bucket for posted images.

alter table public.statuses
  add column if not exists radius_km int not null default 1
  check (radius_km in (1, 5, 10, 25, 50));

alter table public.statuses
  add column if not exists photo_url text;

-- Storage bucket for status photos (public read, owner write)
insert into storage.buckets (id, name, public)
values ('status-photos', 'status-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "status-photos public read" on storage.objects;
create policy "status-photos public read" on storage.objects
  for select using (bucket_id = 'status-photos');

drop policy if exists "status-photos own write" on storage.objects;
create policy "status-photos own write" on storage.objects
  for insert with check (
    bucket_id = 'status-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "status-photos own update" on storage.objects;
create policy "status-photos own update" on storage.objects
  for update using (
    bucket_id = 'status-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "status-photos own delete" on storage.objects;
create policy "status-photos own delete" on storage.objects
  for delete using (
    bucket_id = 'status-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
