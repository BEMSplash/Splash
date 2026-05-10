import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { TextField } from '@/components/TextField';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { supabase } from '@/lib/supabase';
import { colors, spacing, type } from '@/theme/tokens';

function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  return `+${digits}`;
}

export default function AccountDetails() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const canContinue =
    name.trim().length > 0 &&
    password.length >= 8 &&
    phone.replace(/\D/g, '').length >= 7 &&
    agreed &&
    !loading;

  const onContinue = async () => {
    Keyboard.dismiss();
    setLoading(true);
    const e164 = normalizePhone(phone);
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: {
        // username/email/password become profile fields after verification
        data: {
          username: name.trim(),
          email: email.trim() || null,
        },
      },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Could not send code', error.message);
      return;
    }
    router.push({
      pathname: '/auth/verify-otp',
      params: { phone: e164, username: name.trim(), email: email.trim(), password },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Account details</Text>
        <Text style={styles.subtitle}>Enter your details and get verified.</Text>

        <View style={styles.fields}>
          <TextField
            label="Username"
            required
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
          />
          <TextField
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextField
            label="Password"
            required
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            hint="Must be at least 8 characters."
          />
          <TextField
            label="Phone number"
            required
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={() => setAgreed((v) => !v)} style={styles.terms}>
          <Checkbox checked={agreed} />
          <Text style={styles.termsText}>
            I agree with Splash's <Text style={styles.bold}>Terms</Text> and{' '}
            <Text style={styles.bold}>Privacy Policy</Text>
          </Text>
        </Pressable>
        <View style={styles.actions}>
          <IconButton onPress={() => router.back()} variant="light" accessibilityLabel="Back">
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M11 18l-6-6 6-6"
                stroke={colors.textInverse}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </IconButton>
          <PrimaryButton
            label={loading ? '' : 'Continue'}
            onPress={onContinue}
            variant="dark"
            disabled={!canContinue}
            style={{ flex: 1, marginLeft: spacing.md }}
          />
          {loading && (
            <ActivityIndicator
              size="small"
              color={colors.text}
              style={{ position: 'absolute', right: 32 }}
            />
          )}
        </View>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect
        x={2}
        y={2}
        width={20}
        height={20}
        rx={4}
        stroke={colors.textInverse}
        strokeWidth={1.5}
        fill={checked ? colors.textInverse : 'transparent'}
      />
      {checked && (
        <Path
          d="M7 12l3 3 7-7"
          stroke={colors.bgInverse}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  title: { ...type.display, color: colors.text },
  subtitle: { ...type.body, color: colors.textMuted },
  fields: { gap: spacing.md, marginTop: spacing.md },
  footer: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.bg },
  terms: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgInverse,
    borderRadius: 12,
    padding: spacing.md,
  },
  termsText: { ...type.caption, color: colors.textInverse, flex: 1 },
  bold: { fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
});
