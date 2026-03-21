import { Platform, TextStyle } from 'react-native';

// ─── Color palette type ───────────────────────────────────────────────────────

export type ColorPalette = {
  // ── Spec names ────────────────────────────────────────────────────────────
  accentBlue: string;
  accentBlueLight: string;   // 8% opacity — result card background
  thalosNavy: string;        // tab bar tint, brand header text
  thalosDeep: string;        // gradient deep end
  thalosAccent: string;      // brand accent stripe (magenta)
  // ── Legacy aliases (same values, keeps all existing code working) ─────────
  primaryNavy: string;       // → thalosNavy
  deepNavy: string;          // → thalosDeep
  accentTeal: string;        // → accentBlue
  accentTealLight: string;   // → accentBlueLight
  // ── Semantic ──────────────────────────────────────────────────────────────
  background: string;        // systemGroupedBackground
  surface: string;           // card surface (glass material approximation)
  surfaceSecondary: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  systemGray5: string;  // unselected capsule pill bg (#E5E5EA light / #3A3A3C dark)
  emergency: string;
  success: string;
  warning: string;
  white: string;
  black: string;
};

// ─── Static palettes (used by useColors() hook) ───────────────────────────────

export const LightColors: ColorPalette = {
  // Spec brand colors
  accentBlue:       '#33A7B5',
  accentBlueLight:  'rgba(51,167,181,0.08)',
  thalosNavy:       '#003087',
  thalosDeep:       '#001C5A',
  thalosAccent:     '#FA156B',
  // Aliases
  primaryNavy:      '#003087',
  deepNavy:         '#001C5A',
  accentTeal:       '#33A7B5',
  accentTealLight:  'rgba(51,167,181,0.08)',
  // Semantic
  background:       '#F2F2F7',
  surface:          'rgba(255,255,255,0.85)',
  surfaceSecondary: '#F2F2F7',
  systemGray5:      '#E5E5EA',
  border:           'rgba(0,0,0,0.08)',
  text:             '#1C1C1E',
  textSecondary:    '#6C6C70',
  textTertiary:     '#AEAEB2',
  emergency:        '#FF3B30',
  success:          '#34C759',
  warning:          '#FF9500',
  white:            '#FFFFFF',
  black:            '#000000',
};

export const DarkColors: ColorPalette = {
  // Spec brand colors
  accentBlue:       '#3DBDCB',
  accentBlueLight:  'rgba(61,189,203,0.08)',
  thalosNavy:       '#1E5BA3',
  thalosDeep:       '#001135',
  thalosAccent:     '#FF3D85',
  // Aliases
  primaryNavy:      '#1E5BA3',
  deepNavy:         '#001135',
  accentTeal:       '#3DBDCB',
  accentTealLight:  'rgba(61,189,203,0.08)',
  // Semantic
  background:       '#000000',
  surface:          'rgba(44,44,46,0.85)',
  surfaceSecondary: '#2C2C2E',
  systemGray5:      '#3A3A3C',
  border:           'rgba(255,255,255,0.12)',
  text:             '#FFFFFF',
  textSecondary:    '#AEAEB2',
  textTertiary:     '#636366',
  emergency:        '#FF453A',
  success:          '#30D158',
  warning:          '#FF9F0A',
  white:            '#FFFFFF',
  black:            '#000000',
};

// ─── Dynamic Colors ───────────────────────────────────────────────────────────

function dc(light: string, dark: string): string {
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DynamicColorIOS } = require('react-native') as typeof import('react-native');
    return DynamicColorIOS({ light, dark }) as unknown as string;
  }
  return light;
}

/**
 * `Colors` — use in StyleSheet.create for automatic light/dark adaptation.
 * Static brand strings are kept as plain hex so they can be used in
 * rgba() concatenation patterns.
 */
export const Colors: ColorPalette = {
  // ── Brand — static ──────────────────────────────────────────────────────
  accentBlue:   '#33A7B5',
  thalosNavy:   '#003087',
  thalosDeep:   '#001C5A',
  thalosAccent: '#FA156B',
  emergency:    '#FF3B30',
  success:      '#34C759',
  warning:      '#FF9500',
  white:        '#FFFFFF',
  black:        '#000000',

  // ── Legacy aliases (static, same values) ────────────────────────────────
  primaryNavy: '#003087',
  deepNavy:    '#001C5A',
  accentTeal:  '#33A7B5',

  // ── Semantic — dynamic (auto-switch on iOS) ──────────────────────────────
  accentBlueLight:  dc('rgba(51,167,181,0.08)',  'rgba(61,189,203,0.08)'),
  accentTealLight:  dc('rgba(51,167,181,0.08)',  'rgba(61,189,203,0.08)'),
  background:       dc('#F2F2F7',                '#000000'),
  surface:          dc('rgba(255,255,255,0.85)', 'rgba(44,44,46,0.85)'),
  surfaceSecondary: dc('#F2F2F7',                '#2C2C2E'),
  systemGray5:      dc('#E5E5EA',                '#3A3A3C'),
  border:           dc('rgba(0,0,0,0.08)',        'rgba(255,255,255,0.12)'),
  text:             dc('#1C1C1E',                '#FFFFFF'),
  textSecondary:    dc('#6C6C70',                '#AEAEB2'),
  textTertiary:     dc('#AEAEB2',                '#636366'),
};

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
} as const;

// ─── Radius ───────────────────────────────────────────────────────────────────

export const Radius = {
  sm:      8,    // tool icon bg, signature pad
  md:      12,   // cards, input cards, result cards, calculator buttons
  lg:      16,   // dashboard widgets
  xl:      28,
  full:    9999, // capsule / pills
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const Typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' as TextStyle['fontWeight'], letterSpacing: 0.37 },
  title1:     { fontSize: 28, fontWeight: '700' as TextStyle['fontWeight'], letterSpacing: 0.36 },
  title2:     { fontSize: 22, fontWeight: '700' as TextStyle['fontWeight'], letterSpacing: 0.35 },
  title3:     { fontSize: 20, fontWeight: '600' as TextStyle['fontWeight'], letterSpacing: 0.38 },
  headline:   { fontSize: 17, fontWeight: '600' as TextStyle['fontWeight'], letterSpacing: -0.41 },
  body:       { fontSize: 17, fontWeight: '400' as TextStyle['fontWeight'], letterSpacing: -0.41 },
  callout:    { fontSize: 16, fontWeight: '400' as TextStyle['fontWeight'], letterSpacing: -0.32 },
  subhead:    { fontSize: 15, fontWeight: '400' as TextStyle['fontWeight'], letterSpacing: -0.24 },
  footnote:   { fontSize: 13, fontWeight: '400' as TextStyle['fontWeight'], letterSpacing: -0.08 },
  caption1:   { fontSize: 12, fontWeight: '400' as TextStyle['fontWeight'], letterSpacing: 0 },
  caption2:   { fontSize: 11, fontWeight: '400' as TextStyle['fontWeight'], letterSpacing: 0.07 },
  // Numeric display sizes
  numHero:    { fontSize: 48, fontWeight: '700' as TextStyle['fontWeight'], fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] },
  numLarge:   { fontSize: 36, fontWeight: '700' as TextStyle['fontWeight'], fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] },
  numMedium:  { fontSize: 22, fontWeight: '700' as TextStyle['fontWeight'], fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] },
  mono:       { fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] },
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.11,
    shadowRadius: 10,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
  },
} as const;

const theme = { Colors, Spacing, Radius, Typography, Shadow } as const;
export default theme;
