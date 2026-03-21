/**
 * ResultCard — AccentBlue at 8% opacity result display card.
 * cornerRadius: 12pt per spec.
 * Used for all calculator outputs.
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '@/src/ui/theme';

interface ResultCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  padding?: number;
}

export function ResultCard({ children, style, padding = Spacing.lg }: ResultCardProps) {
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.accentBlueLight,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
  },
});
