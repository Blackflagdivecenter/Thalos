import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { getDb } from '@/src/db/client';

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

function getAppSetting(key: string): string {
  const db = getDb();
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
  return row?.value ?? '';
}

function setAppSetting(key: string, value: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, now]
  );
}

export default function MedicalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [conditions, setConditions] = useState('');
  const [iceName, setIceName] = useState('');
  const [icePhone, setIcePhone] = useState('');
  const [iceRelation, setIceRelation] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBloodType(getAppSetting('med_blood_type'));
    setAllergies(getAppSetting('med_allergies'));
    setMedications(getAppSetting('med_medications'));
    setConditions(getAppSetting('med_conditions'));
    setIceName(getAppSetting('ice_name'));
    setIcePhone(getAppSetting('ice_phone'));
    setIceRelation(getAppSetting('ice_relation'));
  }, []);

  function handleSave() {
    setAppSetting('med_blood_type', bloodType);
    setAppSetting('med_allergies', allergies);
    setAppSetting('med_medications', medications);
    setAppSetting('med_conditions', conditions);
    setAppSetting('ice_name', iceName);
    setAppSetting('ice_phone', icePhone);
    setAppSetting('ice_relation', iceRelation);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Medical Info & ICE</Text>
        <Pressable onPress={handleSave} style={styles.saveHeaderBtn}>
          <Text style={[styles.saveHeaderText, saved && styles.saveHeaderSaved]}>
            {saved ? 'Saved ✓' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.disclaimer}>
          This information is stored locally on your device and is never shared. It is intended to help first responders in an emergency.
        </Text>

        {/* Medical */}
        <SectionLabel label="Medical Information" />
        <View style={styles.card}>
          <FieldLabel label="Blood Type" />
          <View style={styles.bloodTypeRow}>
            {BLOOD_TYPES.map(bt => (
              <Pressable
                key={bt}
                style={[styles.btChip, bloodType === bt && styles.btChipActive]}
                onPress={() => setBloodType(bt === bloodType ? '' : bt)}
              >
                <Text style={[styles.btText, bloodType === bt && styles.btTextActive]}>{bt}</Text>
              </Pressable>
            ))}
          </View>

          <FieldLabel label="Allergies" />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={allergies}
            onChangeText={setAllergies}
            placeholder="e.g. Penicillin, shellfish..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            scrollEnabled={false}
          />

          <FieldLabel label="Current Medications" />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={medications}
            onChangeText={setMedications}
            placeholder="e.g. Aspirin 81mg daily..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            scrollEnabled={false}
          />

          <FieldLabel label="Medical Conditions" />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={conditions}
            onChangeText={setConditions}
            placeholder="e.g. Asthma (well-controlled), hypertension..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            scrollEnabled={false}
          />
        </View>

        {/* ICE */}
        <SectionLabel label="In Case of Emergency (ICE)" />
        <View style={styles.card}>
          <FieldLabel label="Contact Name" />
          <TextInput style={styles.input} value={iceName} onChangeText={setIceName} placeholder="e.g. Jane Smith" placeholderTextColor={Colors.textTertiary} />
          <FieldLabel label="Phone Number" />
          <TextInput style={styles.input} value={icePhone} onChangeText={setIcePhone} placeholder="+1 555 000 0000" placeholderTextColor={Colors.textTertiary} keyboardType="phone-pad" />
          <FieldLabel label="Relationship" />
          <TextInput style={styles.input} value={iceRelation} onChangeText={setIceRelation} placeholder="e.g. Spouse, Parent" placeholderTextColor={Colors.textTertiary} />
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{saved ? 'Saved ✓' : 'Save'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 60 },
  backText: { ...Typography.body, color: Colors.accentBlue },
  headerTitle: { ...Typography.headline, color: Colors.text },
  saveHeaderBtn: { width: 60, alignItems: 'flex-end' as const },
  saveHeaderText: { ...Typography.subhead, color: Colors.accentBlue, fontWeight: '600' as const },
  saveHeaderSaved: { color: Colors.success ?? Colors.accentBlue },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  disclaimer: {
    ...Typography.caption1, color: Colors.textSecondary,
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md,
    padding: Spacing.md, lineHeight: 18,
  },
  sectionLabel: {
    ...Typography.footnote, fontWeight: '700' as const, color: Colors.textSecondary,
    textTransform: 'uppercase' as const, letterSpacing: 0.8,
    marginTop: Spacing.lg, marginBottom: 4,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  fieldLabel: { ...Typography.footnote, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 4 },
  bloodTypeRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: Spacing.sm },
  btChip: {
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 6, minWidth: 48, alignItems: 'center' as const,
  },
  btChipActive: { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  btText: { ...Typography.subhead, color: Colors.textSecondary },
  btTextActive: { color: '#FFF', fontWeight: '700' as const },
  input: {
    ...Typography.body, color: Colors.text,
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minHeight: 44,
  },
  multilineInput: { minHeight: 72, textAlignVertical: 'top' as const },
  saveBtn: {
    backgroundColor: Colors.accentBlue, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center' as const, marginTop: Spacing.lg,
  },
  saveBtnText: { ...Typography.subhead, color: '#FFF', fontWeight: '700' as const },
});
