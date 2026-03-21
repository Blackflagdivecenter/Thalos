import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { Radius, Spacing, Typography, type ColorPalette } from '@/src/ui/theme';
import { useColors } from '@/src/hooks/useColors';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', size = 'md', disabled, style }: Props) {
  const colors = useColors();
  const { styles, labelStyles } = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, labelStyles[variant], sizeStyles[size]]}>
        {label}
      </Text>
    </Pressable>
  );
}

const sizeStyles = StyleSheet.create<Record<string, TextStyle>>({
  sm: { ...Typography.footnote, fontWeight: '600' },
  md: { ...Typography.callout, fontWeight: '600' },
  lg: { ...Typography.body,    fontWeight: '600' },
});

function makeStyles(C: ColorPalette) {
  const styles = StyleSheet.create({
    base: {
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary:   { backgroundColor: C.accentBlue },
    secondary: { backgroundColor: C.thalosNavy },
    danger:    { backgroundColor: C.emergency },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.accentBlue,
    },
    size_sm: { paddingVertical: Spacing.xs,     paddingHorizontal: Spacing.md },
    size_md: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg },
    size_lg: { paddingVertical: Spacing.md,     paddingHorizontal: Spacing.xl },
    pressed:  { opacity: 0.8 },
    disabled: { opacity: 0.4 },
    label:    { ...Typography.headline },
  });

  const labelStyles = StyleSheet.create<Record<string, TextStyle>>({
    primary:   { color: C.white },
    secondary: { color: C.white },
    danger:    { color: C.white },
    ghost:     { color: C.accentBlue },
  });

  return { styles, labelStyles };
}
