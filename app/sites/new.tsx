import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/src/ui/components/Card';
import { Chip } from '@/src/ui/components/Chip';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useSiteStore } from '@/src/stores/siteStore';
import { useUIStore } from '@/src/stores/uiStore';
import { generateEAPFromCoords, geocodeLocation } from '@/src/utils/eapAutoGen';

const M_TO_FT = 3.28084;

function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}
function depthToMeters(val: string, imp: boolean): number | null {
  const n = parseNum(val);
  return n != null ? (imp ? n / M_TO_FT : n) : null;
}
function metersToStr(m: number | null, imp: boolean): string {
  if (m == null) return '';
  return imp ? (m * M_TO_FT).toFixed(0) : m.toFixed(1);
}

export default function NewSiteScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { sites, createSite, updateSite, updateEAP } = useSiteStore();
  const { unitSystem, setUnitSystem } = useUIStore();
  const imp = unitSystem === 'imperial';

  const [name,         setName]         = useState('');
  const [location,     setLocation]     = useState('');
  const [maxDepth,     setMaxDepth]     = useState('');
  const [description,  setDescription]  = useState('');
  const [conditions,   setConditions]   = useState('');
  const [accessNotes,  setAccessNotes]  = useState('');

  // Coordinates (from geocoding or GPS)
  const [latitude,      setLatitude]      = useState<number | null>(null);
  const [longitude,     setLongitude]     = useState<number | null>(null);
  const [coordSource,   setCoordSource]   = useState<'geocode' | 'gps' | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [gpsLoading,    setGpsLoading]    = useState(false);

  useEffect(() => {
    if (!editId) return;
    const site = sites.find((s) => s.id === editId);
    if (!site) return;
    setName(site.name);
    setLocation(site.location ?? '');
    setMaxDepth(metersToStr(site.maxDepthMeters, imp));
    setDescription(site.description ?? '');
    setConditions(site.conditions ?? '');
    setAccessNotes(site.accessNotes ?? '');
    setLatitude(site.latitude ?? null);
    setLongitude(site.longitude ?? null);
    if (site.latitude != null) setCoordSource('geocode');
  }, [editId]);

  async function handleLookupLocation() {
    const q = location.trim();
    if (!q) {
      Alert.alert('Enter a Location', 'Type a location name or address in the Location field first.');
      return;
    }
    setLookupLoading(true);
    try {
      const result = await geocodeLocation(q);
      if (!result) {
        Alert.alert('Not Found', `Could not find coordinates for "${q}". Try a more specific address (e.g. "Key Largo, FL" or "26.77, -80.06").`);
        return;
      }
      setLatitude(result.lat);
      setLongitude(result.lon);
      setCoordSource('geocode');
    } catch {
      Alert.alert('Lookup Failed', 'Could not reach the geocoding service. Check your connection and try again.');
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleGetGPS() {
    setGpsLoading(true);
    try {
      // Check if Location Services are enabled at the device level first
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Location Services Off',
          'Location Services are disabled on your device.\n\nGo to Settings → Privacy & Security → Location Services and turn it on.',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Thalos needs location access to auto-generate your Emergency Action Plan.\n\nGo to Settings → Privacy & Security → Location Services → Thalos → select "While Using the App".',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
    } catch {
      Alert.alert('GPS Error', 'Could not determine your location. Try again.');
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a site name.');
      return;
    }
    const input = {
      name:           name.trim(),
      location:       location.trim() || null,
      maxDepthMeters: depthToMeters(maxDepth, imp),
      description:    description.trim() || null,
      conditions:     conditions.trim() || null,
      accessNotes:    accessNotes.trim() || null,
      latitude,
      longitude,
    };

    if (editId) {
      updateSite(editId, input);
      // Re-generate EAP if coordinates changed and coords are present
      if (latitude != null && longitude != null) {
        runAutoGen(editId, latitude, longitude);
      }
    } else {
      const site = createSite(input);
      if (latitude != null && longitude != null) {
        runAutoGen(site.id, latitude, longitude);
      }
    }
    router.dismiss();
  }

  function runAutoGen(siteId: string, lat: number, lon: number) {
    // Fire-and-forget — runs after navigation returns
    generateEAPFromCoords(lat, lon)
      .then((data) => {
        updateEAP(siteId, {
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
      .catch(() => {
        // Silently fail — EAP stays empty, user can fill manually
      });
  }

  function clearCoords() {
    setLatitude(null);
    setLongitude(null);
    setCoordSource(null);
  }

  const depthUnit = imp ? 'ft' : 'm';
  const hasCoords = latitude != null && longitude != null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.dismiss()} style={styles.headerBtn}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{editId ? 'Edit Site' : 'New Site'}</Text>
        <Pressable onPress={handleSave} style={styles.headerBtn}>
          <Text style={styles.headerSave}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Units */}
          <View style={styles.unitRow}>
            <Text style={styles.unitLabel}>Units</Text>
            <View style={styles.chipRow}>
              <Chip label="Metric" selected={!imp} onPress={() => setUnitSystem('metric')} />
              <Chip label="Imperial" selected={imp} onPress={() => setUnitSystem('imperial')} />
            </View>
          </View>

          <SectionLabel label="Site Info" />
          <Card variant="input" style={styles.card}>
            <FormField label="Site Name *" value={name} onChangeText={setName} placeholder="e.g. Blue Heron Bridge" />
            <Divider />
            {/* Location field with inline Look Up button */}
            <View style={subStyles.field}>
              <View style={styles.locationLabelRow}>
                <Text style={subStyles.fieldLabel}>Location</Text>
                <Pressable
                  onPress={handleLookupLocation}
                  disabled={lookupLoading || !location.trim()}
                  style={styles.lookupBtn}
                >
                  {lookupLoading ? (
                    <ActivityIndicator size="small" color={Colors.accentBlue} />
                  ) : (
                    <Text style={[
                      styles.lookupBtnText,
                      (!location.trim()) && styles.lookupBtnDisabled,
                    ]}>
                      Look Up
                    </Text>
                  )}
                </Pressable>
              </View>
              <TextInput
                style={subStyles.input}
                value={location}
                onChangeText={(t) => { setLocation(t); if (hasCoords) clearCoords(); }}
                placeholder="e.g. Key Largo, FL"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <Divider />
            <FormField label={`Max Depth (${depthUnit})`} value={maxDepth} onChangeText={setMaxDepth} placeholder="0" keyboardType="decimal-pad" />
          </Card>

          {/* Coordinate status row */}
          {hasCoords ? (
            <View style={styles.coordStatus}>
              <Ionicons
                name={coordSource === 'gps' ? 'locate' : 'search-circle'}
                size={15}
                color={Colors.accentTeal}
              />
              <Text style={styles.coordStatusText}>
                {coordSource === 'gps' ? 'GPS' : 'Location found'} · {latitude!.toFixed(4)}, {longitude!.toFixed(4)}
              </Text>
              <Pressable onPress={clearCoords} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
              </Pressable>
            </View>
          ) : null}

          {/* GPS fallback */}
          <Pressable
            style={[styles.gpsSecondaryBtn, gpsLoading && { opacity: 0.6 }]}
            onPress={handleGetGPS}
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color={Colors.textSecondary} />
            ) : (
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            )}
            <Text style={styles.gpsSecondaryText}>
              {gpsLoading ? 'Getting GPS…' : 'Use current GPS instead'}
            </Text>
          </Pressable>

          {hasCoords && (
            <View style={styles.autoGenNote}>
              <Ionicons name="flash" size={13} color="#FF9500" />
              <Text style={styles.autoGenNoteText}>
                EAP will auto-generate with nearby hospitals, hyperbaric chambers,
                and local emergency numbers when you save.
              </Text>
            </View>
          )}

          <SectionLabel label="Description" />
          <Card variant="input" style={styles.card}>
            <FormField label="Description" value={description} onChangeText={setDescription} placeholder="Overview of the dive site..." multiline />
            <Divider />
            <FormField label="Typical Conditions" value={conditions} onChangeText={setConditions} placeholder="e.g. Calm, mild current, good vis" multiline />
          </Card>

          <SectionLabel label="Access" />
          <Card variant="input" style={styles.card}>
            <FormField label="Access Notes" value={accessNotes} onChangeText={setAccessNotes} placeholder="Parking, entry points, permits..." multiline />
          </Card>

          <View style={{ height: insets.bottom + Spacing.xxxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={subStyles.sectionLabel}>{label}</Text>;
}
function Divider() {
  return <View style={subStyles.divider} />;
}
function FormField({
  label, value, onChangeText, placeholder, keyboardType, multiline,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: TextInput['props']['keyboardType']; multiline?: boolean;
}) {
  return (
    <View style={subStyles.field}>
      <Text style={subStyles.fieldLabel}>{label}</Text>
      <TextInput
        style={[subStyles.input, multiline && subStyles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        scrollEnabled={false}
      />
    </View>
  );
}

const subStyles = StyleSheet.create({
  sectionLabel: {
    ...Typography.footnote, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.xl, marginBottom: Spacing.sm, marginHorizontal: 2,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  field: { paddingVertical: Spacing.xs },
  fieldLabel: { ...Typography.caption1, color: Colors.textSecondary, marginBottom: 3 },
  input: { ...Typography.body, color: Colors.text, paddingVertical: Spacing.xs, minHeight: 36 },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: { ...Typography.headline, color: Colors.text },
  headerCancel: { ...Typography.body, color: Colors.textSecondary },
  headerSave: { ...Typography.body, fontWeight: '600', color: Colors.accentBlue, textAlign: 'right' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
  card: { marginBottom: 0 },
  unitRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
  unitLabel: {
    ...Typography.footnote, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  chipRow: { flexDirection: 'row', gap: Spacing.sm },

  // Inline Look Up
  locationLabelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 3,
  },
  lookupBtn: { paddingHorizontal: 4, paddingVertical: 2 },
  lookupBtnText: { ...Typography.caption1, color: Colors.accentBlue, fontWeight: '700' },
  lookupBtnDisabled: { color: Colors.textTertiary },

  // Coordinate status
  coordStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 7,
    backgroundColor: Colors.accentTeal + '15',
    borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.accentTeal + '40',
  },
  coordStatusText: { ...Typography.caption1, color: Colors.accentTeal, flex: 1 },

  // GPS secondary
  gpsSecondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: Spacing.sm, alignSelf: 'flex-start',
  },
  gpsSecondaryText: { ...Typography.caption1, color: Colors.textSecondary },

  // Auto-gen note
  autoGenNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(255,149,0,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.20)',
    borderRadius: 8,
    padding: Spacing.sm,
  },
  autoGenNoteText: {
    ...Typography.caption1, color: '#CC7700', flex: 1, lineHeight: 17,
  },
});
