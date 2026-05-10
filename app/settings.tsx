import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  Share,
} from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckIcon, CloseIcon } from '@/components/icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { syncContacts } from '@/lib/contacts-sync';
import { ensureNotificationsPermission } from '@/lib/permissions';
import { colors, radii, spacing, type } from '@/theme/tokens';

type NotifPref = 'off' | 'familiar' | 'both';
type Lang = 'en' | 'ru' | 'es' | 'fr' | 'de';

const LANGUAGES: Array<{ code: Lang; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
];

export default function Settings() {
  const router = useRouter();
  const { user } = useAuth();
  const [notif, setNotif] = useState<NotifPref>('both');
  const [language, setLanguage] = useState<Lang>('en');
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('notifications_pref,language')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setNotif((data.notifications_pref as NotifPref) || 'both');
          setLanguage((data.language as Lang) || 'en');
        }
        setLoaded(true);
      });
  }, [user]);

  const updateNotif = async (next: NotifPref) => {
    setNotif(next);
    if (next !== 'off') {
      await ensureNotificationsPermission();
    }
    if (!user) return;
    await supabase.from('profiles').update({ notifications_pref: next }).eq('id', user.id);
  };

  const updateLang = async (next: Lang) => {
    setLanguage(next);
    if (!user) return;
    await supabase.from('profiles').update({ language: next }).eq('id', user.id);
  };

  const onSync = async () => {
    setSyncing(true);
    try {
      const n = await syncContacts();
      Alert.alert('Contacts synced', `${n} contacts saved.`);
    } catch (err: any) {
      Alert.alert('Sync failed', err?.message || 'Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const onInvite = async () => {
    const message = 'Join me on Splash — share quick thoughts that disappear in 12h.';
    const url = 'https://apps.apple.com/'; // replace with real App Store link
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(`${message} ${url}`);
        Alert.alert('Copied', 'Invite text copied to clipboard.');
      } catch {
        Alert.alert('Invite', `${message} ${url}`);
      }
    } else {
      await Share.share({ message: `${message} ${url}` });
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <CloseIcon color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {!loaded ? (
        <ActivityIndicator color={colors.text} style={{ marginTop: 80 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Section title="Notifications">
            <Choice
              label="Off"
              selected={notif === 'off'}
              onPress={() => updateNotif('off')}
            />
            <Choice
              label="Familiar thoughts only"
              selected={notif === 'familiar'}
              onPress={() => updateNotif('familiar')}
            />
            <Choice
              label="Familiar + Other thoughts"
              selected={notif === 'both'}
              onPress={() => updateNotif('both')}
            />
          </Section>

          <Section title="Language">
            {LANGUAGES.map((l) => (
              <Choice
                key={l.code}
                label={l.label}
                selected={language === l.code}
                onPress={() => updateLang(l.code)}
              />
            ))}
          </Section>

          <Section title="Contacts">
            <PrimaryButton
              label={syncing ? 'Syncing…' : 'Sync contacts'}
              variant="dark"
              onPress={onSync}
              disabled={syncing}
            />
            <Text style={styles.help}>
              Contacts power "Familiar thoughts". We never expose your contacts to other users.
            </Text>
          </Section>

          <Section title="Invite friends">
            <PrimaryButton label="Invite contacts" variant="dark" onPress={onInvite} />
          </Section>

          <View style={{ height: spacing.xl }} />
          <PrimaryButton label="Sign out" variant="light" onPress={signOut} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.choice}>
      <Text style={styles.choiceLabel}>{label}</Text>
      {selected && <CheckIcon size={20} color={colors.text} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...type.bodyBold, color: colors.text },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: { ...type.bodyBold, color: colors.textMuted, fontSize: 14, marginBottom: spacing.xs },
  choice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceLabel: { ...type.body, color: colors.text },
  help: { ...type.small, color: colors.textMuted, paddingHorizontal: spacing.sm },
});
