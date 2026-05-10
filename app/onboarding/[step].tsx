import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { PhoneIllustration } from '@/components/PhoneIllustration';
import { PageDots } from '@/components/PageDots';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing, type } from '@/theme/tokens';

const slides = [
  { title: 'Welcome to Splash' },
  { title: 'One Post a Day,\nGone in 12 Hours' },
  { title: 'Your Location,\nYour Feed' },
  { title: 'Your Thoughts,\nYour Privacy' },
];

export default function OnboardingStep() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const router = useRouter();
  const idx = Math.max(0, Math.min(slides.length - 1, parseInt(step ?? '0', 10) || 0));
  const slide = slides[idx];
  const isLast = idx === slides.length - 1;
  const isFirst = idx === 0;

  const next = () => {
    if (isLast) router.push('/auth/create-account');
    else router.push(`/onboarding/${idx + 1}`);
  };
  const back = () => {
    if (!isFirst) router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.illustrationWrap}>
        <PhoneIllustration />
      </View>
      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        <Text style={styles.title}>{slide.title}</Text>
        <View style={styles.controls}>
          {!isFirst && !isLast && (
            <IconButton onPress={back} variant="light" accessibilityLabel="Back">
              <Arrow direction="left" color={colors.textInverse} />
            </IconButton>
          )}
          {isLast && (
            <IconButton onPress={back} variant="light" accessibilityLabel="Back">
              <Arrow direction="left" color={colors.textInverse} />
            </IconButton>
          )}
          {!isLast && (
            <View style={styles.dotsWrap}>
              <PageDots total={slides.length} current={idx} />
            </View>
          )}
          {!isLast ? (
            <IconButton onPress={next} variant="dark" accessibilityLabel="Next">
              <Arrow direction="right" color={colors.text} />
            </IconButton>
          ) : (
            <PrimaryButton label="Create account" onPress={next} style={{ flex: 1, marginLeft: spacing.md }} />
          )}
        </View>
        {isLast && (
          <Text
            style={styles.guestLink}
            onPress={() => router.replace('/(tabs)')}
          >
            Browse first
          </Text>
        )}
      </SafeAreaView>
    </View>
  );
}

function Arrow({ direction, color }: { direction: 'left' | 'right'; color: string }) {
  const path =
    direction === 'right'
      ? 'M5 12h14M13 6l6 6-6 6'
      : 'M19 12H5M11 18l-6-6 6-6';
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d={path} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  illustrationWrap: { flex: 1, justifyContent: 'center', backgroundColor: colors.bgInverse },
  bottom: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  title: {
    ...type.title,
    color: colors.text,
    textAlign: 'center',
  },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dotsWrap: { flex: 1, alignItems: 'center' },
  guestLink: {
    ...type.caption,
    color: colors.textMuted,
    textDecorationLine: 'underline',
    textAlign: 'center',
    paddingTop: spacing.lg,
  },
});
