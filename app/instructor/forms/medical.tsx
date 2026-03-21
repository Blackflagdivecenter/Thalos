/**
 * 3-page Medical Questionnaire digital form.
 * Route: /instructor/forms/medical?studentId=X&courseId=Y
 */
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
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

// ── Question data ─────────────────────────────────────────────────────────────

const PAGE1_QUESTIONS = [
  'I currently have a cold, congestion, flu or COVID-19',
  'I am currently taking prescription or non-prescription medications',
  'I have had recent surgery or hospitalization in the past 12 months',
  'I am currently pregnant or trying to become pregnant',
  'I suffer from any form of mental illness',
  'I have a history of seizures, epilepsy, or fits',
  'I have diabetes mellitus (sugar diabetes)',
  'I have high blood pressure or take medication to control blood pressure',
  'I have heart disease, heart attack, angina, or cardiac surgery',
  'I have a history of blackouts, fainting, or falling unconscious',
];

const BOX_A = [
  'Chronic ear problems or ear surgery', 'Sinus surgery', 'Dental surgery',
  'Problems with vision (beyond glasses/contacts)', 'Chronic back pain or injury',
  'Bone/joint problems or surgery', 'Chronic skin conditions or rashes',
  'Stomach/bowel/digestive problems', 'Blood clots or thrombosis',
  'HIV positive or have AIDS', 'Active cancer or tumors',
  'Organ transplant', 'Loss of limb, loss of sensation', 'Psychiatric or psychological conditions',
];

const BOX_B = [
  'Heart murmur', 'Coronary artery disease', 'Heart failure',
  'Elevated cholesterol', 'Irregular heartbeat or pacemaker', 'Shortness of breath with light activity',
  'Chronic swollen legs', 'Peripheral vascular disease',
];

const BOX_C = [
  'Asthma or bronchitis', 'Chronic obstructive pulmonary disease (COPD)', 'Spontaneous pneumothorax',
  'Chest surgery', 'Smoking history', 'Persistent cough',
];

const BOX_D = [
  'Stroke or paralysis', 'Head or spinal injury', 'Multiple sclerosis or neuromuscular disease',
  'Chronic migraines', 'Chronic dizziness or vertigo',
];

const BOX_E = [
  'Decompression sickness (DCS) history', 'Arterial gas embolism',
  'Chronic fatigue', 'Chronic pain', 'Chronic use of alcohol or drugs',
  'Anxiety or panic attacks', 'Eating disorder', 'Sickle cell disease',
  'Blood or immune system disorders', 'Other conditions not listed above',
];

// ── Components ────────────────────────────────────────────────────────────────

function PageIndicator({ page, total }: { page: number; total: number }) {
  return (
    <View style={pi.row}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[pi.dot, i === page && pi.dotActive]} />
      ))}
    </View>
  );
}
const pi = StyleSheet.create({
  row:      { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: Spacing.sm },
  dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.accentBlue },
});

function SectionBox({
  title, questions, answers, onChange,
}: {
  title: string;
  questions: string[];
  answers: boolean[];
  onChange: (index: number, value: boolean) => void;
}) {
  return (
    <View style={sb.container}>
      <Text style={sb.title}>{title}</Text>
      <View style={sb.card}>
        {questions.map((q, i) => (
          <View key={i}>
            {i > 0 && <View style={{ height: 1, backgroundColor: Colors.border }} />}
            <View style={sb.row}>
              <Text style={sb.number}>{i + 1}.</Text>
              <Text style={sb.question}>{q}</Text>
              <Switch
                value={answers[i] ?? false}
                onValueChange={v => onChange(i, v)}
                trackColor={{ true: '#FF9500' }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
const sb = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  title: {
    ...(Typography.footnote as TextStyle),
    fontWeight: '700' as TextStyle['fontWeight'],
    color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs,
  },
  row:      { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.sm },
  number:   { ...(Typography.footnote as TextStyle), color: Colors.textSecondary, fontVariant: ['tabular-nums'], width: 20 },
  question: { flex: 1, ...(Typography.body as TextStyle), color: Colors.text, lineHeight: 20 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MedicalQuestionnaireScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { studentId, courseId } = useLocalSearchParams<{ studentId: string; courseId: string }>();

  const { getStudent, getCourse, getDocumentByType, createDocument, updateDocument } = useInstructorStore();

  const student = studentId ? getStudent(studentId) : undefined;
  const course  = courseId  ? getCourse(courseId)   : undefined;

  const existingDoc = studentId && courseId
    ? getDocumentByType(studentId, courseId, 'medical_questionnaire')
    : null;

  const existingContent = existingDoc?.content ? (() => {
    try { return JSON.parse(existingDoc.content); } catch { return {}; }
  })() : {};

  const [page, setPage] = useState(0);

  // Page 1 state
  const [isPregnant, setIsPregnant] = useState(existingContent.isPregnant ?? false);
  const [isOver45, setIsOver45]     = useState(existingContent.isOver45 ?? false);
  const [p1Answers, setP1Answers]   = useState<boolean[]>(existingContent.p1Answers ?? new Array(PAGE1_QUESTIONS.length).fill(false));

  // Page 2 state
  const [boxAAnswers, setBoxAAnswers] = useState<boolean[]>(existingContent.boxAAnswers ?? new Array(BOX_A.length).fill(false));
  const [boxBAnswers, setBoxBAnswers] = useState<boolean[]>(existingContent.boxBAnswers ?? new Array(BOX_B.length).fill(false));
  const [boxCAnswers, setBoxCAnswers] = useState<boolean[]>(existingContent.boxCAnswers ?? new Array(BOX_C.length).fill(false));
  const [boxDAnswers, setBoxDAnswers] = useState<boolean[]>(existingContent.boxDAnswers ?? new Array(BOX_D.length).fill(false));
  const [boxEAnswers, setBoxEAnswers] = useState<boolean[]>(existingContent.boxEAnswers ?? new Array(BOX_E.length).fill(false));

  // Page 3 state
  const [sigData, setSigData] = useState(existingDoc?.signatureData ?? '');

  function updateBoolArray(
    arr: boolean[],
    setter: React.Dispatch<React.SetStateAction<boolean[]>>,
    index: number,
    value: boolean,
  ) {
    const copy = [...arr];
    copy[index] = value;
    setter(copy);
  }

  const hasYesAnswersP1 = isPregnant || isOver45 || p1Answers.some(Boolean);
  const hasYesAnswersP2 = boxAAnswers.some(Boolean) || boxBAnswers.some(Boolean) ||
                          boxCAnswers.some(Boolean) || boxDAnswers.some(Boolean) || boxEAnswers.some(Boolean);
  const requiresPhysician = hasYesAnswersP1 || hasYesAnswersP2;

  function handleNext() {
    if (page < 2) setPage(page + 1);
  }

  function handleBack() {
    if (page > 0) setPage(page - 1);
  }

  function handleSubmit() {
    if (!sigData) { Alert.alert('Signature Required', 'Please add your signature before submitting.'); return; }
    if (!studentId || !courseId) return;

    const content = JSON.stringify({
      isPregnant, isOver45, p1Answers,
      boxAAnswers, boxBAnswers, boxCAnswers, boxDAnswers, boxEAnswers,
      requiresPhysician,
    });

    if (existingDoc) {
      updateDocument(existingDoc.id, { content, signedAt: todayISO(), signatureData: sigData });
    } else {
      createDocument({
        studentId, courseId,
        docType: 'medical_questionnaire',
        title:   'Medical Questionnaire',
        content,
        signedAt:      todayISO(),
        signatureData: sigData,
      });
    }
    router.back();
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Navbar */}
      <View style={s.navbar}>
        <Pressable style={s.leftBtn} onPress={page > 0 ? handleBack : () => router.back()}>
          <Text style={s.leftBtnText}>{page > 0 ? 'Back' : 'Cancel'}</Text>
        </Pressable>
        <Text style={s.navTitle}>Medical Questionnaire</Text>
        <Pressable style={s.rightBtn} onPress={page < 2 ? handleNext : handleSubmit}>
          <Text style={s.rightBtnText}>{page < 2 ? 'Next' : 'Submit'}</Text>
        </Pressable>
      </View>

      <PageIndicator page={page} total={3} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── PAGE 1 ── */}
        {page === 0 && (
          <>
            <View style={s.pageHeader}>
              <Ionicons name="heart-outline" size={40} color="#FF3B30" />
              <Text style={s.pageTitle}>Medical Questionnaire</Text>
              {student && <Text style={s.pageSub}>{student.name}{student.dob ? ` · DOB: ${student.dob}` : ''}</Text>}
              <Text style={s.pageDate}>{todayISO()}</Text>
            </View>

            <View style={s.specialCard}>
              <View style={s.specialRow}>
                <Text style={s.specialLabel}>Currently Pregnant</Text>
                <Switch value={isPregnant} onValueChange={setIsPregnant} trackColor={{ true: '#FF9500' }} />
              </View>
              <View style={{ height: 1, backgroundColor: Colors.border }} />
              <View style={s.specialRow}>
                <Text style={s.specialLabel}>Over 45 Years Old</Text>
                <Switch value={isOver45} onValueChange={setIsOver45} trackColor={{ true: '#FF9500' }} />
              </View>
            </View>

            <SectionBox
              title="Medical Conditions"
              questions={PAGE1_QUESTIONS}
              answers={p1Answers}
              onChange={(i, v) => updateBoolArray(p1Answers, setP1Answers, i, v)}
            />

            {hasYesAnswersP1 && (
              <View style={s.warningBox}>
                <Ionicons name="warning" size={18} color="#FF9500" />
                <Text style={s.warningText}>
                  One or more YES answers detected. Physician evaluation may be required before diving.
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── PAGE 2 ── */}
        {page === 1 && (
          <>
            <Text style={s.page2Header}>Please answer YES or NO to the following:</Text>
            <SectionBox title="Box A — General Conditions" questions={BOX_A} answers={boxAAnswers}
              onChange={(i, v) => updateBoolArray(boxAAnswers, setBoxAAnswers, i, v)} />
            <SectionBox title="Box B — Heart & Circulation" questions={BOX_B} answers={boxBAnswers}
              onChange={(i, v) => updateBoolArray(boxBAnswers, setBoxBAnswers, i, v)} />
            <SectionBox title="Box C — Lungs & Breathing" questions={BOX_C} answers={boxCAnswers}
              onChange={(i, v) => updateBoolArray(boxCAnswers, setBoxCAnswers, i, v)} />
            <SectionBox title="Box D — Neurological" questions={BOX_D} answers={boxDAnswers}
              onChange={(i, v) => updateBoolArray(boxDAnswers, setBoxDAnswers, i, v)} />
            <SectionBox title="Box E — Other Conditions" questions={BOX_E} answers={boxEAnswers}
              onChange={(i, v) => updateBoolArray(boxEAnswers, setBoxEAnswers, i, v)} />

            {hasYesAnswersP2 && (
              <View style={s.warningBox}>
                <Ionicons name="warning" size={18} color="#FF9500" />
                <Text style={s.warningText}>
                  Physician evaluation required before student may dive.
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── PAGE 3 ── */}
        {page === 2 && (
          <>
            {requiresPhysician && (
              <View style={[s.warningBox, { marginBottom: Spacing.lg }]}>
                <Ionicons name="medical" size={18} color="#FF9500" />
                <Text style={s.warningText}>
                  Physician evaluation is required. Please ensure physician approval before certifying this student.
                </Text>
              </View>
            )}

            <View style={s.card}>
              <Text style={s.statementTitle}>Participant Statement</Text>
              <Text style={s.statementBody}>
                I confirm that the information provided on this questionnaire is accurate and complete
                to the best of my knowledge. I understand that withholding or misrepresenting medical
                information could endanger myself and others during diving activities.
              </Text>
            </View>

            <Text style={s.sigSectionLabel}>PARTICIPANT SIGNATURE</Text>
            <View style={s.card}>
              {existingDoc?.signatureData && !!sigData ? (
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
              <Text style={s.sigName}>{student?.name ?? 'Participant'}</Text>
            </View>
          </>
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
  leftBtn:      { minWidth: 60, paddingVertical: Spacing.xs },
  leftBtnText:  { ...(Typography.body as TextStyle), color: Colors.accentBlue },
  navTitle:     { flex: 1, ...(Typography.headline as TextStyle), color: Colors.text, textAlign: 'center' },
  rightBtn:     { minWidth: 60, paddingVertical: Spacing.xs, alignItems: 'flex-end' },
  rightBtnText: { ...(Typography.body as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  scroll:       { flex: 1 },
  content:      { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  pageHeader: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.lg },
  pageTitle:  { ...(Typography.title3 as TextStyle), fontWeight: '700' as TextStyle['fontWeight'], color: Colors.text },
  pageSub:    { ...(Typography.subhead as TextStyle), color: Colors.textSecondary },
  pageDate:   { ...(Typography.caption1 as TextStyle), color: Colors.textTertiary },

  specialCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  specialRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  specialLabel: { flex: 1, ...(Typography.body as TextStyle), color: Colors.text },

  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: '#FF9500' + '1A',
    borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.md,
  },
  warningText: { flex: 1, ...(Typography.body as TextStyle), color: '#FF9500' },

  page2Header: {
    ...(Typography.subhead as TextStyle), color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  statementTitle: { ...(Typography.headline as TextStyle), fontWeight: '700' as TextStyle['fontWeight'], color: Colors.text, marginBottom: Spacing.sm },
  statementBody:  { ...(Typography.body as TextStyle), color: Colors.text, lineHeight: 22 },
  sigSectionLabel: {
    ...(Typography.footnote as TextStyle),
    fontWeight: '700' as TextStyle['fontWeight'],
    color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.md, marginBottom: Spacing.xs,
  },
  sigName: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, textAlign: 'center', paddingTop: Spacing.xs },
});
