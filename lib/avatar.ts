import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

const AVATAR_SIZE = 512;

/**
 * Pick a square photo, resize to 512x512 JPEG, upload to avatars/<userId>/avatar.jpg,
 * then write the public URL into profiles.avatar_url. Surfaces errors via Alert.
 * Returns the new URL or null on cancel/failure.
 */
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Photo access needed',
        'To set an avatar, please grant photo library access in Settings.'
      );
      return null;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      exif: false,
    });
    if (picked.canceled || !picked.assets?.[0]) return null;

    const manipulated = await ImageManipulator.manipulateAsync(
      picked.assets[0].uri,
      [{ resize: { width: AVATAR_SIZE, height: AVATAR_SIZE } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    if (!manipulated.base64) {
      Alert.alert('Upload failed', 'Could not process the image.');
      return null;
    }

    const path = `${userId}/avatar.jpg`;
    const bytes = decodeBase64(manipulated.base64);

    const { error: upErr } = await supabase.storage.from('avatars').upload(
      path,
      bytes.buffer as ArrayBuffer,
      {
        contentType: 'image/jpeg',
        upsert: true,
      }
    );
    if (upErr) {
      Alert.alert('Upload failed', upErr.message);
      return null;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    // cache-bust so the new image shows immediately
    const url = `${data.publicUrl}?v=${Date.now()}`;

    const { error: updErr } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', userId);
    if (updErr) {
      Alert.alert('Saved photo, but could not update profile', updErr.message);
      return null;
    }
    return url;
  } catch (err: any) {
    Alert.alert('Avatar error', err?.message || 'Unexpected error.');
    return null;
  }
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
