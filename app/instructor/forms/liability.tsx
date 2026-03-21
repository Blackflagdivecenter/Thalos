/**
 * Liability Release digital form.
 * Route: /instructor/forms/liability?studentId=X&courseId=Y
 */
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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

const AGREEMENT_TEXT = `
1. I understand and accept that scuba diving involves risk of injury, paralysis, or death.

2. I acknowledge that I am physically fit and have no medical conditions that would prevent safe diving.

3. I agree to follow all instructions from my instructor and dive within the limits of my training and certification.

4. I understand that safe diving requires proper equipment, training, and adherence to established procedures.

5. I release and hold harmless the instructor, dive facility, and their agents from any liability for injury or loss sustained during diving activities.

6. I acknowledge that this release is binding on myself, my heirs, assigns, and legal representatives.

7. I confirm that I have read and understand this agreement and am signing it voluntarily.

8. For minor participants: the parent or legal guardian signing this form accepts all terms on behalf of the minor.
`.trim();

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

function Field({
  label, value, onChangeText, placeholder,
}: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string;
}) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <TextInput
        style={f.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
      />
    </View>
  );
}
const f = StyleSheet.create({
  wrap:  { gap: 4, paddingVertical: Spacing.xs },
  label: { ...(Typography.footnote as TextStyle), color: Colors.textSecondary, fontWeight: '600' as TextStyle['fontWeight'] },
  input: {
    ...(Typography.body as TextStyle), color: Colors.text,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
});

function Divider() { return <View style={{ height: 1, backgroundColor: Colors.border }} />; }

export default function LiabilityReleaseScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { studentId, courseId } = useLocalSearchParams<{ studentId: string; courseId: string }>();

  const { getStudent, getCourse, getDocumentByType, createDocument, updateDocument } = useInstructorStore();

  const student = studentId ? getStudent(studentId) : undefined;
  const course  = courseId  ? getCourse(courseId)   : undefined;

  // Check existing doc
  const existingDoc = studentId && courseId
    ? getDocumentByType(studentId, courseId, 'liability_release')
    : null;

  // Parse existing content
  const existingContent = existingDoc?.content ? (() => {
    try { return JSON.parse(existingDoc.content); } catch { return {}; }
  })() : {};

  const [participantName, setParticipantName] = useState(existingContent.participantName ?? student?.name ?? '');
  const [date, setDate]             = useState(existingContent.date ?? todayISO());
  const [witness, setWitness]       = useState(existingContent.witness ?? '');
  const [isMinor, setIsMinor]       = useState(existingContent.isMinor ?? false);
  const [guardianName, setGuardianName] = useState(existingContent.guardianName ?? '');
  const [agreed, setAgreed]         = useState(existingContent.agreed ?? false);
  const [sigData, setSigData]       = useState(existingDoc?.signatureData ?? '');
  const [showFullText, setShowFullText] = useState(false);

  const alreadySigned = !!existingDoc?.signedAt;

  function handleSave() {
    if (!agreed) { Alert.alert('Required', 'Please agree to the terms before saving.'); return; }
    if (!sigData) { Alert.alert('Signature Required', 'Please add a participant signature.'); return; }
    if (!studentId || !courseId) return;

    const content = JSON.stringify({ participantName, date, witness, isMinor, guardianName, agreed });

    if (existingDoc) {
      updateDocument(existingDoc.id, { content, signedAt: todayISO(), signatureData: sigData });
    } else {
      createDocument({
        studentId, courseId,
        docType: 'liability_release',
        title:   'Liability Release Agreement',
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
        <Text style={s.navTitle}>Liability Release</Text>
        <Pressable style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.headerSection}>
          <Ionicons name="document-text" size={48} color={Colors.accentBlue} />
          <Text style={s.headerTitle}>Liability Release Agreement</Text>
          {course && <Text style={s.headerSub}>{course.name}</Text>}
          {alreadySigned && (
            <View style={s.signedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={s.signedBadgeText}>Signed on {existingDoc!.signedAt}</Text>
            </View>
          )}
        </View>

        {/* Agreement Summary */}
        <SectionTitle label="Agreement" />
        <View style={s.card}>
          <View style={s.agreementSummary}>
            <Text style={s.summaryItem}>• Participant accepts risk inherent in scuba diving</Text>
            <Text style={s.summaryItem}>• Participant confirms physical fitness to dive</Text>
            <Text style={s.summaryItem}>• Participant agrees to follow instructor guidance</Text>
            <Text style={s.summaryItem}>• Participant releases liability for injury or loss</Text>
          </View>
          <Divider />
          <Pressable style={s.readFullBtn} onPress={() => setShowFullText(true)}>
            <Ionicons name="document-outline" size={16} color={Colors.accentBlue} />
            <Text style={s.readFullText}>Read Full Agreement Text</Text>
          </Pressable>
        </View>

        {/* Participant Information */}
        <SectionTitle label="Participant Information" />
        <View style={s.card}>
          <Field label="Participant Name *" value={participantName} onChangeText={setParticipantName} placeholder={student?.name ?? 'Full name'} />
          <Divider />
          <Field label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <Divider />
          <Field label="Witness Name" value={witness} onChangeText={setWitness} placeholder="Optional" />
        </View>

        {/* Minor Participant */}
        <SectionTitle label="Minor Participant" />
        <View style={s.card}>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Participant is a Minor</Text>
              <Text style={s.toggleSub}>Under 18 years old</Text>
            </View>
            <Switch value={isMinor} onValueChange={setIsMinor} trackColor={{ true: '#FF9500' }} />
          </View>
          {isMinor && (
            <>
              <Divider />
              <Field
                label="Parent / Guardian Name *"
                value={guardianName}
                onChangeText={setGuardianName}
                placeholder="Legal guardian signing on behalf of minor"
              />
              <Text style={s.minorNote}>
                By signing, the parent or guardian accepts all terms on behalf of the minor participant.
              </Text>
            </>
          )}
        </View>

        {/* Acknowledgment */}
        <SectionTitle label="Acknowledgment" />
        <View style={s.card}>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabelBold}>I agree to the terms above</Text>
              <Text style={s.toggleSub}>By enabling this switch, I confirm I have read and understand the liability release.</Text>
            </View>
            <Switch value={agreed} onValueChange={setAgreed} trackColor={{ true: Colors.accentBlue }} />
          </View>
        </View>

        {/* Signature */}
        <SectionTitle label="Participant Signature" />
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
              label="Participant Signature"
            />
          )}
          <Text style={s.sigNameLabel}>{participantName || (student?.name ?? 'Participant')}</Text>
        </View>
      </ScrollView>

      {/* Full Agreement Modal */}
      <Modal
        visible={showFullText}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFullText(false)}
      >
        <View style={ftm.container}>
          <View style={ftm.navbar}>
            <View style={{ minWidth: 60 }} />
            <Text style={ftm.title}>Full Agreement</Text>
            <Pressable style={ftm.doneBtn} onPress={() => setShowFullText(false)}>
              <Text style={ftm.doneText}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={ftm.content}>
            <Text style={ftm.text}>{AGREEMENT_TEXT}</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const ftm = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  title:   { flex: 1, ...(Typography.headline as TextStyle), color: Colors.text, textAlign: 'center' },
  doneBtn: { minWidth: 60, paddingVertical: Spacing.xs, alignItems: 'flex-end' },
  doneText: { ...(Typography.body as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  content: { padding: Spacing.xl },
  text:    { ...(Typography.body as TextStyle), color: Colors.text, lineHeight: 24 },
});

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
  headerSection: {
    alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm,
  },
  headerTitle: { ...(Typography.title3 as TextStyle), fontWeight: '700' as TextStyle['fontWeight'], color: Colors.text, textAlign: 'center' },
  headerSub:   { ...(Typography.subhead as TextStyle), color: Colors.textSecondary },
  signedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#34C759' + '1A', borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  signedBadgeText: { ...(Typography.caption1 as TextStyle), color: '#34C759', fontWeight: '600' as TextStyle['fontWeight'] },
  agreementSummary: { paddingVertical: Spacing.xs, gap: 6 },
  summaryItem:      { ...(Typography.body as TextStyle), color: Colors.text, lineHeight: 22 },
  readFullBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  readFullText:     { ...(Typography.body as TextStyle), color: Colors.accentBlue },
  toggleRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  toggleLabel:      { ...(Typography.body as TextStyle), color: Colors.text },
  toggleLabelBold:  { ...(Typography.body as TextStyle), color: Colors.text, fontWeight: '700' as TextStyle['fontWeight'] },
  toggleSub:        { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, marginTop: 2 },
  minorNote:        { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, paddingTop: Spacing.xs, paddingBottom: Spacing.sm },
  sigNameLabel:     { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, textAlign: 'center', paddingTop: Spacing.xs },
});
