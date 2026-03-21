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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useInstructorStore } from '@/src/stores/instructorStore';
import { COURSE_TEMPLATE_MAP } from '@/src/instructor/courseTemplates';
import type {
  CourseSession, Enrollment, SkillEnvironment, SkillEntry, SkillOverrides, SkillSignoff, Student,
} from '@/src/models';
import { FlowLayout } from '@/src/ui/components/FlowLayout';
import { generateId, todayISO } from '@/src/utils/uuid';

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_TYPES: { key: CourseSession['sessionType']; label: string; icon: string }[] = [
  { key: 'classroom',  label: 'Classroom',   icon: 'book-outline' },
  { key: 'pool',       label: 'Pool',         icon: 'water-outline' },
  { key: 'open_water', label: 'Open Water',   icon: 'navigate-outline' },
  { key: 'other',      label: 'Other',        icon: 'ellipsis-horizontal' },
];

const ENV_TABS: { key: SkillEnvironment; label: string; icon: string }[] = [
  { key: 'knowledge',  label: 'Knowledge',      icon: 'book-outline' },
  { key: 'confined',   label: 'Confined Water', icon: 'water-outline' },
  { key: 'open_water', label: 'Open Water',     icon: 'navigate-outline' },
];

const STATUS_LIST = ['planning', 'active', 'completed', 'cancelled'] as const;
const STATUS_COLORS: Record<string, string> = {
  planning: '#FF9500', active: '#34C759', completed: Colors.accentBlue, cancelled: Colors.textTertiary,
};

// ── Helper components ─────────────────────────────────────────────────────────

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

function Divider() { return <View style={{ height: 1, backgroundColor: Colors.border }} />; }

function initials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

// ── AddSessionModal ───────────────────────────────────────────────────────────

function AddSessionModal({
  visible, courseId, nextNumber, onDone, onClose,
}: {
  visible: boolean;
  courseId: string;
  nextNumber: number;
  onDone: () => void;
  onClose: () => void;
}) {
  const { createSession } = useInstructorStore();
  const [type, setType]   = useState<CourseSession['sessionType']>('classroom');
  const [date, setDate]   = useState(todayISO());
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');

  function handleAdd() {
    createSession({
      courseId,
      sessionNumber: nextNumber,
      sessionType:   type,
      date:          date || null,
      topic:         topic.trim() || null,
      notes:         notes.trim() || null,
    });
    setType('classroom'); setDate(todayISO()); setTopic(''); setNotes('');
    onDone();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={m.container}>
        <View style={m.navbar}>
          <Pressable style={m.cancelBtn} onPress={onClose}>
            <Text style={m.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={m.title}>Add Session</Text>
          <Pressable style={m.doneBtn} onPress={handleAdd}>
            <Text style={m.doneText}>Add</Text>
          </Pressable>
        </View>
        <ScrollView style={m.scroll} contentContainerStyle={m.content} keyboardShouldPersistTaps="handled">
          <Text style={m.sectionTitle}>SESSION TYPE</Text>
          <View style={m.typeGrid}>
            {SESSION_TYPES.map(st => (
              <Pressable
                key={st.key}
                style={[m.typeChip, type === st.key && m.typeChipActive]}
                onPress={() => setType(st.key)}
              >
                <Ionicons name={st.icon as never} size={16} color={type === st.key ? '#FFFFFF' : Colors.text} />
                <Text style={[m.typeLabel, type === st.key && m.typeLabelActive]}>{st.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={m.sectionTitle}>DATE</Text>
          <TextInput
            style={m.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="numeric"
          />

          <Text style={m.sectionTitle}>TOPIC</Text>
          <TextInput
            style={m.input}
            value={topic}
            onChangeText={setTopic}
            placeholder="Session topic (optional)"
            placeholderTextColor={Colors.textTertiary}
          />

          <Text style={m.sectionTitle}>NOTES</Text>
          <TextInput
            style={[m.input, { minHeight: 80 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            placeholderTextColor={Colors.textTertiary}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── EnrollStudentModal ────────────────────────────────────────────────────────

function EnrollStudentModal({
  visible, courseId, enrolledIds, onDone, onClose,
}: {
  visible: boolean;
  courseId: string;
  enrolledIds: Set<string>;
  onDone: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const { students, enrollStudent } = useInstructorStore();
  const [query, setQuery] = useState('');

  const available = students.filter(s => {
    if (enrolledIds.has(s.id)) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.email ?? '').toLowerCase().includes(q);
  });

  function enroll(studentId: string) {
    enrollStudent(studentId, courseId);
    setQuery('');
    onDone();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={m.container}>
        <View style={m.navbar}>
          <Pressable style={m.cancelBtn} onPress={onClose}>
            <Text style={m.cancelText}>Close</Text>
          </Pressable>
          <Text style={m.title}>Enroll Student</Text>
          <View style={m.doneBtn} />
        </View>

        {/* New student shortcut */}
        <Pressable
          style={em.newRow}
          onPress={() => { onClose(); router.push('/instructor/students/new'); }}
        >
          <View style={em.plusCircle}>
            <Ionicons name="add" size={18} color={Colors.accentBlue} />
          </View>
          <Text style={em.newText}>Create New Student</Text>
        </Pressable>

        <View style={em.searchBar}>
          <Ionicons name="search" size={16} color={Colors.textTertiary} />
          <TextInput
            style={em.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search students…"
            placeholderTextColor={Colors.textTertiary}
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView>
          {available.length === 0 ? (
            <View style={em.empty}>
              <Text style={em.emptyText}>{query ? 'No matching students' : 'All students enrolled'}</Text>
            </View>
          ) : (
            available.map(student => (
              <Pressable key={student.id} style={em.row} onPress={() => enroll(student.id)}>
                <View style={em.avatar}>
                  <Text style={em.avatarText}>{initials(student.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={em.name}>{student.name}</Text>
                  {student.email ? <Text style={em.sub}>{student.email}</Text> : null}
                </View>
                <Ionicons name="add-circle" size={22} color={Colors.accentBlue} />
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── SkillEditorModal ──────────────────────────────────────────────────────────

function SkillEditorModal({
  visible,
  env,
  entries,
  onSave,
  onClose,
}: {
  visible: boolean;
  env: SkillEnvironment;
  entries: SkillEntry[];
  onSave: (updated: SkillEntry[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<SkillEntry[]>(entries);
  const envLabel = env === 'knowledge' ? 'Knowledge' : env === 'confined' ? 'Confined Water' : 'Open Water';

  // Sync entries when modal opens
  const prevVisible = React.useRef(false);
  if (visible && !prevVisible.current) {
    if (JSON.stringify(items) !== JSON.stringify(entries)) setItems(entries);
  }
  prevVisible.current = visible;

  function moveUp(i: number) {
    if (i === 0) return;
    setItems(prev => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }

  function moveDown(i: number) {
    setItems(prev => {
      if (i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  }

  function addCustom() {
    Alert.prompt(
      `Add ${envLabel} Skill`,
      'Enter skill name',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (name?: string) => {
            const trimmed = (name ?? '').trim();
            if (!trimmed) return;
            setItems(prev => [...prev, { key: `c_${generateId()}`, name: trimmed }]);
          },
        },
      ],
      'plain-text',
    );
  }

  function deleteItem(i: number) {
    Alert.alert(
      'Remove Skill',
      `Remove "${items[i].name}" from ${envLabel}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setItems(prev => prev.filter((_, idx) => idx !== i)) },
      ],
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={sed.container}>
        <View style={sed.navbar}>
          <Pressable style={sed.cancelBtn} onPress={onClose}>
            <Text style={sed.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={sed.title}>{envLabel} Skills</Text>
          <Pressable style={sed.doneBtn} onPress={() => onSave(items)}>
            <Text style={sed.doneText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={sed.listContent} keyboardShouldPersistTaps="handled">
          {items.map((item, i) => (
            <View key={item.key} style={sed.row}>
              {/* Up/Down order controls */}
              <View style={sed.arrows}>
                <Pressable onPress={() => moveUp(i)} style={sed.arrowBtn} hitSlop={8}>
                  <Ionicons name="chevron-up" size={18} color={i === 0 ? Colors.border : Colors.textSecondary} />
                </Pressable>
                <Pressable onPress={() => moveDown(i)} style={sed.arrowBtn} hitSlop={8}>
                  <Ionicons name="chevron-down" size={18} color={i === items.length - 1 ? Colors.border : Colors.textSecondary} />
                </Pressable>
              </View>

              <View style={sed.rowLabel}>
                <Text style={sed.skillName} numberOfLines={2}>{item.name}</Text>
                {item.key.startsWith('c_') && (
                  <Text style={sed.customBadge}>Custom</Text>
                )}
              </View>

              <Pressable onPress={() => deleteItem(i)} hitSlop={8} style={sed.deleteBtn}>
                <Ionicons name="trash-outline" size={17} color={Colors.emergency} />
              </Pressable>
            </View>
          ))}

          <Pressable style={sed.addRow} onPress={addCustom}>
            <Ionicons name="add-circle" size={18} color={Colors.accentBlue} />
            <Text style={sed.addText}>Add Custom Skill</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const sed = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
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
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  arrows:     { flexDirection: 'column', alignItems: 'center', gap: 0 },
  arrowBtn:   { paddingVertical: 2 },
  rowLabel:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  skillName:  { ...(Typography.subhead as TextStyle), color: Colors.text, flexShrink: 1 },
  customBadge: {
    ...(Typography.caption2 as TextStyle),
    color: Colors.accentBlue,
    fontWeight: '600' as TextStyle['fontWeight'],
    backgroundColor: Colors.accentBlue + '1A',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.full,
  },
  deleteBtn:  { padding: 4 },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  addText: { ...(Typography.body as TextStyle), color: Colors.accentBlue },
});

// ── StatusPickerModal ─────────────────────────────────────────────────────────

function StatusPickerModal({
  visible, current, onPick, onClose,
}: {
  visible: boolean;
  current: string;
  onPick: (s: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={sp.backdrop} onPress={onClose}>
        <View style={sp.sheet}>
          <Text style={sp.title}>Change Status</Text>
          {STATUS_LIST.map(s => (
            <Pressable key={s} style={sp.option} onPress={() => onPick(s)}>
              <View style={[sp.dot, { backgroundColor: STATUS_COLORS[s] }]} />
              <Text style={[sp.optLabel, current === s && { fontWeight: '700' as TextStyle['fontWeight'], color: Colors.accentBlue }]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
              {current === s && <Ionicons name="checkmark" size={18} color={Colors.accentBlue} />}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function CourseDetailScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { id }  = useLocalSearchParams<{ id: string }>();

  const {
    getCourse, updateCourse, updateSkillOverrides, deleteCourse, loadCourses,
    getSessions, getEnrollments, unenrollStudent, getSignoffsByCourse,
    addSignoff, removeSignoff, getStudent, students,
  } = useInstructorStore();

  const [sessions, setSessions]       = useState<CourseSession[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allSignoffs, setAllSignoffs] = useState<SkillSignoff[]>([]);
  const [activeEnv, setActiveEnv]     = useState<SkillEnvironment>('knowledge');
  const [showAddSession, setShowAddSession]     = useState(false);
  const [showEnroll, setShowEnroll]             = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showSkillEditor, setShowSkillEditor]   = useState(false);

  function refresh() {
    loadCourses();
    setSessions(getSessions(id));
    setEnrollments(getEnrollments(id));
    setAllSignoffs(getSignoffsByCourse(id));
  }

  useFocusEffect(useCallback(() => { refresh(); }, [id]));

  const course = getCourse(id);

  if (!course) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.navbar}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
          </Pressable>
          <Text style={s.navTitle}>Course</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.center}><Text style={s.emptyText}>Course not found.</Text></View>
      </View>
    );
  }

  const course_ = course; // stable const for closures after null-check narrowing
  const template = course_.templateId ? COURSE_TEMPLATE_MAP[course_.templateId] : undefined;

  // Build per-environment skill lists from overrides or template defaults
  function buildEnvEntries(env: SkillEnvironment): SkillEntry[] {
    const override = course_.skillOverrides?.[env];
    if (override) return override;
    let templateSkills: string[];
    if (env === 'knowledge') templateSkills = template?.knowledgeSkills ?? [];
    else if (env === 'confined') templateSkills = template?.confinedSkills ?? [];
    else templateSkills = template?.openWaterSkills ?? [];
    return templateSkills.map((name, i) => ({ key: String(i), name }));
  }

  const knowledgeEntries  = buildEnvEntries('knowledge');
  const confinedEntries   = buildEnvEntries('confined');
  const openWaterEntries  = buildEnvEntries('open_water');

  function activeEntries(): SkillEntry[] {
    if (activeEnv === 'knowledge') return knowledgeEntries;
    if (activeEnv === 'confined')  return confinedEntries;
    return openWaterEntries;
  }

  const hasSkills =
    (template?.knowledgeSkills?.length ?? 0) > 0 ||
    (template?.confinedSkills?.length ?? 0) > 0 ||
    (template?.openWaterSkills?.length ?? 0) > 0 ||
    Object.values(course.skillOverrides ?? {}).some(arr => arr && arr.length > 0);

  const enrolledStudents: Student[] = enrollments
    .map(e => getStudent(e.studentId))
    .filter((s): s is Student => s !== undefined);

  const enrolledIds = new Set(enrollments.map(e => e.studentId));

  // Signoff helpers — keyed by SkillEntry.key (stable regardless of display order)
  function isSigned(studentId: string, skillKey: string, env: SkillEnvironment): boolean {
    return allSignoffs.some(
      s => s.studentId === studentId && s.skillKey === skillKey && s.environment === env,
    );
  }

  function toggleSignoff(studentId: string, skillKey: string, env: SkillEnvironment) {
    if (isSigned(studentId, skillKey, env)) {
      removeSignoff(studentId, id, skillKey, env);
    } else {
      addSignoff(studentId, id, skillKey, env, null);
    }
    setAllSignoffs(getSignoffsByCourse(id));
  }

  function markAll(skillKey: string, env: SkillEnvironment) {
    const allSigned = enrolledStudents.every(st => isSigned(st.id, skillKey, env));
    enrolledStudents.forEach(st => {
      if (allSigned) {
        removeSignoff(st.id, id, skillKey, env);
      } else if (!isSigned(st.id, skillKey, env)) {
        addSignoff(st.id, id, skillKey, env, null);
      }
    });
    setAllSignoffs(getSignoffsByCourse(id));
  }

  function handleSaveSkillEditor(updated: SkillEntry[]) {
    const newOverrides: SkillOverrides = {
      ...(course_.skillOverrides ?? {}),
      [activeEnv]: updated,
    };
    updateSkillOverrides(id, newOverrides);
    setShowSkillEditor(false);
  }

  // Progress calculation
  function envProgress(env: SkillEnvironment): number {
    const entries = buildEnvEntries(env);
    const total = entries.length * enrolledStudents.length;
    if (total === 0) return 0;
    const done = allSignoffs.filter(s => s.environment === env).length;
    return Math.round((done / total) * 100);
  }

  const knowledgePct   = envProgress('knowledge');
  const confinedPct    = envProgress('confined');
  const openWaterPct   = envProgress('open_water');

  function handleDelete() {
    Alert.alert(
      'Delete Course',
      `Delete "${course!.name}"? This will remove all sessions, enrollments, and signoffs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => { deleteCourse(id); router.back(); },
        },
      ],
    );
  }

  const statusColor = STATUS_COLORS[course.status] ?? Colors.textTertiary;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Navbar */}
      <View style={s.navbar}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
        </Pressable>
        <Text style={s.navTitle} numberOfLines={1}>{course.name}</Text>
        <Pressable style={s.editBtn} onPress={() => router.push(`/instructor/courses/new?id=${id}`)}>
          <Text style={s.editText}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Course Info ── */}
        <SectionHeader title="Course Info" />
        <View style={s.card}>
          {template && (
            <>
              <LabelRow label="Template" value={template.name} />
              <Divider />
            </>
          )}
          <Pressable onPress={() => setShowStatusPicker(true)}>
            <View style={lr.row}>
              <Text style={lr.label}>Status</Text>
              <View style={[s.statusBadge, { backgroundColor: statusColor + '26' }]}>
                <Text style={[s.statusText, { color: statusColor }]}>
                  {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                </Text>
              </View>
            </View>
          </Pressable>
          {course.location ? (
            <>
              <Divider />
              <LabelRow label="Location" value={course.location} />
            </>
          ) : null}
          {course.startDate ? (
            <>
              <Divider />
              <LabelRow label="Start Date" value={course.startDate} />
            </>
          ) : null}
          {course.endDate ? (
            <>
              <Divider />
              <LabelRow label="End Date" value={course.endDate} />
            </>
          ) : null}
          <Divider />
          <LabelRow label="Max Students" value={String(course.maxStudents)} />
          {course.description ? (
            <>
              <Divider />
              <LabelRow label="Notes" value={course.description} />
            </>
          ) : null}
        </View>

        {/* ── Progress ── */}
        {enrolledStudents.length > 0 && hasSkills && (
          <>
            <SectionHeader title="Progress" />
            <View style={s.card}>
              {[
                { label: 'Knowledge',     icon: 'book-outline',     pct: knowledgePct,  color: '#FF9500' },
                { label: 'Confined Water',icon: 'water-outline',    pct: confinedPct,   color: Colors.accentBlue },
                { label: 'Open Water',    icon: 'navigate-outline', pct: openWaterPct,  color: '#34C759' },
              ].map((item, i) => (
                <View key={item.label}>
                  {i > 0 && <Divider />}
                  <View style={p.row}>
                    <Ionicons name={item.icon as never} size={18} color={item.color} />
                    <Text style={p.label}>{item.label}</Text>
                    <Text style={p.pct}>{item.pct}%</Text>
                  </View>
                  <View style={p.track}>
                    <View style={[p.fill, { width: `${item.pct}%` as unknown as number, backgroundColor: item.color }]} />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Enrolled Students ── */}
        <SectionHeader title={`Students (${enrolledStudents.length}/${course.maxStudents})`} />
        <View style={s.card}>
          {enrolledStudents.length === 0 ? (
            <View style={s.emptyInCard}>
              <Text style={s.emptyInCardText}>No students enrolled</Text>
            </View>
          ) : (
            enrolledStudents.map((student, i) => {
              const signedCount = allSignoffs.filter(s => s.studentId === student.id).length;
              return (
                <View key={student.id}>
                  {i > 0 && <Divider />}
                  <View style={en.row}>
                    <View style={en.avatar}>
                      <Text style={en.avatarText}>{initials(student.name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={en.name}>{student.name}</Text>
                      {hasSkills && (
                        <Text style={en.count}>{signedCount} / {(knowledgeEntries.length + confinedEntries.length + openWaterEntries.length)} signoffs</Text>
                      )}
                    </View>
                    <Pressable
                      style={en.progressBtn}
                      onPress={() => router.push(`/instructor/student-progress?studentId=${student.id}&courseId=${id}`)}
                    >
                      <Text style={en.progressText}>Progress</Text>
                    </Pressable>
                    <Pressable
                      style={en.removeBtn}
                      onPress={() => {
                        Alert.alert('Remove', `Remove ${student.name} from this course?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => { unenrollStudent(student.id, id); refresh(); } },
                        ]);
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: 1, backgroundColor: Colors.border, marginTop: Spacing.sm }} />
          <Pressable style={s.addRow} onPress={() => setShowEnroll(true)}>
            <Ionicons name="person-add" size={18} color={Colors.accentBlue} />
            <Text style={s.addRowText}>Enroll Student</Text>
          </Pressable>
        </View>

        {/* ── Paperwork ── */}
        <SectionHeader title="Paperwork" />
        <Pressable
          style={[s.card, s.paperworkRow]}
          onPress={() => router.push(`/instructor/paperwork?courseId=${id}`)}
        >
          <Ionicons name="document-text" size={24} color={Colors.accentBlue} />
          <View style={{ flex: 1 }}>
            <Text style={pw.title}>Student Paperwork</Text>
            <Text style={pw.sub}>Liability release, medical forms &amp; more</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </Pressable>

        {/* ── Training Dives ── */}
        {(template?.trainingDiveCount ?? 0) > 0 && (
          <>
            <SectionHeader title={`Training Dives (${template!.trainingDiveCount} required)`} />
            {enrolledStudents.length === 0 ? (
              <View style={[s.card, s.emptyInCard]}>
                <Text style={s.emptyInCardText}>Enroll students to log training dives</Text>
              </View>
            ) : (
              <View style={s.card}>
                {enrolledStudents.map((student, idx) => (
                  <View key={student.id}>
                    {idx > 0 && <Divider />}
                    <View style={tdiv.block}>
                      <Text style={tdiv.name}>{student.name}</Text>
                      <View style={tdiv.btnRow}>
                        {Array.from({ length: template!.trainingDiveCount! }, (_, j) => j + 1).map(diveNum => (
                          <Pressable
                            key={diveNum}
                            style={tdiv.btn}
                            onPress={() => router.push(
                              `/instructor/forms/training-dive?studentId=${student.id}&courseId=${id}&diveNumber=${diveNum}` as never
                            )}
                          >
                            <Ionicons name="water" size={12} color={Colors.accentBlue} />
                            <Text style={tdiv.btnText}>Dive {diveNum}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ── Sessions ── */}
        <SectionHeader title="Sessions" />
        <View style={s.card}>
          {sessions.length === 0 ? (
            <View style={s.emptyInCard}>
              <Text style={s.emptyInCardText}>No sessions yet</Text>
            </View>
          ) : (
            sessions.map((session, i) => {
              const typeInfo = SESSION_TYPES.find(t => t.key === session.sessionType);
              return (
                <View key={session.id}>
                  {i > 0 && <Divider />}
                  <Pressable
                    style={ses.row}
                    onPress={() => router.push(`/instructor/sessions/${session.id}?courseId=${id}`)}
                  >
                    <Ionicons name={typeInfo?.icon as never ?? 'calendar-outline'} size={20} color={Colors.accentBlue} />
                    <View style={{ flex: 1 }}>
                      <Text style={ses.label}>
                        Session {session.sessionNumber}: {session.topic || session.sessionType}
                      </Text>
                      {session.date ? <Text style={ses.date}>{session.date}</Text> : null}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                  </Pressable>
                </View>
              );
            })
          )}
          <View style={{ height: 1, backgroundColor: Colors.border, marginTop: Spacing.sm }} />
          <Pressable style={s.addRow} onPress={() => setShowAddSession(true)}>
            <Ionicons name="add-circle" size={18} color={Colors.accentBlue} />
            <Text style={s.addRowText}>Add Session</Text>
          </Pressable>
        </View>

        {/* ── Skill Checklist ── */}
        {hasSkills && enrolledStudents.length > 0 && (
          <>
            <View style={sc.checklistHeader}>
              <Text style={sc.checklistHeaderText}>Skill Checklist</Text>
              <Pressable
                style={sc.editSkillsBtn}
                onPress={() => setShowSkillEditor(true)}
              >
                <Ionicons name="create-outline" size={14} color={Colors.accentBlue} />
                <Text style={sc.editSkillsText}>Edit Skills</Text>
              </Pressable>
            </View>

            {/* Environment tabs */}
            <View style={sc.tabRow}>
              {ENV_TABS.map(tab => (
                <Pressable
                  key={tab.key}
                  style={[sc.tab, activeEnv === tab.key && sc.tabActive]}
                  onPress={() => setActiveEnv(tab.key)}
                >
                  <Ionicons
                    name={tab.icon as never}
                    size={14}
                    color={activeEnv === tab.key ? '#FFFFFF' : Colors.textSecondary}
                  />
                  <Text style={[sc.tabLabel, activeEnv === tab.key && sc.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={s.card}>
              {activeEntries().map((entry, i) => {
                const allSigned = enrolledStudents.every(st => isSigned(st.id, entry.key, activeEnv));
                return (
                  <View key={entry.key}>
                    {i > 0 && <Divider />}
                    <View style={sc.skillBlock}>
                      <View style={sc.skillHeader}>
                        <Text style={sc.skillName} numberOfLines={2}>{entry.name}</Text>
                        <Pressable onPress={() => markAll(entry.key, activeEnv)}>
                          <Text style={[sc.markAll, { color: allSigned ? Colors.emergency : Colors.accentBlue }]}>
                            {allSigned ? 'Unmark All' : 'Mark All'}
                          </Text>
                        </Pressable>
                      </View>
                      <FlowLayout spacing={6} style={{ marginTop: Spacing.xs }}>
                        {enrolledStudents.map(student => {
                          const signed = isSigned(student.id, entry.key, activeEnv);
                          return (
                            <Pressable
                              key={student.id}
                              style={[
                                sc.chip,
                                { backgroundColor: signed ? Colors.accentBlue + '26' : Colors.border + '80' },
                              ]}
                              onPress={() => toggleSignoff(student.id, entry.key, activeEnv)}
                            >
                              <Ionicons
                                name={signed ? 'checkmark-circle' : 'ellipse-outline'}
                                size={13}
                                color={signed ? Colors.accentBlue : Colors.textTertiary}
                              />
                              <Text style={[sc.chipName, { color: signed ? Colors.accentBlue : Colors.text }]}>
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

        {/* ── Delete ── */}
        <SectionHeader title="Danger Zone" />
        <View style={s.card}>
          <Pressable style={s.deleteRow} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.emergency} />
            <Text style={s.deleteText}>Delete Course</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modals */}
      <AddSessionModal
        visible={showAddSession}
        courseId={id}
        nextNumber={sessions.length + 1}
        onDone={() => { setShowAddSession(false); refresh(); }}
        onClose={() => setShowAddSession(false)}
      />
      <EnrollStudentModal
        visible={showEnroll}
        courseId={id}
        enrolledIds={enrolledIds}
        onDone={() => { setShowEnroll(false); refresh(); }}
        onClose={() => setShowEnroll(false)}
      />
      <StatusPickerModal
        visible={showStatusPicker}
        current={course.status}
        onPick={status => {
          updateCourse(id, { status: status as typeof STATUS_LIST[number] });
          setShowStatusPicker(false);
        }}
        onClose={() => setShowStatusPicker(false)}
      />
      <SkillEditorModal
        visible={showSkillEditor}
        env={activeEnv}
        entries={activeEntries()}
        onSave={handleSaveSkillEditor}
        onClose={() => setShowSkillEditor(false)}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const m = StyleSheet.create({
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
  content:    { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  sectionTitle: {
    ...(Typography.caption2 as TextStyle),
    fontWeight: '700' as TextStyle['fontWeight'],
    color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.md, marginBottom: Spacing.xs,
  },
  input: {
    ...(Typography.body as TextStyle), color: Colors.text,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  typeChipActive: { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  typeLabel:      { ...(Typography.caption1 as TextStyle), color: Colors.text },
  typeLabelActive: { ...(Typography.caption1 as TextStyle), color: '#FFFFFF' },
});

const em = StyleSheet.create({
  newRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  plusCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accentBlue + '26',
    alignItems: 'center', justifyContent: 'center',
  },
  newText: { ...(Typography.subhead as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    gap: Spacing.xs,
  },
  searchInput: { flex: 1, ...(Typography.body as TextStyle), color: Colors.text, paddingVertical: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accentBlue + '26',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...(Typography.caption1 as TextStyle), color: Colors.accentBlue, fontWeight: '700' as TextStyle['fontWeight'] },
  name:  { ...(Typography.subhead as TextStyle), color: Colors.text },
  sub:   { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { ...(Typography.subhead as TextStyle), color: Colors.textSecondary },
});

const sp = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg,
    paddingBottom: 32, paddingTop: Spacing.lg,
  },
  title: {
    ...(Typography.headline as TextStyle), color: Colors.text,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, fontWeight: '700' as TextStyle['fontWeight'],
  },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  dot:      { width: 12, height: 12, borderRadius: 6 },
  optLabel: { flex: 1, ...(Typography.body as TextStyle), color: Colors.text },
});

const p = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  label: { flex: 1, ...(Typography.subhead as TextStyle), color: Colors.text },
  pct:   { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, fontVariant: ['tabular-nums'] },
  track: {
    height: 6, backgroundColor: Colors.border, borderRadius: 3,
    marginBottom: Spacing.sm, overflow: 'hidden',
  },
  fill:  { height: 6, borderRadius: 3 },
});

const en = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accentBlue + '26',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { ...(Typography.caption1 as TextStyle), color: Colors.accentBlue, fontWeight: '700' as TextStyle['fontWeight'] },
  name:         { ...(Typography.subhead as TextStyle), fontWeight: '600' as TextStyle['fontWeight'], color: Colors.text },
  count:        { ...(Typography.caption2 as TextStyle), color: Colors.textSecondary },
  progressBtn: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentBlue + '1A',
  },
  progressText: { ...(Typography.caption1 as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  removeBtn:    { padding: 4 },
});

const pw = StyleSheet.create({
  title: { ...(Typography.subhead as TextStyle), fontWeight: '600' as TextStyle['fontWeight'], color: Colors.text },
  sub:   { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
});

const ses = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  label: { ...(Typography.subhead as TextStyle), color: Colors.text },
  date:  { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
});

const tdiv = StyleSheet.create({
  block:  { paddingVertical: Spacing.sm, gap: Spacing.xs },
  name:   { ...(Typography.subhead as TextStyle), fontWeight: '600' as TextStyle['fontWeight'], color: Colors.text },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: 4 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentBlue + '15',
    borderWidth: 1, borderColor: Colors.accentBlue + '40',
  },
  btnText: { ...(Typography.caption1 as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
});

const sc = StyleSheet.create({
  checklistHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: Spacing.lg, marginBottom: Spacing.xs, gap: 0,
  },
  checklistHeaderText: {
    ...(Typography.footnote as TextStyle),
    fontWeight: '700' as TextStyle['fontWeight'],
    color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  editSkillsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginLeft: Spacing.sm,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentBlue + '1A',
  },
  editSkillsText: { ...(Typography.caption2 as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  tabRow: {
    flexDirection: 'row', gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 8, paddingHorizontal: 4,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tabActive: { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  tabLabel:      { ...(Typography.caption2 as TextStyle), color: Colors.textSecondary },
  tabLabelActive: { ...(Typography.caption2 as TextStyle), color: '#FFFFFF', fontWeight: '600' as TextStyle['fontWeight'] },
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
  editBtn:  { paddingVertical: Spacing.xs, paddingLeft: Spacing.sm, minWidth: 40, alignItems: 'flex-end' },
  editText: { ...(Typography.body as TextStyle), color: Colors.accentBlue },
  scroll:   { flex: 1 },
  content:  { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  statusText:  { ...(Typography.caption2 as TextStyle), fontWeight: '700' as TextStyle['fontWeight'] },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  addRowText: { ...(Typography.body as TextStyle), color: Colors.accentBlue },
  paperworkRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  emptyInCard: { paddingVertical: Spacing.md, alignItems: 'center' },
  emptyInCardText: { ...(Typography.subhead as TextStyle), color: Colors.textSecondary },
  deleteRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  deleteText: { ...(Typography.body as TextStyle), color: Colors.emergency },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...(Typography.body as TextStyle), color: Colors.textSecondary },
});
