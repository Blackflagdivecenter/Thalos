/**
 * Paperwork checklist for all students in a course.
 * Route: /instructor/paperwork?courseId=X
 */
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useInstructorStore } from '@/src/stores/instructorStore';
import type { InstructorDocument, Student } from '@/src/models';

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

type DocStatus = 'notStarted' | 'inProgress' | 'finished' | 'reviewed';

function computeDocStatus(doc: InstructorDocument | null): DocStatus {
  if (!doc) return 'notStarted';
  if (doc.reviewedAt) return 'reviewed';
  if (doc.signedAt) return 'finished';
  if (doc.content) return 'inProgress';
  return 'notStarted';
}

const DOC_STATUS_COLORS: Record<DocStatus, string> = {
  notStarted: Colors.textTertiary,
  inProgress: '#FF9500',
  finished:   Colors.accentBlue,
  reviewed:   '#34C759',
};

const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  notStarted: 'Not started',
  inProgress: 'In progress',
  finished:   'Signed',
  reviewed:   'Reviewed',
};

const DOC_TYPE_ICONS: Record<string, string> = {
  notStarted: 'document-outline',
  inProgress: 'document-text-outline',
  finished:   'checkmark-circle-outline',
  reviewed:   'checkmark-circle',
};

const DOC_TYPES: { type: string; label: string }[] = [
  { type: 'liability_release',     label: 'Liability Release' },
  { type: 'medical_questionnaire', label: 'Medical Questionnaire' },
];

function Divider() { return <View style={{ height: 1, backgroundColor: Colors.border }} />; }

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function PaperworkScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();

  const {
    getCourse, getEnrollments, getStudent, getDocuments, updateDocument,
  } = useInstructorStore();

  const [docsByStudent, setDocsByStudent] = useState<Map<string, InstructorDocument[]>>(new Map());
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);

  function refresh() {
    if (!courseId) return;
    const enrollments = getEnrollments(courseId);
    const students: Student[] = enrollments
      .map(e => getStudent(e.studentId))
      .filter((s): s is Student => s !== undefined);
    setEnrolledStudents(students);

    const map = new Map<string, InstructorDocument[]>();
    students.forEach(st => {
      map.set(st.id, getDocuments(st.id, courseId));
    });
    setDocsByStudent(map);
  }

  useFocusEffect(useCallback(() => { refresh(); }, [courseId]));

  const course = courseId ? getCourse(courseId) : undefined;

  if (!courseId || !course) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.navbar}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
          </Pressable>
          <Text style={s.navTitle}>Paperwork</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.center}><Text style={s.emptyText}>Course not found.</Text></View>
      </View>
    );
  }

  // Overall progress: count all (student × docType) combos that are finished/reviewed
  const totalDocs     = enrolledStudents.length * DOC_TYPES.length;
  let completedDocs   = 0;
  enrolledStudents.forEach(st => {
    const docs = docsByStudent.get(st.id) ?? [];
    DOC_TYPES.forEach(dt => {
      const doc = docs.find(d => d.docType === dt.type) ?? null;
      const status = computeDocStatus(doc);
      if (status === 'finished' || status === 'reviewed') completedDocs++;
    });
  });
  const overallPct = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

  function getFormRoute(studentId: string, docType: string): string {
    const base = `?studentId=${studentId}&courseId=${courseId}`;
    if (docType === 'liability_release')    return `/instructor/forms/liability${base}`;
    if (docType === 'medical_questionnaire') return `/instructor/forms/medical${base}`;
    return `/instructor/forms/liability${base}`; // fallback
  }

  function handleMarkReviewed(doc: InstructorDocument) {
    const now = new Date().toISOString().slice(0, 10);
    updateDocument(doc.id, { reviewedAt: now });
    refresh();
  }

  function handleVerifyAll(studentId: string) {
    const docs = docsByStudent.get(studentId) ?? [];
    const now = new Date().toISOString().slice(0, 10);
    docs.forEach(doc => {
      if (!doc.reviewedAt) updateDocument(doc.id, { reviewedAt: now });
    });
    refresh();
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.navbar}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
        </Pressable>
        <Text style={s.navTitle} numberOfLines={1}>Paperwork</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
      >
        {/* Overall Progress */}
        <View style={[s.card, op.card]}>
          <Ionicons name="document-text" size={24} color={Colors.accentBlue} />
          <View style={{ flex: 1 }}>
            <Text style={op.title}>Paperwork Progress</Text>
            <Text style={op.subtitle}>{completedDocs} of {totalDocs} documents completed</Text>
            <View style={op.track}>
              <View style={[op.fill, { width: `${overallPct}%` as unknown as number }]} />
            </View>
          </View>
          <Text style={op.pct}>{overallPct}%</Text>
        </View>

        {enrolledStudents.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
            <Text style={s.emptyTitle}>No Students Enrolled</Text>
            <Text style={s.emptySub}>Enroll students in this course to manage their paperwork.</Text>
          </View>
        ) : (
          enrolledStudents.map(student => {
            const docs = docsByStudent.get(student.id) ?? [];
            const studentCompleted = DOC_TYPES.reduce((acc, dt) => {
              const doc = docs.find(d => d.docType === dt.type) ?? null;
              const st = computeDocStatus(doc);
              return acc + (st === 'finished' || st === 'reviewed' ? 1 : 0);
            }, 0);
            const allDone = studentCompleted === DOC_TYPES.length;

            return (
              <View key={student.id} style={{ marginTop: Spacing.md }}>
                {/* Student header */}
                <View style={stu.header}>
                  <View style={stu.avatar}>
                    <Text style={stu.avatarText}>{initials(student.name)}</Text>
                  </View>
                  <Text style={stu.name}>{student.name}</Text>
                  {allDone
                    ? <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                    : (docs.some(d => !d.reviewedAt) && (
                        <Pressable style={stu.verifyAllBtn} onPress={() => handleVerifyAll(student.id)}>
                          <Ionicons name="checkmark-done" size={13} color="#34C759" />
                          <Text style={stu.verifyAllText}>Verify All</Text>
                        </Pressable>
                      ))
                  }
                  <Text style={stu.count}>{studentCompleted}/{DOC_TYPES.length}</Text>
                </View>

                <View style={s.card}>
                  {DOC_TYPES.map((dt, i) => {
                    const doc   = docs.find(d => d.docType === dt.type) ?? null;
                    const status = computeDocStatus(doc);
                    const color  = DOC_STATUS_COLORS[status];
                    const isReviewed = status === 'reviewed';
                    const hasDoc     = doc !== null;

                    return (
                      <View key={dt.type}>
                        {i > 0 && <Divider />}
                        <View style={dr.block}>
                          {/* Main row */}
                          <View style={dr.row}>
                            <Ionicons
                              name={DOC_TYPE_ICONS[status] as never}
                              size={20}
                              color={color}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={dr.label}>{dt.label}</Text>
                              <Text style={[dr.status, { color }]}>{DOC_STATUS_LABELS[status]}</Text>
                            </View>
                            {isReviewed && <Ionicons name="checkmark-circle" size={18} color="#34C759" />}
                          </View>

                          {/* Action buttons */}
                          <View style={dr.actions}>
                            <Pressable
                              style={dr.fillBtn}
                              onPress={() => router.push(getFormRoute(student.id, dt.type) as never)}
                            >
                              <Text style={dr.fillBtnText}>
                                {hasDoc ? 'View / Edit' : 'Fill Out'}
                              </Text>
                            </Pressable>

                            {isReviewed ? (
                              <View style={dr.reviewedBadge}>
                                <Ionicons name="checkmark-circle" size={13} color="#34C759" />
                                <Text style={dr.reviewedText}>Verified</Text>
                              </View>
                            ) : doc !== null ? (
                              <Pressable
                                style={dr.reviewBtn}
                                onPress={() => handleMarkReviewed(doc)}
                              >
                                <Ionicons name="checkmark-done-outline" size={13} color="#34C759" />
                                <Text style={dr.reviewBtnText}>Verify</Text>
                              </Pressable>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const op = StyleSheet.create({
  card:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  title:    { ...(Typography.subhead as TextStyle), fontWeight: '600' as TextStyle['fontWeight'], color: Colors.text },
  subtitle: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
  track:    { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  fill:     { height: 6, borderRadius: 3, backgroundColor: Colors.accentBlue },
  pct:      { ...(Typography.subhead as TextStyle), fontVariant: ['tabular-nums'], color: Colors.accentBlue, fontWeight: '700' as TextStyle['fontWeight'] },
});

const stu = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accentBlue + '26',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:    { ...(Typography.caption2 as TextStyle), color: Colors.accentBlue, fontWeight: '700' as TextStyle['fontWeight'] },
  name:          { flex: 1, ...(Typography.subhead as TextStyle), fontWeight: '600' as TextStyle['fontWeight'], color: Colors.text },
  count:         { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
  verifyAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: '#34C759' + '1A',
  },
  verifyAllText: { ...(Typography.caption2 as TextStyle), color: '#34C759', fontWeight: '600' as TextStyle['fontWeight'] },
});

const dr = StyleSheet.create({
  block:   { paddingVertical: Spacing.sm },
  row:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  label:   { ...(Typography.subhead as TextStyle), color: Colors.text },
  status:  { ...(Typography.caption1 as TextStyle) },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs, paddingLeft: 36 },
  fillBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentBlue + '1A',
  },
  fillBtnText: { ...(Typography.caption1 as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#34C759' + '1A',
  },
  reviewBtnText: { ...(Typography.caption1 as TextStyle), color: '#34C759', fontWeight: '600' as TextStyle['fontWeight'] },
  reviewedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: '#34C759' + '1A',
  },
  reviewedText: { ...(Typography.caption1 as TextStyle), color: '#34C759', fontWeight: '600' as TextStyle['fontWeight'] },
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
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xxxl, gap: Spacing.sm, marginTop: Spacing.xl,
  },
  emptyTitle: { ...(Typography.headline as TextStyle), color: Colors.text, textAlign: 'center' },
  emptySub:   { ...(Typography.subhead as TextStyle), color: Colors.textSecondary, textAlign: 'center' },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText:  { ...(Typography.body as TextStyle), color: Colors.textSecondary },
});
