import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { ConnectedInstructorService } from '@/src/services/ConnectedInstructorService';
import type { ConnectedEnrollment } from '@/src/models';

export default function StudentCoursesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [enrollments, setEnrollments] = useState<ConnectedEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await ConnectedInstructorService.getMyEnrollments();
      setEnrollments(data);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }: { item: ConnectedEnrollment }) => (
    <Pressable
      style={s.card}
      onPress={() => router.push(`/student/course/${item.courseId}?courseId=${item.courseId}`)}
    >
      <View style={s.cardIcon}>
        <Ionicons name="school" size={22} color={Colors.accentBlue} />
      </View>
      <View style={s.cardInfo}>
        <Text style={s.courseName}>{item.courseName ?? 'Course'}</Text>
        <Text style={s.courseLevel}>{item.courseLevel ?? ''}</Text>
        {item.instructorName ? (
          <Text style={s.instructor}>
            <Ionicons name="person-outline" size={12} color={Colors.textTertiary} />
            {' '}{item.instructorName}
          </Text>
        ) : null}
      </View>
      <View style={[s.statusPill,
        item.status === 'active' ? s.pillActive :
        item.status === 'completed' ? s.pillComplete : s.pillWithdrawn,
      ]}>
        <Text style={[s.statusText,
          item.status === 'active' ? s.textActive :
          item.status === 'completed' ? s.textComplete : s.textWithdrawn,
        ]}>
          {item.status}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </Pressable>
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>My Courses</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.accentBlue} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={enrollments}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={Colors.accentBlue} />}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Ionicons name="school-outline" size={48} color={Colors.textTertiary} />
              <Text style={s.emptyTitle}>No courses yet</Text>
              <Text style={s.emptySub}>Your instructor will enroll you when you're ready to start.</Text>
            </View>
          }
        />
      )}
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
  list: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xl },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, gap: Spacing.sm,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.accentBlue + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 1 },
  courseName: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  courseLevel: { ...Typography.caption1, color: Colors.textSecondary },
  instructor: { ...Typography.caption1, color: Colors.textTertiary, marginTop: 2 },

  statusPill: { borderRadius: 10, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderWidth: 1 },
  pillActive: { borderColor: '#34C759', backgroundColor: '#34C75915' },
  pillComplete: { borderColor: Colors.accentBlue, backgroundColor: Colors.accentBlue + '15' },
  pillWithdrawn: { borderColor: Colors.border, backgroundColor: 'transparent' },
  statusText: { ...Typography.caption2, fontWeight: '600', textTransform: 'capitalize' },
  textActive: { color: '#34C759' },
  textComplete: { color: Colors.accentBlue },
  textWithdrawn: { color: Colors.textSecondary },

  emptyWrap: { alignItems: 'center', marginTop: 80, gap: Spacing.xs, paddingHorizontal: Spacing.xl },
  emptyTitle: { ...Typography.headline, fontWeight: '600', color: Colors.textSecondary },
  emptySub: { ...Typography.subhead, color: Colors.textTertiary, textAlign: 'center' },
});
