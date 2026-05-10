import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, Pressable } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing, type } from '@/theme/tokens';

const LEN = 6;

export default function VerifyOtp() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone?: string;
    username?: string;
    email?: string;
    password?: string;
    mode?: string;
  }>();
  const phone = params.phone || '';
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const verify = async (code: string) => {
    if (verifying) return;
    setVerifying(true);

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });
    if (error || !data.user) {
      setVerifying(false);
      Alert.alert('Invalid code', error?.message || 'Please try again.');
      setDigits(Array(LEN).fill(''));
      inputs.current[0]?.focus();
      return;
    }

    // Set password (optional but matches the design's password field)
    if (params.password) {
      await supabase.auth.updateUser({ password: params.password });
    }

    // Check whether a complete profile already exists for this user
    const { data: existing } = await supabase
      .from('profiles')
      .select('username, birthday')
      .eq('id', data.user.id)
      .maybeSingle();

    if (params.mode === 'login') {
      // Log-in flow: never overwrite, just route based on completeness
      setVerifying(false);
      if (existing?.username) {
        router.replace(existing.birthday ? '/(tabs)' : '/auth/complete-profile');
      } else {
        // Phone number had no profile — fall through to sign-up
        Alert.alert(
          'No account found',
          'No Splash account exists for this phone number. Please create one.'
        );
        router.replace('/auth/create-account');
      }
      return;
    }

    // Sign-up flow: upsert with form data
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        username: params.username || 'Splasher',
        email: params.email || null,
        phone,
      },
      { onConflict: 'id' }
    );
    setVerifying(false);
    if (profileError) {
      Alert.alert('Profile error', profileError.message);
      return;
    }
    // If they already had a complete profile, skip the extra step
    router.replace(existing?.birthday ? '/(tabs)' : '/auth/complete-profile');
  };

  const onChange = (i: number, v: string) => {
    const value = v.replace(/[^0-9]/g, '').slice(0, 1);
    const next = [...digits];
    next[i] = value;
    setDigits(next);
    if (value && i < LEN - 1) inputs.current[i + 1]?.focus();
    if (next.every((d) => d.length === 1)) {
      verify(next.join(''));
    }
  };

  const onKey = (i: number, key: string) => {
    if (key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const resend = async () => {
    if (resending || !phone) return;
    setResending(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setResending(false);
    if (error) Alert.alert('Could not resend', error.message);
    else Alert.alert('Code sent', `New code sent to ${phone}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>6-digit code</Text>
        <Text style={styles.subtitle}>
          Code sent to {phone || '+1 (555) 000-0000'} unless you already have an account.
        </Text>

        <View style={styles.codeRow}>
          {digits.map((d, i) => (
            <View key={i} style={styles.cellWrap}>
              <TextInput
                ref={(r) => {
                  inputs.current[i] = r;
                }}
                value={d}
                onChangeText={(v) => onChange(i, v)}
                onKeyPress={({ nativeEvent }) => onKey(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                style={styles.cellInput}
                textContentType="oneTimeCode"
                editable={!verifying}
              />
              {i === 2 && <View style={styles.dash} />}
            </View>
          ))}
        </View>

        {verifying && (
          <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
            <ActivityIndicator color={colors.text} />
          </View>
        )}

        <Pressable onPress={resend} hitSlop={10} style={{ marginTop: spacing.xl, alignItems: 'center' }}>
          <Text style={styles.resend}>
            {resending ? 'Sending…' : 'Didn’t get a code? Resend'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { ...type.display, color: colors.text },
  subtitle: { ...type.body, color: colors.textMuted },
  codeRow: { flexDirection: 'row', gap: 8, marginTop: spacing.xl, justifyContent: 'center' },
  cellWrap: { position: 'relative' },
  cellInput: {
    width: 48,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.bgInverse,
    color: colors.textInverse,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
  },
  dash: {
    position: 'absolute',
    right: -8,
    top: '50%',
    width: 8,
    height: 2,
    backgroundColor: colors.textMuted,
    transform: [{ translateY: -1 }],
  },
  resend: { ...type.caption, color: colors.textMuted, textDecorationLine: 'underline' },
});
