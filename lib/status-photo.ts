import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

const MAX_DIM = 1080; // long edge in px
const COMPRESS_QUALITY = 0.6;

/**
 * Pick a photo, resize/compress it, upload to status-photos bucket,
 * return the public URL or null on cancel/failure.
 */
export async function pickAndUploadStatusPhoto(userId: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1, // we re-compress after resizing
    exif: false,
  });
  if (picked.canceled || !picked.assets?.[0]) return null;
  const asset = picked.assets[0];

  // Resize to MAX_DIM on the long edge to keep payloads small (fast upload + display)
  const longEdge = Math.max(asset.width || 0, asset.height || 0);
  const resizeAction =
    longEdge > MAX_DIM
      ? asset.width >= asset.height
        ? { resize: { width: MAX_DIM } }
        : { resize: { height: MAX_DIM } }
      : null;

  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    resizeAction ? [resizeAction] : [],
    {
      compress: COMPRESS_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );
  if (!manipulated.base64) return null;

  const path = `${userId}/${Date.now()}.jpg`;
  const bytes = decodeBase64(manipulated.base64);

  const { error: upErr } = await supabase.storage
    .from('status-photos')
    .upload(path, bytes.buffer as ArrayBuffer, {
      contentType: 'image/jpeg',
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
