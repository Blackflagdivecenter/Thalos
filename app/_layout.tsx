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

// ── Auth gate hook ─────────────────────────────────────────────────────────────

function useAuthGate(initialized: boolean) {
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!initialized) return;
    const inAuth = segments[0] === 'auth';
    if (!user && !inAuth) {
      router.replace('/auth/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, initialized, segments]);
}

// ── Root Layout ───────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const router = useRouter();
  const { initialized, initialize } = useAuthStore();

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

  // Handle deep links for collab session invites: thalos://collab?session=<uuid>
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      const parsed = Linking.parse(event.url);
      if (parsed.hostname === 'collab' && parsed.queryParams?.session) {
        const sessionId = parsed.queryParams.session as string;
        router.push(`/collab/session?sessionId=${sessionId}`);
      }
    };
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, [router]);

  useAuthGate(initialized);

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
