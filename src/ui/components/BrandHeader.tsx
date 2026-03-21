/**
 * BrandHeader — two variants:
 *
 * Large (Dashboard): 120pt gradient block with logo, "THALOS" title, tagline.
 * Compact (Logbook, Instructor): horizontal row with logo, wordmark, divider, section title.
 */
import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThalosLogo } from '@/src/ui/components/ThalosLogo';
import { Colors, Spacing, Typography } from '@/src/ui/theme';

// ── Large Header ──────────────────────────────────────────────────────────────

interface LargeBrandHeaderProps {
  tagline?: string;
  style?: ViewStyle;
}

export function LargeBrandHeader({ tagline = 'Your Dive Companion', style }: LargeBrandHeaderProps) {
  return (
    <LinearGradient
      colors={[Colors.thalosDeep, Colors.thalosNavy]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.large, style]}
    >
      {/* Decorative water element */}
      <Text style={styles.waterIcon}>〰</Text>

      <View style={styles.largeContent}>
        <ThalosLogo size={64} variant="onNavy" />
        <View style={styles.largeText}>
          <Text style={styles.largeBrand}>THALOS</Text>
          {tagline ? <Text style={styles.largeTagline}>{tagline}</Text> : null}
        </View>
      </View>
    </LinearGradient>
  );
}

// ── Compact Header ────────────────────────────────────────────────────────────

interface CompactBrandHeaderProps {
  section: string;
  style?: ViewStyle;
}

export function CompactBrandHeader({ section, style }: CompactBrandHeaderProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  // Brand text: navy on light backgrounds, teal on dark backgrounds
  const brandColor = isDark ? '#3DBDCB' : '#003087';
  const dividerColor = isDark ? 'rgba(61,189,203,0.30)' : 'rgba(0,48,135,0.20)';

  return (
    <View style={[styles.compact, style]}>
      <ThalosLogo size={24} variant={isDark ? 'dark' : 'dark'} />
      <Text style={[styles.compactBrand, { color: brandColor }]}>THALOS</Text>
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      <Text style={styles.compactSection}>{section}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Large
  large: {
    height: 120,
    borderRadius: 16,
    marginHorizontal: Spacing.lg,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  waterIcon: {
    position: 'absolute',
    fontSize: 80,
    color: 'rgba(255,255,255,0.06)',
    right: -10,
    top: 10,
  },
  largeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  largeText: { flex: 1 },
  largeBrand: {
    fontSize: 32,
    fontWeight: '900' as TextStyle['fontWeight'],
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  largeTagline: {
    ...(Typography.caption1 as TextStyle),
    color: 'rgba(255,255,255,0.70)',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  // Compact
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  compactBrand: {
    fontSize: 18,
    fontWeight: '900' as TextStyle['fontWeight'],
    letterSpacing: 2,
  },
  divider: {
    width: 1,
    height: 16,
    marginHorizontal: Spacing.xs,
  },
  compactSection: {
    ...(Typography.headline as TextStyle),
    color: Colors.text,
  },
});
