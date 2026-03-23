import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { initDatabase } from '@/src/db/migrations';
import { seedDatabase } from '@/src/db/seed';
import { getDb } from '@/src/db/client';
import { generateId } from '@/src/utils/uuid';
import { Colors } from '@/src/ui/theme';
import { useUIStore } from '@/src/stores/uiStore';
import { useAuthStore } from '@/src/stores/authStore';
import { useSubscriptionStore } from '@/src/stores/subscriptionStore';
import { getSupabase } from '@/src/db/supabase';

// ── Handle Supabase auth redirect URLs ────────────────────────────────────────
// Supabase emails send links like thalos://auth/confirm#access_token=...
// or thalos://auth/confirm?code=... (PKCE flow).
async function handleAuthDeepLink(url: string) {
  if (!url) return false;

  // PKCE code-based flow: ?code=xxx
  const queryString = url.split('?')[1] ?? '';
  const queryParams = new URLSearchParams(queryString.split('#')[0]);
  const code = queryParams.get('code');
  if (code) {
    const { data, error } = await getSupabase().auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      useAuthStore.getState().initialize();
    }
    return true;
  }

  // Implicit / hash-based flow: #access_token=xxx&refresh_token=yyy
  const hash = url.split('#')[1] ?? '';
  const hashParams = new URLSearchParams(hash);
  const accessToken  = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await getSupabase().auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error) {
      useAuthStore.getState().initialize();
    }
    return true;
  }

  return false;
}

// ── Auth + Subscription gate hook ─────────────────────────────────────────────

function useAuthGate(initialized: boolean, subInitialized: boolean) {
  const user       = useAuthStore(s => s.user);
  const isActive   = useSubscriptionStore(s => s.isActive);
  const hasPackages = useSubscriptionStore(s => s.packages.length > 0);
  const router     = useRouter();
  const segments   = useSegments();

  useEffect(() => {
    if (!initialized || !subInitialized) return;
    const inAuth    = segments[0] === 'auth';
    const inPaywall = segments[0] === 'paywall';

    if (!user && !inAuth) {
      router.replace('/auth/login');
    } else if (user && inAuth) {
      if (isActive || !hasPackages) {
        router.replace('/(tabs)');
      } else {
        router.replace('/paywall');
      }
    } else if (user && !isActive && hasPackages && !inPaywall) {
      // Only enforce paywall when RC has actually loaded products
      router.replace('/paywall');
    } else if (user && isActive && inPaywall) {
      router.replace('/(tabs)');
    }
  }, [user, isActive, hasPackages, initialized, subInitialized, segments]);
}

// ── Root Layout ───────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const router = useRouter();
  const { initialized, initialize, user } = useAuthStore();
  const { initialized: subInitialized, initialize: initSubscription } = useSubscriptionStore();

  useEffect(() => {
    try {
      initDatabase();
      seedDatabase();
      useUIStore.getState().loadUnitSystem();
      useUIStore.getState().loadThemeMode();

      // Bootstrap device_id (generate once, persist in app_settings)
      const db = getDb();
      const row = db.getFirstSync<{ value: string }>(
        `SELECT value FROM app_settings WHERE key = ?`, ['device_id'],
      );
      if (!row) {
        db.runSync(
          `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
          ['device_id', generateId(), new Date().toISOString()],
        );
      }
    } catch (e) {
      console.error('Database initialization failed:', e);
    } finally {
      setDbReady(true);
    }

    // Initialize Supabase auth (checks for existing session)
    initialize();
  }, []);

  // Initialize RevenueCat once we know the user (or lack thereof)
  useEffect(() => {
    if (!initialized) return;
    initSubscription(user?.id ?? null);
  }, [initialized, user?.id]);

  // Handle deep links: auth confirmation + collab invites
  useEffect(() => {
    async function handleUrl(url: string) {
      // Try auth deep link first (email confirm, password reset)
      const wasAuth = await handleAuthDeepLink(url);
      if (wasAuth) return;

      // Collab session invite: thalos://collab?session=<uuid>
      const parsed = Linking.parse(url);
      if (parsed.hostname === 'collab' && parsed.queryParams?.session) {
        router.push(`/collab/session?sessionId=${parsed.queryParams.session as string}`);
      }
    }

    // App already open — incoming deep link
    const sub = Linking.addEventListener('url', e => handleUrl(e.url));

    // App opened cold from a deep link
    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });

    return () => sub.remove();
  }, [router]);

  useAuthGate(initialized, subInitialized);

  if (!dbReady) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.accentBlue} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* ── Auth ── */}
        <Stack.Screen name="auth/login"           options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth/signup"          options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />

        {/* ── Paywall ── */}
        <Stack.Screen name="paywall" options={{ headerShown: false, animation: 'fade' }} />

        {/* ── Main tabs ── */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* ── Modals & screens ── */}
        <Stack.Screen
          name="emergency"
          options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }}
        />
        <Stack.Screen name="logbook/new"         options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="logbook/[id]"        options={{ headerShown: false }} />
        <Stack.Screen name="logbook/import-fit"  options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="logbook/buddies"     options={{ headerShown: false }} />
        <Stack.Screen name="sites/new"           options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="sites/[id]"          options={{ headerShown: false }} />
        <Stack.Screen name="sites/[id]/eap"      options={{ headerShown: false }} />
        <Stack.Screen name="tools/unit-converter"  options={{ headerShown: false }} />
        <Stack.Screen name="tools/weight"          options={{ headerShown: false }} />
        <Stack.Screen name="tools/sac"             options={{ headerShown: false }} />
        <Stack.Screen name="tools/turn-pressure"   options={{ headerShown: false }} />
        <Stack.Screen name="tools/gas-planner"     options={{ headerShown: false }} />
        <Stack.Screen name="tools/gas-blending"    options={{ headerShown: false }} />
        <Stack.Screen name="tools/dive-tables"     options={{ headerShown: false }} />
        <Stack.Screen name="tools/deco-planner"    options={{ headerShown: false }} />
        <Stack.Screen name="instructor/students"        options={{ headerShown: false }} />
        <Stack.Screen name="instructor/students/new"    options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="instructor/students/[id]"   options={{ headerShown: false }} />
        <Stack.Screen name="instructor/courses"         options={{ headerShown: false }} />
        <Stack.Screen name="instructor/courses/new"     options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="instructor/signoff"         options={{ headerShown: false }} />
        <Stack.Screen name="logbook/media"   options={{ headerShown: false }} />
        <Stack.Screen name="logbook/share"   options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="qr"              options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="collab/session"  options={{ headerShown: false }} />
        <Stack.Screen name="collab/scan"     options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="settings"        options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="account/profile" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="gas-stats"       options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
