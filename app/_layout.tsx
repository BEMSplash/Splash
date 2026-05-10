// Sentry side-effect import must run before anything else in the app graph
import '@/lib/sentry';

import { Stack, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { AuthProvider } from '@/lib/auth';
import { navigationIntegration, SentryWrapper } from '@/lib/sentry';
import { colors } from '@/theme/tokens';

function RootLayout() {
  // Hand the current navigation container to Sentry so breadcrumbs include
  // the current route + previous route on every event.
  const navRef = useNavigationContainerRef();
  useEffect(() => {
    if (navRef?.current) {
      navigationIntegration.registerNavigationContainer(navRef);
    }
  }, [navRef]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'fade',
            }}
          >
            <Stack.Screen
              name="post"
              options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="status/[id]"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="settings"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default SentryWrapper(RootLayout);
