import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextStyle, View, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CompactBrandHeader } from '@/src/ui/components/BrandHeader';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToolItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  iconColor: string;
  route?: string;
}

const TOOLS: ToolItem[] = [
  { id: 'deco',     title: 'Deco Planner',       description: 'Bühlmann ZHL-16C deco planning',       iconName: 'trending-down',   iconColor: '#FF3B30', route: '/tools/deco-planner'   },
  { id: 'gas',      title: 'Gas Planner',         description: 'MOD, END, density, IBCD, trimix',      iconName: 'radio-button-on', iconColor: '#007AFF', route: '/tools/gas-planner'    },
  { id: 'blend',    title: 'Gas Blending',        description: 'Partial pressure blending',            iconName: 'flask',           iconColor: '#34C759', route: '/tools/gas-blending'   },
  { id: 'sac',      title: 'SAC Rate',            description: 'Air consumption & gas supply',       iconName: 'pulse',           iconColor: '#00C7BE', route: '/tools/sac'            },
  { id: 'turn',     title: 'Turn Pressure',       description: 'Rock bottom & gas matching',           iconName: 'speedometer',     iconColor: '#FF9500', route: '/tools/turn-pressure'  },
  { id: 'tables',   title: 'Dive Planner',        description: 'NDL tables & repetitive dives',        iconName: 'grid',            iconColor: '#5AC8FA', route: '/tools/dive-tables'    },
  { id: 'altitude', title: 'Altitude Diving',     description: 'TOD, altitude NDL, flying after',      iconName: 'navigate',        iconColor: '#A2845E', route: '/tools/altitude-diving'  },
  { id: 'convert',  title: 'Unit Converter',      description: 'Depth, temp, pressure, weight',        iconName: 'swap-horizontal', iconColor: '#5856D6', route: '/tools/unit-converter' },
  { id: 'weight',   title: 'Weight Calculator',   description: 'Ballast weight estimator',             iconName: 'barbell',         iconColor: '#AF52DE', route: '/tools/weight'         },
  { id: 'trip',     title: 'Trip Calculator',     description: 'Group trip pricing & profit planning',  iconName: 'airplane',        iconColor: '#FF9500', route: '/tools/trip-calculator'},
  { id: 'course',   title: 'Course Calculator',   description: 'Instructor & shop course pricing',       iconName: 'school',          iconColor: '#34C759', route: '/tools/course-calculator'},
  { id: 'shop',     title: 'Shop Profitability',  description: 'Monthly P&L, break-even & revenue',      iconName: 'storefront',      iconColor: '#007AFF', route: '/tools/shop-calculator' },
];

const ROUTES: Record<string, string> = Object.fromEntries(
  TOOLS.filter(t => t.route).map(t => [t.id, t.route!])
);

export default function ToolsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function handlePress(id: string) {
    const route = ROUTES[id];
    if (route) {
      router.push(route as Parameters<typeof router.push>[0]);
    } else {
      Alert.alert('Coming Soon', 'This tool will be available in a future update.');
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CompactBrandHeader section="Tools" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onPress={() => handlePress(tool.id)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ToolCard({ tool, onPress }: { tool: ToolItem; onPress: () => void }) {
  const inner = (
    <>
      <View style={[styles.iconBg, { backgroundColor: tool.iconColor + '1F' }]}>
        <Ionicons name={tool.iconName as any} size={20} color={tool.iconColor} />
      </View>
      <Text style={styles.toolTitle}>{tool.title}</Text>
      <Text style={styles.toolDesc} numberOfLines={2}>{tool.description}</Text>
      {!tool.route && (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>Soon</Text>
        </View>
      )}
    </>
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.cardWrapper, pressed && styles.pressed]}
      onPress={onPress}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="regular" style={styles.card}>{inner}</BlurView>
      ) : (
        <View style={[styles.card, styles.cardAndroid]}>{inner}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  scroll:         { flex: 1 },
  content:        { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 120 },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  cardWrapper:    { width: '47%' },
  pressed:        { opacity: 0.85, transform: [{ scale: 0.98 }] },
  card: {
    borderRadius: Radius.md, padding: Spacing.lg, overflow: 'hidden', alignItems: 'flex-start', gap: Spacing.sm,
  },
  cardAndroid:    { backgroundColor: 'rgba(255,255,255,0.92)' },
  iconBg: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  toolTitle:      { ...(Typography.subhead as TextStyle), fontWeight: '700', color: Colors.text },
  toolDesc:       { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, lineHeight: 16 },
  soonBadge:      { borderRadius: 9999, paddingHorizontal: Spacing.sm, paddingVertical: 1, backgroundColor: Colors.systemGray5, marginTop: 2 },
  soonText:       { ...(Typography.caption2 as TextStyle), fontWeight: '700', color: Colors.textSecondary },
});
