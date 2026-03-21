import { useColorScheme } from 'react-native';
import { LightColors, DarkColors, type ColorPalette } from '@/src/ui/theme';
import { useUIStore } from '@/src/stores/uiStore';

export function useColors(): ColorPalette {
  const themeMode    = useUIStore(s => s.themeMode);
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemScheme === 'dark');

  return isDark ? DarkColors : LightColors;
}
