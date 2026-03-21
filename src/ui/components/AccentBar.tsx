/**
 * AccentBar — thin decorative 3-color stripe.
 * Three segments: ThalosNavy → AccentBlue → ThalosAccent
 * Height: 3pt, Capsule (fully-rounded ends).
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Spacing } from '@/src/ui/theme';

interface AccentBarProps {
  style?: ViewStyle;
}

export function AccentBar({ style }: AccentBarProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={[styles.seg, { backgroundColor: Colors.thalosNavy }]} />
      <View style={[styles.seg, { backgroundColor: Colors.accentBlue }]} />
      <View style={[styles.seg, { backgroundColor: Colors.thalosAccent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    height: 3,
    marginHorizontal: Spacing.lg,
    borderRadius: 9999,
    overflow: 'hidden',
    gap: 2,
  },
  seg: {
    flex: 1,
    borderRadius: 9999,
  },
});
