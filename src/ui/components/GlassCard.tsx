/**
 * GlassCard — frosted glass input card using expo-blur's BlurView.
 * On iOS: genuine regularMaterial blur (intensity 80, tint 'regular').
 * On Android: semi-transparent fallback.
 * cornerRadius: 12pt (default) or 16pt for dashboard widgets.
 */
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Radius, Shadow, Spacing } from '@/src/ui/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  radius?: number;
  /** Extra padding override (default 16pt per spec) */
  padding?: number;
  /** Disable shadow for nested cards */
  noShadow?: boolean;
}

export function GlassCard({
  children,
  style,
  radius = Radius.md,
  padding = Spacing.lg,
  noShadow = false,
}: GlassCardProps) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={80}
        tint="regular"
        style={[
          styles.base,
          { borderRadius: radius, padding },
          noShadow ? null : Shadow.sm,
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  // Android fallback
  return (
    <View
      style={[
        styles.base,
        styles.androidFallback,
        { borderRadius: radius, padding },
        noShadow ? null : Shadow.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    marginHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  androidFallback: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});
