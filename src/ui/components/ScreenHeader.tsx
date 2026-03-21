import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing } from '@/src/ui/theme';
import { useColors } from '@/src/hooks/useColors';

interface Props {
  title: string;
  subtitle?: string;
  back?: () => void;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, back, right }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View style={[
      styles.container,
      {
        paddingTop: insets.top + Spacing.md,
        backgroundColor: colors.surface,
        borderBottomColor: colors.border,
      }
    ]}>
      <View style={styles.row}>
        {/* Left — back button or spacer */}
        <View style={styles.side}>
          {back ? (
            <Pressable onPress={back} hitSlop={12} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={26} color={colors.thalosNavy} />
            </Pressable>
          ) : null}
        </View>

        {/* Center — title + subtitle */}
        <View style={styles.center}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>

        {/* Right */}
        <View style={[styles.side, styles.sideRight]}>
          {right ?? null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  side: {
    width: 56,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  backBtn: {
    padding: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...(Typography.title2 as TextStyle),
    textAlign: 'center',
  },
  subtitle: {
    ...(Typography.subhead as TextStyle),
    marginTop: 2,
    textAlign: 'center',
  },
});
