/**
 * Training Dive Sign-Off form.
 * Route: /instructor/forms/training-dive?studentId=X&courseId=Y&diveNumber=N
 */
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useInstructorStore } from '@/src/stores/instructorStore';
import { SignaturePad, SavedSignatureView } from '@/src/ui/components/SignaturePad';
import { todayISO } from '@/src/utils/uuid';

// ── Constants ─────────────────────────────────────────────────────────────────

type Units = 'metric' | 'imperial';

const GAS_TYPES = ['Air', 'EANx32', 'EANx36', 'EANx28', 'Other'] as const;

const CYLINDERS = [
  { label: 'AL80 (11.1 L)',   volume: 11.1 },
  { label: 'AL63 (8.9 L)',    volume: 8.9  },
  { label: 'HP80 (10.2 L)',   volume: 10.2 },
  { label: 'HP100 (12.9 L)',  volume: 12.9 },
  { label: 'HP120 (15.7 L)',  volume: 15.7 },
  { label: 'Steel 10 (10 L)', volume: 10   },
  { label: 'Steel 12 (12 L)', volume: 12   },
  { label: 'Steel 15 (15 L)', volume: 15   },
];

// ── Helper components ─────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return <Text style={st.text}>{label}</Text>;
}
const st = StyleSheet.create({
  text: {
    ...(Typography.footnote as TextStyle),
    fontWeight: '700' as TextStyle['fontWeight'],
    color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.lg, marginBottom: Spacing.xs,
  },
});

function Divider() { return <View style={{ height: 1, backgroundColor: Colors.border }} />; }

function ProfileField({
  label, value, onChangeText, unit,
}: {
  label: string; value: string; onChangeText: (v: string) => void; unit: string;
}) {
  return (
    <View style={pf.row}>
      <Text style={pf.label}>{label}</Text>
      <TextInput
        style={pf.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={Colors.textTertiary}
      />
      <Text style={pf.unit}>{unit}</Text>
    </View>
  );
}
const pf = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.sm },
  label: { flex: 1, ...(Typography.subhead as TextStyle), color: Colors.text },
  input: {
    ...(Typography.body as TextStyle), color: Colors.text,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
    width: 80, textAlign: 'right',
    backgroundColor: Colors.background,
    fontVariant: ['tabular-nums'],
  },
  unit: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, width: 36 },
});

function PickerRow({
  label, options, selected, onSelect,
}: {
  label: string; options: string[]; selected: string; onSelect: (s: string) => void;
}) {
  return (
    <View style={pr.container}>
      <Text style={pr.label}>{label}</Text>
      <View style={pr.pills}>
        {options.map(opt => (
          <Pressable
            key={opt}
            style={[pr.pill, selected === opt && pr.pillActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[pr.pillText, selected === opt && pr.pillTextActive]}>
              {opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const pr = StyleSheet.create({
  container:    { paddingVertical: Spacing.sm, gap: Spacing.xs },
  label:        { ...(Typography.footnote as TextStyle), color: Colors.textSecondary, fontWeight: '600' as TextStyle['fontWeight'] },
  pills:        { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  pill: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  pillActive:      { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  pillText:        { ...(Typography.caption1 as TextStyle), color: Colors.text },
  pillTextActive:  { ...(Typography.caption1 as TextStyle), color: '#FFFFFF' },
});

function TextField({
  label, value, onChangeText, placeholder, multiline = false,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  return (
    <View style={tf.wrap}>
      <Text style={tf.label}>{label}</Text>
      <TextInput
        style={[tf.input, multiline && tf.multi]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}
const tf = StyleSheet.create({
  wrap:  { gap: 4, paddingVertical: Spacing.xs },
  label: { ...(Typography.footnote as TextStyle), color: Colors.textSecondary, fontWeight: '600' as TextStyle['fontWeight'] },
  input: {
    ...(Typography.body as TextStyle), color: Colors.text,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  multi: { minHeight: 80 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function TrainingDiveScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { studentId, courseId, diveNumber } = useLocalSearchParams<{
    studentId: string; courseId: string; diveNumber: string;
  }>();

  const { getStudent, getCourse, getDocuments, createDocument, updateDocument, profile } = useInstructorStore();

  const student   = studentId ? getStudent(studentId) : undefined;
  const course    = courseId  ? getCourse(courseId)   : undefined;
  const diveNum   = parseInt(diveNumber ?? '1', 10) || 1;

  // Find existing training dive doc for this dive number
  const allDiveDocs = studentId && courseId ? getDocuments(studentId, courseId).filter(d => d.docType === 'training_dive') : [];
  const existingDoc = allDiveDocs.find(d => {
    try { return JSON.parse(d.content ?? '{}').diveNumber === diveNum; } catch { return false; }
  }) ?? null;

  const existing = existingDoc?.content ? (() => {
    try { return JSON.parse(existingDoc.content); } catch { return {}; }
  })() : {};

  const [units, setUnits]   = useState<Units>(existing.units ?? 'metric');

  // Dive details
  const [date, setDate]         = useState(existing.date ?? todayISO());
  const [site, setSite]         = useState(existing.site ?? '');
  const [maxDepth, setMaxDepth] = useState(existing.maxDepth ?? '');
  const [bottomTime, setBottomTime] = useState(existing.bottomTime ?? '');
  const [surfaceInterval, setSurfaceInterval] = useState(existing.surfaceInterval ?? '');
  const [waterTemp, setWaterTemp] = useState(existing.waterTemp ?? '');

  // Conditions
  const [visibility, setVisibility]       = useState(existing.visibility ?? '');
  const [conditions, setConditions]       = useState(existing.conditions ?? '');
  const [equipment, setEquipment]         = useState(existing.equipment ?? '');

  // Gas
  const [gasType, setGasType]           = useState<string>(existing.gasType ?? 'Air');
  const [cylinder, setCylinder]         = useState<string>(existing.cylinder ?? CYLINDERS[0].label);
  const [startPressure, setStartPressure] = useState(existing.startPressure ?? '');
  const [endPressure, setEndPressure]   = useState(existing.endPressure ?? '');

  // Training
  const [skillsCompleted, setSkillsCompleted] = useState(existing.skillsCompleted ?? '');
  const [notes, setNotes]             = useState(existing.notes ?? '');

  // Signature
  const [sigData, setSigData] = useState(existingDoc?.signatureData ?? '');

  const depthUnit    = units === 'metric' ? 'm'   : 'ft';
  const tempUnit     = units === 'metric' ? '°C'  : '°F';
  const pressureUnit = units === 'metric' ? 'bar' : 'psi';

  const alreadySigned = !!existingDoc?.signedAt;

  function handleSave() {
    if (!sigData) { Alert.alert('Instructor Signature Required', 'Please add your signature to sign off this dive.'); return; }
    if (!studentId || !courseId) return;

    const content = JSON.stringify({
      diveNumber: diveNum, units,
      date, site, maxDepth, bottomTime, surfaceInterval, waterTemp,
      visibility, conditions, equipment,
      gasType, cylinder, startPressure, endPressure,
      skillsCompleted, notes,
    });

    if (existingDoc) {
      updateDocument(existingDoc.id, { content, signedAt: todayISO(), signatureData: sigData });
    } else {
      createDocument({
        studentId, courseId,
        docType:       'training_dive',
        title:         `Training Dive #${diveNum}`,
        content,
        signedAt:      todayISO(),
        signatureData: sigData,
      });
    }
    router.back();
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.navbar}>
        <Pressable style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={s.navTitle}>Training Dive #{diveNum}</Text>
        <Pressable style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveText}>Sign Off</Text>
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Units toggle */}
        <SectionTitle label="Units" />
        <View style={s.card}>
          <View style={s.unitsRow}>
            {(['metric', 'imperial'] as Units[]).map(u => (
              <Pressable
                key={u}
                style={[s.unitsPill, units === u && s.unitsPillActive]}
                onPress={() => setUnits(u)}
              >
                <Text style={[s.unitsPillText, units === u && s.unitsPillTextActive]}>
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Dive Details */}
        <SectionTitle label="Dive Details" />
        <View style={s.card}>
          <View style={s.labeledRow}>
            <Text style={s.infoLabel}>Student</Text>
            <Text style={s.infoValue}>{student?.name ?? '—'}</Text>
          </View>
          <Divider />
          <View style={s.labeledRow}>
            <Text style={s.infoLabel}>Dive #</Text>
            <Text style={s.infoValue}>{diveNum}</Text>
          </View>
          <Divider />
          <View style={s.labeledRow}>
            <Text style={s.infoLabel}>Course</Text>
            <Text style={s.infoValue}>{course?.name ?? '—'}</Text>
          </View>
          <Divider />
          <TextField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        </View>

        {/* Location */}
        <SectionTitle label="Location" />
        <View style={s.card}>
          <TextField label="Dive Site" value={site} onChangeText={setSite} placeholder="Site name" />
        </View>

        {/* Dive Profile */}
        <SectionTitle label="Dive Profile" />
        <View style={s.card}>
          <ProfileField label="Max Depth"         value={maxDepth}         onChangeText={setMaxDepth}         unit={depthUnit} />
          <Divider />
          <ProfileField label="Bottom Time"       value={bottomTime}       onChangeText={setBottomTime}       unit="min" />
          <Divider />
          <ProfileField label="Surface Interval"  value={surfaceInterval}  onChangeText={setSurfaceInterval}  unit="min" />
          <Divider />
          <ProfileField label="Water Temp"        value={waterTemp}        onChangeText={setWaterTemp}        unit={tempUnit} />
        </View>

        {/* Conditions */}
        <SectionTitle label="Conditions" />
        <View style={s.card}>
          <TextField label="Visibility" value={visibility} onChangeText={setVisibility} placeholder={`e.g. 15 ${depthUnit}`} />
          <Divider />
          <TextField label="Conditions" value={conditions} onChangeText={setConditions} placeholder="Calm, current, surge…" />
          <Divider />
          <TextField label="Equipment Used" value={equipment} onChangeText={setEquipment} placeholder="Wetsuit, BCD, regulator…" />
        </View>

        {/* Gas */}
        <SectionTitle label="Gas" />
        <View style={s.card}>
          <PickerRow
            label="Gas Type"
            options={[...GAS_TYPES]}
            selected={gasType}
            onSelect={setGasType}
          />
          <Divider />
          <PickerRow
            label="Cylinder"
            options={CYLINDERS.map(c => c.label)}
            selected={cylinder}
            onSelect={setCylinder}
          />
          <Divider />
          <ProfileField label="Start Pressure" value={startPressure} onChangeText={setStartPressure} unit={pressureUnit} />
          <Divider />
          <ProfileField label="End Pressure"   value={endPressure}   onChangeText={setEndPressure}   unit={pressureUnit} />
        </View>

        {/* Training */}
        <SectionTitle label="Training" />
        <View style={s.card}>
          <TextField
            label="Skills Completed"
            value={skillsCompleted}
            onChangeText={setSkillsCompleted}
            placeholder="e.g. Mask clearing, BCD oral inflation…"
            multiline
          />
          <Divider />
          <TextField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Observations, feedback…"
            multiline
          />
        </View>

        {/* Instructor Signature */}
        <SectionTitle label="Instructor Signature" />
        <View style={s.card}>
          {alreadySigned && existingDoc?.signatureData && !!sigData ? (
            <SavedSignatureView
              svgData={existingDoc.signatureData}
              height={150}
              onResign={() => setSigData('')}
            />
          ) : (
            <SignaturePad
              height={150}
              onSign={setSigData}
              existingData={sigData || null}
              label="Instructor Signature"
            />
          )}
          <Text style={s.sigName}>{profile?.name ?? 'Instructor'}</Text>
          <Text style={s.disclaimer}>
            By signing, the instructor certifies that the above training dive was completed
            in accordance with established standards and the student demonstrated the required skills.
          </Text>
        </View>

        {alreadySigned && (
          <View style={s.signedInfo}>
            <Ionicons name="checkmark-circle" size={18} color="#34C759" />
            <Text style={s.signedInfoText}>Signed on {existingDoc!.signedAt}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cancelBtn:  { minWidth: 60, paddingVertical: Spacing.xs },
  cancelText: { ...(Typography.body as TextStyle), color: Colors.accentBlue },
  navTitle:   { flex: 1, ...(Typography.headline as TextStyle), color: Colors.text, textAlign: 'center' },
  saveBtn:    { minWidth: 60, paddingVertical: Spacing.xs, alignItems: 'flex-end' },
  saveText:   { ...(Typography.body as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  scroll:     { flex: 1 },
  content:    { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  unitsRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  unitsPill: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  unitsPillActive:    { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  unitsPillText:      { ...(Typography.body as TextStyle), color: Colors.text },
  unitsPillTextActive: { ...(Typography.body as TextStyle), color: '#FFFFFF', fontWeight: '600' as TextStyle['fontWeight'] },
  labeledRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  infoLabel:   { flex: 1, ...(Typography.subhead as TextStyle), color: Colors.textSecondary },
  infoValue:   { ...(Typography.subhead as TextStyle), color: Colors.text, textAlign: 'right' },
  sigName:     { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, textAlign: 'center', paddingTop: Spacing.xs },
  disclaimer:  { ...(Typography.caption2 as TextStyle), color: Colors.textTertiary, textAlign: 'center', paddingTop: Spacing.sm, paddingBottom: Spacing.xs, lineHeight: 16 },
  signedInfo: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    justifyContent: 'center', paddingVertical: Spacing.md,
  },
  signedInfoText: { ...(Typography.subhead as TextStyle), color: '#34C759' },
});
