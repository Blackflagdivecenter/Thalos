import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { initDatabase } from '@/src/db/migrations';
import { seedDatabase } from '@/src/db/seed';
import { getDb } from '@/src/db/client';
import { generateId } from '@/src/utils/uuid';
import { Colors } from '@/src/ui/theme';
import { useUIStore } from '@/src/stores/uiStore';
import { useInstructorStore } from '@/src/stores/instructorStore';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      initDatabase();
      seedDatabase(); // seeds 3 sites + 3 dives if DB is empty
      useUIStore.getState().loadUnitSystem();
      useUIStore.getState().loadThemeMode();
      useInstructorStore.getState().loadPinState();

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

      setDbReady(true);
    } catch (e) {
      console.error('Database initialization failed:', e);
      setDbReady(true);
    }
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="emergency"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="logbook/new"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen name="logbook/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="logbook/import-fit" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="logbook/buddies" options={{ headerShown: false }} />
        <Stack.Screen
          name="sites/new"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen name="sites/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="sites/[id]/eap" options={{ headerShown: false }} />
        <Stack.Screen name="tools/unit-converter" options={{ headerShown: false }} />
        <Stack.Screen name="tools/weight" options={{ headerShown: false }} />
        <Stack.Screen name="tools/sac" options={{ headerShown: false }} />
        <Stack.Screen name="tools/turn-pressure" options={{ headerShown: false }} />
        <Stack.Screen name="tools/gas-planner" options={{ headerShown: false }} />
        <Stack.Screen name="tools/gas-blending" options={{ headerShown: false }} />
        <Stack.Screen name="tools/dive-tables"    options={{ headerShown: false }} />
        <Stack.Screen name="tools/deco-planner"         options={{ headerShown: false }} />
        <Stack.Screen name="instructor/students"        options={{ headerShown: false }} />
        <Stack.Screen name="instructor/students/new"    options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="instructor/students/[id]"   options={{ headerShown: false }} />
        <Stack.Screen name="instructor/courses"         options={{ headerShown: false }} />
        <Stack.Screen name="instructor/courses/new"     options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="instructor/signoff"         options={{ headerShown: false }} />
        <Stack.Screen name="logbook/media"   options={{ headerShown: false }} />
        <Stack.Screen name="logbook/share"  options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="qr"             options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="collab/session" options={{ headerShown: false }} />
        <Stack.Screen name="collab/scan"    options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="settings"       options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="gas-stats"      options={{ headerShown: false }} />
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
