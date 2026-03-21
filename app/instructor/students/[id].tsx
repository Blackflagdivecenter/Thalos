import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useInstructorStore } from '@/src/stores/instructorStore';
import { todayISO } from '@/src/utils/uuid';
import type { InstructorCourse, Certification } from '@/src/models';

function initials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={ir.row}>
      <Ionicons name={icon as any} size={16} color={Colors.textTertiary} style={ir.icon} />
      <View style={ir.body}>
        <Text style={ir.label}>{label}</Text>
        <Text style={ir.value}>{value}</Text>
      </View>
    </View>
  );
}
const ir = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm, gap: Spacing.sm },
  icon:  { marginTop: 2, width: 20 },
  body:  { flex: 1 },
  label: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
  value: { ...(Typography.body as TextStyle), color: Colors.text },
});

function SectionHeader({ title }: { title: string }) {
  return <Text style={sh.t}>{title}</Text>;
}
const sh = StyleSheet.create({
  t: {
    ...(Typography.footnote as TextStyle), fontWeight: '700',
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.xl, marginBottom: Spacing.xs,
  },
});

// ── Certify Modal ─────────────────────────────────────────────────────────────

function CertifyModal({
  visible, studentId, studentName, courses, onClose,
}: {
  visible: boolean;
  studentId: string;
  studentName: string;
  courses: InstructorCourse[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { createCertification } = useInstructorStore();
  const [level, setLevel]     = useState('');
  const [agency, setAgency]   = useState('');
  const [certNum, setCertNum] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [notes, setNotes]     = useState('');

  function handleIssue() {
    if (!level.trim()) return;
    createCertification({
      studentId,
      courseId: courseId ?? null,
      certLevel: level.trim(),
      certAgency: agency.trim() || null,
      certNumber: certNum.trim() || null,
      issuedDate: todayISO(),
      notes: notes.trim() || null,
    });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[cm.container, { paddingTop: insets.top }]}>
        <View style={cm.navbar}>
          <Pressable onPress={onClose}>
            <Text style={cm.cancel}>Cancel</Text>
          </Pressable>
          <Text style={cm.title}>Issue Certification</Text>
          <Pressable onPress={handleIssue}>
            <Text style={[cm.issue, !level.trim() && { opacity: 0.4 }]}>Issue</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={cm.content} keyboardShouldPersistTaps="handled">
          <Text style={cm.studentName}>{studentName}</Text>

          <Text style={cm.fieldLabel}>Certification Level *</Text>
          <TextInput
            style={cm.input} value={level} onChangeText={setLevel}
            placeholder="e.g. Open Water Diver" placeholderTextColor={Colors.textTertiary}
          />
          <Text style={cm.fieldLabel}>Agency</Text>
          <TextInput style={cm.input} value={agency} onChangeText={setAgency} placeholder="e.g. PADI, SSI" placeholderTextColor={Colors.textTertiary} />
          <Text style={cm.fieldLabel}>Certification Number</Text>
          <TextInput style={cm.input} value={certNum} onChangeText={setCertNum} placeholder="Optional" placeholderTextColor={Colors.textTertiary} />
          {courses.length > 0 && (
            <>
              <Text style={cm.fieldLabel}>Linked Course</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <Pressable
                    style={[cm.chip, courseId === null && cm.chipActive]}
                    onPress={() => setCourseId(null)}
                  >
                    <Text style={[cm.chipText, courseId === null && cm.chipTextActive]}>None</Text>
                  </Pressable>
                  {courses.map(c => (
                    <Pressable
                      key={c.id}
                      style={[cm.chip, courseId === c.id && cm.chipActive]}
                      onPress={() => setCourseId(c.id)}
                    >
                      <Text style={[cm.chipText, courseId === c.id && cm.chipTextActive]} numberOfLines={1}>{c.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          )}
          <Text style={cm.fieldLabel}>Notes</Text>
          <TextInput
            style={[cm.input, { minHeight: 60 }]} value={notes} onChangeText={setNotes}
            placeholder="Optional" placeholderTextColor={Colors.textTertiary}
            multiline textAlignVertical="top"
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

const cm = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cancel:      { ...(Typography.body as TextStyle), color: Colors.accentBlue, flex: 1 },
  title:       { ...(Typography.headline as TextStyle), color: Colors.text, flex: 2, textAlign: 'center' },
  issue:       { ...(Typography.body as TextStyle), color: Colors.accentBlue, fontWeight: '600', flex: 1, textAlign: 'right' },
  content:     { padding: Spacing.lg, gap: Spacing.sm },
  studentName: { ...(Typography.headline as TextStyle), color: Colors.text, marginBottom: Spacing.md },
  fieldLabel:  { ...(Typography.footnote as TextStyle), color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    ...(Typography.body as TextStyle), color: Colors.text,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, marginBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.systemGray5,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive:     { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  chipText:       { ...(Typography.caption1 as TextStyle), color: Colors.text, fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function StudentDetailScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const {
    getStudent, deleteStudent, getCertifications, deleteCertification,
    getStudentEnrollments, getCourse,
  } = useInstructorStore();

  const [certifyVisible, setCertifyVisible] = useState(false);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<InstructorCourse[]>([]);

  const student = getStudent(id);

  useFocusEffect(useCallback(() => {
    setCerts(getCertifications(id));
    const enrollments = getStudentEnrollments(id);
    const cs = enrollments.map(e => getCourse(e.courseId)).filter((c): c is InstructorCourse => !!c);
    setEnrolledCourses(cs);
  }, [id]));

  if (!student) {
    return (
      <View style={[d.container, d.center, { paddingTop: insets.top }]}>
        <Text style={d.notFound}>Student not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
        </Pressable>
      </View>
    );
  }

  function handleDelete() {
    Alert.alert(
      'Delete Student',
      `Delete "${student!.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => { deleteStudent(id); router.back(); },
        },
      ],
    );
  }

  const STATUS_COLORS: Record<string, string> = {
    planning: Colors.warning, active: Colors.success,
    completed: Colors.accentBlue, cancelled: Colors.textTertiary,
  };

  return (
    <View style={[d.container, { paddingTop: insets.top }]}>
      {/* Navbar */}
      <View style={d.navbar}>
        <Pressable style={d.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
        </Pressable>
        <Text style={d.navTitle} numberOfLines={1}>{student.name}</Text>
        <Pressable
          style={d.editBtn}
          onPress={() => router.push(`/instructor/students/new?id=${id}`)}
        >
          <Text style={d.editText}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView
        style={d.scroll}
        contentContainerStyle={[d.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + name */}
        <View style={d.profileHeader}>
          <View style={d.bigAvatar}>
            <Text style={d.bigAvatarText}>{initials(student.name)}</Text>
          </View>
          <Text style={d.profileName}>{student.name}</Text>
          {student.certLevel ? (
            <Text style={d.profileCert}>{student.certLevel}{student.certAgency ? ` · ${student.certAgency}` : ''}</Text>
          ) : null}
        </View>

        {/* Contact Info */}
        <SectionHeader title="Contact Information" />
        <View style={d.card}>
          {student.email     && <InfoRow icon="mail"        label="Email"      value={student.email} />}
          {student.phone     && <InfoRow icon="call"        label="Phone"      value={student.phone} />}
          {student.studentId && <InfoRow icon="card"        label="Student ID" value={student.studentId} />}
          {student.dob       && <InfoRow icon="gift"        label="Date of Birth" value={student.dob} />}
          {student.notes     && <InfoRow icon="document-text" label="Notes"    value={student.notes} />}
          {!student.email && !student.phone && !student.studentId && !student.dob && !student.notes && (
            <Text style={d.noInfo}>No contact information on file.</Text>
          )}
        </View>

        {/* Enrolled Courses */}
        <SectionHeader title="Enrolled Courses" />
        <View style={d.card}>
          {enrolledCourses.length === 0 ? (
            <Text style={d.noInfo}>Not enrolled in any courses.</Text>
          ) : (
            enrolledCourses.map((course, idx) => (
              <React.Fragment key={course.id}>
                {idx > 0 && <View style={d.rowDivider} />}
                <Pressable
                  style={d.courseRow}
                  onPress={() => router.push(`/instructor/courses/${course.id}`)}
                >
                  <View style={d.courseInfo}>
                    <Text style={d.courseName}>{course.name}</Text>
                    <Text style={d.courseMeta}>{course.status}</Text>
                  </View>
                  <Pressable
                    style={d.progressBtn}
                    onPress={() => router.push(`/instructor/student-progress?studentId=${id}&courseId=${course.id}`)}
                  >
                    <Text style={d.progressBtnText}>Progress</Text>
                  </Pressable>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                </Pressable>
              </React.Fragment>
            ))
          )}
        </View>

        {/* Certifications */}
        <SectionHeader title="Certifications" />
        <View style={d.card}>
          {certs.length === 0 ? (
            <Text style={d.noInfo}>No certifications issued yet.</Text>
          ) : (
            certs.map((cert, idx) => (
              <React.Fragment key={cert.id}>
                {idx > 0 && <View style={d.rowDivider} />}
                <View style={d.certRow}>
                  <View style={d.certInfo}>
                    <Text style={d.certLevel}>{cert.certLevel}</Text>
                    <Text style={d.certMeta}>
                      {cert.certAgency ? `${cert.certAgency} · ` : ''}
                      {cert.issuedDate}
                      {cert.certNumber ? ` · #${cert.certNumber}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Remove Certification', 'Delete this certification?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => {
                          deleteCertification(cert.id);
                          setCerts(prev => prev.filter(c => c.id !== cert.id));
                        }},
                      ])
                    }
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
                  </Pressable>
                </View>
              </React.Fragment>
            ))
          )}
          <Pressable style={d.addCertBtn} onPress={() => setCertifyVisible(true)}>
            <Ionicons name="add-circle" size={18} color={Colors.accentBlue} />
            <Text style={d.addCertText}>Add Certification</Text>
          </Pressable>
        </View>

        {/* Delete */}
        <Pressable style={d.deleteBtn} onPress={handleDelete}>
          <Text style={d.deleteBtnText}>Delete Student</Text>
        </Pressable>
      </ScrollView>

      <CertifyModal
        visible={certifyVisible}
        studentId={id}
        studentName={student.name}
        courses={enrolledCourses}
        onClose={() => {
          setCertifyVisible(false);
          setCerts(getCertifications(id));
        }}
      />
    </View>
  );
}

const d = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { alignItems: 'center', justifyContent: 'center' },
  notFound:  { ...(Typography.body as TextStyle), color: Colors.textSecondary },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn:  { paddingVertical: Spacing.xs, paddingRight: Spacing.sm },
  navTitle: { flex: 1, ...(Typography.headline as TextStyle), color: Colors.text, textAlign: 'center' },
  editBtn:  { paddingVertical: Spacing.xs, paddingLeft: Spacing.sm },
  editText: { ...(Typography.body as TextStyle), color: Colors.accentBlue, fontWeight: '600' },
  scroll:   { flex: 1 },
  content:  { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  profileHeader: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  bigAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: `${Colors.accentBlue}26`,
    alignItems: 'center', justifyContent: 'center',
  },
  bigAvatarText: { fontSize: 28, fontWeight: '700' as TextStyle['fontWeight'], color: Colors.accentBlue },
  profileName:   { ...(Typography.title3 as TextStyle), fontWeight: '700', color: Colors.text },
  profileCert:   { ...(Typography.subhead as TextStyle), color: Colors.textSecondary },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
  },
  noInfo:     { ...(Typography.subhead as TextStyle), color: Colors.textTertiary, paddingVertical: Spacing.md },
  rowDivider: { height: 1, backgroundColor: Colors.border },

  courseRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
  courseInfo:    { flex: 1 },
  courseName:    { ...(Typography.subhead as TextStyle), fontWeight: '600', color: Colors.text },
  courseMeta:    { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, textTransform: 'capitalize' },
  progressBtn: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    backgroundColor: `${Colors.accentBlue}15`,
    borderRadius: Radius.sm,
  },
  progressBtnText: { ...(Typography.caption1 as TextStyle), color: Colors.accentBlue, fontWeight: '600' },

  certRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
  certInfo:   { flex: 1 },
  certLevel:  { ...(Typography.subhead as TextStyle), fontWeight: '600', color: Colors.text },
  certMeta:   { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },

  addCertBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  addCertText: { ...(Typography.subhead as TextStyle), color: Colors.accentBlue },

  deleteBtn: {
    marginTop: Spacing.xl,
    backgroundColor: `${Colors.emergency}15`,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.emergency,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  deleteBtnText: { ...(Typography.subhead as TextStyle), fontWeight: '600', color: Colors.emergency },
});
