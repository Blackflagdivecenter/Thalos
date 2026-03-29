import React, { useCallback } from 'react';
import {
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
import { useNotificationStore } from '@/src/stores/notificationStore';
import type { AppNotification, NotificationType } from '@/src/models';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

const ICONS: Record<NotificationType, { name: string; color: string }> = {
  enrollment:         { name: 'school-outline',           color: Colors.accentBlue },
  paperwork_request:  { name: 'document-text-outline',    color: '#FF9500' },
  paperwork_complete: { name: 'document-text',            color: '#34C759' },
  ack_request:        { name: 'create-outline',           color: '#FF9500' },
  ack_complete:       { name: 'checkmark-circle',         color: '#34C759' },
  certification:      { name: 'ribbon',                   color: '#FFD700' },
  tank_tap:           { name: 'hand-left',                color: Colors.accentBlue },
  follow:             { name: 'person-add',               color: Colors.accentBlue },
};

function NotificationRow({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  const icon = ICONS[item.type] ?? { name: 'notifications-outline', color: Colors.textSecondary };

  return (
    <Pressable
      style={[s.row, !item.isRead && s.rowUnread]}
      onPress={onPress}
    >
      <View style={[s.iconWrap, { backgroundColor: icon.color + '15' }]}>
        <Ionicons name={icon.name as any} size={20} color={icon.color} />
      </View>
      <View style={s.rowInfo}>
        <Text style={[s.rowTitle, !item.isRead && s.rowTitleUnread]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.body ? (
          <Text style={s.rowBody} numberOfLines={2}>{item.body}</Text>
        ) : null}
        <Text style={s.rowTime}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={s.unreadDot} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, loading, load, markRead, markAllRead } = useNotificationStore();

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handlePress = (item: AppNotification) => {
    if (!item.isRead) markRead(item.id);

    // Deep link based on notification type
    if (item.dataJson) {
      try {
        const data = JSON.parse(item.dataJson);
        if (item.type === 'enrollment' || item.type === 'paperwork_request' || item.type === 'ack_request') {
          router.push(`/student/course/${data.courseId}?courseId=${data.courseId}` as any);
          return;
        }
        if (item.type === 'paperwork_complete' || item.type === 'ack_complete') {
          router.push(`/instructor/paperwork?courseId=${data.courseId}` as any);
          return;
        }
      } catch { /* ignore parse errors */ }
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={s.markAllText}>Read All</Text>
          </Pressable>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotificationRow item={item} onPress={() => handlePress(item)} />
        )}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.accentBlue} />}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.textTertiary} />
            <Text style={s.emptyTitle}>No notifications yet</Text>
            <Text style={s.emptySub}>You'll see updates here when your instructor or dive buddies interact with you.</Text>
          </View>
        }
      />
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
  markAllText: { ...Typography.subhead, color: Colors.accentBlue, fontWeight: '600' },
  list: { paddingBottom: Spacing.xl },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  rowUnread: { backgroundColor: Colors.accentBlue + '08' },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  rowInfo: { flex: 1, gap: 1 },
  rowTitle: { ...Typography.subhead, color: Colors.text },
  rowTitleUnread: { fontWeight: '700' },
  rowBody: { ...Typography.footnote, color: Colors.textSecondary },
  rowTime: { ...Typography.caption2, color: Colors.textTertiary, marginTop: 2 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accentBlue,
  },

  emptyWrap: { alignItems: 'center', marginTop: 80, gap: Spacing.xs, paddingHorizontal: Spacing.xl },
  emptyTitle: { ...Typography.headline, fontWeight: '600', color: Colors.textSecondary },
  emptySub: { ...Typography.subhead, color: Colors.textTertiary, textAlign: 'center' },
});
