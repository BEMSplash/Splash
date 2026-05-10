import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SplashLogo } from '@/components/SplashLogo';
import { TextField } from '@/components/TextField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { pickAndUploadAvatar } from '@/lib/avatar';
import { colors, radii, spacing, type } from '@/theme/tokens';

type Profile = {
  username: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  language: string;
  notifications_pref: 'off' | 'familiar' | 'both';
  avatar_url: string | null;
};

export default function ProfileTab() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [edited, setEdited] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('username,email,phone,country,city,language,notifications_pref,avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setProfile((data as Profile) ?? null);
        setLoading(false);
      });
  }, [user]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setEdited((e) => ({ ...e, [key]: value }));
  };

  const save = async () => {
    if (!user || !profile) return;
    if (Object.keys(edited).length === 0) {
      Alert.alert('Nothing to save');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .update(edited)
      .eq('id', user.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }
    setProfile(data as Profile);
    setEdited({});
    Alert.alert('Saved');
  };

  const onAvatarPress = async () => {
    if (!user || uploadingAvatar) return;
    setUploadingAvatar(true);
    const url = await pickAndUploadAvatar(user.id);
    setUploadingAvatar(false);
    if (url) {
      setProfile((p) => (p ? { ...p, avatar_url: url } : p));
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Sign out error', error.message);
      return;
    }
    router.replace('/');
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator color={colors.text} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const v = { ...profile, ...edited };
  const dirty = Object.keys(edited).length > 0;
  const initials = (v.username || '?').slice(0, 1).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={{ width: 60 }} />
          <SplashLogo size={28} color={colors.text} />
          <Pressable onPress={() => router.push('/settings')} hitSlop={10}>
            <Text style={styles.settingsLink}>Settings</Text>
          </Pressable>
        </View>

        <Pressable onPress={onAvatarPress} style={styles.avatarWrap}>
          {v.avatar_url ? (
            <Image
              source={v.avatar_url}
              style={styles.avatarImg}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.initial}>{initials}</Text>
            </View>
          )}
          {uploadingAvatar && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color={colors.text} />
            </View>
          )}
          <Text style={styles.changePhoto}>Change photo</Text>
        </Pressable>

        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          <TextField
            label="Username"
            value={v.username}
            onChangeText={(t) => set('username', t)}
            autoCapitalize="words"
          />
          <TextField
            label="Email"
            value={v.email ?? ''}
            onChangeText={(t) => set('email', t)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextField
            label="Country"
            value={v.country ?? ''}
            onChangeText={(t) => set('country', t)}
            autoCapitalize="words"
          />
          <TextField
            label="City"
            value={v.city ?? ''}
            onChangeText={(t) => set('city', t)}
            autoCapitalize="words"
          />
        </View>

        <Text style={styles.readonly}>Phone: {v.phone || '—'}</Text>

        <PrimaryButton
          label={saving ? 'Saving…' : 'Save changes'}
          onPress={save}
          disabled={!dirty || saving}
          variant="dark"
          style={{ marginTop: spacing.lg }}
        />

        <Pressable onPress={signOut} hitSlop={10} style={{ marginTop: spacing.xl, alignSelf: 'center' }}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  muted: { ...type.caption, color: colors.textMuted },
  avatarWrap: { alignItems: 'center', gap: spacing.sm },
  avatarImg: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
  },
  initial: { ...type.title, color: colors.text, fontSize: 36 },
  changePhoto: { ...type.caption, color: colors.textMuted, textDecorationLine: 'underline' },
  readonly: {
    ...type.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  settingsLink: { ...type.caption, color: colors.text, fontWeight: '600' },
  signOut: { ...type.body, color: colors.textMuted, textDecorationLine: 'underline' },
});
