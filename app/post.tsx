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
} from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckIcon } from '@/components/icons';
import { postStatus } from '@/lib/statuses';
import { getCurrentLocation } from '@/lib/permissions';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing, type } from '@/theme/tokens';

const RADII = [1, 5, 10, 25, 50] as const;
type Radius = (typeof RADII)[number];

export default function NewSplash() {
  const router = useRouter();
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [radius, setRadius] = useState<Radius>(1);
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setUsername(data?.username ?? null));
  }, [user]);

  const onPost = async () => {
    if (!body.trim() || posting) return;
    Keyboard.dismiss();
    setPosting(true);
    try {
      const loc = includeLocation ? await getCurrentLocation() : null;
      await postStatus({
        body: body.trim(),
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
        radius_km: radius,
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

          <Text style={styles.charCount}>{body.length}/500</Text>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={openRadiusMenu} hitSlop={8} style={styles.radiusBtn}>
            <Text style={styles.radiusLabel}>
              {includeLocation ? `Within ${radius} km ▾` : '◯ Location off'}
            </Text>
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
          <Pressable
            onPress={onPost}
            disabled={!body.trim() || posting}
            style={[
              styles.postBtn,
              (!body.trim() || posting) && { opacity: 0.5 },
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
    flex: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: { ...type.small, color: colors.textDim, alignSelf: 'flex-end' },
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
