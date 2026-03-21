import React from 'react';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useColors } from '@/src/hooks/useColors';
import { useUIStore } from '@/src/stores/uiStore';

// ── Tab config ────────────────────────────────────────────────────────────────

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: {
  name: string;
  label: string;
  icon: IconName;
  iconFocused: IconName;
}[] = [
  { name: 'home',             label: 'Home',       icon: 'home-outline',          iconFocused: 'home'            },
  { name: 'logbook/index',    label: 'Logbook',    icon: 'book-outline',          iconFocused: 'book'            },
  { name: 'sites/index',      label: 'Sites',      icon: 'location-outline',      iconFocused: 'location-sharp'  },
  { name: 'tools/index',      label: 'Tools',      icon: 'construct-outline',     iconFocused: 'construct'       },
  { name: 'instructor/index', label: 'Instructor', icon: 'person-circle-outline', iconFocused: 'person-circle'   },
  { name: 'gear/index',       label: 'Gear',       icon: 'briefcase-outline',     iconFocused: 'briefcase'       },
];

// ── Floating glass pill tab bar ───────────────────────────────────────────────

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets      = useSafeAreaInsets();
  const colors      = useColors();
  const { themeMode } = useUIStore();
  const systemScheme  = useColorScheme();
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const activeColor   = colors.accentBlue;
  const inactiveColor = isDark ? 'rgba(255,255,255,0.50)' : '#8E8E93';
  const bubbleBg      = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.72)';
  const rimColor      = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.65)';

  // Build tab items
  const tabItems = state.routes.map((route, index) => {
    const focused  = state.index === index;
    const tabCfg   = TABS.find(t => t.name === route.name);
    const iconName: IconName = tabCfg
      ? (focused ? tabCfg.iconFocused : tabCfg.icon)
      : 'ellipse-outline';

    function onPress() {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
    }
    function onLongPress() {
      navigation.emit({ type: 'tabLongPress', target: route.key });
    }

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel}
        onPress={onPress}
        onLongPress={onLongPress}
        style={tb.tabItem}
      >
        {focused ? (
          <View style={[tb.bubble, { backgroundColor: bubbleBg }]}>
            <Ionicons name={iconName} size={22} color={activeColor} />
          </View>
        ) : (
          <View style={tb.iconWrap}>
            <Ionicons name={iconName} size={22} color={inactiveColor} />
          </View>
        )}
      </Pressable>
    );
  });

  // Inner pill content — shared between both rendering paths
  const pillInner = (
    <>
      <View pointerEvents="none" style={[tb.pillRim, { borderColor: rimColor }]} />
      <View style={tb.row}>{tabItems}</View>
    </>
  );

  return (
    <View style={[tb.container, { paddingBottom: insets.bottom, backgroundColor: isDark ? 'rgb(28,28,30)' : 'transparent' }]}>
      <View style={[tb.shadow, isDark && tb.shadowDark]} />

      {isDark ? (
        // Dark mode: solid semi-opaque pill — no BlurView so we never capture
        // white content from behind and amplify it through the frosted effect.
        <View style={[tb.pill, tb.pillDark]}>
          {pillInner}
        </View>
      ) : (
        // Light mode: frosted glass blur
        <BlurView tint="light" intensity={85} style={tb.pill}>
          {pillInner}
        </BlurView>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const PILL_H      = 56;
const PILL_RADIUS = 28;

const tb = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  shadow: {
    position: 'absolute',
    left: 18, right: 18,
    top: 10,
    height: PILL_H,
    borderRadius: PILL_RADIUS,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 14,
  },
  shadowDark: {
    shadowOpacity: 0.55,
  },
  pill: {
    height: PILL_H,
    borderRadius: PILL_RADIUS,
    overflow: 'hidden',
  },
  pillDark: {
    backgroundColor: 'rgba(28,28,30,0.94)',
  },
  pillRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PILL_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 2,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    height: PILL_H,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: PILL_H,
  },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.50)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ── Root layout ───────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.label }}
        />
      ))}
    </Tabs>
  );
}
