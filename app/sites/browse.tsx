import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/src/ui/components/ScreenHeader';
import { Card } from '@/src/ui/components/Card';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useSiteStore } from '@/src/stores/siteStore';
import {
  ALL_SITES,
  CATEGORY_META,
  WORLD_REGIONS,
  WorldSite,
  LibrarySection,
  SiteCategory,
  groupForLibrary,
  getCountriesForRegion,
  getStatesForCountry,
  getAreaLabel,
} from '@/src/data/siteLibrary';
import { generateEAPFromCoords } from '@/src/utils/eapAutoGen';

const ALL_CATEGORIES: (SiteCategory | 'all')[] = ['all', 'reef', 'wreck', 'spring', 'cenote', 'shore', 'lake'];
const TYPE_LABELS: Record<SiteCategory | 'all', string> = {
  all: 'All', spring: 'Springs', reef: 'Reefs', wreck: 'Wrecks',
  shore: 'Shore', lake: 'Lakes', cenote: 'Cenotes',
};

export default function BrowseSitesScreen() {
  const router = useRouter();
  const { sites, createSite, updateEAP } = useSiteStore();

  const [search,           setSearch]           = useState('');
  const [category,         setCategory]         = useState<SiteCategory | 'all'>('all');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedCountry,  setSelectedCountry]  = useState<string | null>(null);
  const [selectedState,    setSelectedState]    = useState<string | null>(null);
  const [expanded,         setExpanded]         = useState<string | null>(null);
  const [addingName,       setAddingName]       = useState<string | null>(null);

  // Derived: current region object
  const currentRegion = useMemo(
    () => WORLD_REGIONS.find(r => r.id === selectedRegionId) ?? null,
    [selectedRegionId],
  );

  // For single-country regions (US), effectiveCountry is always set automatically
  const effectiveCountry = useMemo(() => {
    if (selectedCountry) return selectedCountry;
    if (currentRegion && currentRegion.countries.length === 1) return currentRegion.countries[0];
    return null;
  }, [selectedCountry, currentRegion]);

  // Show country row only for multi-country regions
  const showCountryRow = !!selectedRegionId && (currentRegion?.countries.length ?? 0) > 1;

  // Countries in selected region that actually have sites
  const availableCountries = useMemo(
    () => selectedRegionId ? getCountriesForRegion(selectedRegionId) : [],
    [selectedRegionId],
  );

  // States/areas for the effective country
  const stateList = useMemo(
    () => effectiveCountry ? getStatesForCountry(effectiveCountry) : [],
    [effectiveCountry],
  );

  const areaLabel = effectiveCountry ? getAreaLabel(effectiveCountry) : 'AREA';

  // Set of already-added site names for quick lookup
  const addedNames = useMemo(
    () => new Set(sites.map(s => s.name.toLowerCase())),
    [sites],
  );

  // Filter + search + group
  const filteredSections: LibrarySection[] = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = ALL_SITES.filter(s => {
      if (category !== 'all' && s.category !== category) return false;
      if (selectedRegionId) {
        const region = WORLD_REGIONS.find(r => r.id === selectedRegionId);
        if (!region?.countries.includes(s.country)) return false;
      }
      if (effectiveCountry && s.country !== effectiveCountry) return false;
      if (selectedState && s.state !== selectedState) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.location.toLowerCase().includes(q)) return false;
      return true;
    });
    return groupForLibrary(filtered, selectedRegionId, effectiveCountry, selectedState);
  }, [search, category, selectedRegionId, effectiveCountry, selectedState]);

  const totalCount = filteredSections.reduce((n, s) => n + s.data.length, 0);

  function selectRegion(id: string | null) {
    setSelectedRegionId(id);
    setSelectedCountry(null);
    setSelectedState(null);
  }

  function selectCountry(country: string | null) {
    setSelectedCountry(country);
    setSelectedState(null);
  }

  async function handleAdd(site: WorldSite) {
    if (addedNames.has(site.name.toLowerCase())) return;
    setAddingName(site.name);
    try {
      const created = createSite({
        name:           site.name,
        location:       site.location,
        latitude:       site.latitude,
        longitude:      site.longitude,
        maxDepthMeters: site.maxDepthMeters,
        description:    site.description,
        conditions:     site.conditions,
        accessNotes:    site.accessNotes,
      });
      generateEAPFromCoords(site.latitude, site.longitude)
        .then(data => {
          updateEAP(created.id, {
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
          });
        })
        .catch(() => { /* silently fail — user can regenerate manually */ });

      Alert.alert(
        'Site Added',
        `"${site.name}" has been added to your sites. Emergency contacts are generating in the background.`,
        [{ text: 'OK' }],
      );
    } catch {
      Alert.alert('Error', 'Could not add site. Please try again.');
    } finally {
      setAddingName(null);
    }
  }

  function handleRowPress(site: WorldSite) {
    const key = site.name.toLowerCase();
    if (addedNames.has(key)) {
      const existing = sites.find(s => s.name.toLowerCase() === key);
      if (existing) router.push(`/sites/${existing.id}`);
    } else {
      setExpanded(prev => prev === site.name ? null : site.name);
    }
  }

  function renderItem({ item }: { item: WorldSite }) {
    const meta     = CATEGORY_META[item.category];
    const isAdded  = addedNames.has(item.name.toLowerCase());
    const isOpen   = expanded === item.name;
    const isAdding = addingName === item.name;

    return (
      <View>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => handleRowPress(item)}
        >
          <View style={[styles.iconBadge, { backgroundColor: meta.color + '20' }]}>
            <Ionicons name={meta.icon as any} size={16} color={meta.color} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowName}>{item.name}</Text>
            <Text style={styles.rowLocation}>{item.location}</Text>
          </View>
          <Text style={styles.depthBadge}>
            {(item.maxDepthMeters * 3.28084).toFixed(0)} ft
          </Text>
          {isAdded ? (
            <Ionicons name="checkmark-circle" size={20} color={Colors.accentTeal} style={styles.trailingIcon} />
          ) : (
            <Ionicons
              name={isOpen ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={Colors.textTertiary}
              style={styles.trailingIcon}
            />
          )}
        </Pressable>

        {isOpen && !isAdded && (
          <Card style={styles.detailCard}>
            {item.description ? (
              <>
                <Text style={styles.detailLabel}>About</Text>
                <Text style={styles.detailText}>{item.description}</Text>
              </>
            ) : null}
            {item.conditions ? (
              <>
                <Text style={[styles.detailLabel, { marginTop: Spacing.sm }]}>Conditions</Text>
                <Text style={styles.detailText}>{item.conditions}</Text>
              </>
            ) : null}
            {item.accessNotes ? (
              <>
                <Text style={[styles.detailLabel, { marginTop: Spacing.sm }]}>Access</Text>
                <Text style={styles.detailText}>{item.accessNotes}</Text>
              </>
            ) : null}
            <Pressable
              style={[styles.addBtn, isAdding && styles.addBtnLoading]}
              onPress={() => handleAdd(item)}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
              )}
              <Text style={styles.addBtnText}>
                {isAdding ? 'Adding…' : 'Add to My Sites'}
              </Text>
            </Pressable>
          </Card>
        )}
      </View>
    );
  }

  function renderSectionHeader({ section }: { section: LibrarySection }) {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.region}</Text>
      </View>
    );
  }

  const subtitle = selectedState
    ? selectedState
    : effectiveCountry ?? (selectedRegionId ? currentRegion?.name ?? 'Global' : 'Global');

  return (
    <View style={styles.container}>
      <ScreenHeader title="Dive Site Library" subtitle={subtitle} back={() => router.back()} />

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search sites…"
          placeholderTextColor={Colors.textTertiary}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── EXPLORE — World Regions ─────────────────────────────────── */}
      <View style={styles.filterBlock}>
        <Text style={styles.filterLabel}>EXPLORE</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <Pressable
            style={[styles.chip, selectedRegionId === null && styles.chipActive]}
            onPress={() => selectRegion(null)}
          >
            <Text style={[styles.chipText, selectedRegionId === null && styles.chipTextActive]}>
              🌍 All Regions
            </Text>
          </Pressable>
          {WORLD_REGIONS.map(r => (
            <Pressable
              key={r.id}
              style={[styles.chip, selectedRegionId === r.id && styles.chipActive]}
              onPress={() => selectRegion(r.id)}
            >
              <Text style={[styles.chipText, selectedRegionId === r.id && styles.chipTextActive]}>
                {r.emoji} {r.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── COUNTRY — multi-country regions only ───────────────────── */}
      {showCountryRow && (
        <View style={styles.filterBlock}>
          <Text style={styles.filterLabel}>COUNTRY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            <Pressable
              style={[styles.chip, selectedCountry === null && styles.chipActive]}
              onPress={() => selectCountry(null)}
            >
              <Text style={[styles.chipText, selectedCountry === null && styles.chipTextActive]}>
                All
              </Text>
            </Pressable>
            {availableCountries.map(country => (
              <Pressable
                key={country}
                style={[styles.chip, selectedCountry === country && styles.chipActive]}
                onPress={() => selectCountry(country)}
              >
                <Text style={[styles.chipText, selectedCountry === country && styles.chipTextActive]}>
                  {country}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── STATE / AREA — when effective country has areas ─────────── */}
      {effectiveCountry && stateList.length > 1 && (
        <View style={styles.filterBlock}>
          <Text style={styles.filterLabel}>{areaLabel}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            <Pressable
              style={[styles.chip, selectedState === null && styles.chipActive]}
              onPress={() => setSelectedState(null)}
            >
              <Text style={[styles.chipText, selectedState === null && styles.chipTextActive]}>
                All
              </Text>
            </Pressable>
            {stateList.map(state => (
              <Pressable
                key={state}
                style={[styles.chip, selectedState === state && styles.chipActive]}
                onPress={() => setSelectedState(state)}
              >
                <Text style={[styles.chipText, selectedState === state && styles.chipTextActive]}>
                  {state}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── TYPE — always visible ───────────────────────────────────── */}
      <View style={[styles.filterBlock, styles.filterBlockLast]}>
        <Text style={styles.filterLabel}>TYPE</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {ALL_CATEGORIES.map(cat => (
            <Pressable
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {TYPE_LABELS[cat]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Result count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{totalCount} site{totalCount !== 1 ? 's' : ''}</Text>
      </View>

      {/* Site list */}
      {filteredSections.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={40} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No sites match your search.</Text>
        </View>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={item => item.name}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Search
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    height: 40,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, ...Typography.body, color: Colors.text },

  // Filter blocks
  filterBlock: {
    marginTop: Spacing.md,
  },
  filterBlockLast: {
    marginBottom: 4,
  },
  filterLabel: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginHorizontal: Spacing.lg,
    marginBottom: 6,
  },
  filterScroll: {
    flexShrink: 0,
    height: 46,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'center',
  },

  // Chips
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.textSecondary,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.accentBlue + '26',
    borderColor: Colors.accentBlue,
  },
  chipText: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.accentBlue,
    fontWeight: '700',
  },

  // Result count
  countRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  countText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // List
  listContent: { paddingBottom: Spacing.xxxl },

  // Section header
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  sectionHeaderText: {
    ...Typography.footnote, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  // Site row
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 11,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  rowPressed: { opacity: 0.75 },
  iconBadge: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  rowInfo: { flex: 1, marginRight: Spacing.sm },
  rowName: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  rowLocation: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 1 },
  depthBadge: {
    ...Typography.caption1, color: Colors.accentBlue, fontWeight: '600',
    marginRight: Spacing.sm,
  },
  trailingIcon: { width: 22 },

  // Expanded detail card
  detailCard: {
    marginHorizontal: Spacing.lg, marginBottom: 2, marginTop: 0,
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
  },
  detailLabel: {
    ...Typography.caption1, color: Colors.textSecondary,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4,
  },
  detailText: { ...Typography.footnote, color: Colors.text, lineHeight: 18, marginTop: 3 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.accentBlue,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  addBtnLoading: { opacity: 0.7 },
  addBtnText: { ...Typography.subhead, fontWeight: '700', color: Colors.white },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
});
