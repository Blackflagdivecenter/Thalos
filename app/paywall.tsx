import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { PurchasesPackage } from 'react-native-purchases';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { ThalosLogo } from '@/src/ui/components/ThalosLogo';
import { useSubscriptionStore } from '@/src/stores/subscriptionStore';

const FEATURES = [
  { icon: 'book',           text: 'Unlimited dive logbook with full history' },
  { icon: 'location',       text: '510+ dive sites with emergency action plans' },
  { icon: 'calculator',     text: '9 dive calculators including Bühlmann ZHL-16C' },
  { icon: 'warning',        text: 'Emergency mode — works fully offline' },
  { icon: 'school',         text: 'Instructor module with skill sign-offs & paperwork' },
  { icon: 'people',         text: 'Community classes, trips & dive centers' },
  { icon: 'camera',         text: 'Media gallery & buddy signatures' },
];

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={s.featureRow}>
      <View style={s.featureIcon}>
        <Ionicons name={icon as any} size={16} color={Colors.accentBlue} />
      </View>
      <Text style={s.featureText}>{text}</Text>
    </View>
  );
}

function PlanCard({
  pkg,
  selected,
  onPress,
  isBestValue,
}: {
  pkg: PurchasesPackage;
  selected: boolean;
  onPress: () => void;
  isBestValue: boolean;
}) {
  const isAnnual = pkg.packageType === 'ANNUAL';
  const price = pkg.product.priceString;
  const period = isAnnual ? 'year' : 'month';
  const perMonth = isAnnual
    ? `$${(pkg.product.price / 12).toFixed(2)}/mo`
    : null;

  return (
    <Pressable
      style={[s.planCard, selected && s.planCardSelected]}
      onPress={onPress}
    >
      {isBestValue && (
        <View style={s.bestValueBadge}>
          <Text style={s.bestValueText}>BEST VALUE</Text>
        </View>
      )}
      <View style={s.planLeft}>
        <View style={[s.planRadio, selected && s.planRadioSelected]}>
          {selected && <View style={s.planRadioDot} />}
        </View>
        <View>
          <Text style={[s.planTitle, selected && s.planTitleSelected]}>
            {isAnnual ? 'Annual' : 'Monthly'}
          </Text>
          {perMonth && (
            <Text style={s.planSub}>{perMonth} · save 44%</Text>
          )}
        </View>
      </View>
      <Text style={[s.planPrice, selected && s.planPriceSelected]}>
        {price}<Text style={s.planPeriod}>/{period}</Text>
      </Text>
    </Pressable>
  );
}

export default function PaywallScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { packages, loading, purchaseError, fetchPackages, purchasePackage, restorePurchases, isActive } = useSubscriptionStore();

  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  // Pre-select annual plan
  useEffect(() => {
    if (packages.length > 0 && !selectedPkg) {
      const annual = packages.find(p => p.packageType === 'ANNUAL');
      setSelectedPkg(annual ?? packages[0]);
    }
  }, [packages]);

  // If subscription becomes active (after purchase), navigate away
  useEffect(() => {
    if (isActive) router.replace('/(tabs)/home');
  }, [isActive]);

  async function handleSubscribe() {
    if (!selectedPkg) return;
    await purchasePackage(selectedPkg);
  }

  async function handleRestore() {
    const restored = await restorePurchases();
    if (!restored) {
      Alert.alert('No Subscription Found', 'No active subscription was found for this Apple ID.');
    }
  }

  const annualPkg  = packages.find(p => p.packageType === 'ANNUAL');
  const monthlyPkg = packages.find(p => p.packageType === 'MONTHLY');
  const orderedPackages = [annualPkg, monthlyPkg].filter(Boolean) as PurchasesPackage[];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <ThalosLogo size={52} variant="dark" />
          <Text style={s.wordmark}>THALOS</Text>
          <Text style={s.tagline}>Professional Dive Tools</Text>
        </View>

        {/* Trial callout */}
        <View style={s.trialBanner}>
          <Ionicons name="gift" size={20} color={Colors.thalosNavy} />
          <Text style={s.trialText}>
            <Text style={s.trialBold}>1 month free</Text>
            {' '}— cancel anytime before trial ends
          </Text>
        </View>

        {/* Features */}
        <View style={s.featuresCard}>
          {FEATURES.map(f => <FeatureRow key={f.icon} {...f} />)}
        </View>

        {/* Plan picker */}
        {loading && packages.length === 0 ? (
          <ActivityIndicator color={Colors.accentBlue} style={{ marginVertical: Spacing.xl }} />
        ) : (
          <View style={s.plans}>
            {orderedPackages.map(pkg => (
              <PlanCard
                key={pkg.identifier}
                pkg={pkg}
                selected={selectedPkg?.identifier === pkg.identifier}
                onPress={() => setSelectedPkg(pkg)}
                isBestValue={pkg.packageType === 'ANNUAL'}
              />
            ))}
          </View>
        )}

        {purchaseError ? (
          <Text style={s.errorText}>{purchaseError}</Text>
        ) : null}

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [s.ctaBtn, (loading || !selectedPkg) && s.ctaBtnDisabled, pressed && { opacity: 0.88 }]}
          onPress={handleSubscribe}
          disabled={loading || !selectedPkg}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.ctaBtnText}>Start Free Trial</Text>
          )}
        </Pressable>

        <Text style={s.trialNote}>
          Free for 1 month, then {selectedPkg?.product.priceString ?? '—'}/
          {selectedPkg?.packageType === 'ANNUAL' ? 'year' : 'month'}.
          {'\n'}Billed automatically. Cancel anytime.
        </Text>

        {/* Restore */}
        <Pressable onPress={handleRestore} style={s.restoreBtn} disabled={loading}>
          <Text style={s.restoreText}>Restore Purchases</Text>
        </Pressable>

        {/* Legal */}
        <View style={s.legalRow}>
          <Pressable onPress={() => Linking.openURL('https://blackflagdivecenter.github.io/Thalos/privacy.html')}>
            <Text style={s.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={s.legalDot}>·</Text>
          <Pressable onPress={() => Linking.openURL('https://blackflagdivecenter.github.io/Thalos/terms.html')}>
            <Text style={s.legalLink}>Terms of Use</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md },

  header: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  wordmark: {
    fontSize: 28, fontWeight: '800', letterSpacing: 6,
    color: Colors.thalosNavy,
  },
  tagline: { ...Typography.subhead, color: Colors.textSecondary },

  trialBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.accentBlue + '15',
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.accentBlue + '30',
  },
  trialText:  { ...Typography.subhead, color: Colors.text, flex: 1 },
  trialBold:  { fontWeight: '700', color: Colors.thalosNavy },

  featuresCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  featureIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.accentBlue + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { ...Typography.subhead, color: Colors.text, flex: 1 },

  plans: { gap: Spacing.sm },
  planCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 2, borderColor: Colors.border,
  },
  planCardSelected: { borderColor: Colors.accentBlue, backgroundColor: Colors.accentBlue + '08' },
  planLeft:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  planRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  planRadioSelected: { borderColor: Colors.accentBlue },
  planRadioDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accentBlue },
  planTitle:     { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  planTitleSelected: { color: Colors.accentBlue },
  planSub:       { ...Typography.footnote, color: Colors.textSecondary, marginTop: 2 },
  planPrice:     { ...Typography.headline, fontWeight: '700', color: Colors.text },
  planPriceSelected: { color: Colors.accentBlue },
  planPeriod:    { ...Typography.footnote, fontWeight: '400', color: Colors.textSecondary },

  bestValueBadge: {
    position: 'absolute', top: -10, right: Spacing.md,
    backgroundColor: Colors.thalosAccent, borderRadius: 20,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  bestValueText: { ...Typography.caption2, color: '#fff', fontWeight: '700', letterSpacing: 0.5 },

  errorText: { ...Typography.footnote, color: Colors.emergency, textAlign: 'center' },

  ctaBtn: {
    backgroundColor: Colors.accentBlue, borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center',
    shadowColor: Colors.accentBlue, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { ...Typography.headline, color: '#fff', fontWeight: '700' },

  trialNote: {
    ...Typography.footnote, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 18,
  },

  restoreBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  restoreText: { ...Typography.subhead, color: Colors.accentBlue },

  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  legalLink: { ...Typography.caption1, color: Colors.textTertiary },
  legalDot:  { ...Typography.caption1, color: Colors.textTertiary },
});
