import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { TextField } from '@/components/TextField';
import { RadioOption } from '@/components/RadioOption';
import { PrimaryButton } from '@/components/PrimaryButton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { colors, spacing, type } from '@/theme/tokens';

type Gender = 'female' | 'male' | 'unspecified';

function parseBirthday(input: string): string | null {
  // Accepts DD.MM.YYYY → returns YYYY-MM-DD or null if invalid
  const m = input.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const iso = `${yyyy}-${mm}-${dd}`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

export default function CompleteProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [saving, setSaving] = useState(false);

  const onContinue = async () => {
    const iso = parseBirthday(birthday);
    if (!iso) {
      Alert.alert('Invalid date', 'Please enter a date in DD.MM.YYYY format.');
      return;
    }
    if (!user) {
      Alert.alert('Not signed in', 'Please verify your phone first.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ birthday: iso, gender })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>
          This helps us find more relevant content for you. We won't show it on your profile.
        </Text>

        <View style={{ marginTop: spacing.lg }}>
          <TextField
            label="When is your birthday?"
            required
            placeholder="DD.MM.YYYY"
            value={birthday}
            onChangeText={setBirthday}
            keyboardType="numbers-and-punctuation"
            prefix={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ marginRight: spacing.sm }}>
                <Rect x={3} y={5} width={18} height={16} rx={2} stroke={colors.text} strokeWidth={1.6} />
                <Path d="M3 9h18M8 3v4M16 3v4" stroke={colors.text} strokeWidth={1.6} strokeLinecap="round" />
              </Svg>
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's your gender?</Text>
          <View style={{ gap: spacing.sm }}>
            <RadioOption label="Female" selected={gender === 'female'} onPress={() => setGender('female')} />
            <RadioOption label="Male" selected={gender === 'male'} onPress={() => setGender('male')} />
            <RadioOption
              label="Prefer not to say"
              selected={gender === 'unspecified'}
              onPress={() => setGender('unspecified')}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={saving ? 'Saving…' : 'Continue'}
          variant="dark"
          disabled={!birthday || saving}
          onPress={onContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  title: { ...type.display, color: colors.text },
  subtitle: { ...type.body, color: colors.textMuted },
  section: { marginTop: spacing.lg, gap: spacing.md },
  sectionTitle: { ...type.bodyBold, color: colors.text, fontSize: 18 },
  footer: { padding: spacing.lg },
});
