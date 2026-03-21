import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Keyboard, Modal,
  Pressable, ScrollView, StyleSheet, Text, TextInput,
  TextStyle, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { Chip } from '@/src/ui/components/Chip';
import { communityService, CommunityClass, haversineKm } from '@/src/services/CommunityService';

const AGENCIES = ['All', 'PADI', 'SSI', 'NAUI', 'SDI', 'TDI', 'GUE', 'IANTD', 'BSAC', 'CMAS', 'RAID'];

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

export default function ClassesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [agency, setAgency] = useState('All');
  const [results, setResults] = useState<CommunityClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [showPost, setShowPost] = useState(false);

  // Post form state
  const [pTitle, setPTitle] = useState('');
  const [pAgency, setPAgency] = useState('');
  const [pCertLevel, setPCertLevel] = useState('');
  const [pInstructor, setPInstructor] = useState('');
  const [pCenter, setPCenter] = useState('');
  const [pLocation, setPLocation] = useState('');
  const [pStartDate, setPStartDate] = useState('');
  const [pEndDate, setPEndDate] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pMaxStudents, setPMaxStudents] = useState('');
  const [pSpots, setPSpots] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrereqs, setPPrereqs] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [posting, setPosting] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      let items = await communityService.searchClasses(q);
      if (agency !== 'All') {
        items = items.filter(c => c.agency?.toLowerCase().includes(agency.toLowerCase()) ?? false);
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
  }, [agency, nearMe, userLoc]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(query), 400);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [query, agency, nearMe, userLoc, doSearch]);

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
    if (!pTitle.trim() || (!pEmail.trim() && !pPhone.trim())) {
      Alert.alert('Required Fields', 'Please enter a title and at least one contact method.');
      return;
    }
    setPosting(true);
    const code = randomCode();
    try {
      await communityService.createClass({
        title: pTitle.trim(),
        agency: pAgency.trim() || null,
        certLevel: pCertLevel.trim() || null,
        instructorName: pInstructor.trim() || null,
        diveCenterName: pCenter.trim() || null,
        locationText: pLocation.trim() || null,
        latitude: null, longitude: null,
        startDate: pStartDate.trim() || null,
        endDate: pEndDate.trim() || null,
        priceUsd: pPrice ? parseFloat(pPrice) : null,
        maxStudents: pMaxStudents ? parseInt(pMaxStudents, 10) : null,
        spotsRemaining: pSpots ? parseInt(pSpots, 10) : null,
        description: pDesc.trim() || null,
        prerequisites: pPrereqs.trim() || null,
        contactEmail: pEmail.trim() || null,
        contactPhone: pPhone.trim() || null,
      }, code);
      setShowPost(false);
      resetPostForm();
      doSearch(query);
      Alert.alert(
        '🎉 Listing Posted!',
        `Save this claim code to edit or remove your listing later:\n\n${code}\n\nKeep it somewhere safe.`,
        [{ text: 'Copy & Close', onPress: () => Clipboard.setStringAsync(code) }]
      );
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not post listing. Check your connection.');
    } finally {
      setPosting(false);
    }
  }

  function resetPostForm() {
    setPTitle(''); setPAgency(''); setPCertLevel(''); setPInstructor(''); setPCenter('');
    setPLocation(''); setPStartDate(''); setPEndDate(''); setPPrice('');
    setPMaxStudents(''); setPSpots(''); setPDesc(''); setPPrereqs('');
    setPEmail(''); setPPhone('');
  }

  const distLabel = (item: CommunityClass) => {
    if (!nearMe || !userLoc || item.latitude == null || item.longitude == null) return null;
    const km = haversineKm(userLoc.lat, userLoc.lon, item.latitude, item.longitude);
    return km < 1 ? `< 1 km` : `${km.toFixed(0)} km`;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Find a Class</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowPost(true)}>
          <Ionicons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search classes, agencies, location…"
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

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        <Chip label={nearMe ? '📍 Near Me' : 'Near Me'} selected={nearMe} onPress={handleNearMeToggle} />
        {AGENCIES.map(a => (
          <Chip key={a} label={a} selected={agency === a} onPress={() => setAgency(a)} />
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accentBlue} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎓</Text>
          <Text style={styles.emptyTitle}>No classes found</Text>
          <Text style={styles.emptySub}>Be the first to post one — tap the + button above.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/discover/class-detail?id=${item.id}` as Parameters<typeof router.push>[0])}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {item.agency && <View style={styles.agencyBadge}><Text style={styles.agencyText}>{item.agency}</Text></View>}
              </View>
              {(item.instructorName || item.diveCenterName) && (
                <Text style={styles.cardMeta} numberOfLines={1}>
                  <Ionicons name="person-outline" size={12} /> {item.instructorName ?? item.diveCenterName}
                </Text>
              )}
              {item.locationText && (
                <Text style={styles.cardMeta} numberOfLines={1}>
                  <Ionicons name="location-outline" size={12} /> {item.locationText}
                  {distLabel(item) ? `  ·  ${distLabel(item)}` : ''}
                </Text>
              )}
              <View style={styles.cardFooter}>
                {item.startDate && <Text style={styles.cardDate}>{formatDateRange(item.startDate, item.endDate)}</Text>}
                {item.priceUsd != null && <Text style={styles.cardPrice}>${item.priceUsd}</Text>}
                {item.spotsRemaining != null && (
                  <View style={styles.spotsBadge}>
                    <Text style={styles.spotsText}>{item.spotsRemaining} spots</Text>
                  </View>
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
            <Text style={styles.modalTitle}>Post a Class</Text>
            <Pressable onPress={() => { setShowPost(false); resetPostForm(); }}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <FieldLabel>CLASS TITLE *</FieldLabel>
            <TextInput style={styles.field} value={pTitle} onChangeText={setPTitle} placeholder="e.g. PADI Open Water Course" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>AGENCY</FieldLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg }}>
                {AGENCIES.slice(1).map(a => (
                  <Chip key={a} label={a} selected={pAgency === a} onPress={() => setPAgency(pAgency === a ? '' : a)} />
                ))}
              </View>
            </ScrollView>

            <FieldLabel>CERTIFICATION LEVEL</FieldLabel>
            <TextInput style={styles.field} value={pCertLevel} onChangeText={setPCertLevel} placeholder="e.g. Open Water, AOW, Rescue…" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>INSTRUCTOR NAME</FieldLabel>
            <TextInput style={styles.field} value={pInstructor} onChangeText={setPInstructor} placeholder="Your name" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>DIVE CENTER</FieldLabel>
            <TextInput style={styles.field} value={pCenter} onChangeText={setPCenter} placeholder="Dive center or shop name" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>LOCATION</FieldLabel>
            <TextInput style={styles.field} value={pLocation} onChangeText={setPLocation} placeholder="City, state, or country" placeholderTextColor={Colors.textTertiary} />

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
                <TextInput style={styles.field} value={pSpots} onChangeText={setPSpots} placeholder="e.g. 4" keyboardType="numeric" placeholderTextColor={Colors.textTertiary} />
              </View>
            </View>

            <FieldLabel>PREREQUISITES</FieldLabel>
            <TextInput style={styles.field} value={pPrereqs} onChangeText={setPPrereqs} placeholder="Required certifications or experience" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>DESCRIPTION</FieldLabel>
            <TextInput style={[styles.field, styles.fieldMulti]} value={pDesc} onChangeText={setPDesc} placeholder="What students will learn, schedule, what's included…" placeholderTextColor={Colors.textTertiary} multiline numberOfLines={4} textAlignVertical="top" />

            <FieldLabel>CONTACT EMAIL *</FieldLabel>
            <TextInput style={styles.field} value={pEmail} onChangeText={setPEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.textTertiary} />

            <FieldLabel>CONTACT PHONE</FieldLabel>
            <TextInput style={styles.field} value={pPhone} onChangeText={setPPhone} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" placeholderTextColor={Colors.textTertiary} />

            <Text style={styles.disclaimer}>* Required. You'll receive a 6-digit claim code to remove your listing anytime.</Text>

            <Pressable
              style={[styles.postBtn, (!pTitle.trim() || (!pEmail.trim() && !pPhone.trim()) || posting) && styles.postBtnDisabled]}
              onPress={handlePost}
              disabled={!pTitle.trim() || (!pEmail.trim() && !pPhone.trim()) || posting}
            >
              {posting
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.postBtnText}>Post Class Listing</Text>
              }
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
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  cardTitle: { ...Typography.subhead as TextStyle, fontWeight: '700' as const, color: Colors.text, flex: 1 },
  agencyBadge: {
    backgroundColor: Colors.accentBlue + '18', borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  agencyText: { ...Typography.caption2 as TextStyle, color: Colors.accentBlue, fontWeight: '700' as const },
  cardMeta: { ...Typography.caption1 as TextStyle, color: Colors.textSecondary },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  cardDate: { ...Typography.caption1 as TextStyle, color: Colors.textSecondary, flex: 1 },
  cardPrice: { ...Typography.subhead as TextStyle, color: Colors.accentBlue, fontWeight: '700' as const },
  spotsBadge: { backgroundColor: '#34C75918', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  spotsText: { ...Typography.caption2 as TextStyle, color: '#34C759', fontWeight: '600' as const },
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
  disclaimer: { ...Typography.caption2 as TextStyle, color: Colors.textTertiary, marginTop: Spacing.lg, lineHeight: 16 },
  postBtn: {
    backgroundColor: Colors.accentBlue, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.lg,
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { ...Typography.subhead as TextStyle, color: '#FFF', fontWeight: '700' as const },
});
