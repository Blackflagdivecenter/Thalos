import React from 'react';
import { View, ViewStyle } from 'react-native';

interface FlowLayoutProps {
  children: React.ReactNode;
  spacing?: number;
  style?: ViewStyle;
}

export function FlowLayout({ children, spacing = 6, style }: FlowLayoutProps) {
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing }, style]}>
      {children}
    </View>
  );
}
