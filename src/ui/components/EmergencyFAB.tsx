import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { LightColors, Shadow } from '@/src/ui/theme';

// EmergencyFAB always uses the brand emergency red — same in light and dark mode
export function EmergencyFAB() {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      onPress={() => router.push('/emergency')}
      accessibilityLabel="Emergency"
      accessibilityRole="button"
    >
      <Text style={styles.icon}>!</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LightColors.emergency,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    ...Shadow.lg,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
});
