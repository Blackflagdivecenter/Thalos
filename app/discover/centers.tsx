import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Keyboard, Modal,
  Pressable, ScrollView, StyleSheet, Text, TextInput,
  TextStyle, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { Chip } from '@/src/ui/components/Chip';
import { communityService, CommunityDiveCenter, haversineKm } from '@/src/services/CommunityService';

const AGENCIES = ['All', 'PADI', 'SSI', 'NAUI', 'SDI', 'TDI', 'GUE', 'IANTD', 'BSAC', 'CMAS', 'RAID'];
const CENTER_TYPES = ['All', 'Retail', 'Service', 'Both', 'Resort'];
const TYPE_COLORS: Record<string, string> = {
  retail: '#007AFF', service: '#FF9500', both: Colors.accentBlue, resort: '#AF52DE',
};
const BRAND_SUGGESTIONS = [
  'Scubapro', 'Aqualung', 'Mares', 'Cressi', 'Atomic Aquatics', 'Shearwater',
  'Suunto', 'Garmin', 'Apeks', 'Hollis', 'Fourth Element', 'Waterproof', 'DUI', 'Bare', 'Orca',
];

function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function CentersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [agency, setAgency] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [results, setResults] = useState<CommunityDiveCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [showPost, setShowPost] = useState(false);

  // Post form
  const [pName, setPName] = useState('');
  const [pType, setPType] = useState('Both');
  const [pAddress, setPAddress] = useState('');
  const [pCity, setPCity] = useState('');
  const [pState, setPState] = useState('');
  const [pCountry, setPCountry] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pWebsite, setPWebsite] = useState('');
  const [pBrandsSold, setPBrandsSold] = useState<string[]>([]);
  const [pBrandsServiced, setPBrandsServiced] = useState<string[]>([]);
  const [pAgencies, setPAgencies] = useState<string[]>([]);
  const [pDesc, setPDesc] = useState('');
  const [brandSoldInput, setBrandSoldInput] = useState('');
  const [brandServicedInput, setBrandServicedInput] = useState('');
  const [posting, setPosting] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      let items = await communityService.searchCenters(q, agency !== 'All' ? agency : undefined);
      if (typeFilter !== 'All') {
        items = items.filter(c => c.type.toLowerCase() === typeFilter.toLowerCase());
      }
      if (nearMe && userLoc) {
        items = items
          .filter(c => c.latitude != null && c.longitude != null)
          .sort((a, b) =>
            haversineKm(userLoc.lat, userLoc.lon, a.latitude!, a.longitude!) -
            haversineKm(userLoc.lat, userLoc.lon, b.latitude!, b.longitude!)
          );
      }
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [agency, typeFilter, nearMe, userLoc]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(query), 400);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [query, agency, typeFilter, nearMe, userLoc, doSearch]);

  async function handleNearMeToggle() {
    if (nearMe) { setNearMe(false); return; }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location Required', 'Please enable location access in Settings to use Near Me sorting.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setUserLoc({ lat: loc.coords.latitude, lon: loc.coords.longitude });
    setNearMe(true);
  }

  function addBrandSold() {
    const b = brandSoldInput.trim();
    if (b && !pBrandsSold.includes(b)) setPBrandsSold(prev => [...prev, b]);
    setBrandSoldInput('');
  }
  function addBrandServiced() {
    const b = brandServicedInput.trim();
    if (b && !pBrandsServiced.includes(b)) setPBrandsServiced(prev => [...prev, b]);
    setBrandServicedInput('');
  }
  function toggleAgency(a: string) {
    setPAgencies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  async function handlePost() {
    if (!pName.trim()) {
      Alert.alert('Required', 'Please enter a shop name.');
      return;
    }
    setPosting(true);
    const code = randomCode();
    try {
      await communityService.createCenter({
        name: pName.trim(), type: pType.toLowerCase(),
        address: pAddress.trim() || null, city: pCity.trim() || null,
        stateRegion: pState.trim() || null, country: pCountry.trim() || null,
        phone: pPhone.trim() || null, email: pEmail.trim() || null,
        website: pWebsite.trim() || null,
        latitude: null, longitude: null,
        brandsSold: pBrandsSold, brandsServiced: pBrandsServiced, agencies: pAgencies,
        description: pDesc.trim() || null,
      }, code);
      setShowPost(false);
      resetForm();
      doSearch(query);
      Alert.alert(
        '🎉 Dive Center Listed!',
        `Save this claim code to remove your listing later:\n\n${code}`,
        [{ text: 'Copy & Close', onPress: () => Clipboard.setStringAsync(code) }]
      );
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not post listing.');
    } finally {
      setPosting(false);
    }
  }

  function resetForm() {
    setPName(''); setPType('Both'); setPAddress(''); setPCity(''); setPState(''); setPCountry('');
    setPPhone(''); setPEmail(''); setPWebsite('');
    setPBrandsSold([]); setPBrandsServiced([]); setPAgencies([]); setPDesc('');
    setBrandSoldInput(''); setBrandServicedInput('');
  }

  const distLabel = (c: CommunityDiveCenter) => {
    if (!nearMe || !userLoc || c.latitude == null || c.longitude == null) return null;
    const km = haversineKm(userLoc.lat, userLoc.lon, c.latitude, c.longitude);
    return km < 1 ? '< 1 km' : `${km.toFixed(0)} km`;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Find a Dive Center</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowPost(true)}>
          <Ionicons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Shop name, city, country…"
          placeholderTextColor={Colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        <Chip label={nearMe ? '📍 Near Me' : 'Near Me'} selected={nearMe} onPress={handleNearMeToggle} />
        {CENTER_TYPES.map(t => (
          <Chip key={t} label={t} selected={typeFilter === t} onPress={() => setTypeFilter(t)} />
        ))}
        <View style={styles.filterDivider} />
        {AGENCIES.map(a => (
          <Chip key={a} label={a} selected={agency === a} onPress={() => setAgency(a)} />
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.accentBlue} /></View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🤿</Text>
          <Text style={styles.emptyTitle}>No dive centers found</Text>
          <Text style={styles.emptySub}>Know a great shop? Add it with the + button.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => {
            const typeColor = TYPE_COLORS[item.type] ?? Colors.accentBlue;
            const brandTeaser = item.brandsSold.slice(0, 2).join(', ') +
              (item.brandsSold.length > 2 ? ` +${item.brandsSold.length - 2}` : '');
            const dist = distLabel(item);
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => router.push(`/discover/center-detail?id=${item.id}` as Parameters<typeof router.push>[0])}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
                    <Text style={[styles.typeText, { color: typeColor }]}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
                  </View>
                </View>
                {(item.city || item.stateRegion || item.country) && (
                  <Text style={styles.cardMeta}>
                    <Ionicons name="location-outline" size={12} /> {[item.city, item.stateRegion, item.country].filter(Boolean).join(', ')}
                    {dist ? `  ·  ${dist}` : ''}
                  </Text>
                )}
                {item.agencies.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                    {item.agencies.map(a => (
                      <View key={a} style={styles.agencyPill}>
                        <Text style={styles.agencyPillText}>{a}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
                <View style={styles.cardFooter}>
                  {brandTeaser ? <Text style={styles.brandTeaser}>{brandTeaser}</Text> : null}
                  {item.phone && <Text style={styles.cardPhone}>{item.phone}</Text>}
                  <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} style={styles.chevron} />
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Post Modal */}
      <Modal visible={showPost} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPost(false)}>
        <View style={[styles.modal, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>List Your Dive Center</Text>
            <Pressable onPress={() => { setShowPost(false); resetForm(); }}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <FieldLabel>SHOP NAME *</FieldLabel>
            <TextInput style={styles.field} value={pName} onChangeText={setPName} placeholder="Your dive shop name" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>TYPE</FieldLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg }}>
                {['Retail', 'Service', 'Both', 'Resort'].map(t => (
                  <Chip key={t} label={t} selected={pType === t} onPress={() => setPType(t)} />
                ))}
              </View>
            </ScrollView>

            <FieldLabel>ADDRESS</FieldLabel>
            <TextInput style={styles.field} value={pAddress} onChangeText={setPAddress} placeholder="Street address" placeholderTextColor={Colors.textTertiary} />

            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <FieldLabel>CITY</FieldLabel>
                <TextInput style={styles.field} value={pCity} onChangeText={setPCity} placeholder="City" placeholderTextColor={Colors.textTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>STATE / REGION</FieldLabel>
                <TextInput style={styles.field} value={pState} onChangeText={setPState} placeholder="State / Province" placeholderTextColor={Colors.textTertiary} />
              </View>
            </View>

            <FieldLabel>COUNTRY</FieldLabel>
            <TextInput style={styles.field} value={pCountry} onChangeText={setPCountry} placeholder="Country" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>PHONE</FieldLabel>
            <TextInput style={styles.field} value={pPhone} onChangeText={setPPhone} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>EMAIL</FieldLabel>
            <TextInput style={styles.field} value={pEmail} onChangeText={setPEmail} placeholder="info@shop.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>WEBSITE</FieldLabel>
            <TextInput style={styles.field} value={pWebsite} onChangeText={setPWebsite} placeholder="https://yourshop.com" keyboardType="url" autoCapitalize="none" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>AGENCY AFFILIATIONS</FieldLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg }}>
                {AGENCIES.slice(1).map(a => (
                  <Chip key={a} label={a} selected={pAgencies.includes(a)} onPress={() => toggleAgency(a)} />
                ))}
              </View>
            </ScrollView>

            <FieldLabel>BRANDS SOLD</FieldLabel>
            <View style={styles.tagInputRow}>
              <TextInput style={[styles.field, { flex: 1 }]} value={brandSoldInput} onChangeText={setBrandSoldInput} placeholder="Brand name…" placeholderTextColor={Colors.textTertiary} onSubmitEditing={addBrandSold} returnKeyType="done" />
              <Pressable style={styles.tagAddBtn} onPress={addBrandSold}>
                <Ionicons name="add" size={20} color="#FFF" />
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg }}>
                {BRAND_SUGGESTIONS.filter(b => !pBrandsSold.includes(b)).slice(0, 8).map(b => (
                  <Pressable key={b} style={styles.suggestionPill} onPress={() => setPBrandsSold(prev => [...prev, b])}>
                    <Text style={styles.suggestionText}>+ {b}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            {pBrandsSold.length > 0 && (
              <View style={styles.tagCloud}>
                {pBrandsSold.map(b => (
                  <Pressable key={b} style={styles.tagChip} onPress={() => setPBrandsSold(prev => prev.filter(x => x !== b))}>
                    <Text style={styles.tagText}>{b}</Text>
                    <Ionicons name="close" size={12} color={Colors.accentBlue} />
                  </Pressable>
                ))}
              </View>
            )}

            <FieldLabel>BRANDS SERVICED</FieldLabel>
            <View style={styles.tagInputRow}>
              <TextInput style={[styles.field, { flex: 1 }]} value={brandServicedInput} onChangeText={setBrandServicedInput} placeholder="Brand name…" placeholderTextColor={Colors.textTertiary} onSubmitEditing={addBrandServiced} returnKeyType="done" />
              <Pressable style={styles.tagAddBtn} onPress={addBrandServiced}>
                <Ionicons name="add" size={20} color="#FFF" />
              </Pressable>
            </View>
            {pBrandsServiced.length > 0 && (
              <View style={styles.tagCloud}>
                {pBrandsServiced.map(b => (
                  <Pressable key={b} style={styles.tagChip} onPress={() => setPBrandsServiced(prev => prev.filter(x => x !== b))}>
                    <Text style={styles.tagText}>{b}</Text>
                    <Ionicons name="close" size={12} color={Colors.accentBlue} />
                  </Pressable>
                ))}
              </View>
            )}

            <FieldLabel>DESCRIPTION</FieldLabel>
            <TextInput style={[styles.field, styles.fieldMulti]} value={pDesc} onChangeText={setPDesc} placeholder="Tell divers about your shop, specialties, services…" multiline numberOfLines={4} textAlignVertical="top" placeholderTextColor={Colors.textTertiary} />

            <Text style={styles.disclaimer}>* Required. You'll receive a 6-digit claim code to remove your listing anytime.</Text>

            <Pressable
              style={[styles.postBtn, (!pName.trim() || posting) && styles.postBtnDisabled]}
              onPress={handlePost}
              disabled={!pName.trim() || posting}
            >
              {posting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.postBtnText}>List Dive Center</Text>}
            </Pressable>
            <View style={{ height: Spacing.xxxl }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 50 },
  backText: { ...Typography.body, color: Colors.accentBlue },
  headerTitle: { ...Typography.subhead, color: Colors.text, fontWeight: '600' as const },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.accentBlue, alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    margin: Spacing.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, ...Typography.body as TextStyle, color: Colors.text },
  filterRow: { flexShrink: 0, maxHeight: 44 },
  filterContent: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.sm, alignItems: 'center' as const },
  filterDivider: { width: 1, height: 20, backgroundColor: Colors.border, marginHorizontal: Spacing.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxxl, gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...Typography.title3 as TextStyle, color: Colors.text },
  emptySub: { ...Typography.body as TextStyle, color: Colors.textSecondary, textAlign: 'center' as const },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  sep: { height: Spacing.sm },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: 4,
  },
  cardPressed: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: { ...Typography.subhead as TextStyle, fontWeight: '700' as const, color: Colors.text, flex: 1 },
  typeBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  typeText: { ...Typography.caption2 as TextStyle, fontWeight: '700' as const },
  cardMeta: { ...Typography.caption1 as TextStyle, color: Colors.textSecondary },
  pillRow: { marginTop: 2, marginBottom: 2 },
  agencyPill: {
    backgroundColor: Colors.accentBlue + '18', borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2, marginRight: Spacing.xs,
  },
  agencyPillText: { ...Typography.caption2 as TextStyle, color: Colors.accentBlue, fontWeight: '600' as const },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  brandTeaser: { ...Typography.caption1 as TextStyle, color: Colors.textSecondary, flex: 1 },
  cardPhone: { ...Typography.caption1 as TextStyle, color: Colors.accentBlue },
  chevron: { marginLeft: 'auto' as const },
  // Modal
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface,
  },
  modalTitle: { ...Typography.headline as TextStyle, fontWeight: '600' as const, color: Colors.text },
  modalBody: { flex: 1, padding: Spacing.lg },
  fieldLabel: {
    ...Typography.caption2 as TextStyle, fontWeight: '700' as const, color: Colors.textSecondary,
    textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6, marginTop: Spacing.md,
  },
  field: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Typography.body as TextStyle, color: Colors.text,
  },
  fieldMulti: { minHeight: 100 },
  rowFields: { flexDirection: 'row', gap: Spacing.md },
  tagInputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  tagAddBtn: {
    width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.accentBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionPill: {
    backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
  },
  suggestionText: { ...Typography.caption1 as TextStyle, color: Colors.accentBlue },
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: Spacing.sm, marginVertical: Spacing.sm },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accentBlue + '14', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
  },
  tagText: { ...Typography.caption1 as TextStyle, color: Colors.accentBlue },
  disclaimer: { ...Typography.caption2 as TextStyle, color: Colors.textTertiary, marginTop: Spacing.lg, lineHeight: 16 },
  postBtn: {
    backgroundColor: Colors.accentBlue, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.lg,
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { ...Typography.subhead as TextStyle, color: '#FFF', fontWeight: '700' as const },
});
