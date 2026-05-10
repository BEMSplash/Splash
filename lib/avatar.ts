import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

/**
 * Lets the user pick a square photo from their library, uploads to
 * the `avatars` bucket under <userId>/avatar.<ext>, then writes the
 * public URL into profiles.avatar_url. Returns the new URL or null.
 */
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  // Permission
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  if (!asset.base64) return null;

  const ext = (asset.uri.match(/\.(\w+)(?:\?|$)/)?.[1] || 'jpg').toLowerCase();
  const path = `${userId}/avatar.${ext}`;

  // Decode base64 → bytes
  const bytes = decodeBase64(asset.base64);

  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, bytes.buffer as ArrayBuffer, {
      contentType: asset.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: true,
    });
  if (upErr) {
    console.warn('avatar upload failed:', upErr.message);
    return null;
  }

  const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path);
  // bust cache
  const url = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error: updErr } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', userId);
  if (updErr) {
    console.warn('profile avatar_url update failed:', updErr.message);
    return null;
  }
  return url;
}

// Tiny base64 decoder (no Node Buffer in RN)
function decodeBase64(input: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  let bufLen = (input.length * 3) >> 2;
  if (input.endsWith('==')) bufLen -= 2;
  else if (input.endsWith('=')) bufLen -= 1;
  const out = new Uint8Array(bufLen);
  let p = 0;
  for (let i = 0; i < input.length; i += 4) {
    const a = lookup[input.charCodeAt(i)];
    const b = lookup[input.charCodeAt(i + 1)];
    const c = lookup[input.charCodeAt(i + 2)];
    const d = lookup[input.charCodeAt(i + 3)];
    out[p++] = (a << 2) | (b >> 4);
    if (p < bufLen) out[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < bufLen) out[p++] = ((c & 3) << 6) | d;
  }
  return out;
}
