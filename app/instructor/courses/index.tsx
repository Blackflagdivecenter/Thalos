import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useInstructorStore } from '@/src/stores/instructorStore';
import type { InstructorCourse } from '@/src/models';

type FilterKey = 'active' | 'planning' | 'completed' | 'all';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'active',    label: 'Active' },
  { key: 'planning',  label: 'Planning' },
  { key: 'completed', label: 'Completed' },
  { key: 'all',       label: 'All' },
];

const STATUS_COLORS: Record<string, string> = {
  planning:  '#FF9500',
  active:    '#34C759',
  completed: Colors.accentBlue,
  cancelled: Colors.textTertiary,
};

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function CourseRow({ course, onPress }: { course: InstructorCourse; onPress: () => void }) {
  const color = STATUS_COLORS[course.status] ?? Colors.textTertiary;
  return (
    <Pressable style={r.row} onPress={onPress}>
      <View style={r.main}>
        <View style={r.topRow}>
          <Text style={r.name} numberOfLines={1}>{course.name}</Text>
          <View style={[r.badge, { backgroundColor: color + '26' }]}>
            <Text style={[r.badgeText, { color }]}>{statusLabel(course.status)}</Text>
          </View>
        </View>
        <Text style={r.sub} numberOfLines={1}>
          {course.templateId ? course.templateId.replace('tpl_', '').replace(/_/g, ' ') : 'Custom'}
          {course.location ? ` · ${course.location}` : ''}
        </Text>
        {course.startDate ? (
          <Text style={r.date}>{course.startDate}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </Pressable>
  );
}

export default function CoursesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { courses, loadCourses } = useInstructorStore();
  const [filter, setFilter] = useState<FilterKey>('active');
  const [query, setQuery] = useState('');

  useFocusEffect(useCallback(() => { loadCourses(); }, []));

  const filtered = useMemo(() => {
    let list = courses;
    if (filter !== 'all') {
      list = list.filter(c => c.status === filter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.location ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [courses, filter, query]);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Navbar */}
      <View style={s.navbar}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
        </Pressable>
        <Text style={s.navTitle}>Courses</Text>
        <Pressable style={s.addBtn} onPress={() => router.push('/instructor/courses/new')}>
          <View style={s.addCircle}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>

      {/* Filter chips */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <Pressable
            key={f.key}
            style={[s.chip, filter === f.key && s.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.chipText, filter === f.key && s.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search */}
      <View style={s.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textTertiary} />
        <TextInput
          style={s.searchInput}
          placeholder="Search courses…"
          placeholderTextColor={Colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CourseRow course={item} onPress={() => router.push(`/instructor/courses/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        contentContainerStyle={[
          s.list,
          filtered.length === 0 && s.listEmpty,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="book-outline" size={48} color={Colors.textTertiary} />
            <Text style={s.emptyTitle}>{query ? 'No Results' : 'No Courses'}</Text>
            <Text style={s.emptySub}>
              {query ? 'Try a different search term.' : 'Tap + to create your first course.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const r = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, gap: Spacing.sm,
  },
  main:   { flex: 1, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name:   { flex: 1, ...(Typography.subhead as TextStyle), fontWeight: '600', color: Colors.text },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { ...(Typography.caption2 as TextStyle), fontWeight: '700' as TextStyle['fontWeight'] },
  sub:  { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
  date: { ...(Typography.caption2 as TextStyle), color: Colors.textTertiary },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn:   { paddingVertical: Spacing.xs, paddingRight: Spacing.sm },
  navTitle: {
    flex: 1, ...(Typography.headline as TextStyle),
    color: Colors.text, textAlign: 'center',
  },
  addBtn:    { paddingVertical: Spacing.xs, paddingLeft: Spacing.sm },
  addCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accentBlue + '26',
    borderColor: Colors.accentBlue,
  },
  chipText:       { ...(Typography.caption1 as TextStyle), fontWeight: '500' as TextStyle['fontWeight'], color: Colors.textSecondary },
  chipTextActive: { ...(Typography.caption1 as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1, ...(Typography.body as TextStyle),
    color: Colors.text, paddingVertical: 10,
  },
  list:      { paddingTop: Spacing.xs },
  listEmpty: { flexGrow: 1 },
  sep:       { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.lg },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xxxl, gap: Spacing.sm,
  },
  emptyTitle: { ...(Typography.headline as TextStyle), color: Colors.text, textAlign: 'center' },
  emptySub:   { ...(Typography.subhead as TextStyle), color: Colors.textSecondary, textAlign: 'center' },
});
