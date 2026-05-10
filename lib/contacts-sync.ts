import { supabase } from './supabase';
import { readContacts, ensureContactsPermission } from './permissions';

/**
 * Read device contacts → upsert phone numbers into public.contacts
 * for the authenticated user. Returns number of contacts saved.
 */
export async function syncContacts(): Promise<number> {
  const granted = await ensureContactsPermission();
  if (!granted) return 0;

  const items = await readContacts();
  if (items.length === 0) return 0;

  // Normalize to E.164-ish: keep + and digits only
  const rows = items
    .map((c) => ({
      phone: c.phone.startsWith('+') ? c.phone : `+${c.phone.replace(/\D/g, '')}`,
      display_name: c.name,
    }))
    .filter((c) => c.phone.length >= 8) // discard junk
    // de-dupe by phone
    .reduce<Record<string, { phone: string; display_name: string }>>((acc, c) => {
      acc[c.phone] = c;
      return acc;
    }, {});

  const list = Object.values(rows);
  if (list.length === 0) return 0;

  // Batch in chunks of 200 to avoid huge requests
  const CHUNK = 200;
  let saved = 0;
  for (let i = 0; i < list.length; i += CHUNK) {
    const chunk = list.slice(i, i + CHUNK);
    const { error } = await supabase
      .from('contacts')
      .upsert(chunk, { onConflict: 'user_id,phone', ignoreDuplicates: true });
    if (error) {
      console.warn('contacts upsert failed:', error.message);
      break;
    }
    saved += chunk.length;
  }
  return saved;
}
