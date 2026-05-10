import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';

/**
 * Contextual permission helpers. Each returns whether the permission is granted.
 * On web they're no-ops that return false (the user can still use the app).
 */

export async function ensureLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;
  const result = await Location.requestForegroundPermissionsAsync();
  return result.granted;
}

export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  const ok = await ensureLocationPermission();
  if (!ok) return null;
  try {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}

export async function ensureNotificationsPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

export async function ensureContactsPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existing = await Contacts.getPermissionsAsync();
  if (existing.granted) return true;
  const result = await Contacts.requestPermissionsAsync();
  return result.granted;
}

export async function readContacts(): Promise<Array<{ phone: string; name: string }>> {
  const ok = await ensureContactsPermission();
  if (!ok) return [];
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
  });
  const out: Array<{ phone: string; name: string }> = [];
  for (const c of data) {
    const numbers = c.phoneNumbers ?? [];
    for (const n of numbers) {
      if (!n.number) continue;
      out.push({
        phone: n.number.replace(/[^\d+]/g, ''),
        name: c.name || c.firstName || 'Unknown',
      });
    }
  }
  return out;
}
