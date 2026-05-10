import { View, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SplashLogo } from '@/components/SplashLogo';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme/tokens';

export default function SplashScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding/0');
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [router, loading, session]);

  return (
    <View style={styles.container}>
      <SplashLogo size={120} color={colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
