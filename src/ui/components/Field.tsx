import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Radius, Spacing, Typography, type ColorPalette } from '@/src/ui/theme';
import { useColors } from '@/src/hooks/useColors';

interface Props extends TextInputProps {
  label: string;
  containerStyle?: ViewStyle;
}

export function Field({ label, containerStyle, ...inputProps }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textTertiary}
        {...inputProps}
      />
    </View>
  );
}

function makeStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: {
      backgroundColor: C.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xs,
    },
    label: {
      ...Typography.caption1,
      color: C.textSecondary,
      marginBottom: 2,
    },
    input: {
      ...Typography.body,
      color: C.text,
      paddingVertical: Spacing.xs,
    },
  });
}
