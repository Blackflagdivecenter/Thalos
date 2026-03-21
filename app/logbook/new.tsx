import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { Card } from '@/src/ui/components/Card';
import { Chip } from '@/src/ui/components/Chip';
import { CylinderPicker } from '@/src/ui/components/CylinderPicker';
import { Cylinder } from '@/src/data/cylinders';
import { DiveCylinder } from '@/src/models';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useDiveStore } from '@/src/stores/diveStore';
import { useUIStore } from '@/src/stores/uiStore';
import { useGearStore } from '@/src/stores/gearStore';
import { useTripStore } from '@/src/stores/tripStore';
import { DIVING_TYPE_LABELS } from '@/src/utils/gearUtils';
import { DiveType } from '@/src/models';
import { todayISO } from '@/src/utils/uuid';

// ── Unit conversion ───────────────────────────────────────────────────────────
const M_TO_FT = 3.28084;
const BAR_TO_PSI = 14.5038;
const L_TO_CUFT = 0.0353147;

function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}
function parseIntNum(s: string): number | null {
  const n = parseInt(s, 10);
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
function pressureToBar(val: string, imp: boolean): number | null {
  const n = parseNum(val);
  return n != null ? (imp ? n / BAR_TO_PSI : n) : null;
}
function barToStr(b: number | null, imp: boolean): string {
  if (b == null) return '';
  return imp ? Math.round(b * BAR_TO_PSI).toString() : Math.round(b).toString();
}
function tempToCelsius(val: string, imp: boolean): number | null {
  const n = parseNum(val);
  return n != null ? (imp ? (n - 32) * 5 / 9 : n) : null;
}
function celsiusToStr(c: number | null, imp: boolean): string {
  if (c == null) return '';
  return imp ? (c * 9 / 5 + 32).toFixed(1) : c.toFixed(1);
}

// ── Types ─────────────────────────────────────────────────────────────────────
const GAS_TYPES = ['Air', 'EAN32', 'EAN36', 'Nitrox', 'Trimix'];

const ACTIVITY_TAGS = [
  'Boat', 'Shore', 'Drift', 'Cave', 'Wreck', 'Night', 'Training',
  'Photography', 'Deep', 'Liveaboard', 'Ice', 'Freediving',
];
const MAX_CYLINDERS = 4;

interface CylEntry {
  cylinder: Cylinder | null;
  startPressure: string;
  endPressure: string;
}

const emptyCylEntry = (): CylEntry => ({ cylinder: null, startPressure: '', endPressure: '' });

// ── Component ─────────────────────────────────────────────────────────────────
export default function NewDiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { dives, createDive, editDive } = useDiveStore();
  const { unitSystem, setUnitSystem } = useUIStore();
  const { sets: gearSets, logDivesOnSet, loadGear } = useGearStore();
  const { trips, loadTrips } = useTripStore();
  const imp = unitSystem === 'imperial';

  // Gear set selector (create mode only — not shown for edits)
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);

  // Form state
  const [diveType, setDiveType] = useState<DiveType>('RECREATIONAL');
  const [date, setDate] = useState(todayISO());
  const [siteName, setSiteName] = useState('');
  const [maxDepth, setMaxDepth] = useState('');
  const [bottomTime, setBottomTime] = useState('');
  const [surfaceInterval, setSurfaceInterval] = useState('');
  const [waterTemp, setWaterTemp] = useState('');
  const [gasType, setGasType] = useState('Air');
  const [cylEntries, setCylEntries] = useState<CylEntry[]>([emptyCylEntry()]);
  const [visibility, setVisibility] = useState('');
  const [conditions, setConditions] = useState('');
  const [equipment, setEquipment] = useState('');
  const [courseName, setCourseName] = useState('');
  const [skillsCompleted, setSkillsCompleted] = useState('');
  const [notes, setNotes] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  // New fields
  const [activityTags, setActivityTags] = useState<string[]>([]);
  const [visibilityRating, setVisibilityRating] = useState<number | null>(null);
  const [currentRating, setCurrentRating] = useState<number | null>(null);
  const [waveRating, setWaveRating] = useState<number | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [showTripPicker, setShowTripPicker] = useState(false);

  // Load gear sets and trips on mount
  useEffect(() => { loadGear(); loadTrips(); }, []);

  // Load existing dive for edit mode
  useEffect(() => {
    if (!editId) return;
    const dive = dives.find((d) => d.id === editId);
    if (!dive) return;
    setDiveType(dive.diveType);
    setDate(dive.date);
    setSiteName(dive.siteName ?? '');
    setMaxDepth(metersToStr(dive.maxDepthMeters, imp));
    setBottomTime(dive.bottomTimeMinutes != null ? String(dive.bottomTimeMinutes) : '');
    setSurfaceInterval(dive.surfaceIntervalMinutes != null ? String(dive.surfaceIntervalMinutes) : '');
    setWaterTemp(celsiusToStr(dive.waterTemperatureCelsius, imp));
    setGasType(dive.gasType ?? 'Air');
    // Restore multi-cylinder array
    if (dive.cylindersJson) {
      try {
        const saved: DiveCylinder[] = JSON.parse(dive.cylindersJson);
        if (saved.length > 0) {
          setCylEntries(saved.map(dc => ({
            cylinder: { id: '', name: dc.name, brand: undefined, internalVolL: dc.internalVolL, gasCapCuft: 0, workPressBar: 0, workPressPsi: 0, category: 'single-steel' as const, material: 'steel' as const, configuration: 'single' as const },
            startPressure: barToStr(dc.startBar, imp),
            endPressure: barToStr(dc.endBar, imp),
          })));
        }
      } catch { /* ignore parse errors */ }
    } else if (dive.tankSizeLiters != null || dive.startPressureBar != null) {
      setCylEntries([{
        cylinder: dive.tankSizeLiters != null ? { id: '', name: `${dive.tankSizeLiters}L`, brand: undefined, internalVolL: dive.tankSizeLiters, gasCapCuft: 0, workPressBar: 0, workPressPsi: 0, category: 'single-steel' as const, material: 'steel' as const, configuration: 'single' as const } : null,
        startPressure: barToStr(dive.startPressureBar, imp),
        endPressure: barToStr(dive.endPressureBar, imp),
      }]);
    }
    setVisibility(dive.visibility ?? '');
    setConditions(dive.conditions ?? '');
    setEquipment(dive.equipment ?? '');
    setCourseName(dive.courseName ?? '');
    setSkillsCompleted(dive.skillsCompleted ?? '');
    setNotes(dive.notes ?? '');
    // Restore new fields
    if (dive.activityTagsJson) {
      try { setActivityTags(JSON.parse(dive.activityTagsJson)); } catch { /* ignore */ }
    }
    setVisibilityRating(dive.visibilityRating ?? null);
    setCurrentRating(dive.currentRating ?? null);
    setWaveRating(dive.waveRating ?? null);
    setTripId(dive.tripId ?? null);
  }, [editId]);

  function handleSave() {
    if (!date.trim()) {
      Alert.alert('Required', 'Please enter a date.');
      return;
    }

    // Serialize cylinders
    const filledCyls = cylEntries.filter(e => e.cylinder != null);
    const cylindersSave: DiveCylinder[] = filledCyls.map(e => ({
      name: e.cylinder!.name + (e.cylinder!.brand ? ` / ${e.cylinder!.brand}` : ''),
      internalVolL: e.cylinder!.internalVolL,
      startBar: pressureToBar(e.startPressure, imp),
      endBar: pressureToBar(e.endPressure, imp),
    }));
    const firstCyl = filledCyls[0];

    const input = {
      date: date.trim(),
      siteName: siteName.trim() || null,
      maxDepthMeters: depthToMeters(maxDepth, imp),
      bottomTimeMinutes: parseIntNum(bottomTime),
      surfaceIntervalMinutes: parseIntNum(surfaceInterval),
      waterTemperatureCelsius: tempToCelsius(waterTemp, imp),
      gasType: gasType || null,
      tankSizeLiters: firstCyl?.cylinder?.internalVolL ?? null,
      startPressureBar: firstCyl ? pressureToBar(firstCyl.startPressure, imp) : null,
      endPressureBar: firstCyl ? pressureToBar(firstCyl.endPressure, imp) : null,
      visibility: visibility.trim() || null,
      conditions: conditions.trim() || null,
      equipment: equipment.trim() || null,
      courseName: courseName.trim() || null,
      skillsCompleted: skillsCompleted.trim() || null,
      notes: notes.trim() || null,
      cylindersJson: cylindersSave.length > 0 ? JSON.stringify(cylindersSave) : null,
      activityTagsJson: activityTags.length > 0 ? JSON.stringify(activityTags) : null,
      visibilityRating,
      currentRating,
      waveRating,
      tripId,
    };

    if (editId) {
      editDive(editId, { ...input, changeDescription: changeDescription.trim() || null });
    } else {
      createDive({ ...input, diveType });
      // Auto-increment dive count on selected gear set
      if (selectedSetId) {
        logDivesOnSet(selectedSetId);
      }
    }

    router.dismiss();
  }

  const depthUnit = imp ? 'ft' : 'm';
  const pressureUnit = imp ? 'psi' : 'bar';
  const tempUnit = imp ? '°F' : '°C';

  function updateCylEntry(idx: number, patch: Partial<CylEntry>) {
    setCylEntries(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e));
  }
  function addCylinder() {
    if (cylEntries.length < MAX_CYLINDERS) setCylEntries(prev => [...prev, emptyCylEntry()]);
  }
  function removeCylinder(idx: number) {
    setCylEntries(prev => prev.filter((_, i) => i !== idx));
  }

  const gasAdequacy = useMemo(() => {
    const depthM  = depthToMeters(maxDepth, imp);
    const timeMin = parseIntNum(bottomTime);
    if (!depthM || depthM <= 0 || !timeMin || timeMin <= 0) return null;
    const withPressure = cylEntries.filter(e => e.cylinder && parseNum(e.startPressure));
    if (!withPressure.length) return null;

    const pAmb        = depthM / 10 + 1;
    const RESERVE_BAR = 50;
    const DEFAULT_RMV = 15; // L/min surface equivalent — conservative recreational average

    const availableL = withPressure.reduce((sum, e) => {
      const startBar = pressureToBar(e.startPressure, imp) ?? 0;
      return sum + Math.max(0, startBar - RESERVE_BAR) * e.cylinder!.internalVolL;
    }, 0);

    const neededL = DEFAULT_RMV * pAmb * timeMin;
    return { availableL, neededL, pAmb, adequate: availableL >= neededL };
  }, [cylEntries, maxDepth, bottomTime, imp]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.dismiss()} style={styles.headerBtn}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{editId ? 'Edit Dive' : 'Log Dive'}</Text>
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
          {/* Type */}
          <SectionLabel label="Dive Type" />
          <Card variant="input" style={styles.card}>
            <View style={styles.chipRow}>
              <Chip
                label="Recreational"
                selected={diveType === 'RECREATIONAL'}
                onPress={() => setDiveType('RECREATIONAL')}
                style={styles.typeChip}
              />
              <Chip
                label="Training"
                selected={diveType === 'TRAINING'}
                onPress={() => setDiveType('TRAINING')}
                style={styles.typeChip}
              />
            </View>
          </Card>

          {/* Units */}
          <View style={styles.unitRow}>
            <Text style={styles.unitLabel}>Units</Text>
            <View style={styles.chipRow}>
              <Chip label="Metric" selected={!imp} onPress={() => setUnitSystem('metric')} />
              <Chip label="Imperial" selected={imp} onPress={() => setUnitSystem('imperial')} />
            </View>
          </View>

          {/* When & Where */}
          <SectionLabel label="When & Where" />
          <Card variant="input" style={styles.card}>
            <FormField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2025-06-15" keyboardType="numbers-and-punctuation" />
            <Divider />
            <FormField label="Site Name" value={siteName} onChangeText={setSiteName} placeholder="e.g. Blue Heron Bridge" />
            {trips.length > 0 && (
              <>
                <Divider />
                <View style={fieldStyles.container}>
                  <Text style={fieldStyles.label}>Trip</Text>
                  <Pressable style={styles.tripPickerRow} onPress={() => setShowTripPicker(true)}>
                    <Text style={tripId ? styles.tripPickerValue : styles.tripPickerPlaceholder}>
                      {tripId ? (trips.find(t => t.id === tripId)?.name ?? 'Unknown Trip') : 'No trip selected'}
                    </Text>
                    <Text style={styles.tripPickerChevron}>›</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Card>

          {/* Activity Tags */}
          <SectionLabel label="Activity Tags" />
          <Card variant="input" style={styles.card}>
            <View style={styles.chipRow}>
              {ACTIVITY_TAGS.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  selected={activityTags.includes(tag)}
                  onPress={() => setActivityTags(prev =>
                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                  )}
                />
              ))}
            </View>
          </Card>

          {/* Measurements */}
          <SectionLabel label="Measurements" />
          <Card variant="input" style={styles.card}>
            <View style={styles.row}>
              <FormField label={`Max Depth (${depthUnit})`} value={maxDepth} onChangeText={setMaxDepth} placeholder="0" keyboardType="decimal-pad" style={styles.halfField} />
              <View style={styles.fieldSpacer} />
              <FormField label="Bottom Time (min)" value={bottomTime} onChangeText={setBottomTime} placeholder="0" keyboardType="number-pad" style={styles.halfField} />
            </View>
            <Divider />
            <View style={styles.row}>
              <FormField label="Surface Interval (min)" value={surfaceInterval} onChangeText={setSurfaceInterval} placeholder="0" keyboardType="number-pad" style={styles.halfField} />
              <View style={styles.fieldSpacer} />
              <FormField label={`Water Temp (${tempUnit})`} value={waterTemp} onChangeText={setWaterTemp} placeholder="—" keyboardType="decimal-pad" style={styles.halfField} />
            </View>
          </Card>

          {/* Gas */}
          <SectionLabel label="Gas & Cylinder" />
          <Card variant="input" style={styles.card}>
            <Text style={styles.fieldLabel}>Gas Mix</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              <View style={styles.chipRow}>
                {GAS_TYPES.map((g) => (
                  <Chip key={g} label={g} selected={gasType === g} onPress={() => setGasType(g)} />
                ))}
              </View>
            </ScrollView>
          </Card>

          {/* Cylinder slots — each in its own Card to avoid BlurView dynamic-height issues */}
          {cylEntries.map((entry, idx) => (
            <Card key={idx} variant="input" style={styles.card}>
              <View style={styles.cylHeader}>
                <Text style={styles.cylLabel}>
                  {cylEntries.length > 1 ? `Cylinder ${idx + 1}` : 'Cylinder'}
                </Text>
                {cylEntries.length > 1 && (
                  <Pressable onPress={() => removeCylinder(idx)} style={styles.cylRemoveBtn}>
                    <Text style={styles.cylRemoveText}>Remove</Text>
                  </Pressable>
                )}
              </View>
              <CylinderPicker
                value={entry.cylinder}
                onChange={(c) => updateCylEntry(idx, { cylinder: c })}
              />
              <View style={[styles.row, { marginTop: Spacing.sm }]}>
                <FormField
                  label={`Start (${pressureUnit})`}
                  value={entry.startPressure}
                  onChangeText={(v) => updateCylEntry(idx, { startPressure: v })}
                  placeholder="0" keyboardType="number-pad" style={styles.halfField}
                />
                <View style={styles.fieldSpacer} />
                <FormField
                  label={`End (${pressureUnit})`}
                  value={entry.endPressure}
                  onChangeText={(v) => updateCylEntry(idx, { endPressure: v })}
                  placeholder="0" keyboardType="number-pad" style={styles.halfField}
                />
              </View>
            </Card>
          ))}

          {cylEntries.length < MAX_CYLINDERS && (
            <Pressable onPress={addCylinder} style={styles.addCylBtn}>
              <Text style={styles.addCylText}>+ Add Cylinder</Text>
            </Pressable>
          )}

          {/* Gas adequacy check */}
          {gasAdequacy != null && (
            <Card variant="result" style={styles.card}>
              <View style={styles.gasCheckRow}>
                <View style={styles.gasCheckCol}>
                  <Text style={styles.gasCheckLabel}>Available</Text>
                  <Text style={styles.gasCheckValue}>
                    {imp ? `${(gasAdequacy.availableL * L_TO_CUFT).toFixed(1)} cuft` : `${gasAdequacy.availableL.toFixed(0)} L`}
                  </Text>
                </View>
                <View style={styles.gasCheckCol}>
                  <Text style={styles.gasCheckLabel}>Est. Needed</Text>
                  <Text style={styles.gasCheckValue}>
                    {imp ? `${(gasAdequacy.neededL * L_TO_CUFT).toFixed(1)} cuft` : `${gasAdequacy.neededL.toFixed(0)} L`}
                  </Text>
                </View>
                <View style={[styles.gasCheckBadge, {
                  backgroundColor: gasAdequacy.adequate ? Colors.success + '26' : Colors.emergency + '26',
                }]}>
                  <Text style={[styles.gasCheckBadgeText, {
                    color: gasAdequacy.adequate ? Colors.success : Colors.emergency,
                  }]}>
                    {gasAdequacy.adequate ? '✓ Adequate' : '✗ Low Gas'}
                  </Text>
                </View>
              </View>
              <Text style={styles.gasCheckNote}>
                {`${gasAdequacy.pAmb.toFixed(1)} ATA · 15 L/min SAC · 50 bar reserve`}
              </Text>
            </Card>
          )}

          {/* Conditions */}
          <SectionLabel label="Conditions" />
          <Card variant="input" style={styles.card}>
            <StarRatingRow label="Visibility" value={visibilityRating} onChange={setVisibilityRating} />
            <Divider />
            <StarRatingRow label="Current" value={currentRating} onChange={setCurrentRating} />
            <Divider />
            <StarRatingRow label="Waves / Surge" value={waveRating} onChange={setWaveRating} />
            <Divider />
            <FormField label="Visibility Notes" value={visibility} onChangeText={setVisibility} placeholder="e.g. Excellent, 20m" />
            <Divider />
            <FormField label="Conditions Notes" value={conditions} onChangeText={setConditions} placeholder="e.g. Calm, slight current" />
            <Divider />
            <FormField label="Equipment" value={equipment} onChangeText={setEquipment} placeholder="e.g. BCD, reg, wetsuit" />
          </Card>

          {/* Training fields */}
          {diveType === 'TRAINING' && (
            <>
              <SectionLabel label="Training" />
              <Card variant="input" style={styles.card}>
                <FormField label="Course Name" value={courseName} onChangeText={setCourseName} placeholder="e.g. Open Water" />
                <Divider />
                <FormField label="Skills Completed" value={skillsCompleted} onChangeText={setSkillsCompleted} placeholder="e.g. Mask clearing, buoyancy" multiline />
              </Card>
            </>
          )}

          {/* Gear Used (create mode only) */}
          {!editId && gearSets.length > 0 && (
            <>
              <SectionLabel label="Gear Used" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
                <View style={styles.chipRow}>
                  {gearSets.map(gs => (
                    <Chip
                      key={gs.id}
                      label={`${gs.name} (${DIVING_TYPE_LABELS[gs.divingType]})`}
                      selected={selectedSetId === gs.id}
                      onPress={() => setSelectedSetId(prev => prev === gs.id ? null : gs.id)}
                    />
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* Notes */}
          <SectionLabel label="Notes" />
          <Card variant="input" style={styles.card}>
            <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Any observations, highlights..." multiline />
          </Card>

          {/* Change description (edit mode) */}
          {editId && (
            <>
              <SectionLabel label="Edit Reason" />
              <Card variant="input" style={styles.card}>
                <FormField label="Change Description" value={changeDescription} onChangeText={setChangeDescription} placeholder="What did you correct?" multiline />
              </Card>
            </>
          )}

          <View style={{ height: insets.bottom + Spacing.xxxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Trip picker modal */}
      <Modal visible={showTripPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTripPicker(false)}>
        <View style={[styles.tripModal, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.tripModalHeader}>
            <Text style={styles.tripModalTitle}>Select Trip</Text>
            <Pressable onPress={() => setShowTripPicker(false)} style={styles.tripModalClose}>
              <Text style={styles.tripModalCloseText}>✕</Text>
            </Pressable>
          </View>
          <Pressable style={[styles.tripRow, !tripId && styles.tripRowSelected]} onPress={() => { setTripId(null); setShowTripPicker(false); }}>
            <Text style={styles.tripRowName}>No trip</Text>
            {!tripId && <Text style={styles.tripCheck}>✓</Text>}
          </Pressable>
          {trips.map(t => (
            <Pressable key={t.id} style={[styles.tripRow, tripId === t.id && styles.tripRowSelected]} onPress={() => { setTripId(t.id); setShowTripPicker(false); }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripRowName}>{t.name}</Text>
                {t.destination ? <Text style={styles.tripRowSub}>{t.destination}</Text> : null}
              </View>
              {tripId === t.id && <Text style={styles.tripCheck}>✓</Text>}
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={sectionStyles.label}>{label}</Text>;
}

function Divider() {
  return <View style={sectionStyles.divider} />;
}

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: TextInput['props']['keyboardType'];
  multiline?: boolean;
  style?: object;
}

function StarRatingRow({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <View style={[fieldStyles.container, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1,2,3,4,5].map(n => (
          <Pressable key={n} onPress={() => onChange(value === n ? null : n)} hitSlop={6}>
            <Text style={{ fontSize: 22, color: value != null && n <= value ? '#FFB700' : Colors.border }}>★</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType, multiline, style }: FormFieldProps) {
  return (
    <View style={[fieldStyles.container, style]}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, multiline && fieldStyles.multiline]}
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

const sectionStyles = StyleSheet.create({
  label: {
    ...Typography.footnote,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginHorizontal: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
});

const fieldStyles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xs,
  },
  label: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  input: {
    ...Typography.body,
    color: Colors.text,
    paddingVertical: Spacing.xs,
    minHeight: 36,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: { ...Typography.headline, color: Colors.text },
  headerCancel: { ...Typography.body, color: Colors.textSecondary },
  headerSave: { ...Typography.body, fontWeight: '600', color: Colors.accentBlue, textAlign: 'right' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
  card: { marginBottom: 0 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeChip: { flex: 1 },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  unitLabel: { ...Typography.footnote, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  hScroll: { marginTop: Spacing.sm, marginBottom: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  halfField: { flex: 1 },
  fieldSpacer: { width: Spacing.lg },
  fieldLabel: { ...Typography.caption1, color: Colors.textSecondary, marginBottom: 2 },
  cylHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  cylLabel: { ...Typography.caption1, color: Colors.textSecondary, fontWeight: '600' as const },
  cylRemoveBtn: { paddingVertical: 2, paddingHorizontal: Spacing.xs },
  cylRemoveText: { ...Typography.caption1, color: Colors.emergency },
  addCylBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.accentBlue,
    borderStyle: 'dashed',
  },
  addCylText: { ...Typography.subhead, color: Colors.accentBlue, fontWeight: '600' as const },
  gasCheckRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xs },
  gasCheckCol: { flex: 1 },
  gasCheckLabel: { ...Typography.caption2, color: Colors.textSecondary, marginBottom: 2 },
  gasCheckValue: { ...Typography.subhead, color: Colors.text, fontWeight: '600' as const, fontVariant: ['tabular-nums'] as const },
  gasCheckBadge: { borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  gasCheckBadgeText: { ...Typography.caption1, fontWeight: '700' as const },
  gasCheckNote: { ...Typography.caption2, color: Colors.textSecondary, marginTop: 2 },
  tripPickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  tripPickerValue: { ...Typography.body, color: Colors.text, flex: 1 },
  tripPickerPlaceholder: { ...Typography.body, color: Colors.textTertiary, flex: 1 },
  tripPickerChevron: { ...Typography.title3, color: Colors.textSecondary, lineHeight: 22 },
  tripModal: { flex: 1, backgroundColor: Colors.background },
  tripModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  tripModalTitle: { ...Typography.headline, color: Colors.text },
  tripModalClose: { padding: Spacing.sm },
  tripModalCloseText: { ...Typography.body, color: Colors.textSecondary, fontSize: 18 },
  tripRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  tripRowSelected: { backgroundColor: Colors.accentBlue + '0C' },
  tripRowName: { ...Typography.subhead, color: Colors.text, fontWeight: '500' as const },
  tripRowSub: { ...Typography.caption2, color: Colors.textSecondary, marginTop: 2 },
  tripCheck: { ...Typography.subhead, color: Colors.accentBlue },
});
