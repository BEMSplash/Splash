-- Bug fixes after first iPhone test pass:
-- (1) allow photo-only posts (body can be empty/null when photo_url is set)
-- (2) ignore duplicate reactions instead of erroring (UI handles state via unique key)

-- (1) Relax body constraint: body can be empty string when there is a photo,
--     but at least one of body / photo_url must be non-empty.

alter table public.statuses drop constraint if exists statuses_body_check;
alter table public.statuses alter column body drop not null;
alter table public.statuses
  add constraint statuses_has_content
  check (
    (body is not null and length(body) > 0)
    or (photo_url is not null and length(photo_url) > 0)
  );
alter table public.statuses
  add constraint statuses_body_max
  check (body is null or length(body) <= 500);
