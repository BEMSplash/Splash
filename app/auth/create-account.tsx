import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { SplashLogo } from '@/components/SplashLogo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing, type } from '@/theme/tokens';

export default function CreateAccount() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <SplashLogo size={56} color={colors.text} />
        <Text style={styles.title}>Create an account</Text>
        <Text style={styles.subtitle}>
          Log how you feel, take a pulse of the community and find out what's trending nearby.
        </Text>
        <PrimaryButton
          label="Create with Phone Number"
          onPress={() => router.push('/auth/account-details')}
          style={styles.cta}
        />
        <Pressable onPress={() => router.push('/auth/log-in')} hitSlop={8}>
          <Text style={styles.muted}>
            Already have an account? <Text style={styles.bold}>Log in</Text>
          </Text>
        </Pressable>
      </View>
      <Text style={styles.footer}>
        By signing up, you are creating a Splash account and agree to our{' '}
        <Text style={styles.bold}>Terms</Text> and <Text style={styles.bold}>Privacy Policy.</Text>
      </Text>
    </SafeAreaView>
  );
}

function PhoneIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"
        stroke={colors.textInverse}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  title: { ...type.title, color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  subtitle: {
    ...type.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  cta: { marginTop: spacing.lg, alignSelf: 'stretch' },
  muted: { ...type.caption, color: colors.textMuted, marginTop: spacing.sm },
  bold: { color: colors.text, fontWeight: '600' },
  footer: {
    ...type.small,
    color: colors.textMuted,
    textAlign: 'center',
    paddingBottom: spacing.md,
  },
});
