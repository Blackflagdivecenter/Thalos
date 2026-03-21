import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThalosLogo } from '@/src/ui/components/ThalosLogo';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/src/ui/theme';
import { useUIStore } from '@/src/stores/uiStore';

type ThemeMode = 'light' | 'dark' | 'system';
type UnitSystem = 'metric' | 'imperial';

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function SegmentControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map(opt => (
        <Pressable
          key={opt.value}
          style={[styles.segBtn, value === opt.value && styles.segBtnActive]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[styles.segLabel, value === opt.value && styles.segLabelActive]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function RowLink({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <Pressable style={styles.rowLink} onPress={onPress}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowChevron}>›</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode, unitSystem, setUnitSystem } = useUIStore();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <SectionLabel label="APPEARANCE" />
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Theme</Text>
          <SegmentControl<ThemeMode>
            value={themeMode}
            options={[
              { label: '☀️  Light', value: 'light' },
              { label: '⚙️  Auto',  value: 'system' },
              { label: '🌙  Dark',  value: 'dark' },
            ]}
            onChange={setThemeMode}
          />
        </View>

        {/* Units */}
        <SectionLabel label="UNITS" />
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Measurement system</Text>
          <SegmentControl<UnitSystem>
            value={unitSystem}
            options={[
              { label: 'Metric (m / bar)', value: 'metric' },
              { label: 'Imperial (ft / psi)', value: 'imperial' },
            ]}
            onChange={setUnitSystem}
          />
        </View>

        {/* Logbook */}
        <SectionLabel label="LOGBOOK" />
        <View style={styles.card}>
          <RowLink
            icon="🗺"
            label="Trips & Expeditions"
            onPress={() => router.push('/logbook/trips')}
          />
          <View style={styles.separator} />
          <RowLink
            icon="🤿"
            label="Dive Buddies"
            onPress={() => router.push('/logbook/buddies')}
          />
          <View style={styles.separator} />
          <RowLink
            icon="🏅"
            label="My Certifications"
            onPress={() => router.push('/logbook/certs')}
          />
          <View style={styles.separator} />
          <RowLink
            icon="📂"
            label="Import from FIT File"
            onPress={() => router.push('/logbook/import-fit')}
          />
        </View>

        {/* Safety */}
        <SectionLabel label="SAFETY" />
        <View style={styles.card}>
          <RowLink
            icon="🏥"
            label="Medical Info & ICE Contact"
            onPress={() => router.push('/settings/medical')}
          />
        </View>

        {/* About */}
        <SectionLabel label="ABOUT" />
        <View style={styles.aboutCard}>
          <ThalosLogo size={56} variant="dark" />
          <View style={styles.aboutText}>
            <Text style={styles.aboutName}>THALOS</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutTagline}>Your dive companion</Text>
          </View>
        </View>

        <View style={styles.legalCard}>
          <Text style={styles.legalText}>
            All depth, gas, and decompression calculations are for planning purposes only.
            Always dive within your training and certification limits. Never dive alone.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 60 },
  backText: { ...Typography.body, color: Colors.accentBlue },
  headerTitle: { ...Typography.headline, color: Colors.text },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  sectionLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: Spacing.md,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  cardLabel: { ...Typography.subhead, color: Colors.text, fontWeight: '600' },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    padding: 3,
    gap: 2,
  },
  segBtn: {
    flex: 1,
    borderRadius: Radius.md - 2,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  segBtnActive: {
    backgroundColor: Colors.accentBlue,
    ...Shadow.sm,
  },
  segLabel: { ...Typography.footnote, color: Colors.textSecondary, fontWeight: '500' },
  segLabelActive: { color: '#FFF', fontWeight: '700' },
  rowLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowLabel: { ...Typography.body, color: Colors.text, flex: 1 },
  rowChevron: { ...Typography.title3, color: Colors.textTertiary },
  separator: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  aboutCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    ...Shadow.sm,
  },
  aboutText: { flex: 1 },
  aboutName: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.thalosDeep,
    letterSpacing: 3,
  },
  aboutVersion: { ...Typography.footnote, color: Colors.textSecondary, marginTop: 2 },
  aboutTagline: { ...Typography.footnote, color: Colors.textTertiary, marginTop: 1 },
  legalCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  legalText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
