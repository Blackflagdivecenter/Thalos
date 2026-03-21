import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useInstructorStore } from '@/src/stores/instructorStore';

// ── Inline field ──────────────────────────────────────────────────────────────

function Field({
  label, value, onChangeText, placeholder, keyboard = 'default', multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboard?: 'default' | 'email-address' | 'phone-pad' | 'number-pad' | 'numeric';
  multiline?: boolean;
}) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <TextInput
        style={[f.input, multiline && f.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboard}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const f = StyleSheet.create({
  wrap:  { gap: 4, paddingVertical: Spacing.xs },
  label: { ...(Typography.footnote as TextStyle), color: Colors.textSecondary, fontWeight: '600' },
  input: {
    ...(Typography.body as TextStyle),
    color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  multiline: { minHeight: 60 },
});

// ── Section header ────────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <Text style={st.title}>{label}</Text>
  );
}
const st = StyleSheet.create({
  title: {
    ...(Typography.footnote as TextStyle),
    fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.lg, marginBottom: Spacing.xs,
  },
});

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AddEditStudentScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { id }  = useLocalSearchParams<{ id?: string }>();
  const { createStudent, updateStudent, getStudent } = useInstructorStore();

  const existing = id ? getStudent(id) : undefined;
  const isEdit   = !!existing;

  // Name
  const [firstName, setFirstName] = useState(
    existing ? existing.name.split(' ')[0] ?? '' : '',
  );
  const [lastName, setLastName] = useState(
    existing ? existing.name.split(' ').slice(1).join(' ') : '',
  );

  // Contact
  const [email, setEmail]   = useState(existing?.email ?? '');
  const [phone, setPhone]   = useState(existing?.phone ?? '');

  // Info
  const [studentId, setStudentId] = useState(existing?.studentId ?? '');
  const [hasDob, setHasDob] = useState(!!existing?.dob);
  const [dob, setDob]       = useState<Date>(() => {
    if (existing?.dob) {
      const d = new Date(existing.dob + 'T12:00:00');
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  // Notes
  const [notes, setNotes] = useState(existing?.notes ?? '');

  function handleSave() {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!name) return;

    const input = {
      name,
      email:     email.trim()     || null,
      phone:     phone.trim()     || null,
      studentId: studentId.trim() || null,
      dob:       hasDob ? `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}` : null,
      notes:     notes.trim()     || null,
    };

    if (isEdit) {
      updateStudent(id!, input);
    } else {
      createStudent(input);
    }
    router.back();
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Navbar */}
      <View style={s.navbar}>
        <Pressable style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={s.navTitle}>{isEdit ? 'Edit Student' : 'New Student'}</Text>
        <Pressable style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <SectionTitle label="Name" />
        <View style={s.card}>
          <Field label="First Name *" value={firstName} onChangeText={setFirstName} placeholder="Required" />
          <View style={s.divider} />
          <Field label="Last Name"  value={lastName}  onChangeText={setLastName}  placeholder="Optional" />
        </View>

        {/* Contact */}
        <SectionTitle label="Contact" />
        <View style={s.card}>
          <Field label="Email"  value={email} onChangeText={setEmail} placeholder="student@email.com" keyboard="email-address" />
          <View style={s.divider} />
          <Field label="Phone"  value={phone} onChangeText={setPhone} placeholder="+1 555 000 0000" keyboard="phone-pad" />
        </View>

        {/* Info */}
        <SectionTitle label="Info" />
        <View style={s.card}>
          <Field label="Student ID" value={studentId} onChangeText={setStudentId} placeholder="Optional" keyboard="default" />
          <View style={s.divider} />
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Date of Birth</Text>
            <Switch
              value={hasDob}
              onValueChange={setHasDob}
              trackColor={{ true: Colors.accentBlue }}
            />
          </View>
          {hasDob && (
            <DateTimePicker
              value={dob}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(_, date) => { if (date) setDob(date); }}
              style={{ marginTop: -Spacing.sm }}
            />
          )}
        </View>

        {/* Notes */}
        <SectionTitle label="Notes" />
        <View style={s.card}>
          <Field
            label="Internal notes (not shared with student)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            multiline
          />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cancelBtn:  { paddingVertical: Spacing.xs, paddingRight: Spacing.sm, minWidth: 60 },
  cancelText: { ...(Typography.body as TextStyle), color: Colors.accentBlue },
  navTitle:   { flex: 1, ...(Typography.headline as TextStyle), color: Colors.text, textAlign: 'center' },
  saveBtn:    { paddingVertical: Spacing.xs, paddingLeft: Spacing.sm, minWidth: 60, alignItems: 'flex-end' },
  saveText:   { ...(Typography.body as TextStyle), color: Colors.accentBlue, fontWeight: '600' },
  scroll:     { flex: 1 },
  content:    { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  divider:    { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  toggleRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  toggleLabel: { flex: 1, ...(Typography.body as TextStyle), color: Colors.text },
});
