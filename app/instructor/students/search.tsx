import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { ConnectedInstructorService } from '@/src/services/ConnectedInstructorService';
import { useInstructorStore } from '@/src/stores/instructorStore';
import { useAuthStore } from '@/src/stores/authStore';
import type { UserProfile } from '@/src/stores/authStore';
import type { InstructorCourse } from '@/src/models';

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function SearchStudentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { courses, loadCourses } = useInstructorStore();
  const myId = useAuthStore(s => s.user?.id);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await ConnectedInstructorService.searchUsers(text);
        setResults(r.filter(u => u.id !== myId));
      } catch { /* silent */ }
      setSearching(false);
    }, 400);
  }, [myId]);

  const handleAddToCourse = (user: UserProfile) => {
    loadCourses();
    setSelectedUser(user);
    setShowCoursePicker(true);
  };

  const handleSelectCourse = async (course: InstructorCourse) => {
    if (!selectedUser) return;
    setShowCoursePicker(false);
    setEnrolling(true);
    try {
      await ConnectedInstructorService.pushCourse({
        id: course.id,
        name: course.name,
        level: course.level,
        templateId: course.templateId,
        status: course.status,
        location: course.location,
        startDate: course.startDate,
        endDate: course.endDate,
        maxStudents: course.maxStudents,
      });
      await ConnectedInstructorService.enrollStudent(course.id, selectedUser.id);
      Alert.alert(
        'Student Enrolled',
        `${selectedUser.displayName ?? 'Student'} has been enrolled in ${course.name}. They'll be notified to complete their paperwork.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to enroll student');
    }
    setEnrolling(false);
  };

  const renderResult = ({ item }: { item: UserProfile }) => (
    <View style={s.card}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{initials(item.displayName)}</Text>
      </View>
      <View style={s.cardInfo}>
        <Text style={s.name}>{item.displayName ?? 'Unknown'}</Text>
        <View style={s.metaRow}>
          <View style={[s.roleBadge, item.role === 'instructor' && s.roleBadgeInstructor]}>
            <Text style={[s.roleText, item.role === 'instructor' && s.roleTextInstructor]}>
              {item.role === 'instructor' ? 'Instructor' : 'Diver'}
            </Text>
          </View>
          {item.certLevel ? <Text style={s.cert}>{item.certLevel}</Text> : null}
        </View>
      </View>
      <Pressable style={s.addBtn} onPress={() => handleAddToCourse(item)}>
        <Ionicons name="add-circle" size={28} color={Colors.accentBlue} />
      </Pressable>
    </View>
  );

  const activeCourses = courses.filter(c => c.status === 'active' || c.status === 'planning');

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>Find Students</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textTertiary} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or handle..."
          placeholderTextColor={Colors.textTertiary}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searching && <ActivityIndicator size="small" color={Colors.accentBlue} />}
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={renderResult}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          query.length >= 2 && !searching ? (
            <Text style={s.empty}>No users found</Text>
          ) : query.length < 2 ? (
            <Text style={s.empty}>Type at least 2 characters to search</Text>
          ) : null
        }
      />

      {/* Enrolling overlay */}
      {enrolling && (
        <View style={s.overlay}>
          <ActivityIndicator size="large" color={Colors.accentBlue} />
          <Text style={s.overlayText}>Enrolling student...</Text>
        </View>
      )}

      {/* Course picker modal */}
      <Modal visible={showCoursePicker} transparent animationType="slide">
        <Pressable style={s.modalBg} onPress={() => setShowCoursePicker(false)}>
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + Spacing.md }]}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Select Course</Text>
            {selectedUser && (
              <Text style={s.modalSub}>
                Enrolling {selectedUser.displayName ?? 'student'}
              </Text>
            )}
            {activeCourses.length === 0 ? (
              <Text style={s.empty}>No active courses. Create one first.</Text>
            ) : (
              <FlatList
                data={activeCourses}
                keyExtractor={c => c.id}
                renderItem={({ item }) => (
                  <Pressable style={s.courseRow} onPress={() => handleSelectCourse(item)}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.courseName}>{item.name}</Text>
                      <Text style={s.courseLevel}>{item.level}</Text>
                    </View>
                    <View style={[s.statusPill, item.status === 'active' ? s.statusActive : s.statusPlanning]}>
                      <Text style={[s.statusText, item.status === 'active' ? s.statusTextActive : s.statusTextPlanning]}>
                        {item.status}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  headerTitle: { ...Typography.headline, fontWeight: '700', color: Colors.text },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm, height: 44,
  },
  searchIcon: { marginRight: Spacing.xs },
  searchInput: { flex: 1, ...Typography.body, color: Colors.text },

  list: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xl },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, gap: Spacing.sm,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accentBlue + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.subhead, fontWeight: '700', color: Colors.accentBlue },
  cardInfo: { flex: 1, gap: 2 },
  name: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  roleBadge: {
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.xs, paddingVertical: 1,
  },
  roleBadgeInstructor: { borderColor: Colors.accentBlue, backgroundColor: Colors.accentBlue + '15' },
  roleText: { ...Typography.caption2, color: Colors.textSecondary },
  roleTextInstructor: { color: Colors.accentBlue },
  cert: { ...Typography.caption1, color: Colors.textSecondary },
  addBtn: { padding: Spacing.xs },

  empty: { ...Typography.subhead, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.xl },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  overlayText: { ...Typography.subhead, color: '#fff', fontWeight: '600' },

  modalBg: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.md, maxHeight: '60%',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.sm,
  },
  modalTitle: { ...Typography.headline, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  modalSub: { ...Typography.footnote, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md },

  courseRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  courseName: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  courseLevel: { ...Typography.caption1, color: Colors.textSecondary },
  statusPill: {
    borderRadius: 10, paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderWidth: 1,
  },
  statusActive: { borderColor: '#34C759', backgroundColor: '#34C75915' },
  statusPlanning: { borderColor: Colors.border, backgroundColor: 'transparent' },
  statusText: { ...Typography.caption2, fontWeight: '600' },
  statusTextActive: { color: '#34C759' },
  statusTextPlanning: { color: Colors.textSecondary },
});
