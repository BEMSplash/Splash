import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { supabase } from './supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/**
 * Helper for guest-mode actions that require auth (post, react, etc.).
 * Returns true if the user is authenticated; otherwise prompts to sign up
 * and returns false.
 */
export function requireAuth(user: User | null, intent: string): boolean {
  if (user) return true;
  Alert.alert(
    'Create an account to ' + intent,
    "You're browsing as a guest. Sign up to post, react, and follow other people.",
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Create account', onPress: () => router.push('/auth/create-account') },
    ]
  );
  return false;
}
