/**
 * Student × Course progress view.
 * Route: /instructor/student-progress?studentId=X&courseId=Y
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useInstructorStore } from '@/src/stores/instructorStore';
import { COURSE_TEMPLATE_MAP } from '@/src/instructor/courseTemplates';
import type { Certification, InstructorDocument, SkillEnvironment, SkillSignoff, TrainingAcknowledgment } from '@/src/models';
import { SignaturePad, SavedSignatureView } from '@/src/ui/components/SignaturePad';
import { todayISO } from '@/src/utils/uuid';
import { CourseRepository } from '@/src/repositories/CourseRepository';

const courseRepo = new CourseRepository();

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={sh.text}>{title}</Text>;
}
const sh = StyleSheet.create({
  text: {
    ...(Typography.footnote as TextStyle),
    fontWeight: '700' as TextStyle['fontWeight'],
    color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.lg, marginBottom: Spacing.xs,
  },
});

function Divider() { return <View style={{ height: 1, backgroundColor: Colors.border }} />; }

function initials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${Math.min(100, value)}%` as unknown as number, backgroundColor: color }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: 6, borderRadius: 3 },
});

// ── Training Acknowledgment Modal ─────────────────────────────────────────────

const ACK_ENVS: { label: string; env: string; icon: string; color: string }[] = [
  { label: 'Knowledge',      env: 'knowledge',  icon: 'book-outline',     color: '#FF9500' },
  { label: 'Confined Water', env: 'confined',   icon: 'water-outline',    color: Colors.accentBlue },
  { label: 'Open Water',     env: 'open_water', icon: 'navigate-outline', color: '#34C759' },
];

function TrainingAckModal({
  visible, studentId, courseId, courseName, skills, existingAck, onDone, onClose,
}: {
  visible: boolean;
  studentId: string;
  courseId: string;
  courseName: string;
  skills: string[];
  existingAck: TrainingAcknowledgment | null;
  onDone: () => void;
  onClose: () => void;
}) {
  const { createAcknowledgment } = useInstructorStore();
  const ackInsets = useSafeAreaInsets();
  const [sigData, setSigData] = useState('');
  const [resigning, setResigning] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      setSigData(existingAck?.signatureData ?? '');
      const hasSig = !!existingAck?.signatureData;
      setResigning(!hasSig);
      // Pre-check all items when viewing an existing acknowledgment
      if (hasSig) {
        const all = new Set<string>();
        ACK_ENVS.forEach(({ env }) => skills.forEach((_, i) => all.add(`${env}:${i}`)));
        setCheckedItems(all);
      } else {
        setCheckedItems(new Set());
      }
    }
  }, [visible]);

  const totalItems = skills.length * ACK_ENVS.length;
  const allChecked = totalItems === 0 || checkedItems.size >= totalItems;

  function toggle(key: string) {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function handleSubmit() {
    if (!allChecked) { Alert.alert('Incomplete', 'Please check off every skill before signing.'); return; }
    if (!sigData) { Alert.alert('Signature Required', 'Please sign to acknowledge training.'); return; }
    createAcknowledgment({
      studentId,
      courseId,
      acknowledgedAt: todayISO(),
      signatureData: sigData,
    });
    onDone();
  }

  const showSaved = !resigning && !!existingAck?.signatureData && !!sigData;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[tam.container, { paddingTop: ackInsets.top }]}>
        <View style={tam.navbar}>
          <Pressable style={tam.cancelBtn} onPress={onClose}>
            <Text style={tam.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={tam.title}>Training Acknowledgment</Text>
          <Pressable style={tam.doneBtn} onPress={showSaved ? onClose : handleSubmit}>
            <Text style={tam.doneText}>{showSaved ? 'Done' : 'Submit'}</Text>
          </Pressable>
        </View>
        {/* Checklist scrolls; signature pad lives OUTSIDE the ScrollView so it
            never competes with scroll gestures */}
        <ScrollView style={tam.scroll} contentContainerStyle={tam.content} keyboardShouldPersistTaps="handled">
          <View style={tam.iconRow}>
            <Ionicons name="hand-left-outline" size={48} color={Colors.accentBlue} />
          </View>
          <Text style={tam.heading}>Student Training Agreement</Text>
          <Text style={tam.body}>
            I acknowledge that I have received training for <Text style={{ fontWeight: '700' as TextStyle['fontWeight'] }}>{courseName}</Text> and
            understand the risks involved in scuba diving. I confirm that all information
            I have provided is accurate and complete.
          </Text>

          {/* Skill checklist */}
          {skills.length > 0 && (
            <>
              <Text style={tam.checklistIntro}>
                Please confirm you have completed each of the following:
              </Text>
              {ACK_ENVS.map(section => (
                <View key={section.env} style={tam.envBlock}>
                  <View style={tam.envHeader}>
                    <Ionicons name={section.icon as never} size={14} color={section.color} />
                    <Text style={[tam.envLabel, { color: section.color }]}>{section.label}</Text>
                    <Text style={tam.envCount}>
                      {skills.filter((_, i) => checkedItems.has(`${section.env}:${i}`)).length}/{skills.length}
                    </Text>
                  </View>
                  {skills.map((skill, i) => {
                    const key = `${section.env}:${i}`;
                    const checked = checkedItems.has(key);
                    return (
                      <Pressable
                        key={i}
                        style={tam.skillRow}
                        onPress={showSaved ? undefined : () => toggle(key)}
                      >
                        <Ionicons
                          name={checked ? 'checkmark-circle' : 'ellipse-outline'}
                          size={20}
                          color={checked ? '#34C759' : Colors.textTertiary}
                        />
                        <Text style={[tam.skillText, checked && tam.skillChecked]}>{skill}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              {!allChecked && !showSaved && (
                <Text style={tam.warningText}>
                  Check off all skills above before signing.
                </Text>
              )}
            </>
          )}
        </ScrollView>

        {/* scrollEnabled=false ScrollView prevents the pageSheet swipe-to-dismiss
            gesture from stealing vertical strokes — same reason the other forms work */}
        <ScrollView
          style={tam.sigSection}
          scrollEnabled={false}
          bounces={false}
          keyboardShouldPersistTaps="always"
        >
          <Text style={tam.sigLabel}>Student Signature</Text>
          {showSaved ? (
            <SavedSignatureView
              svgData={existingAck!.signatureData!}
              height={150}
              onResign={() => { setSigData(''); setResigning(true); setCheckedItems(new Set()); }}
            />
          ) : (
            <SignaturePad
              height={150}
              onSign={setSigData}
              existingData={null}
            />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Certify Modal ─────────────────────────────────────────────────────────────

function CertifyModal({
  visible, studentId, courseId, studentName, courseName, onDone, onClose,
}: {
  visible: boolean;
  studentId: string;
  courseId: string;
  studentName: string;
  courseName: string;
  onDone: () => void;
  onClose: () => void;
}) {
  const { createCertification } = useInstructorStore();
  const [certLevel, setCertLevel]   = useState(courseName);
  const [agency, setAgency]         = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [notes, setNotes]           = useState('');

  function handleIssue() {
    if (!certLevel.trim()) { Alert.alert('Required', 'Certification level is required.'); return; }
    createCertification({
      studentId,
      courseId,
      certLevel: certLevel.trim(),
      certAgency: agency.trim() || null,
      certNumber: certNumber.trim() || null,
      issuedDate: todayISO(),
      notes: notes.trim() || null,
    });
    onDone();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={cm.container}>
        <View style={cm.navbar}>
          <Pressable style={cm.cancelBtn} onPress={onClose}>
            <Text style={cm.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={cm.title}>Issue Certification</Text>
          <Pressable style={cm.doneBtn} onPress={handleIssue}>
            <Text style={cm.doneText}>Issue</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={cm.content} keyboardShouldPersistTaps="handled">
          <View style={cm.summary}>
            <Ionicons name="checkmark-circle" size={32} color="#34C759" />
            <View>
              <Text style={cm.summaryName}>{studentName}</Text>
              <Text style={cm.summarySub}>{courseName}</Text>
            </View>
          </View>

          {[
            { label: 'Certification Level *', value: certLevel, setter: setCertLevel, placeholder: 'e.g. Open Water Diver' },
            { label: 'Agency', value: agency, setter: setAgency, placeholder: 'Optional' },
            { label: 'Certification #', value: certNumber, setter: setCertNumber, placeholder: 'Optional' },
          ].map(field => (
            <View key={field.label} style={cm.field}>
              <Text style={cm.fieldLabel}>{field.label}</Text>
              <TextInput
                style={cm.input}
                value={field.value}
                onChangeText={field.setter}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          ))}
          <View style={cm.field}>
            <Text style={cm.fieldLabel}>Notes</Text>
            <TextInput
              style={[cm.input, { minHeight: 60 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional"
              placeholderTextColor={Colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function StudentProgressScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { studentId, courseId } = useLocalSearchParams<{ studentId: string; courseId: string }>();

  const {
    getStudent, getCourse, getSignoffs, getDocuments, getAcknowledgment,
    addSignoff, removeSignoff,
  } = useInstructorStore();

  const [signoffs, setSignoffs]           = useState<SkillSignoff[]>([]);
  const [docs, setDocs]                   = useState<InstructorDocument[]>([]);
  const [prereqProofUri, setPrereqProofUri]       = useState<string | null>(null);
  const [prereqProofNotes, setPrereqProofNotes]   = useState('');
  const [showAckModal, setShowAckModal]   = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  function refresh() {
    if (studentId && courseId) {
      setSignoffs(getSignoffs(studentId, courseId));
      setDocs(getDocuments(studentId, courseId));
      const enrollment = courseRepo.getEnrollment(studentId, courseId);
      setPrereqProofUri(enrollment?.prereqProofUri ?? null);
      setPrereqProofNotes(enrollment?.prereqProofNotes ?? '');
    }
  }

  useFocusEffect(useCallback(() => { refresh(); }, [studentId, courseId]));

  const student = studentId ? getStudent(studentId) : undefined;
  const course  = courseId  ? getCourse(courseId)   : undefined;

  if (!student || !course) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.navbar}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
          </Pressable>
          <Text style={s.navTitle}>Progress</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.center}><Text style={s.emptyText}>Student or course not found.</Text></View>
      </View>
    );
  }

  const template    = course.templateId ? COURSE_TEMPLATE_MAP[course.templateId] : undefined;
  const needsPrereq = (template?.level ?? 'beginner') !== 'beginner';

  async function handlePickPrereqProof() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPrereqProofUri(uri);
      courseRepo.updateEnrollmentPrereqProof(studentId, courseId, uri, prereqProofNotes || null);
    }
  }

  async function handleTakePrereqPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPrereqProofUri(uri);
      courseRepo.updateEnrollmentPrereqProof(studentId, courseId, uri, prereqProofNotes || null);
    }
  }

  function handleRemovePrereqProof() {
    Alert.alert('Remove Proof', 'Remove the uploaded certification proof?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setPrereqProofUri(null);
        setPrereqProofNotes('');
        courseRepo.updateEnrollmentPrereqProof(studentId, courseId, null, null);
      }},
    ]);
  }

  function handlePrereqNotesBlur() {
    courseRepo.updateEnrollmentPrereqProof(studentId, courseId, prereqProofUri, prereqProofNotes || null);
  }

  const kSkills   = template?.knowledgeSkills  ?? [];
  const cwSkills  = template?.confinedSkills   ?? [];
  const owSkills  = template?.openWaterSkills  ?? [];

  const signedFor = (skillIdx: number, env: SkillEnvironment) =>
    signoffs.some(s => s.skillKey === String(skillIdx) && s.environment === env);

  function toggleSkill(skillIdx: number, env: SkillEnvironment) {
    const key = String(skillIdx);
    if (signedFor(skillIdx, env)) {
      removeSignoff(studentId, courseId, key, env);
    } else {
      addSignoff(studentId, courseId, key, env, null);
    }
    setSignoffs(getSignoffs(studentId, courseId));
  }

  // Progress counts (each env uses its own array's indices)
  const kCount  = kSkills.filter((_, i)  => signedFor(i, 'knowledge')).length;
  const cwCount = cwSkills.filter((_, i) => signedFor(i, 'confined')).length;
  const owCount = owSkills.filter((_, i) => signedFor(i, 'open_water')).length;

  const kPct  = kSkills.length  > 0 ? Math.round((kCount  / kSkills.length)  * 100) : 0;
  const cwPct = cwSkills.length > 0 ? Math.round((cwCount / cwSkills.length) * 100) : 0;
  const owPct = owSkills.length > 0 ? Math.round((owCount / owSkills.length) * 100) : 0;

  // Document status helpers
  const getDoc = (docType: string) => docs.find(d => d.docType === docType) ?? null;
  function docStatus(docType: string): 'notStarted' | 'inProgress' | 'finished' | 'reviewed' {
    const doc = getDoc(docType);
    if (!doc) return 'notStarted';
    if (doc.reviewedAt) return 'reviewed';
    if (doc.signedAt) return 'finished';
    if (doc.content) return 'inProgress';
    return 'notStarted';
  }
  const docStatusColors = { notStarted: Colors.textTertiary, inProgress: '#FF9500', finished: Colors.accentBlue, reviewed: '#34C759' };
  const docStatusLabels = { notStarted: 'Not started', inProgress: 'In progress', finished: 'Signed', reviewed: 'Reviewed' };

  const liabilityStatus = docStatus('liability_release');
  const medicalStatus   = docStatus('medical_questionnaire');

  // Acknowledgment
  const ack = courseId ? getAcknowledgment(studentId, courseId) : null;

  // Training dives
  const trainingDiveCount = template?.trainingDiveCount ?? 0;
  const trainingDiveDocs  = docs.filter(d => d.docType === 'training_dive');

  // Eligibility check
  const hasAnySkills  = kSkills.length > 0 || cwSkills.length > 0 || owSkills.length > 0;
  const allKnowledge  = kSkills.length  === 0 || kCount  === kSkills.length;
  const allConfined   = cwSkills.length === 0 || cwCount === cwSkills.length;
  const allOpenWater  = owSkills.length === 0 || owCount === owSkills.length;
  const liabilityOk   = liabilityStatus === 'reviewed';
  const medicalOk     = medicalStatus === 'reviewed';
  const ackOk         = !!ack;
  const divesDone     = trainingDiveCount === 0 || trainingDiveDocs.filter(d => !!d.signedAt).length >= trainingDiveCount;
  const isEligible    = (!hasAnySkills || (allKnowledge && allConfined && allOpenWater))
                        && liabilityOk && medicalOk && ackOk && divesDone;

  const envSections: { label: string; env: SkillEnvironment; icon: string; color: string; skills: string[]; count: number; pct: number }[] = [
    { label: 'Knowledge',      env: 'knowledge',  icon: 'book-outline',     color: '#FF9500',          skills: kSkills,  count: kCount,  pct: kPct  },
    { label: 'Confined Water', env: 'confined',   icon: 'water-outline',    color: Colors.accentBlue,  skills: cwSkills, count: cwCount, pct: cwPct },
    { label: 'Open Water',     env: 'open_water', icon: 'navigate-outline', color: '#34C759',           skills: owSkills, count: owCount, pct: owPct },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.navbar}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
        </Pressable>
        <Text style={s.navTitle} numberOfLines={1}>Progress</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
      >
        {/* Profile header */}
        <View style={[s.card, hd.card]}>
          <View style={hd.avatar}>
            <Text style={hd.avatarText}>{initials(student.name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={hd.name}>{student.name}</Text>
            <Text style={hd.course}>{course.name}</Text>
            {hasAnySkills && (
              <View style={hd.barsContainer}>
                <View style={hd.barRow}>
                  <Text style={hd.barLabel}>Skills</Text>
                  <ProgressBar
                    value={(() => {
                      const total = kSkills.length + cwSkills.length + owSkills.length;
                      return total > 0 ? Math.round(((kCount + cwCount + owCount) / total) * 100) : 0;
                    })()}
                    color={Colors.accentBlue}
                  />
                </View>
                <View style={hd.barRow}>
                  <Text style={hd.barLabel}>Docs</Text>
                  <ProgressBar value={liabilityOk && medicalOk ? 100 : (liabilityOk || medicalOk ? 50 : 0)} color="#34C759" />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Previous Certification Proof (non-beginner courses only) */}
        {needsPrereq && (
          <>
            <SectionHeader title="Previous Certification Proof" />
            <View style={s.card}>
              {prereqProofUri ? (
                <View style={pp.imageContainer}>
                  <Image source={{ uri: prereqProofUri }} style={pp.thumbnail} resizeMode="cover" />
                  <View style={pp.imageActions}>
                    <Pressable style={pp.actionBtn} onPress={handlePickPrereqProof}>
                      <Ionicons name="images-outline" size={16} color={Colors.accentBlue} />
                      <Text style={pp.actionText}>Replace</Text>
                    </Pressable>
                    <Pressable style={[pp.actionBtn, pp.actionBtnDanger]} onPress={handleRemovePrereqProof}>
                      <Ionicons name="trash-outline" size={16} color={Colors.emergency} />
                      <Text style={[pp.actionText, pp.actionTextDanger]}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={pp.uploadRow}>
                  <Pressable style={pp.uploadBtn} onPress={handlePickPrereqProof}>
                    <Ionicons name="images-outline" size={22} color={Colors.accentBlue} />
                    <Text style={pp.uploadBtnText}>Library</Text>
                  </Pressable>
                  <View style={pp.uploadDivider} />
                  <Pressable style={pp.uploadBtn} onPress={handleTakePrereqPhoto}>
                    <Ionicons name="camera-outline" size={22} color={Colors.accentBlue} />
                    <Text style={pp.uploadBtnText}>Camera</Text>
                  </Pressable>
                </View>
              )}
              <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm }} />
              <TextInput
                style={pp.notesInput}
                value={prereqProofNotes}
                onChangeText={setPrereqProofNotes}
                onBlur={handlePrereqNotesBlur}
                placeholder="Notes (cert #, agency, level…)"
                placeholderTextColor={Colors.textTertiary}
                multiline
              />
            </View>
          </>
        )}

        {/* Skills per environment — only show sections that have skills */}
        {envSections.filter(section => section.skills.length > 0).map(section => (
          <View key={section.env}>
            <View style={s.sectionHeaderRow}>
              <Ionicons name={section.icon as never} size={16} color={section.color} />
              <Text style={[sh.text, { marginTop: 0, color: section.color }]}>{section.label}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[sh.text, { marginTop: 0, color: section.count === section.skills.length ? '#34C759' : Colors.textSecondary }]}>
                {section.count}/{section.skills.length}
              </Text>
            </View>
            <View style={s.card}>
              {section.skills.map((skill, i) => {
                const signed = signedFor(i, section.env);
                return (
                  <View key={i}>
                    {i > 0 && <Divider />}
                    <Pressable style={sk.row} onPress={() => toggleSkill(i, section.env)}>
                      <Ionicons
                        name={signed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={signed ? '#34C759' : Colors.textTertiary}
                      />
                      <Text style={[sk.name, signed && sk.nameSigned]}>{skill}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Paperwork */}
        <SectionHeader title="Paperwork" />
        <View style={s.card}>
          {[
            { type: 'liability_release',    label: 'Liability Release',       route: `/instructor/forms/liability?studentId=${studentId}&courseId=${courseId}` },
            { type: 'medical_questionnaire', label: 'Medical Questionnaire',   route: `/instructor/forms/medical?studentId=${studentId}&courseId=${courseId}` },
          ].map((item, i) => {
            const st = docStatus(item.type);
            const color = docStatusColors[st];
            return (
              <View key={item.type}>
                {i > 0 && <Divider />}
                <Pressable style={dw.row} onPress={() => router.push(item.route as never)}>
                  <Ionicons
                    name={st === 'reviewed' ? 'checkmark-circle' : st === 'finished' ? 'checkmark-circle-outline' : 'document-outline'}
                    size={22} color={color}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={dw.label}>{item.label}</Text>
                    <Text style={[dw.status, { color }]}>{docStatusLabels[st]}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Training Acknowledgment */}
        <SectionHeader title="Training Acknowledgment" />
        <View style={s.card}>
          {ack ? (
            <View style={ackRow.row}>
              <Ionicons name="checkmark-circle" size={22} color="#34C759" />
              <View style={{ flex: 1 }}>
                <Text style={ackRow.signed}>Training Acknowledged</Text>
                <Text style={ackRow.date}>{ack.acknowledgedAt}</Text>
              </View>
              <Pressable onPress={() => setShowAckModal(true)}>
                <Text style={ackRow.resign}>Re-sign</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={ackRow.row} onPress={() => setShowAckModal(true)}>
              <Ionicons name="hand-left-outline" size={22} color="#FF9500" />
              <View style={{ flex: 1 }}>
                <Text style={ackRow.unsigned}>Not Yet Acknowledged</Text>
                <Text style={ackRow.hint}>Tap to sign training agreement</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Training Dives */}
        {trainingDiveCount > 0 && (
          <>
            <SectionHeader title={`Training Dives (${trainingDiveDocs.length}/${trainingDiveCount})`} />
            <View style={s.card}>
              {Array.from({ length: trainingDiveCount }, (_, i) => i + 1).map(diveNum => {
                const divDoc = trainingDiveDocs.find(d => {
                  try { return JSON.parse(d.content ?? '{}').diveNumber === diveNum; } catch { return false; }
                });
                const isSigned = !!divDoc?.signedAt;
                const isLogged = !!divDoc;
                return (
                  <View key={diveNum}>
                    {diveNum > 1 && <Divider />}
                    <Pressable
                      style={td.row}
                      onPress={() => router.push(`/instructor/forms/training-dive?studentId=${studentId}&courseId=${courseId}&diveNumber=${diveNum}` as never)}
                    >
                      <Ionicons
                        name={isSigned ? 'checkmark-circle' : isLogged ? 'pencil-outline' : 'ellipse-outline'}
                        size={22}
                        color={isSigned ? '#34C759' : isLogged ? Colors.accentBlue : Colors.textTertiary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={td.label}>Training Dive #{diveNum}</Text>
                        {divDoc ? (
                          <Text style={td.sub}>{divDoc.signedAt ? `Signed ${divDoc.signedAt}` : 'Logged, not signed'}</Text>
                        ) : (
                          <Text style={td.sub}>Not yet completed</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Certification section — always visible */}
        <SectionHeader title="Certification" />
        {isEligible ? (
          <Pressable style={s.certifyBtn} onPress={() => setShowCertModal(true)}>
            <Ionicons name="ribbon" size={20} color="#FFFFFF" />
            <Text style={s.certifyBtnText}>Certify Student</Text>
          </Pressable>
        ) : (
          <View style={s.card}>
            {hasAnySkills && [
              ...(kSkills.length  > 0 ? [{ ok: allKnowledge, label: 'Knowledge skills',      detail: `${kCount} of ${kSkills.length} signed off` }]  : []),
              ...(cwSkills.length > 0 ? [{ ok: allConfined,  label: 'Confined water skills', detail: `${cwCount} of ${cwSkills.length} signed off` }] : []),
              ...(owSkills.length > 0 ? [{ ok: allOpenWater, label: 'Open water skills',     detail: `${owCount} of ${owSkills.length} signed off` }] : []),
            ].map(item => (
              <View key={item.label} style={req.row}>
                <Ionicons name={item.ok ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={item.ok ? '#34C759' : '#FF9500'} />
                <View style={{ flex: 1 }}>
                  <Text style={[req.label, item.ok && req.done]}>{item.label}</Text>
                  {!item.ok && <Text style={req.detail}>{item.detail}</Text>}
                </View>
              </View>
            ))}
            {[
              {
                ok: liabilityOk,
                label: 'Liability release',
                detail: liabilityStatus === 'notStarted' ? 'Not yet completed'
                      : liabilityStatus === 'inProgress' ? 'Started but not signed'
                      : liabilityStatus === 'finished'   ? 'Signed — needs instructor review'
                      : 'Reviewed',
                onPress: () => router.push(`/instructor/forms/liability?studentId=${studentId}&courseId=${courseId}` as never),
              },
              {
                ok: medicalOk,
                label: 'Medical questionnaire',
                detail: medicalStatus === 'notStarted' ? 'Not yet completed'
                      : medicalStatus === 'inProgress' ? 'Started but not signed'
                      : medicalStatus === 'finished'   ? 'Signed — needs instructor review'
                      : 'Reviewed',
                onPress: () => router.push(`/instructor/forms/medical?studentId=${studentId}&courseId=${courseId}` as never),
              },
              {
                ok: ackOk,
                label: 'Training acknowledgment',
                detail: ack ? `Signed ${ack.acknowledgedAt}` : 'Student has not yet signed',
                onPress: ackOk ? undefined : () => setShowAckModal(true),
              },
              ...(trainingDiveCount > 0 ? [{
                ok: divesDone,
                label: 'Training dives',
                detail: `${trainingDiveDocs.filter(d => !!d.signedAt).length} of ${trainingDiveCount} logged with instructor signature`,
                onPress: undefined as (() => void) | undefined,
              }] : []),
            ].map(item => (
              <Pressable
                key={item.label}
                style={req.row}
                onPress={item.onPress}
                disabled={!item.onPress}
              >
                <Ionicons name={item.ok ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={item.ok ? '#34C759' : '#FF9500'} />
                <View style={{ flex: 1 }}>
                  <Text style={[req.label, item.ok && req.done]}>{item.label}</Text>
                  {!item.ok && <Text style={req.detail}>{item.detail}</Text>}
                </View>
                {!item.ok && item.onPress && <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <TrainingAckModal
        visible={showAckModal}
        studentId={studentId}
        courseId={courseId}
        courseName={course.name}
        skills={[...kSkills, ...cwSkills, ...owSkills]}
        existingAck={ack}
        onDone={() => { setShowAckModal(false); refresh(); }}
        onClose={() => setShowAckModal(false)}
      />
      <CertifyModal
        visible={showCertModal}
        studentId={studentId}
        courseId={courseId}
        studentName={student.name}
        courseName={course.name}
        onDone={() => { setShowCertModal(false); refresh(); Alert.alert('Certified!', `${student.name} has been certified.`); }}
        onClose={() => setShowCertModal(false)}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const tam = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cancelBtn:  { minWidth: 60, paddingVertical: Spacing.xs },
  cancelText: { ...(Typography.body as TextStyle), color: Colors.accentBlue },
  title:      { flex: 1, ...(Typography.headline as TextStyle), color: Colors.text, textAlign: 'center' },
  doneBtn:    { minWidth: 60, paddingVertical: Spacing.xs, alignItems: 'flex-end' },
  doneText:   { ...(Typography.body as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  scroll:     { flex: 1 },
  content:    { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.md },
  sigSection: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  iconRow:    { alignItems: 'center', paddingVertical: Spacing.md },
  heading:    { ...(Typography.title3 as TextStyle), fontWeight: '700' as TextStyle['fontWeight'], color: Colors.text, marginBottom: Spacing.sm },
  body:       { ...(Typography.body as TextStyle), color: Colors.textSecondary, lineHeight: 22 },
  sigLabel:   { ...(Typography.footnote as TextStyle), fontWeight: '600' as TextStyle['fontWeight'], color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  checklistIntro: { ...(Typography.footnote as TextStyle), fontWeight: '600' as TextStyle['fontWeight'], color: Colors.textSecondary, marginTop: Spacing.xs },
  envBlock:   { gap: 2 },
  envHeader:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm, marginBottom: 2 },
  envLabel:   { ...(Typography.footnote as TextStyle), fontWeight: '700' as TextStyle['fontWeight'], textTransform: 'uppercase', letterSpacing: 0.4, flex: 1 },
  envCount:   { ...(Typography.caption2 as TextStyle), color: Colors.textSecondary },
  skillRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 5 },
  skillText:  { flex: 1, ...(Typography.subhead as TextStyle), color: Colors.text },
  skillChecked: { color: Colors.textSecondary },
  warningText: { ...(Typography.caption1 as TextStyle), color: '#FF9500', textAlign: 'center', marginTop: Spacing.xs },
});

const cm = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cancelBtn:  { minWidth: 60, paddingVertical: Spacing.xs },
  cancelText: { ...(Typography.body as TextStyle), color: Colors.accentBlue },
  title:      { flex: 1, ...(Typography.headline as TextStyle), color: Colors.text, textAlign: 'center' },
  doneBtn:    { minWidth: 60, paddingVertical: Spacing.xs, alignItems: 'flex-end' },
  doneText:   { ...(Typography.body as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  content:    { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  summary:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  summaryName: { ...(Typography.headline as TextStyle), color: Colors.text, fontWeight: '700' as TextStyle['fontWeight'] },
  summarySub:  { ...(Typography.subhead as TextStyle), color: Colors.textSecondary },
  field:       { gap: 4 },
  fieldLabel:  { ...(Typography.footnote as TextStyle), fontWeight: '600' as TextStyle['fontWeight'], color: Colors.textSecondary },
  input: {
    ...(Typography.body as TextStyle), color: Colors.text,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
});

const hd = StyleSheet.create({
  card:       { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.md },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accentBlue + '26',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:    { ...(Typography.title2 as TextStyle), color: Colors.accentBlue, fontWeight: '700' as TextStyle['fontWeight'] },
  name:          { ...(Typography.title3 as TextStyle), fontWeight: '700' as TextStyle['fontWeight'], color: Colors.text },
  course:        { ...(Typography.subhead as TextStyle), color: Colors.textSecondary, marginBottom: Spacing.xs },
  barsContainer: { gap: 4, marginTop: Spacing.xs },
  barRow:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  barLabel:      { ...(Typography.caption2 as TextStyle), color: Colors.textSecondary, width: 36 },
});

const sk = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  name:      { flex: 1, ...(Typography.subhead as TextStyle), color: Colors.text },
  nameSigned:{ color: Colors.textSecondary },
});

const dw = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  label:  { ...(Typography.subhead as TextStyle), color: Colors.text, fontWeight: '600' as TextStyle['fontWeight'] },
  status: { ...(Typography.caption1 as TextStyle) },
});

const ackRow = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  signed:  { ...(Typography.subhead as TextStyle), color: '#34C759', fontWeight: '600' as TextStyle['fontWeight'] },
  date:    { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
  resign:  { ...(Typography.caption1 as TextStyle), color: Colors.accentBlue },
  unsigned: { ...(Typography.subhead as TextStyle), color: '#FF9500', fontWeight: '600' as TextStyle['fontWeight'] },
  hint:    { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
});

const td = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  label: { ...(Typography.subhead as TextStyle), color: Colors.text, fontWeight: '600' as TextStyle['fontWeight'] },
  sub:   { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
});

const req = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 7 },
  label:  { ...(Typography.subhead as TextStyle), color: Colors.text },
  done:   { color: Colors.textTertiary },
  detail: { ...(Typography.caption1 as TextStyle), color: '#FF9500', marginTop: 1 },
});

const pp = StyleSheet.create({
  imageContainer: { alignItems: 'center', paddingVertical: Spacing.xs },
  thumbnail: { width: '100%', height: 180, borderRadius: Radius.sm, marginBottom: Spacing.sm },
  imageActions: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.accentBlue, backgroundColor: Colors.accentBlue + '15',
  },
  actionBtnDanger: { borderColor: Colors.emergency, backgroundColor: Colors.emergency + '15' },
  actionText: { ...(Typography.caption1 as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  actionTextDanger: { color: Colors.emergency },
  uploadRow: { flexDirection: 'row', gap: Spacing.sm },
  uploadBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.md, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  uploadDivider: { width: 1, backgroundColor: Colors.border },
  uploadBtnText: { ...(Typography.caption1 as TextStyle), color: Colors.accentBlue, textAlign: 'center' },
  notesInput: { ...(Typography.body as TextStyle), color: Colors.text, minHeight: 40, paddingVertical: Spacing.xs },
});

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn:  { paddingVertical: Spacing.xs, paddingRight: Spacing.sm },
  navTitle: {
    flex: 1, ...(Typography.headline as TextStyle), color: Colors.text, textAlign: 'center',
  },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginTop: Spacing.lg, marginBottom: Spacing.xs,
  },
  certifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md,
    backgroundColor: '#34C759', borderRadius: Radius.md,
  },
  certifyBtnText: { ...(Typography.headline as TextStyle), color: '#FFFFFF', fontWeight: '700' as TextStyle['fontWeight'] },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...(Typography.body as TextStyle), color: Colors.textSecondary },
});
