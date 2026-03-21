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
import { communityService, CommunityTrip, haversineKm } from '@/src/services/CommunityService';

const ORGANIZER_TYPES = ['Diver', 'Instructor', 'Dive Center', 'Resort'];

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return '';
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  return '';
}

function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function TripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommunityTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [showPost, setShowPost] = useState(false);

  // Post form
  const [pTitle, setPTitle] = useState('');
  const [pDest, setPDest] = useState('');
  const [pOrgName, setPOrgName] = useState('');
  const [pOrgType, setPOrgType] = useState('');
  const [pLocation, setPLocation] = useState('');
  const [pStartDate, setPStartDate] = useState('');
  const [pEndDate, setPEndDate] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pSpotsTotal, setPSpotsTotal] = useState('');
  const [pSpots, setPSpots] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pIncludes, setPIncludes] = useState('');
  const [pReqCert, setPReqCert] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [posting, setPosting] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      let items = await communityService.searchTrips(q);
      if (nearMe && userLoc) {
        items = items
          .filter(t => t.latitude != null && t.longitude != null)
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
  }, [nearMe, userLoc]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(query), 400);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [query, nearMe, userLoc, doSearch]);

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

  async function handlePost() {
    if (!pTitle.trim() || !pDest.trim() || (!pEmail.trim() && !pPhone.trim())) {
      Alert.alert('Required Fields', 'Please enter a title, destination, and at least one contact method.');
      return;
    }
    setPosting(true);
    const code = randomCode();
    try {
      await communityService.createTrip({
        title: pTitle.trim(), destination: pDest.trim(),
        organizerName: pOrgName.trim() || null,
        organizerType: pOrgType || null,
        locationText: pLocation.trim() || null,
        latitude: null, longitude: null,
        startDate: pStartDate.trim() || null, endDate: pEndDate.trim() || null,
        priceUsd: pPrice ? parseFloat(pPrice) : null,
        spotsTotal: pSpotsTotal ? parseInt(pSpotsTotal, 10) : null,
        spotsRemaining: pSpots ? parseInt(pSpots, 10) : null,
        description: pDesc.trim() || null,
        includes: pIncludes.trim() || null,
        requiredCert: pReqCert.trim() || null,
        contactEmail: pEmail.trim() || null,
        contactPhone: pPhone.trim() || null,
      }, code);
      setShowPost(false);
      resetForm();
      doSearch(query);
      Alert.alert(
        '🎉 Trip Posted!',
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
    setPTitle(''); setPDest(''); setPOrgName(''); setPOrgType(''); setPLocation('');
    setPStartDate(''); setPEndDate(''); setPPrice(''); setPSpotsTotal(''); setPSpots('');
    setPDesc(''); setPIncludes(''); setPReqCert(''); setPEmail(''); setPPhone('');
  }

  const distLabel = (item: CommunityTrip) => {
    if (!nearMe || !userLoc || item.latitude == null || item.longitude == null) return null;
    const km = haversineKm(userLoc.lat, userLoc.lon, item.latitude, item.longitude);
    return km < 1 ? '< 1 km' : `${km.toFixed(0)} km`;
  };

  const orgIcon: Record<string, string> = {
    diver: 'person-outline', instructor: 'school-outline', 'dive center': 'business-outline',
    resort: 'home-outline',
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Find a Trip</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowPost(true)}>
          <Ionicons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search destination, organizer…"
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
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.accentBlue} /></View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✈️</Text>
          <Text style={styles.emptyTitle}>No trips found</Text>
          <Text style={styles.emptySub}>Be the first to post a group dive trip.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/discover/trip-detail?id=${item.id}` as Parameters<typeof router.push>[0])}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.destBadge}><Text style={styles.destText}>{item.destination}</Text></View>
              </View>
              {item.organizerName && (
                <Text style={styles.cardMeta}>
                  <Ionicons name={(orgIcon[item.organizerType?.toLowerCase() ?? ''] ?? 'person-outline') as any} size={12} /> {item.organizerName}
                  {item.organizerType ? ` · ${item.organizerType}` : ''}
                </Text>
              )}
              {item.locationText && (
                <Text style={styles.cardMeta}>
                  <Ionicons name="location-outline" size={12} /> {item.locationText}
                  {distLabel(item) ? `  ·  ${distLabel(item)}` : ''}
                </Text>
              )}
              {item.requiredCert && (
                <Text style={styles.cardMeta}>
                  <Ionicons name="ribbon-outline" size={12} /> Min cert: {item.requiredCert}
                </Text>
              )}
              <View style={styles.cardFooter}>
                {item.startDate && <Text style={styles.cardDate}>{formatDateRange(item.startDate, item.endDate)}</Text>}
                {item.priceUsd != null && <Text style={styles.cardPrice}>${item.priceUsd}</Text>}
                {item.spotsRemaining != null && (
                  <View style={styles.spotsBadge}><Text style={styles.spotsText}>{item.spotsRemaining} spots</Text></View>
                )}
                <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} style={styles.chevron} />
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Post Modal */}
      <Modal visible={showPost} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPost(false)}>
        <View style={[styles.modal, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Post a Trip</Text>
            <Pressable onPress={() => { setShowPost(false); resetForm(); }}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <FieldLabel>TRIP TITLE *</FieldLabel>
            <TextInput style={styles.field} value={pTitle} onChangeText={setPTitle} placeholder="e.g. Cozumel Drift Diving Week" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>DESTINATION *</FieldLabel>
            <TextInput style={styles.field} value={pDest} onChangeText={setPDest} placeholder="e.g. Cozumel, Mexico" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>ORGANIZER NAME</FieldLabel>
            <TextInput style={styles.field} value={pOrgName} onChangeText={setPOrgName} placeholder="Your name or organization" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>ORGANIZER TYPE</FieldLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg }}>
                {ORGANIZER_TYPES.map(t => (
                  <Chip key={t} label={t} selected={pOrgType === t} onPress={() => setPOrgType(pOrgType === t ? '' : t)} />
                ))}
              </View>
            </ScrollView>

            <FieldLabel>DEPARTURE / MEET LOCATION</FieldLabel>
            <TextInput style={styles.field} value={pLocation} onChangeText={setPLocation} placeholder="City, airport, or marina" placeholderTextColor={Colors.textTertiary} />

            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <FieldLabel>START DATE</FieldLabel>
                <TextInput style={styles.field} value={pStartDate} onChangeText={setPStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>END DATE</FieldLabel>
                <TextInput style={styles.field} value={pEndDate} onChangeText={setPEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary} />
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <FieldLabel>PRICE (USD)</FieldLabel>
                <TextInput style={styles.field} value={pPrice} onChangeText={setPPrice} placeholder="0.00" keyboardType="numeric" placeholderTextColor={Colors.textTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>SPOTS REMAINING</FieldLabel>
                <TextInput style={styles.field} value={pSpots} onChangeText={setPSpots} placeholder="e.g. 6" keyboardType="numeric" placeholderTextColor={Colors.textTertiary} />
              </View>
            </View>

            <FieldLabel>REQUIRED CERTIFICATION</FieldLabel>
            <TextInput style={styles.field} value={pReqCert} onChangeText={setPReqCert} placeholder="e.g. Open Water, Advanced, None" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>WHAT'S INCLUDED</FieldLabel>
            <TextInput style={[styles.field, styles.fieldMulti]} value={pIncludes} onChangeText={setPIncludes} placeholder="e.g. 3 dives/day, boat, tanks, nitrox, meals…" multiline numberOfLines={3} textAlignVertical="top" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>DESCRIPTION</FieldLabel>
            <TextInput style={[styles.field, styles.fieldMulti]} value={pDesc} onChangeText={setPDesc} placeholder="Tell divers about the trip, dive sites, difficulty…" multiline numberOfLines={4} textAlignVertical="top" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>CONTACT EMAIL *</FieldLabel>
            <TextInput style={styles.field} value={pEmail} onChangeText={setPEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>CONTACT PHONE</FieldLabel>
            <TextInput style={styles.field} value={pPhone} onChangeText={setPPhone} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" placeholderTextColor={Colors.textTertiary} />

            <Text style={styles.disclaimer}>* Required. You'll receive a 6-digit claim code to remove your listing anytime.</Text>

            <Pressable
              style={[styles.postBtn, (!pTitle.trim() || !pDest.trim() || (!pEmail.trim() && !pPhone.trim()) || posting) && styles.postBtnDisabled]}
              onPress={handlePost}
              disabled={!pTitle.trim() || !pDest.trim() || (!pEmail.trim() && !pPhone.trim()) || posting}
            >
              {posting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.postBtnText}>Post Trip Listing</Text>}
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
  headerTitle: { ...Typography.headline, color: Colors.text, fontWeight: '600' as const },
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
  filterContent: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.sm },
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
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, flexWrap: 'wrap' as const },
  cardTitle: { ...Typography.subhead as TextStyle, fontWeight: '700' as const, color: Colors.text, flex: 1 },
  destBadge: { backgroundColor: '#34C75918', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  destText: { ...Typography.caption2 as TextStyle, color: '#34C759', fontWeight: '700' as const },
  cardMeta: { ...Typography.caption1 as TextStyle, color: Colors.textSecondary },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  cardDate: { ...Typography.caption1 as TextStyle, color: Colors.textSecondary, flex: 1 },
  cardPrice: { ...Typography.subhead as TextStyle, color: Colors.accentBlue, fontWeight: '700' as const },
  spotsBadge: { backgroundColor: '#34C75918', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  spotsText: { ...Typography.caption2 as TextStyle, color: '#34C759', fontWeight: '600' as const },
  chevron: { marginLeft: 'auto' as const },
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
  fieldMulti: { minHeight: 80 },
  rowFields: { flexDirection: 'row', gap: Spacing.md },
  disclaimer: { ...Typography.caption2 as TextStyle, color: Colors.textTertiary, marginTop: Spacing.lg, lineHeight: 16 },
  postBtn: {
    backgroundColor: Colors.accentBlue, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.lg,
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { ...Typography.subhead as TextStyle, color: '#FFF', fontWeight: '700' as const },
});
