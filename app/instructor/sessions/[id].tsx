import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useInstructorStore } from '@/src/stores/instructorStore';
import { COURSE_TEMPLATE_MAP } from '@/src/instructor/courseTemplates';
import type {
  Enrollment, SessionAttendance, SkillEnvironment, SkillSignoff, Student,
} from '@/src/models';
import { FlowLayout } from '@/src/ui/components/FlowLayout';

// Session type → default signoff environment
const ENV_FOR_TYPE: Record<string, SkillEnvironment> = {
  classroom:  'knowledge',
  pool:       'confined',
  open_water: 'open_water',
  other:      'knowledge',
};

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

function LabelRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={lr.row}>
      <Text style={lr.label}>{label}</Text>
      <Text style={lr.value}>{value}</Text>
    </View>
  );
}
const lr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  label: { flex: 1, ...(Typography.subhead as TextStyle), color: Colors.textSecondary },
  value: { ...(Typography.subhead as TextStyle), color: Colors.text, textAlign: 'right', flexShrink: 1 },
});

function initials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  classroom:  'Classroom',
  pool:       'Pool',
  open_water: 'Open Water',
  other:      'Other',
};

export default function SessionDetailScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { id }  = useLocalSearchParams<{ id: string }>();

  const {
    getSessions, getCourse, getEnrollments, getStudent,
    setAttendance, getAttendance,
    addSignoff, removeSignoff, getSignoffsByCourse,
  } = useInstructorStore();

  const [attendance, setAttendanceState] = useState<SessionAttendance[]>([]);
  const [enrollments, setEnrollments]    = useState<Enrollment[]>([]);
  const [allSignoffs, setAllSignoffs]    = useState<SkillSignoff[]>([]);

  // We find the session by searching courses for sessions
  // The session is identified by id; we need to find it via a course
  const [session, setSession] = useState(() => {
    // Search through all courses' sessions — use a workaround since there's no getSession(id)
    return null as null | import('@/src/models').CourseSession;
  });

  function refresh() {
    // Find session by id — we need to look through course sessions
    // Since there's no direct getSession, we query attendance which returns the session
    const att = getAttendance(id);
    setAttendanceState(att);
  }

  useFocusEffect(useCallback(() => {
    // Fetch attendance for this session
    const att = getAttendance(id);
    setAttendanceState(att);
  }, [id]));

  // Find the session via enrollment/course linkage
  // We'll pass courseId as a query param for efficiency
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();

  useFocusEffect(useCallback(() => {
    if (!courseId) return;
    const sessions = getSessions(courseId);
    const found = sessions.find(s => s.id === id);
    if (found) {
      setSession(found);
      setEnrollments(getEnrollments(courseId));
      setAllSignoffs(getSignoffsByCourse(courseId));
    }
    setAttendanceState(getAttendance(id));
  }, [id, courseId]));

  if (!session || !courseId) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.navbar}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
          </Pressable>
          <Text style={s.navTitle}>Session</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.center}>
          <Text style={s.emptyText}>
            {!courseId ? 'Missing course context.' : 'Session not found.'}
          </Text>
        </View>
      </View>
    );
  }

  const cid = courseId as string;  // narrowed by the early return above
  const course = getCourse(cid);
  const template = course?.templateId ? COURSE_TEMPLATE_MAP[course.templateId] : undefined;

  const defaultEnv = ENV_FOR_TYPE[session.sessionType] ?? 'knowledge';
  const skills = (() => {
    if (defaultEnv === 'knowledge') return template?.knowledgeSkills ?? [];
    if (defaultEnv === 'confined')  return template?.confinedSkills  ?? [];
    return template?.openWaterSkills ?? [];
  })();

  const enrolledStudents: Student[] = enrollments
    .map(e => getStudent(e.studentId))
    .filter((st): st is Student => st !== undefined);
  const attendedIds = new Set(attendance.filter(a => a.attended).map(a => a.studentId));

  function toggleAttendance(studentId: string, attended: boolean) {
    setAttendance(id, studentId, attended);
    setAttendanceState(getAttendance(id));
  }

  function isSigned(studentId: string, skillIndex: number): boolean {
    return allSignoffs.some(
      s => s.studentId === studentId && s.skillKey === String(skillIndex) && s.environment === defaultEnv,
    );
  }

  function toggleSignoff(studentId: string, skillIndex: number) {
    const key = String(skillIndex);
    if (isSigned(studentId, skillIndex)) {
      removeSignoff(studentId, cid, key, defaultEnv);
    } else {
      addSignoff(studentId, cid, key, defaultEnv, id);
    }
    setAllSignoffs(getSignoffsByCourse(cid));
  }

  function markAll(skillIndex: number) {
    const key = String(skillIndex);
    const allSigned = enrolledStudents.every(st => isSigned(st.id, skillIndex));
    enrolledStudents.forEach(st => {
      if (allSigned) {
        removeSignoff(st.id, cid, key, defaultEnv);
      } else if (!isSigned(st.id, skillIndex)) {
        addSignoff(st.id, cid, key, defaultEnv, id);
      }
    });
    setAllSignoffs(getSignoffsByCourse(cid));
  }

  const attendedCount = attendedIds.size;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.navbar}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
        </Pressable>
        <Text style={s.navTitle}>
          Session {session.sessionNumber}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
      >
        {/* Session Info */}
        <SectionHeader title="Session Info" />
        <View style={s.card}>
          <LabelRow label="Session #"  value={String(session.sessionNumber)} />
          <Divider />
          <LabelRow label="Type"  value={SESSION_TYPE_LABELS[session.sessionType] ?? session.sessionType} />
          {session.date ? (
            <>
              <Divider />
              <LabelRow label="Date" value={session.date} />
            </>
          ) : null}
          {session.topic ? (
            <>
              <Divider />
              <LabelRow label="Topic" value={session.topic} />
            </>
          ) : null}
          {session.notes ? (
            <>
              <Divider />
              <LabelRow label="Notes" value={session.notes} />
            </>
          ) : null}
          {course ? (
            <>
              <Divider />
              <LabelRow label="Course" value={course.name} />
            </>
          ) : null}
        </View>

        {/* Attendance */}
        <SectionHeader title={`Attendance — ${attendedCount}/${enrolledStudents.length}`} />
        <View style={s.card}>
          {enrolledStudents.length === 0 ? (
            <View style={s.emptyInCard}>
              <Text style={s.emptyInCardText}>No students enrolled</Text>
            </View>
          ) : (
            enrolledStudents.map((student, i) => {
              const attended = attendedIds.has(student.id);
              return (
                <View key={student.id}>
                  {i > 0 && <Divider />}
                  <View style={at.row}>
                    <Switch
                      value={attended}
                      onValueChange={v => toggleAttendance(student.id, v)}
                      trackColor={{ true: Colors.accentBlue }}
                    />
                    <View style={at.avatar}>
                      <Text style={at.avatarText}>{initials(student.name)}</Text>
                    </View>
                    <Text style={at.name}>{student.name}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Sign-offs */}
        {skills.length > 0 && enrolledStudents.length > 0 && (
          <>
            <SectionHeader title={`Sign-offs — ${SESSION_TYPE_LABELS[session.sessionType]}`} />
            <View style={s.card}>
              {skills.map((skill, skillIdx) => {
                const allSigned = enrolledStudents.every(st => isSigned(st.id, skillIdx));
                return (
                  <View key={skillIdx}>
                    {skillIdx > 0 && <Divider />}
                    <View style={so.skillBlock}>
                      <View style={so.skillHeader}>
                        <Text style={so.skillName} numberOfLines={2}>{skill}</Text>
                        <Pressable onPress={() => markAll(skillIdx)}>
                          <Text style={[so.markAll, { color: allSigned ? Colors.emergency : Colors.accentBlue }]}>
                            {allSigned ? 'Unmark' : 'Mark All'}
                          </Text>
                        </Pressable>
                      </View>
                      <FlowLayout spacing={6} style={{ marginTop: Spacing.xs }}>
                        {enrolledStudents.map(student => {
                          const signed = isSigned(student.id, skillIdx);
                          return (
                            <Pressable
                              key={student.id}
                              style={[
                                so.chip,
                                { backgroundColor: signed ? Colors.accentBlue + '26' : Colors.border + '80' },
                              ]}
                              onPress={() => toggleSignoff(student.id, skillIdx)}
                            >
                              <Ionicons
                                name={signed ? 'checkmark-circle' : 'ellipse-outline'}
                                size={13}
                                color={signed ? Colors.accentBlue : Colors.textTertiary}
                              />
                              <Text style={[so.chipName, { color: signed ? Colors.accentBlue : Colors.text }]}>
                                {student.name.split(' ')[0]}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </FlowLayout>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const at = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  avatar:     {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.accentBlue + '26',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...(Typography.caption2 as TextStyle), color: Colors.accentBlue, fontWeight: '700' as TextStyle['fontWeight'] },
  name:       { flex: 1, ...(Typography.subhead as TextStyle), color: Colors.text },
});

const so = StyleSheet.create({
  skillBlock:  { paddingVertical: Spacing.sm },
  skillHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  skillName:   { flex: 1, ...(Typography.subhead as TextStyle), fontWeight: '600' as TextStyle['fontWeight'], color: Colors.text },
  markAll:     { ...(Typography.caption1 as TextStyle), fontWeight: '600' as TextStyle['fontWeight'] },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  chipName: { ...(Typography.caption2 as TextStyle) },
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
  emptyInCard:     { paddingVertical: Spacing.md, alignItems: 'center' },
  emptyInCardText: { ...(Typography.subhead as TextStyle), color: Colors.textSecondary },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...(Typography.body as TextStyle), color: Colors.textSecondary },
});
