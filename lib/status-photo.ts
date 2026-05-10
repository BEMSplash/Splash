import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

/** Pick → upload to status-photos bucket → return public URL or null. */
export async function pickAndUploadStatusPhoto(userId: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.7,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  if (!asset.base64) return null;

  const ext = (asset.uri.match(/\.(\w+)(?:\?|$)/)?.[1] || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;
  const bytes = decodeBase64(asset.base64);

  const { error: upErr } = await supabase.storage
    .from('status-photos')
    .upload(path, bytes.buffer as ArrayBuffer, {
      contentType: asset.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: false,
    });
  if (upErr) {
    console.warn('photo upload failed:', upErr.message);
    return null;
  }

  const { data: publicUrl } = supabase.storage.from('status-photos').getPublicUrl(path);
  return publicUrl.publicUrl;
}

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
