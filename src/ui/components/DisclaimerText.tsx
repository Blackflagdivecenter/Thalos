/**
 * DisclaimerText — caption2, tertiary color, centered.
 * Used at the bottom of every calculator screen.
 */
import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { Colors, Spacing, Typography } from '@/src/ui/theme';

interface DisclaimerTextProps {
  text?: string;
}

const DEFAULT =
  'For planning purposes only. Always dive within your training and certification limits. Never dive alone.';

export function DisclaimerText({ text = DEFAULT }: DisclaimerTextProps) {
  return (
    <Text style={styles.text}>{text}</Text>
  );
}

const styles = StyleSheet.create({
  text: {
    ...(Typography.caption2 as TextStyle),
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: Spacing.lg,
  },
});
