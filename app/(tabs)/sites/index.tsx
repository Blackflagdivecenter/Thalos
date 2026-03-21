import React, { useEffect, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextStyle, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CompactBrandHeader } from '@/src/ui/components/BrandHeader';
import { Colors, Spacing, Typography } from '@/src/ui/theme';
import { useSiteStore } from '@/src/stores/siteStore';
import { useUIStore } from '@/src/stores/uiStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Site } from '@/src/models';
import { generateEAPFromCoords } from '@/src/utils/eapAutoGen';
import { LIBRARY_SITE_COUNT } from '@/src/data/siteLibrary';

export default function SitesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sites, loadSites, getEAP, updateEAP } = useSiteStore();
  const { unitSystem } = useUIStore();
  const imp = unitSystem === 'imperial';
  const eapCheckRef = useRef(false);

  useEffect(() => { loadSites(); }, []);

  // Once sites are loaded, back-fill EAPs for any site that has coordinates
  // but no emergency contacts yet (e.g. sites saved before EAP auto-gen existed).
  useEffect(() => {
    if (eapCheckRef.current || sites.length === 0) return;
    eapCheckRef.current = true;

    let cancelled = false;
    async function backfillEAPs() {
      for (const site of sites) {
        if (cancelled) break;
        if (site.latitude == null || site.longitude == null) continue;
        const eap = getEAP(site.id);
        // Skip only when the EAP already has existing emergency data AND the
        // newer chamber + evacuation fields — so sites with a first-gen EAP
        // (missing chamber/evacuation) get a top-up pass.
        const hasEmergencyData = eap?.nearestHospitalPhone || eap?.localEmergencyNumber || eap?.coastGuardPhone;
        const hasChamberData   = !!eap?.nearestChamberName;
        const hasEvacData      = !!eap?.evacuationProcedure;
        if (hasEmergencyData && hasChamberData && hasEvacData) continue;
        // Stagger requests to respect API rate limits
        await new Promise((r) => setTimeout(r, 1000));
        if (cancelled) break;
        generateEAPFromCoords(site.latitude, site.longitude)
          .then((data) => updateEAP(site.id, {
            nearestHospitalName:    data.nearestHospitalName,
            nearestHospitalAddress: data.nearestHospitalAddress,
            nearestHospitalPhone:   data.nearestHospitalPhone,
            nearestChamberName:     data.nearestChamberName,
            nearestChamberAddress:  data.nearestChamberAddress,
            nearestChamberPhone:    data.nearestChamberPhone,
            coastGuardPhone:        data.coastGuardPhone,
            localEmergencyNumber:   data.localEmergencyNumber,
            danEmergencyNumber:     data.danEmergencyNumber,
            nearestExitPoint:       data.nearestExitPoint,
            vhfChannel:             data.vhfChannel,
            evacuationProcedure:    data.evacuationProcedure,
          }))
          .catch(() => { /* silently skip — user can regenerate manually */ });
      }
    }
    backfillEAPs();
    return () => { cancelled = true; };
  }, [sites.length]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CompactBrandHeader section="Sites" />

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.count}>{sites.length} site{sites.length !== 1 ? 's' : ''}</Text>
        <Pressable onPress={() => router.push('/sites/new')} style={styles.addBtn} hitSlop={8}>
          <Ionicons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      {/* Library banner — always visible */}
      <LibraryBanner onPress={() => router.push('/sites/browse')} />

      {sites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={56} color={Colors.textSecondary} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No sites saved yet</Text>
          <Text style={styles.emptySubtitle}>Browse the library or tap + to add a site</Text>
        </View>
      ) : (
        <FlatList
          data={sites}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <SiteRow
              site={item}
              imp={imp}
              onPress={() => router.push(`/sites/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

function LibraryBanner({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.libraryBanner, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Ionicons name="library-outline" size={18} color={Colors.accentBlue} />
      <Text style={styles.libraryBannerText}>Browse Dive Site Library</Text>
      <View style={styles.libraryBannerRight}>
        <Text style={styles.libraryCount}>{LIBRARY_SITE_COUNT} sites</Text>
        <Ionicons name="chevron-forward" size={15} color={Colors.accentBlue} />
      </View>
    </Pressable>
  );
}

function SiteRow({ site, imp, onPress }: { site: Site; imp: boolean; onPress: () => void }) {
  const depth = site.maxDepthMeters != null
    ? imp
      ? `${(site.maxDepthMeters * 3.28084).toFixed(0)} ft`
      : `${site.maxDepthMeters.toFixed(1)} m`
    : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.locationBadge}>
        <Ionicons name="location" size={18} color={Colors.accentBlue} />
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.siteName}>{site.name}</Text>
        {site.location ? <Text style={styles.siteLocation}>{site.location}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        {depth ? (
          <Text style={styles.depthValue}>{depth}</Text>
        ) : null}
        <View style={styles.offlineTag}>
          <Ionicons name="checkmark-circle" size={11} color={Colors.success} />
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  count: { ...(Typography.subhead as TextStyle), color: Colors.textSecondary },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  libraryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: 11,
    backgroundColor: Colors.accentBlue + '12',
    borderBottomWidth: 1, borderBottomColor: Colors.accentBlue + '30',
  },
  libraryBannerText: {
    ...(Typography.subhead as TextStyle), color: Colors.accentBlue, fontWeight: '600', flex: 1,
  },
  libraryBannerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  libraryCount: { ...(Typography.caption1 as TextStyle), color: Colors.accentBlue },
  listContent: { paddingBottom: 120 },
  separator: { height: 1, backgroundColor: Colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  pressed: { opacity: 0.6 },
  locationBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(51,167,181,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  rowMid: { flex: 1 },
  siteName: { ...(Typography.subhead as TextStyle), fontWeight: '600', color: Colors.text },
  siteLocation: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 3 },
  depthValue: {
    ...(Typography.caption1 as TextStyle),
    fontWeight: '600',
    color: Colors.accentBlue,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  offlineTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  offlineText: { ...(Typography.caption2 as TextStyle), color: Colors.success },
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxxl,
  },
  emptyIcon: { marginBottom: Spacing.md },
  emptyTitle: { ...(Typography.title3 as TextStyle), color: Colors.text, marginBottom: Spacing.sm },
  emptySubtitle: { ...(Typography.body as TextStyle), color: Colors.textSecondary, textAlign: 'center' },
});
