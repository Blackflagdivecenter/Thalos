/**
 * /qr?type=dive&id=<id>   — share a dive summary
 * /qr?type=site&id=<id>   — share a site + EAP
 *
 * Encodes a compact JSON payload into a QR code.
 * Anyone scanning gets a structured summary they can read.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/src/ui/theme';
import { DiveRepository } from '@/src/repositories/DiveRepository';
import { SiteRepository } from '@/src/repositories/SiteRepository';
import type { DiveWithVersion } from '@/src/models';

const diveRepo = new DiveRepository();
const siteRepo = new SiteRepository();

type QRType = 'dive' | 'site';

function buildDivePayload(dive: DiveWithVersion): string {
  return JSON.stringify({
    app: 'thalos',
    type: 'dive',
    date: dive.date,
    location: dive.siteName ?? dive.siteId ?? 'Unknown',
    maxDepthM: dive.maxDepthMeters,
    bottomTimeMin: dive.bottomTimeMinutes,
    gasType: dive.gasType ?? 'Air',
    diveType: dive.diveType,
    notes: dive.notes?.slice(0, 120) ?? '',
  });
}

function buildSitePayload(site: NonNullable<ReturnType<SiteRepository['getById']>>): string {
  return JSON.stringify({
    app: 'thalos',
    type: 'site',
    name: site.name,
    location: site.location ?? '',
    lat: site.latitude,
    lng: site.longitude,
    maxDepthM: site.maxDepthMeters,
    description: site.description?.slice(0, 120) ?? '',
  });
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export default function QRScreen() {
  const { type, id } = useLocalSearchParams<{ type: QRType; id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [payload, setPayload] = useState<string | null>(null);
  const [title, setTitle] = useState('Share');
  const [rows, setRows] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    if (!id) return;
    try {
      if (type === 'dive') {
        const dive = diveRepo.getByIdWithVersion(id);
        if (!dive) return;
        setTitle('Share Dive');
        setPayload(buildDivePayload(dive));
        setRows([
          { label: 'Date', value: dive.date },
          { label: 'Location', value: dive.siteName ?? dive.siteId ?? '—' },
          { label: 'Max depth', value: dive.maxDepthMeters != null ? `${dive.maxDepthMeters} m` : '—' },
          { label: 'Bottom time', value: dive.bottomTimeMinutes != null ? `${dive.bottomTimeMinutes} min` : '—' },
          { label: 'Gas', value: dive.gasType ?? 'Air' },
          { label: 'Type', value: dive.diveType },
        ]);
      } else if (type === 'site') {
        const site = siteRepo.getById(id);
        if (!site) return;
        setTitle('Share Site');
        setPayload(buildSitePayload(site));
        setRows([
          { label: 'Name', value: site.name },
          { label: 'Location', value: site.location ?? '—' },
          { label: 'Max depth', value: site.maxDepthMeters != null ? `${site.maxDepthMeters} m` : '—' },
          { label: 'Conditions', value: site.conditions ?? '—' },
          {
            label: 'Coordinates',
            value: site.latitude != null && site.longitude != null
              ? `${site.latitude.toFixed(4)}, ${site.longitude.toFixed(4)}`
              : '—',
          },
        ]);
      }
    } catch { /* ignore */ }
  }, [type, id]);

  async function shareText() {
    if (!payload) return;
    const parsed = JSON.parse(payload);
    const text = rows.map(r => `${r.label}: ${r.value}`).join('\n');
    await Share.share({ message: `${title} via Thalos\n\n${text}` });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <Pressable onPress={shareText} style={styles.shareBtn}>
          <Text style={styles.shareText}>Share</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* QR code */}
        <View style={styles.qrCard}>
          {payload ? (
            <QRCode
              value={payload}
              size={220}
              color={Colors.thalosDeep}
              backgroundColor="#FFFFFF"
              logo={undefined}
            />
          ) : (
            <ActivityIndicator color={Colors.accentBlue} size="large" />
          )}
          <Text style={styles.qrHint}>
            Scan with any QR reader to view this {type ?? 'item'}
          </Text>
        </View>

        {/* Summary */}
        {rows.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            {rows.map(r => (
              <SummaryRow key={r.label} label={r.label} value={r.value} />
            ))}
          </View>
        )}
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
  shareBtn: { width: 60, alignItems: 'flex-end' },
  shareText: { ...Typography.body, color: Colors.accentBlue, fontWeight: '600' },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  qrCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.md,
  },
  qrHint: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  summaryTitle: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryLabel: { ...Typography.body, color: Colors.textSecondary },
  summaryValue: { ...Typography.body, color: Colors.text, fontWeight: '500', flex: 1, textAlign: 'right' },
});
