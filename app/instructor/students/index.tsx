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
import type { Student } from '@/src/models';

function initials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function StudentRow({ student, onPress }: { student: Student; onPress: () => void }) {
  return (
    <Pressable style={s.row} onPress={onPress}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{initials(student.name)}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.name}>{student.name}</Text>
        {student.email ? (
          <Text style={s.sub}>{student.email}</Text>
        ) : (
          <Text style={s.subMuted}>No contact info</Text>
        )}
      </View>
      {student.studentId ? (
        <Text style={s.sid}>{student.studentId}</Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </Pressable>
  );
}

export default function StudentsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { students, loadStudents } = useInstructorStore();
  const [query, setQuery] = useState('');

  useFocusEffect(useCallback(() => { loadStudents(); }, []));

  const filtered = useMemo(() => {
    if (!query.trim()) return students;
    const q = query.toLowerCase();
    return students.filter(
      st => st.name.toLowerCase().includes(q) ||
            (st.email ?? '').toLowerCase().includes(q) ||
            (st.studentId ?? '').toLowerCase().includes(q),
    );
  }, [students, query]);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.navbar}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
        </Pressable>
        <Text style={s.navTitle}>Students</Text>
        <Pressable style={s.addBtn} onPress={() => router.push('/instructor/students/new')}>
          <View style={s.addCircle}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>

      <View style={s.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textTertiary} />
        <TextInput
          style={s.searchInput}
          placeholder="Search students…"
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
          <StudentRow student={item} onPress={() => router.push(`/instructor/students/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        contentContainerStyle={[
          s.list,
          filtered.length === 0 && s.listEmpty,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
            <Text style={s.emptyTitle}>{query ? 'No Results' : 'No Students'}</Text>
            <Text style={s.emptySub}>
              {query ? 'Try a different search term.' : 'Tap + to register your first student.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { paddingVertical: Spacing.xs, paddingRight: Spacing.sm },
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
  sep:       { height: 1, backgroundColor: Colors.border, marginLeft: 72 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${Colors.accentBlue}26`,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...(Typography.subhead as TextStyle), color: Colors.accentBlue, fontWeight: '700' },
  info:     { flex: 1, gap: 2 },
  name:     { ...(Typography.subhead as TextStyle), fontWeight: '600', color: Colors.text },
  sub:      { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
  subMuted: { ...(Typography.caption1 as TextStyle), color: Colors.textTertiary },
  sid: {
    ...(Typography.caption2 as TextStyle),
    color: Colors.textTertiary, fontVariant: ['tabular-nums'],
  },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xxxl, gap: Spacing.sm,
  },
  emptyTitle: { ...(Typography.headline as TextStyle), color: Colors.text, textAlign: 'center' },
  emptySub:   { ...(Typography.subhead as TextStyle), color: Colors.textSecondary, textAlign: 'center' },
});
