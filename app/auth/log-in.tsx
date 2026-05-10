import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from '@/components/TextField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { IconButton } from '@/components/IconButton';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '@/lib/supabase';
import { colors, spacing, type } from '@/theme/tokens';

function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? digits : `+${digits}`;
}

export default function LogIn() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const onContinue = async () => {
    Keyboard.dismiss();
    setLoading(true);
    const e164 = normalizePhone(phone);
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Could not send code', error.message);
      return;
    }
    router.push({ pathname: '/auth/verify-otp', params: { phone: e164, mode: 'login' } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Log in</Text>
          <Text style={styles.subtitle}>Enter the phone number on your account.</Text>

          <View style={{ marginTop: spacing.lg }}>
            <TextField
              label="Phone number"
              required
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              autoFocus
              returnKeyType="send"
              onSubmitEditing={onContinue}
            />
          </View>
        </View>

        <View style={styles.footer}>
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
            label={loading ? '' : 'Send code'}
            onPress={onContinue}
            variant="dark"
            disabled={phone.replace(/\D/g, '').length < 7 || loading}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between' },
  content: { padding: spacing.lg, gap: spacing.md, marginTop: spacing.xl },
  title: { ...type.display, color: colors.text },
  subtitle: { ...type.body, color: colors.textMuted },
  footer: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
});
