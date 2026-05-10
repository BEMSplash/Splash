import { supabase } from './supabase';

export type Status = {
  id: string;
  user_id: string;
  body: string;
  lat: number | null;
  lng: number | null;
  radius_km: number;
  photo_url: string | null;
  created_at: string;
  expires_at: string;
  // joined fields
  username?: string | null;
  avatar_url?: string | null;
  drop_count?: number;
  star_count?: number;
  reacted_drop?: boolean;
  reacted_star?: boolean;
};

type RawStatusRow = {
  id: string;
  user_id: string;
  body: string;
  lat: number | null;
  lng: number | null;
  radius_km: number;
  photo_url: string | null;
  created_at: string;
  expires_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
  reactions: Array<{ kind: 'drop' | 'star'; user_id: string }>;
};

const SELECT = `
  id, user_id, body, lat, lng, radius_km, photo_url, created_at, expires_at,
  profiles!statuses_user_id_fkey ( username, avatar_url ),
  reactions ( kind, user_id )
` as const;

function shape(row: RawStatusRow, viewerId: string | null): Status {
  const drops = row.reactions.filter((r) => r.kind === 'drop');
  const stars = row.reactions.filter((r) => r.kind === 'star');
  return {
    id: row.id,
    user_id: row.user_id,
    body: row.body,
    lat: row.lat,
    lng: row.lng,
    radius_km: row.radius_km ?? 1,
    photo_url: row.photo_url ?? null,
    created_at: row.created_at,
    expires_at: row.expires_at,
    username: row.profiles?.username ?? null,
    avatar_url: row.profiles?.avatar_url ?? null,
    drop_count: drops.length,
    star_count: stars.length,
    reacted_drop: viewerId ? drops.some((r) => r.user_id === viewerId) : false,
    reacted_star: viewerId ? stars.some((r) => r.user_id === viewerId) : false,
  };
}

/** Fetch a single status by id, including profile and reactions */
export async function fetchStatus(id: string, viewerId: string | null): Promise<Status | null> {
  const { data, error } = await supabase
    .from('statuses')
    .select(SELECT)
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return shape(data as unknown as RawStatusRow, viewerId);
}

/** Trending: most reactions (drops + stars), still active */
export async function fetchTrending(viewerId: string | null, limit = 50): Promise<Status[]> {
  const { data, error } = await supabase
    .from('statuses')
    .select(SELECT)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = (data as unknown as RawStatusRow[]) ?? [];
  return rows
    .map((r) => shape(r, viewerId))
    .sort((a, b) => (b.drop_count! + b.star_count!) - (a.drop_count! + a.star_count!));
}

/**
 * My list: statuses from people you've ⭐ starred OR people in your contacts
 * (matching by phone number) — this is the "Familiar thoughts" of the spec.
 */
export async function fetchMyList(viewerId: string, limit = 50): Promise<Status[]> {
  const [{ data: follows }, { data: contacts }] = await Promise.all([
    supabase.from('follows').select('followed_id').eq('follower_id', viewerId),
    supabase.from('contacts').select('phone').eq('user_id', viewerId),
  ]);

  const followIds = new Set((follows ?? []).map((f) => f.followed_id));

  // Resolve contact phone numbers to user ids
  const phones = (contacts ?? []).map((c) => c.phone);
  let contactUserIds: string[] = [];
  if (phones.length > 0) {
    const { data: matched } = await supabase
      .from('profiles')
      .select('id')
      .in('phone', phones);
    contactUserIds = (matched ?? []).map((m) => m.id);
  }

  const allIds = new Set([...followIds, ...contactUserIds]);
  allIds.delete(viewerId); // don't show your own splashes here
  if (allIds.size === 0) return [];

  const { data, error } = await supabase
    .from('statuses')
    .select(SELECT)
    .in('user_id', Array.from(allIds))
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data as unknown as RawStatusRow[]) ?? []).map((r) => shape(r, viewerId));
}

/** Near you: simple bounding-box filter; full geo ranking is a follow-up */
export async function fetchNearYou(
  viewerId: string | null,
  loc: { lat: number; lng: number } | null,
  limit = 50
): Promise<Status[]> {
  let q = supabase
    .from('statuses')
    .select(SELECT)
    .gt('expires_at', new Date().toISOString())
    .not('lat', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (loc) {
    // ~50km bounding box (rough). Real impl uses PostGIS distance.
    const dLat = 0.45;
    const dLng = 0.45 / Math.max(0.1, Math.cos((loc.lat * Math.PI) / 180));
    q = q
      .gte('lat', loc.lat - dLat)
      .lte('lat', loc.lat + dLat)
      .gte('lng', loc.lng - dLng)
      .lte('lng', loc.lng + dLng);
  }

  const { data, error } = await q;
  if (error) throw error;
  return ((data as unknown as RawStatusRow[]) ?? []).map((r) => shape(r, viewerId));
}

export async function postStatus(opts: {
  body: string;
  lat?: number | null;
  lng?: number | null;
  radius_km?: number;
  photo_url?: string | null;
}): Promise<Status | null> {
  const { data, error } = await supabase
    .from('statuses')
    .insert({
      body: opts.body,
      lat: opts.lat ?? null,
      lng: opts.lng ?? null,
      radius_km: opts.radius_km ?? 1,
      photo_url: opts.photo_url ?? null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  if (!data) return null;
  const { data: u } = await supabase.auth.getUser();
  return shape(data as unknown as RawStatusRow, u.user?.id ?? null);
}

export async function toggleReaction(
  statusId: string,
  kind: 'drop' | 'star',
  active: boolean
): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  if (active) {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('status_id', statusId)
      .eq('user_id', u.user.id)
      .eq('kind', kind);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('reactions')
      .insert({ status_id: statusId, kind });
    if (error) throw error;
  }
}

/** When user stars someone (in detail view), also add to follows. */
export async function follow(followedId: string): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .insert({ followed_id: followedId })
    .select();
  if (error && !error.message.includes('duplicate')) throw error;
}

export async function unfollow(followedId: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', u.user.id)
    .eq('followed_id', followedId);
  if (error) throw error;
}
