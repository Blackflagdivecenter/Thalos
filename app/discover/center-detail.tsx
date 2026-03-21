import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { communityService, CommunityDiveCenter } from '@/src/services/CommunityService';

const TYPE_COLORS: Record<string, string> = {
  retail:  '#007AFF',
  service: '#FF9500',
  both:    Colors.accentBlue,
  resort:  '#AF52DE',
};

const AGENCY_COLORS: Record<string, string> = {
  PADI:  '#0033A0',
  SSI:   '#00AEEF',
  NAUI:  '#CC0000',
  SDI:   '#003087',
  TDI:   '#1A237E',
  GUE:   '#B71C1C',
  IANTD: '#2E7D32',
  BSAC:  '#003082',
  CMAS:  '#0A5E9B',
  RAID:  '#FF6F00',
};

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={16} color={Colors.textSecondary} style={styles.detailIcon} />
      <View style={styles.detailBody}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function ChipList({ items, color }: { items: string[]; color?: (item: string) => string }) {
  if (items.length === 0) return <Text style={styles.emptyChips}>None listed</Text>;
  return (
    <View style={styles.chipRow}>
      {items.map(item => {
        const bg = color ? color(item) : Colors.accentBlue;
        return (
          <View key={item} style={[styles.chip, { backgroundColor: bg + '22', borderColor: bg + '55' }]}>
            <Text style={[styles.chipText, { color: bg }]}>{item}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function CenterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [item, setItem] = useState<CommunityDiveCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [claimInput, setClaimInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    communityService.getCenterById(id).then(c => {
      setItem(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!item || !claimInput.trim()) return;
    setDeleting(true);
    const ok = await communityService.deleteCenter(item.id, claimInput.trim());
    setDeleting(false);
    if (ok) {
      Alert.alert('Removed', 'Your listing has been removed.');
      router.back();
    } else {
      Alert.alert('Incorrect Code', 'The claim code did not match. Please try again.');
    }
  }

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.accentBlue} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.notFound}>Listing not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const typeColor = TYPE_COLORS[item.type] ?? Colors.accentBlue;
  const typeName  = item.type.charAt(0).toUpperCase() + item.type.slice(1);
  const hasPhone   = !!item.phone;
  const hasEmail   = !!item.email;
  const hasWebsite = !!item.website;
  const hasContact = hasPhone || hasEmail || hasWebsite;

  const locationParts = [item.city, item.stateRegion, item.country].filter(Boolean);
  const locationText  = locationParts.join(', ') || null;
  const fullAddress   = [item.address, ...locationParts].filter(Boolean).join(', ') || null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Dive Center</Text>
        <Pressable onPress={() => setShowDelete(true)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={Colors.emergency} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title card */}
        <View style={[styles.card, { overflow: 'hidden' as const }]}>
          <BlurView intensity={80} tint="regular" style={styles.blurFill}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{item.name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: typeColor + '22', borderColor: typeColor + '55' }]}>
                <Text style={[styles.typeText, { color: typeColor }]}>{typeName}</Text>
              </View>
            </View>
            {locationText && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.locationText}>{locationText}</Text>
              </View>
            )}
          </BlurView>
        </View>

        {/* Contact / address card */}
        <View style={[styles.card, { overflow: 'hidden' as const }]}>
          <BlurView intensity={80} tint="regular" style={styles.blurFill}>
            <Text style={styles.sectionTitle}>Contact & Location</Text>
            <DetailRow icon="map-outline" label="Address" value={fullAddress} />
            <DetailRow icon="call-outline" label="Phone" value={item.phone} />
            <DetailRow icon="mail-outline" label="Email" value={item.email} />
            <DetailRow icon="globe-outline" label="Website" value={item.website} />
          </BlurView>
        </View>

        {/* Agency affiliations */}
        <View style={[styles.card, { overflow: 'hidden' as const }]}>
          <BlurView intensity={80} tint="regular" style={styles.blurFill}>
            <Text style={styles.sectionTitle}>Agency Affiliations</Text>
            <ChipList
              items={item.agencies}
              color={(a) => AGENCY_COLORS[a] ?? Colors.accentBlue}
            />
          </BlurView>
        </View>

        {/* Brands sold */}
        <View style={[styles.card, { overflow: 'hidden' as const }]}>
          <BlurView intensity={80} tint="regular" style={styles.blurFill}>
            <Text style={styles.sectionTitle}>Brands Sold</Text>
            <ChipList items={item.brandsSold} />
          </BlurView>
        </View>

        {/* Brands serviced */}
        <View style={[styles.card, { overflow: 'hidden' as const }]}>
          <BlurView intensity={80} tint="regular" style={styles.blurFill}>
            <Text style={styles.sectionTitle}>Brands Serviced</Text>
            <ChipList items={item.brandsServiced} />
          </BlurView>
        </View>

        {/* Description */}
        {item.description && (
          <View style={[styles.card, { overflow: 'hidden' as const }]}>
            <BlurView intensity={80} tint="regular" style={styles.blurFill}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bodyText}>{item.description}</Text>
            </BlurView>
          </View>
        )}

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Community-posted listing. Thalos does not verify or endorse this listing.
        </Text>
      </ScrollView>

      {/* Contact action bar */}
      {hasContact && (
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
          {hasPhone && (
            <Pressable
              style={[styles.actionBtn, { flex: 1 }]}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
            >
              <Ionicons name="call-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Call</Text>
            </Pressable>
          )}
          {hasEmail && (
            <Pressable
              style={[styles.actionBtn, styles.actionBtnSecondary, { flex: 1 }]}
              onPress={() => Linking.openURL(`mailto:${item.email}`)}
            >
              <Ionicons name="mail-outline" size={18} color={Colors.accentBlue} />
              <Text style={[styles.actionBtnText, { color: Colors.accentBlue }]}>Email</Text>
            </Pressable>
          )}
          {hasWebsite && (
            <Pressable
              style={[styles.actionBtn, styles.actionBtnSecondary, { flex: 1 }]}
              onPress={() => {
                const url = item.website!.startsWith('http') ? item.website! : `https://${item.website}`;
                Linking.openURL(url);
              }}
            >
              <Ionicons name="globe-outline" size={18} color={Colors.accentBlue} />
              <Text style={[styles.actionBtnText, { color: Colors.accentBlue }]}>Website</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Delete / claim code sheet */}
      {showDelete && (
        <View style={styles.overlay}>
          <Pressable style={styles.overlayBg} onPress={() => setShowDelete(false)} />
          <View style={styles.deleteSheet}>
            <Text style={styles.deleteTitle}>Remove Listing</Text>
            <Text style={styles.deleteSubtitle}>
              Enter your 6-digit claim code to remove this listing.
            </Text>
            <TextInput
              style={styles.claimInput}
              placeholder="Claim code"
              value={claimInput}
              onChangeText={setClaimInput}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <View style={styles.deleteActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowDelete(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, (!claimInput.trim() || deleting) && styles.btnDisabled]}
                onPress={handleDelete}
                disabled={!claimInput.trim() || deleting}
              >
                {deleting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmText}>Remove</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 60 },
  backText: { ...Typography.body, color: Colors.accentBlue },
  headerTitle: { ...Typography.headline, color: Colors.text, fontWeight: '600' as const, flex: 1, textAlign: 'center' as const },
  deleteBtn: { width: 60, alignItems: 'flex-end' as const },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  card: { borderRadius: Radius.lg },
  blurFill: { padding: Spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, flexWrap: 'wrap' as const },
  title: { ...Typography.title3, color: Colors.text, fontWeight: '700' as const, flex: 1 },
  typeBadge: {
    borderRadius: Radius.sm, borderWidth: 1,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  typeText: { ...Typography.caption1, fontWeight: '600' as const },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm },
  locationText: { ...Typography.subhead, color: Colors.textSecondary },
  sectionTitle: { ...Typography.headline, color: Colors.text, fontWeight: '600' as const, marginBottom: Spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  detailIcon: { marginTop: 2 },
  detailBody: { flex: 1 },
  detailLabel: { ...Typography.caption1, color: Colors.textSecondary },
  detailValue: { ...Typography.body, color: Colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: Spacing.sm },
  chip: {
    borderRadius: Radius.sm, borderWidth: 1,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  chipText: { ...Typography.caption1, fontWeight: '600' as const },
  emptyChips: { ...Typography.body, color: Colors.textTertiary, fontStyle: 'italic' as const },
  bodyText: { ...Typography.body, color: Colors.text, lineHeight: 22 },
  footerNote: {
    ...Typography.caption2, color: Colors.textTertiary, textAlign: 'center' as const,
    lineHeight: 16, marginTop: Spacing.sm,
  },
  notFound: { ...Typography.body, color: Colors.textSecondary },
  backLink: { marginTop: Spacing.md },
  backLinkText: { ...Typography.body, color: Colors.accentBlue },

  // Action bar
  actionBar: {
    flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.accentBlue, borderRadius: Radius.md,
  },
  actionBtnSecondary: {
    backgroundColor: Colors.accentBlue + '18',
  },
  actionBtnText: { ...Typography.body, color: '#fff', fontWeight: '600' as const },

  // Delete sheet
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, justifyContent: 'flex-end' as const },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  deleteSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.xl, gap: Spacing.md,
  },
  deleteTitle: { ...Typography.title3, color: Colors.text, fontWeight: '700' as const },
  deleteSubtitle: { ...Typography.subhead, color: Colors.textSecondary },
  claimInput: {
    height: 48, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, ...Typography.body, color: Colors.text,
    backgroundColor: Colors.background, letterSpacing: 4,
  },
  deleteActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cancelBtn: {
    flex: 1, height: 48, alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
  },
  cancelText: { ...Typography.body, color: Colors.textSecondary },
  confirmBtn: {
    flex: 1, height: 48, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: Colors.emergency, borderRadius: Radius.md,
  },
  confirmText: { ...Typography.body, color: '#fff', fontWeight: '600' as const },
  btnDisabled: { opacity: 0.4 },
});
