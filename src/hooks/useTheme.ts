import { Spacing, Radius, Typography, Shadow } from '@/src/ui/theme';
import { useColors } from './useColors';

export function useTheme() {
  const Colors = useColors();
  return { Colors, Spacing, Radius, Typography, Shadow };
}
