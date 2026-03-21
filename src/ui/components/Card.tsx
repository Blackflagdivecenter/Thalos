import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radius, Spacing } from '@/src/ui/theme';

interface Props {
  children: React.ReactNode;
  variant?: 'default' | 'result' | 'input';
  style?: ViewStyle;
}

/**
 * Card — three visual variants:
 * • default / input  → frosted glass (BlurView "regular" on iOS, rgba fallback on Android)
 * • result           → AccentBlue at 8% opacity (per spec: "NOT frosted glass")
 */
export function Card({ children, variant = 'default', style }: Props) {
  if (variant === 'result') {
    return (
      <View style={[s.base, s.result, style]}>
        {children}
      </View>
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={80} tint="regular" style={[s.base, style]}>
        {children}
      </BlurView>
    );
  }

  // Android fallback
  return (
    <View style={[s.base, s.androidFallback, style]}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  result: {
    backgroundColor: Colors.accentBlueLight,
  },
  androidFallback: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});
