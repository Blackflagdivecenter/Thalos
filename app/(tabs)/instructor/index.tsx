import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { CompactBrandHeader } from '@/src/ui/components/BrandHeader';
import { useInstructorStore } from '@/src/stores/instructorStore';
import { useAuthStore } from '@/src/stores/authStore';
import type { CourseSession } from '@/src/models';

// ── Not-an-instructor gate ────────────────────────────────────────────────────

function NotInstructorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[s.container, s.loginRoot, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom }]}>
      <Ionicons name="school" size={64} color={Colors.accentBlue} />
      <Text style={s.setupTitle}>Instructor Module</Text>
      <Text style={s.setupDesc}>
        This section is for certified instructors. Update your account role to Instructor to access
        student management, courses, and skill sign-offs.
      </Text>
      <Pressable
        style={({ pressed }) => [s.completeBtn, { width: '80%', marginTop: Spacing.lg }, pressed && { opacity: 0.85 }]}
        onPress={() => router.push('/account/profile')}
      >
        <Text style={s.completeBtnText}>Update My Role</Text>
      </Pressable>
    </View>
  );
}

// ── Stat & Action cards ───────────────────────────────────────────────────────

function StatCard({ value, label, iconName, color }: {
  value: number; label: string; iconName: string; color: string;
}) {
  return (
    <View style={ds.statCard}>
      <Ionicons name={iconName as any} size={22} color={color} />
      <Text style={[ds.statValue, { fontVariant: ['tabular-nums'] }]}>{value}</Text>
      <Text style={ds.statLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({ title, iconName, color, onPress }: {
  title: string; iconName: string; color: string; onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [ds.actionCard, pressed && { opacity: 0.8 }]}
      onPress={onPress}
    >
      <Ionicons name={iconName as any} size={20} color={color} />
      <Text style={ds.actionTitle}>{title}</Text>
      <View style={{ flex: 1 }} />
      <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
    </Pressable>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    profile, students, courses,
    loadStudents, loadCourses, getSessions,
  } = useInstructorStore();
  const { profile: authProfile } = useAuthStore();

  useFocusEffect(useCallback(() => {
    loadStudents();
    loadCourses();
  }, []));

  const activeCourses = useMemo(
    () => courses.filter(c => c.status === 'active').length,
    [courses],
  );

  const upcomingSessions = useMemo((): Array<CourseSession & { courseName: string }> => {
    const today = new Date().toISOString().slice(0, 10);
    const result: Array<CourseSession & { courseName: string }> = [];
    for (const course of courses) {
      const sessions = getSessions(course.id);
      for (const session of sessions) {
        if (session.date && session.date >= today) {
          result.push({ ...session, courseName: course.name });
        }
      }
    }
    return result
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
      .slice(0, 3);
  }, [courses, getSessions]);

  const SESSION_ICONS: Record<string, string> = {
    classroom: 'school', pool: 'water', open_water: 'boat', other: 'calendar',
  };

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top }]}
      contentContainerStyle={[s.dashContent, { paddingBottom: insets.bottom + Spacing.xxxl }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.dashHeader}>
        <View style={s.dashHeaderRow}>
          <CompactBrandHeader section="" style={s.dashBrand} />
          <Text style={s.dashSectionTitle}>Instructor</Text>
          <View style={{ flex: 1 }} />
          <Pressable style={s.lockBtn} onPress={() => router.push('/account/profile')}>
            <Ionicons name="person-circle-outline" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>
        {authProfile?.displayName ? (
          <Text style={s.welcomeText}>Welcome, {authProfile.displayName}</Text>
        ) : profile?.name ? (
          <Text style={s.welcomeText}>Welcome, {profile.name}</Text>
        ) : null}
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatCard value={students.length} label="Students"      iconName="people" color={Colors.thalosNavy}   />
        <StatCard value={activeCourses}   label="Active Courses" iconName="book"   color={Colors.thalosAccent} />
      </View>

      {/* Quick Actions */}
      <Text style={s.sectionLabel}>Quick Actions</Text>
      <View style={s.actionsRow}>
        <ActionCard title="Students" iconName="people" color={Colors.thalosNavy}   onPress={() => router.push('/instructor/students')} />
        <ActionCard title="Courses"  iconName="book"   color={Colors.thalosAccent} onPress={() => router.push('/instructor/courses')} />
      </View>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <>
          <Text style={s.sectionLabel}>Upcoming Sessions</Text>
          {upcomingSessions.map(session => (
            <Pressable
              key={session.id}
              style={s.sessionRow}
              onPress={() => router.push(`/instructor/sessions/${session.id}`)}
            >
              <View style={s.sessionIconWrap}>
                <Ionicons name={SESSION_ICONS[session.sessionType] as any} size={20} color={Colors.accentBlue} />
              </View>
              <View style={s.sessionInfo}>
                <Text style={s.sessionTopic}>{session.topic ?? session.sessionType}</Text>
                <Text style={s.sessionCourse}>{session.courseName}</Text>
              </View>
              <Text style={s.sessionDate}>{session.date ?? ''}</Text>
            </Pressable>
          ))}
        </>
      )}

      {/* Empty state */}
      {students.length === 0 && courses.length === 0 && (
        <View style={s.emptyState}>
          <Ionicons name="school" size={48} color={Colors.textTertiary} />
          <Text style={s.emptyText}>
            Get started by adding students and creating courses
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function InstructorTabView() {
  const { loadProfile } = useInstructorStore();
  const { profile: authProfile } = useAuthStore();

  useFocusEffect(useCallback(() => {
    loadProfile();
  }, []));

  if (authProfile?.role !== 'instructor') return <NotInstructorScreen />;
  return <Dashboard />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Setup
  setupContent: { padding: Spacing.lg, paddingTop: Spacing.xl, gap: Spacing.xl },
  setupHeader: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.xl },
  setupTitle:  { ...(Typography.title2 as TextStyle), fontWeight: '700', color: Colors.text },
  setupDesc: {
    ...(Typography.subhead as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  formField:          { gap: 4 },
  formFieldLabel:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  formFieldLabelText: { ...(Typography.subhead as TextStyle), fontWeight: '600', color: Colors.textSecondary },
  formFieldInput: {
    ...(Typography.body as TextStyle),
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  divider:  { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  pinLabel: { ...(Typography.subhead as TextStyle), fontWeight: '600', color: Colors.textSecondary },
  pinField: {
    ...(Typography.body as TextStyle),
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    letterSpacing: 4,
  },
  errorText: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.emergency,
    textAlign: 'center',
  },
  completeBtn: {
    backgroundColor: Colors.accentBlue,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  completeBtnText: { ...(Typography.headline as TextStyle), color: '#FFFFFF', fontWeight: '600' },

  // Login
  loginRoot:       { alignItems: 'center', gap: Spacing.xl },
  loginBrandHeader: { borderBottomWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0 },
  loginTitle:      { ...(Typography.title2 as TextStyle), fontWeight: '700', color: Colors.thalosNavy },
  loginSubtitle:   { ...(Typography.subhead as TextStyle), color: Colors.textSecondary },
  pinDotsArea:     { paddingVertical: Spacing.lg },
  hiddenInput:     { position: 'absolute', opacity: 0, width: 1, height: 1 },
  unlockBtn: {
    backgroundColor: Colors.thalosNavy,
    borderRadius: Radius.md,
    paddingVertical: 16,
    width: 200,
    alignItems: 'center',
  },
  unlockBtnText: { ...(Typography.headline as TextStyle), color: '#FFFFFF', fontWeight: '600' },
  resetLink:     { marginTop: Spacing.sm },
  resetLinkText: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.textTertiary,
    textDecorationLine: 'underline',
  },

  // Dashboard
  dashContent:    { gap: Spacing.lg, paddingTop: Spacing.sm },
  dashHeader:     { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  dashHeaderRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dashBrand:      { borderBottomWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0 },
  dashSectionTitle: { ...(Typography.headline as TextStyle), color: Colors.text },
  lockBtn:        { padding: Spacing.xs },
  welcomeText: {
    ...(Typography.title3 as TextStyle),
    fontWeight: '700',
    color: Colors.thalosNavy,
  },
  statsRow:    { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  sectionLabel: {
    ...(Typography.headline as TextStyle),
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
  },
  actionsRow:  { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionIconWrap: { width: 32, alignItems: 'center' },
  sessionInfo:     { flex: 1, gap: 2 },
  sessionTopic:    { ...(Typography.subhead as TextStyle), fontWeight: '600', color: Colors.text },
  sessionCourse:   { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
  sessionDate: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyText: {
    ...(Typography.subhead as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

const ds = StyleSheet.create({
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: Colors.text,
    letterSpacing: -0.5,
  },
  statLabel:  { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionTitle: { ...(Typography.subhead as TextStyle), fontWeight: '600', color: Colors.text },
});
