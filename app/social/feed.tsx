import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
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
import { useFeedStore } from '@/src/stores/feedStore';
import type { DiveShare } from '@/src/models';

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

function initials(name?: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function DiveShareCard({
  share,
  onTap,
  onProfile,
}: {
  share: DiveShare;
  onTap: () => void;
  onProfile: () => void;
}) {
  return (
    <View style={s.card}>
      {/* User header */}
      <Pressable style={s.cardUser} onPress={onProfile}>
        <View style={s.cardAvatar}>
          <Text style={s.cardAvatarText}>{initials(share.userName)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardName}>{share.userName ?? 'Diver'}</Text>
          {share.userHandle ? <Text style={s.cardHandle}>@{share.userHandle}</Text> : null}
        </View>
        <Text style={s.cardTime}>{timeAgo(share.createdAt)}</Text>
      </Pressable>

      {/* Dive stats */}
      <View style={s.statsRow}>
        {share.siteName ? (
          <View style={s.statItem}>
            <Ionicons name="location-outline" size={14} color={Colors.accentBlue} />
            <Text style={s.statText} numberOfLines={1}>{share.siteName}</Text>
          </View>
        ) : null}
        {share.maxDepthM != null ? (
          <View style={s.statItem}>
            <Ionicons name="arrow-down-outline" size={14} color={Colors.accentBlue} />
            <Text style={s.statText}>{share.maxDepthM.toFixed(0)}m</Text>
          </View>
        ) : null}
        {share.bottomTimeMin != null ? (
          <View style={s.statItem}>
            <Ionicons name="time-outline" size={14} color={Colors.accentBlue} />
            <Text style={s.statText}>{share.bottomTimeMin}min</Text>
          </View>
        ) : null}
      </View>

      {/* Activity tags */}
      {share.activityTags.length > 0 && (
        <View style={s.tagsRow}>
          {share.activityTags.map(tag => (
            <View key={tag} style={s.tag}>
              <Text style={s.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Caption */}
      {share.caption ? <Text style={s.caption}>{share.caption}</Text> : null}

      {/* Photo */}
      {share.photoUrl ? (
        <Image source={{ uri: share.photoUrl }} style={s.photo} resizeMode="cover" />
      ) : null}

      {/* Tank Tap button */}
      <View style={s.actionRow}>
        <Pressable style={s.tapBtn} onPress={onTap}>
          <Ionicons
            name={share.isTapped ? 'hand-left' : 'hand-left-outline'}
            size={20}
            color={share.isTapped ? Colors.accentBlue : Colors.textSecondary}
          />
          <Text style={[s.tapCount, share.isTapped && s.tapCountActive]}>
            {share.tapCount ?? 0}
          </Text>
        </Pressable>
        <Text style={s.tapLabel}>Tank Tap{(share.tapCount ?? 0) !== 1 ? 's' : ''}</Text>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { feed, exploreFeed, loading, loadFeed, loadExploreFeed, toggleTap } = useFeedStore();
  const [tab, setTab] = useState<'following' | 'explore'>('following');

  useFocusEffect(useCallback(() => {
    if (tab === 'following') loadFeed();
    else loadExploreFeed();
  }, [tab, loadFeed, loadExploreFeed]));

  const currentFeed = tab === 'following' ? feed : exploreFeed;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>Dive Feed</Text>
        <Pressable onPress={() => router.push('/social/search' as any)} hitSlop={12}>
          <Ionicons name="search" size={22} color={Colors.text} />
        </Pressable>
      </View>

      {/* Tab pills */}
      <View style={s.tabRow}>
        {(['following', 'explore'] as const).map(t => (
          <Pressable
            key={t}
            style={[s.tabPill, tab === t && s.tabPillActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'following' ? 'Following' : 'Explore'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Feed */}
      <FlatList
        data={currentFeed}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <DiveShareCard
            share={item}
            onTap={() => toggleTap(item.id)}
            onProfile={() => router.push(`/social/profile/${item.userId}` as any)}
          />
        )}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={tab === 'following' ? loadFeed : loadExploreFeed}
            tintColor={Colors.accentBlue}
          />
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Ionicons name="water-outline" size={48} color={Colors.textTertiary} />
            <Text style={s.emptyTitle}>
              {tab === 'following' ? 'No dives from divers you follow' : 'No shared dives yet'}
            </Text>
            <Text style={s.emptySub}>
              {tab === 'following'
                ? 'Follow other divers to see their shared dives here.'
                : 'Be the first to share a dive!'}
            </Text>
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

  tabRow: {
    flexDirection: 'row', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  tabPill: {
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  tabPillActive: { borderColor: Colors.accentBlue, backgroundColor: Colors.accentBlue + '26' },
  tabText: { ...Typography.caption1, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.accentBlue, fontWeight: '600' },

  list: { paddingHorizontal: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardUser: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accentBlue + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  cardAvatarText: { ...Typography.caption1, fontWeight: '700', color: Colors.accentBlue },
  cardName: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  cardHandle: { ...Typography.caption2, color: Colors.textTertiary },
  cardTime: { ...Typography.caption2, color: Colors.textTertiary },

  statsRow: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { ...Typography.caption1, color: Colors.text, fontWeight: '500', fontVariant: ['tabular-nums'] },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  tag: {
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.xs, paddingVertical: 1,
  },
  tagText: { ...Typography.caption2, color: Colors.textSecondary },

  caption: { ...Typography.subhead, color: Colors.text },

  photo: { width: '100%', height: 200, borderRadius: Radius.md },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.xs },
  tapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4, paddingHorizontal: 8,
    borderRadius: 16, backgroundColor: Colors.background,
  },
  tapCount: { ...Typography.caption1, fontWeight: '600', color: Colors.textSecondary, fontVariant: ['tabular-nums'] },
  tapCountActive: { color: Colors.accentBlue },
  tapLabel: { ...Typography.caption2, color: Colors.textTertiary },

  emptyWrap: { alignItems: 'center', marginTop: 80, gap: Spacing.xs, paddingHorizontal: Spacing.xl },
  emptyTitle: { ...Typography.headline, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  emptySub: { ...Typography.subhead, color: Colors.textTertiary, textAlign: 'center' },
});
