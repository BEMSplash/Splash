import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  Image,
} from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { CheckIcon, CloseIcon } from '@/components/icons';
import { postStatus } from '@/lib/statuses';
import { getCurrentLocation, ensureLocationPermission } from '@/lib/permissions';
import { pickAndUploadStatusPhoto } from '@/lib/status-photo';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing, type } from '@/theme/tokens';

const RADII = [1, 5, 10, 25, 50] as const;
type Radius = (typeof RADII)[number];
type LocStatus = 'idle' | 'fetching' | 'ok' | 'denied' | 'unavailable';

export default function NewSplash() {
  const router = useRouter();
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [radius, setRadius] = useState<Radius>(1);
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<LocStatus>('idle');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setUsername(data?.username ?? null));
  }, [user]);

  // Try to get location upfront so the user knows whether it's working
  useEffect(() => {
    if (!includeLocation) return;
    let cancelled = false;
    (async () => {
      setLocStatus('fetching');
      const granted = await ensureLocationPermission();
      if (cancelled) return;
      if (!granted) {
        setLocStatus('denied');
        setCoords(null);
        return;
      }
      const c = await getCurrentLocation();
      if (cancelled) return;
      if (c) {
        setCoords(c);
        setLocStatus('ok');
      } else {
        setCoords(null);
        setLocStatus('unavailable');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [includeLocation]);

  const onPickPhoto = async () => {
    if (!user || uploadingPhoto) return;
    setUploadingPhoto(true);
    const url = await pickAndUploadStatusPhoto(user.id);
    setUploadingPhoto(false);
    if (url) setPhotoUrl(url);
    else Alert.alert('Photo not added', 'Permission denied or upload failed.');
  };

  const onPost = async () => {
    if ((!body.trim() && !photoUrl) || posting) return;
    Keyboard.dismiss();
    setPosting(true);
    try {
      const useLoc = includeLocation && coords;
      await postStatus({
        body: body.trim(),
        lat: useLoc ? coords.lat : null,
        lng: useLoc ? coords.lng : null,
        radius_km: radius,
        photo_url: photoUrl,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Could not post', err?.message || 'Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const openRadiusMenu = () => {
    Keyboard.dismiss();
    if (!includeLocation) setIncludeLocation(true);
    setShowRadiusMenu(true);
  };

  const locText = !includeLocation
    ? '◯ Location off'
    : locStatus === 'fetching'
    ? '📍 Locating…'
    : locStatus === 'ok'
    ? `📍 Within ${radius} km ▾`
    : locStatus === 'denied'
    ? '⚠️ Permission denied'
    : locStatus === 'unavailable'
    ? '⚠️ GPS unavailable'
    : `📍 Within ${radius} km ▾`;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>New splash</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.body}>
          <View style={styles.who}>
            <View style={styles.avatar}>
              <Text style={styles.initial}>{(username || '?').slice(0, 1).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.name}>{username || 'You'}</Text>
              <Text style={styles.muted}>Public</Text>
            </View>
          </View>

          <TextInput
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textDim}
            value={body}
            onChangeText={setBody}
            multiline
            autoFocus
            maxLength={500}
            style={styles.input}
          />

          {photoUrl && (
            <View style={styles.photoWrap}>
              <Image source={{ uri: photoUrl }} style={styles.photo} />
              <Pressable onPress={() => setPhotoUrl(null)} style={styles.photoRemove}>
                <CloseIcon size={16} color={colors.text} />
              </Pressable>
            </View>
          )}

          <View style={styles.attachRow}>
            <Pressable onPress={onPickPhoto} hitSlop={8} disabled={uploadingPhoto}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <PhotoIcon />
              )}
            </Pressable>
            <Text style={styles.charCount}>{body.length}/500</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={openRadiusMenu} hitSlop={8} style={styles.radiusBtn}>
            <Text style={styles.radiusLabel}>{locText}</Text>
          </Pressable>
          {includeLocation && (
            <Pressable
              onPress={() => setIncludeLocation(false)}
              hitSlop={8}
              style={{ marginRight: 'auto' }}
            >
              <Text style={styles.muted}> · turn off</Text>
            </Pressable>
          )}
          {!includeLocation && (
            <Pressable
              onPress={() => setIncludeLocation(true)}
              hitSlop={8}
              style={{ marginRight: 'auto' }}
            >
              <Text style={styles.muted}> · turn on</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onPost}
            disabled={(!body.trim() && !photoUrl) || posting}
            style={[
              styles.postBtn,
              ((!body.trim() && !photoUrl) || posting) && { opacity: 0.5 },
            ]}
          >
            {posting ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.postLabel}>Post</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showRadiusMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRadiusMenu(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setShowRadiusMenu(false)}>
          <Pressable style={styles.menu} onPress={() => {}}>
            <Text style={styles.menuTitle}>Share within a radius</Text>
            {RADII.map((r) => (
              <Pressable
                key={r}
                style={styles.menuItem}
                onPress={() => {
                  setRadius(r);
                  setShowRadiusMenu(false);
                }}
              >
                <Text style={styles.menuLabel}>
                  {r === 50 ? '50 km (city-wide)' : `${r} km`}
                </Text>
                {radius === r && <CheckIcon size={18} color={colors.text} />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function PhotoIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke={colors.text} strokeWidth={1.6} />
      <Path d="m3 17 5-5 5 5 3-3 5 5" stroke={colors.text} strokeWidth={1.6} strokeLinejoin="round" />
      <Rect x={14} y={8} width={3} height={3} rx={1.5} fill={colors.text} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancel: { ...type.body, color: colors.textMuted },
  title: { ...type.bodyBold, color: colors.text },
  body: { padding: spacing.lg, gap: spacing.md, flex: 1 },
  who: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { ...type.bodyBold, color: colors.text },
  name: { ...type.bodyBold, color: colors.text },
  muted: { ...type.small, color: colors.textMuted },
  input: {
    ...type.body,
    color: colors.text,
    fontSize: 20,
    lineHeight: 28,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  photoWrap: { position: 'relative', alignSelf: 'flex-start' },
  photo: { width: 180, height: 180, borderRadius: radii.md, backgroundColor: colors.surface },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  charCount: { ...type.small, color: colors.textDim },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  radiusBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  radiusLabel: { ...type.caption, color: colors.text },
  postBtn: {
    backgroundColor: colors.bgInverse,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 90,
    alignItems: 'center',
    marginLeft: 'auto',
  },
  postLabel: { ...type.bodyBold, color: colors.textInverse },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  menuTitle: { ...type.bodyBold, color: colors.text, marginBottom: spacing.sm },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.bg,
  },
  menuLabel: { ...type.body, color: colors.text },
});
