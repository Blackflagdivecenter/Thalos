import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { Colors, Spacing, Typography } from '@/src/ui/theme';
import { useSiteStore } from '@/src/stores/siteStore';

export default function EAPScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getEAP, updateEAP } = useSiteStore();

  // Emergency Contacts
  const [danNumber, setDanNumber] = useState('+1-919-684-9111');
  const [localEmergency, setLocalEmergency] = useState('');
  const [coastGuard, setCoastGuard] = useState('');
  // Hospital
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [hospitalPhone, setHospitalPhone] = useState('');
  // Chamber
  const [chamberName, setChamberName] = useState('');
  const [chamberAddress, setChamberAddress] = useState('');
  const [chamberPhone, setChamberPhone] = useState('');
  // Equipment locations
  const [oxygenLocation, setOxygenLocation] = useState('');
  const [firstAidLocation, setFirstAidLocation] = useState('');
  const [aedLocation, setAedLocation] = useState('');
  // Evacuation
  const [exitPoint, setExitPoint] = useState('');
  const [vhfChannel, setVhfChannel] = useState('');
  const [evacuationProcedure, setEvacuationProcedure] = useState('');
  // Notes
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    const eap = getEAP(id);
    if (!eap) return;
    setDanNumber(eap.danEmergencyNumber ?? '+1-919-684-9111');
    setLocalEmergency(eap.localEmergencyNumber ?? '');
    setCoastGuard(eap.coastGuardPhone ?? '');
    setHospitalName(eap.nearestHospitalName ?? '');
    setHospitalAddress(eap.nearestHospitalAddress ?? '');
    setHospitalPhone(eap.nearestHospitalPhone ?? '');
    setChamberName(eap.nearestChamberName ?? '');
    setChamberAddress(eap.nearestChamberAddress ?? '');
    setChamberPhone(eap.nearestChamberPhone ?? '');
    setOxygenLocation(eap.oxygenLocation ?? '');
    setFirstAidLocation(eap.firstAidKitLocation ?? '');
    setAedLocation(eap.aedLocation ?? '');
    setExitPoint(eap.nearestExitPoint ?? '');
    setVhfChannel(eap.vhfChannel ?? '');
    setEvacuationProcedure(eap.evacuationProcedure ?? '');
    setAdditionalNotes(eap.additionalNotes ?? '');
  }, [id]);

  function handleSave() {
    updateEAP(id, {
      danEmergencyNumber: danNumber.trim() || '+1-919-684-9111',
      localEmergencyNumber: localEmergency.trim() || null,
      coastGuardPhone: coastGuard.trim() || null,
      nearestHospitalName: hospitalName.trim() || null,
      nearestHospitalAddress: hospitalAddress.trim() || null,
      nearestHospitalPhone: hospitalPhone.trim() || null,
      nearestChamberName: chamberName.trim() || null,
      nearestChamberAddress: chamberAddress.trim() || null,
      nearestChamberPhone: chamberPhone.trim() || null,
      oxygenLocation: oxygenLocation.trim() || null,
      firstAidKitLocation: firstAidLocation.trim() || null,
      aedLocation: aedLocation.trim() || null,
      nearestExitPoint: exitPoint.trim() || null,
      vhfChannel: vhfChannel.trim() || null,
      evacuationProcedure: evacuationProcedure.trim() || null,
      additionalNotes: additionalNotes.trim() || null,
    });
    router.back();
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Emergency Action Plan</Text>
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
          <SectionLabel label="Emergency Numbers" />
          <Card variant="input">
            <F label="DAN Emergency" value={danNumber} onChange={setDanNumber} placeholder="+1-919-684-9111" keyboard="phone-pad" />
            <D />
            <F label="Local Emergency (911, 112, etc.)" value={localEmergency} onChange={setLocalEmergency} placeholder="911" keyboard="phone-pad" />
            <D />
            <F label="Coast Guard" value={coastGuard} onChange={setCoastGuard} placeholder="" keyboard="phone-pad" />
          </Card>

          <SectionLabel label="Nearest Hospital" />
          <Card variant="input">
            <F label="Hospital Name" value={hospitalName} onChange={setHospitalName} placeholder="e.g. Palm Beach Gardens Medical" />
            <D />
            <F label="Address" value={hospitalAddress} onChange={setHospitalAddress} placeholder="Street address" />
            <D />
            <F label="Phone" value={hospitalPhone} onChange={setHospitalPhone} placeholder="" keyboard="phone-pad" />
          </Card>

          <SectionLabel label="Nearest Hyperbaric Chamber" />
          <Card variant="input">
            <F label="Chamber Name" value={chamberName} onChange={setChamberName} placeholder="e.g. Wound Care & Hyperbaric Center" />
            <D />
            <F label="Address" value={chamberAddress} onChange={setChamberAddress} placeholder="Street address" />
            <D />
            <F label="Phone" value={chamberPhone} onChange={setChamberPhone} placeholder="" keyboard="phone-pad" />
          </Card>

          <SectionLabel label="Equipment Locations" />
          <Card variant="input">
            <F label="Oxygen Location" value={oxygenLocation} onChange={setOxygenLocation} placeholder="e.g. Blue box near entry point" />
            <D />
            <F label="First Aid Kit Location" value={firstAidLocation} onChange={setFirstAidLocation} placeholder="e.g. Dive shop counter" />
            <D />
            <F label="AED Location" value={aedLocation} onChange={setAedLocation} placeholder="e.g. Parking lot kiosk" />
          </Card>

          <SectionLabel label="Evacuation" />
          <Card variant="input">
            <F label="Nearest Exit Point" value={exitPoint} onChange={setExitPoint} placeholder="e.g. North shore boat ramp" />
            <D />
            <F label="VHF Channel" value={vhfChannel} onChange={setVhfChannel} placeholder="e.g. Channel 16" keyboard="number-pad" />
            <D />
            <F label="Evacuation Procedure" value={evacuationProcedure} onChange={setEvacuationProcedure} placeholder="Step-by-step evacuation instructions..." multi />
          </Card>

          <SectionLabel label="Additional Notes" />
          <Card variant="input">
            <F label="Notes" value={additionalNotes} onChange={setAdditionalNotes} placeholder="Any other emergency-relevant information..." multi />
          </Card>

          <View style={{ height: insets.bottom + Spacing.xxxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={sub.label}>{label}</Text>;
}
function D() {
  return <View style={sub.divider} />;
}
function F({
  label, value, onChange, placeholder, keyboard, multi,
}: {
  label: string; value: string; onChange: (t: string) => void;
  placeholder?: string; keyboard?: TextInput['props']['keyboardType']; multi?: boolean;
}) {
  return (
    <View style={sub.field}>
      <Text style={sub.fieldLabel}>{label}</Text>
      <TextInput
        style={[sub.input, multi && sub.multiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboard ?? 'default'}
        multiline={multi}
        scrollEnabled={false}
      />
    </View>
  );
}

const sub = StyleSheet.create({
  label: {
    ...Typography.footnote, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.xl, marginBottom: Spacing.sm, marginHorizontal: 2,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  field: { paddingVertical: Spacing.xs },
  fieldLabel: { ...Typography.caption1, color: Colors.textSecondary, marginBottom: 3 },
  input: { ...Typography.body, color: Colors.text, paddingVertical: Spacing.xs, minHeight: 36 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
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
  headerTitle: { ...Typography.headline, color: Colors.text, flex: 1, textAlign: 'center' },
  headerCancel: { ...Typography.body, color: Colors.textSecondary },
  headerSave: { ...Typography.body, fontWeight: '600', color: Colors.accentTeal, textAlign: 'right' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
});
