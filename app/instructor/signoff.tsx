import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/src/ui/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useInstructorStore } from '@/src/stores/instructorStore';
import { COURSE_TEMPLATE_MAP, LEVEL_COLORS, LEVEL_LABELS } from '@/src/instructor/courseTemplates';
import { SkillSignoff } from '@/src/models';

export default function SignoffScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { studentId, courseId } = useLocalSearchParams<{ studentId?: string; courseId: string }>();
  const { students, getSignoffs, addSignoff, removeSignoff } = useInstructorStore();

  const [signoffs, setSignoffs] = useState<SkillSignoff[]>([]);

  useFocusEffect(useCallback(() => {
    if (studentId) {
      setSignoffs(getSignoffs(studentId, courseId));
    }
  }, [studentId, courseId]));

  const student  = studentId ? students.find(s => s.id === studentId) : null;
  const template = COURSE_TEMPLATE_MAP[courseId];

  if (!template) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
          </Pressable>
          <Text style={styles.headerTitle}>Course</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.center}><Text style={styles.emptyText}>Course not found.</Text></View>
      </View>
    );
  }

  const allSkills = [
    ...(template.knowledgeSkills ?? []),
    ...(template.confinedSkills  ?? []),
    ...(template.openWaterSkills ?? []),
  ];

  const signedKeys = new Set(signoffs.map(s => s.skillKey));
  const pct = allSkills.length > 0
    ? Math.round((signoffs.length / allSkills.length) * 100)
    : 0;

  function handleToggle(skillIndex: number) {
    const key = String(skillIndex);
    const skill = allSkills[skillIndex];

    if (!studentId) {
      // Preview mode — no student selected
      Alert.alert('No student selected', 'Open this course from a student\'s profile to sign off skills.');
      return;
    }

    if (signedKeys.has(key)) {
      Alert.alert(
        'Remove Sign-Off',
        `Remove sign-off for:\n"${skill}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              removeSignoff(studentId, courseId, key, 'open_water');
              setSignoffs(getSignoffs(studentId, courseId));
            },
          },
        ],
      );
    } else {
      Alert.alert(
        'Sign Off Skill',
        `Sign off:\n"${skill}"\n\nFor student: ${student?.name ?? ''}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Off',
            onPress: () => {
              addSignoff(studentId, courseId, key, 'open_water');
              setSignoffs(getSignoffs(studentId, courseId));
            },
          },
        ],
      );
    }
  }

  function handleSignAll() {
    if (!studentId) return;
    Alert.alert(
      'Sign Off All Skills',
      `Sign off all ${allSkills.length} skills for ${student?.name ?? 'this student'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign All',
          onPress: () => {
            allSkills.forEach((_, i) => {
              if (!signedKeys.has(String(i))) {
                addSignoff(studentId, courseId, String(i), 'open_water');
              }
            });
            setSignoffs(getSignoffs(studentId, courseId));
          },
        },
      ],
    );
  }

  const levelColor = LEVEL_COLORS[template.level as keyof typeof LEVEL_COLORS] ?? Colors.accentBlue;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{template.name}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Course info */}
        <Card variant="result" style={styles.infoCard}>
          <View style={styles.infoTop}>
            <View style={[styles.levelBadge, { backgroundColor: levelColor + '20' }]}>
              <Text style={[styles.levelText, { color: levelColor }]}>
                {LEVEL_LABELS[template.level as keyof typeof LEVEL_LABELS] ?? template.level}
              </Text>
            </View>
            {student && (
              <Text style={styles.studentLabel}>Student: {student.name}</Text>
            )}
          </View>
          <Text style={styles.courseDesc}>{template.description}</Text>

          {studentId && (
            <>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>{signoffs.length} / {allSkills.length} skills</Text>
                <Text style={styles.progressPct}>{pct}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
              </View>
              {pct === 100 && (
                <Text style={styles.completeMsg}>Course complete!</Text>
              )}
            </>
          )}
        </Card>

        {/* Sign-off all button */}
        {studentId && signoffs.length < allSkills.length && (
          <Pressable style={styles.signAllBtn} onPress={handleSignAll}>
            <Text style={styles.signAllText}>Sign Off All Remaining Skills</Text>
          </Pressable>
        )}

        {/* Skills list */}
        <Text style={styles.sectionLabel}>Skills Checklist</Text>
        <Card>
          {allSkills.map((skill, i) => {
            const done = signedKeys.has(String(i));
            const so   = signoffs.find(s => s.skillKey === String(i));
            return (
              <Pressable
                key={i}
                style={[styles.skillRow, i > 0 && styles.skillBorder]}
                onPress={() => handleToggle(i)}
              >
                <View style={[styles.checkbox, done && styles.checkboxDone]}>
                  {done && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.skillInfo}>
                  <Text style={[styles.skillName, done && styles.skillNameDone]}>{skill}</Text>
                  {done && so && (
                    <Text style={styles.signedAt}>
                      Signed {new Date(so.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </Card>

        {!studentId && (
          <Card style={styles.previewNote}>
            <Text style={styles.previewText}>
              This is a preview. Open this course from a student's profile to begin signing off skills.
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerBtn:   { minWidth: 60 },
  headerTitle: { ...Typography.headline, color: Colors.text, flex: 1, textAlign: 'center' },
  headerBack:  { ...Typography.body, color: Colors.accentBlue },
  scroll:   { flex: 1 },
  content:  { padding: Spacing.lg, gap: Spacing.sm },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...Typography.subhead, color: Colors.textSecondary },
  sectionLabel: {
    ...Typography.footnote, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: 2,
  },
  infoCard:    { marginBottom: 0 },
  infoTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  levelBadge:  { borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  levelText:   { ...Typography.caption1, fontWeight: '600' as const },
  studentLabel:{ ...Typography.footnote, color: Colors.textSecondary },
  courseDesc:  { ...Typography.footnote, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.md },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  progressText:{ ...Typography.footnote, color: Colors.textSecondary },
  progressPct: { ...Typography.footnote, fontWeight: '600', color: Colors.accentBlue },
  progressBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill:{ height: 6, backgroundColor: Colors.accentTeal, borderRadius: 3 },
  completeMsg: { ...Typography.subhead, fontWeight: '600', color: Colors.success, textAlign: 'center', marginTop: Spacing.sm },
  signAllBtn: {
    backgroundColor: Colors.accentTeal + '15', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.accentTeal,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  signAllText: { ...Typography.subhead, fontWeight: '600', color: Colors.accentBlue },
  skillRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.md },
  skillBorder:{ borderTopWidth: 1, borderTopColor: Colors.border },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.border, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkmark:    { ...Typography.caption1, color: Colors.white, fontWeight: '700' as const },
  skillInfo:    { flex: 1 },
  skillName:    { ...Typography.subhead, color: Colors.text },
  skillNameDone:{ color: Colors.textSecondary, textDecorationLine: 'line-through' },
  signedAt:     { ...Typography.caption1, color: Colors.textTertiary, marginTop: 2 },
  previewNote:  { backgroundColor: Colors.warning + '15', borderWidth: 1, borderColor: Colors.warning },
  previewText:  { ...Typography.footnote, color: Colors.warning, textAlign: 'center', lineHeight: 18 },
});
