import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';

const FEATURES = [
  {
    icon: '🎓',
    title: 'Find a Class',
    subtitle: 'Upcoming courses from certified instructors and dive centers',
    route: '/discover/classes',
    color: '#007AFF',
  },
  {
    icon: '✈️',
    title: 'Find a Trip',
    subtitle: 'Group dive trips organized by operators, instructors, and fellow divers',
    route: '/discover/trips',
    color: '#34C759',
  },
  {
    icon: '🤿',
    title: 'Find a Dive Center',
    subtitle: 'Local shops for gear, equipment service, and certification courses',
    route: '/discover/centers',
    color: Colors.accentBlue,
  },
  {
    icon: '🔍',
    title: 'Verify a Certification',
    subtitle: 'Look up diver certifications via official agency verification pages and log results',
    route: '/cert-lookup',
    color: '#2E7D32',
  },
] as const;

export default function DiscoverHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tagline}>Find classes, trips, and dive shops posted by the community.</Text>

        {FEATURES.map(f => (
          <Pressable
            key={f.route}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(f.route as Parameters<typeof router.push>[0])}
          >
            <View style={[styles.cardInner, { overflow: 'hidden' as const }]}>
              <BlurView intensity={80} tint="regular" style={styles.blurFill}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconCircle, { backgroundColor: f.color + '18' }]}>
                    <Text style={styles.iconText}>{f.icon}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{f.title}</Text>
                    <Text style={styles.cardSubtitle}>{f.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.accentBlue} />
                </View>
              </BlurView>
            </View>
          </Pressable>
        ))}

        <Text style={styles.footerNote}>
          All listings are community-posted. Thalos does not endorse or verify any individual listing.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 60 },
  backText: { ...Typography.body, color: Colors.accentBlue },
  headerTitle: { ...Typography.headline, color: Colors.text, fontWeight: '600' as const },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  tagline: { ...Typography.subhead, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xs },
  card: { borderRadius: Radius.lg, overflow: 'hidden' as const },
  cardPressed: { opacity: 0.75 },
  cardInner: { borderRadius: Radius.lg },
  blurFill: { padding: Spacing.lg },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTitle: { ...Typography.headline, color: Colors.text, fontWeight: '700' as const, marginBottom: 4 },
  cardSubtitle: { ...Typography.footnote, color: Colors.textSecondary, lineHeight: 18 },
  footerNote: {
    ...Typography.caption2, color: Colors.textTertiary, textAlign: 'center' as const,
    lineHeight: 16, marginTop: Spacing.md,
  },
});
