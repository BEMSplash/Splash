import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Tracking integration so we can see which screen the user is on when an
// error happens. We attach the navigation container ref later via expo-router.
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: false,
});

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    enableNative: true,
    enableAutoSessionTracking: true,
    debug: __DEV__,
    environment: __DEV__ ? 'dev' : 'production',
    release: `splash@${Constants.expoConfig?.version ?? '0.0.0'}`,
    // 100% of breadcrumbs in dev so we capture everything; 25% in prod to stay
    // within the free Sentry tier.
    tracesSampleRate: __DEV__ ? 1.0 : 0.25,
    integrations: [navigationIntegration],
    // Don't surface these expected errors
    ignoreErrors: ['Network request failed', 'AbortError'],
  });
}

/** Attach the current Supabase user to all subsequent events. */
export function setSentryUser(user: { id: string; phone?: string | null } | null) {
  if (!dsn) return;
  if (user) {
    Sentry.setUser({ id: user.id, username: user.phone ?? undefined });
  } else {
    Sentry.setUser(null);
  }
}

/** Add a hand-rolled breadcrumb for major actions. */
export function trackAction(message: string, data?: Record<string, unknown>) {
  if (!dsn) return;
  Sentry.addBreadcrumb({
    category: 'action',
    message,
    level: 'info',
    data,
  });
}

/** Capture a user-submitted bug report with extra context. */
export function captureBugReport(text: string, extra?: Record<string, unknown>) {
  if (!dsn) return;
  Sentry.captureMessage(`[bug-report] ${text}`, {
    level: 'warning',
    extra,
  });
}

export { navigationIntegration };
export const SentryWrapper = Sentry.wrap as <T>(component: T) => T;
