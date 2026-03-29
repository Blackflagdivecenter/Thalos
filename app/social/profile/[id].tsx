import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { FeedService } from '@/src/services/FeedService';
import { getSupabase } from '@/src/db/supabase';
import { useAuthStore } from '@/src/stores/authStore';
import type { DiveShare } from '@/src/models';

function initials(name?: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

interface ProfileData {
  id: string;
  displayName: string | null;
  handle: string | null;
  bio: string | null;
  role: string;
  certLevel: string | null;
  certAgency: string | null;
  totalDives: number;
}

export default function PublicProfileScreen() {
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const myId = useAuthStore(s => s.user?.id);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [shares, setShares] = useState<DiveShare[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const supabase = getSupabase();
        const [{ data: p }, shrs, counts, isFol] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          FeedService.getUserShares(userId),
          FeedService.getFollowCounts(userId),
          myId ? FeedService.isFollowing(userId) : Promise.resolve(false),
        ]);
        if (p) {
          setProfile({
            id: p.id,
            displayName: p.display_name,
            handle: p.handle,
            bio: p.bio,
            role: p.role,
            certLevel: p.cert_level,
            certAgency: p.cert_agency,
            totalDives: p.total_dives ?? 0,
          });
        }
        setShares(shrs);
        setFollowers(counts.followers);
        setFollowing(counts.following);
        setIsFollowing(isFol);
      } catch (e) {
        console.warn('[Profile] load error:', e);
      }
      setLoading(false);
    })();
  }, [userId, myId]);

  const handleToggleFollow = async () => {
    if (!userId) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await FeedService.unfollow(userId);
        setIsFollowing(false);
        setFollowers(f => f - 1);
      } else {
        await FeedService.follow(userId);
        setIsFollowing(true);
        setFollowers(f => f + 1);
      }
    } catch { /* silent */ }
    setFollowLoading(false);
  };

  const isMe = myId === userId;

  if (loading) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.accentBlue} style={{ marginTop: 80 }} />
      </View>
    );
  }

  const headerComponent = (
    <View style={s.profileSection}>
      {/* Avatar */}
      <View style={s.avatarLarge}>
        <Text style={s.avatarText}>{initials(profile?.displayName)}</Text>
      </View>

      {/* Name + handle */}
      <Text style={s.displayName}>{profile?.displayName ?? 'Diver'}</Text>
      {profile?.handle ? <Text style={s.handle}>@{profile.handle}</Text> : null}
      {profile?.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}

      {/* Cert + role */}
      <View style={s.badgeRow}>
        <View style={[s.badge, profile?.role === 'instructor' && s.badgeInstructor]}>
          <Text style={[s.badgeText, profile?.role === 'instructor' && s.badgeTextInstructor]}>
            {profile?.role === 'instructor' ? 'Instructor' : 'Diver'}
          </Text>
        </View>
        {profile?.certLevel ? (
          <View style={s.badge}>
            <Text style={s.badgeText}>{profile.certLevel}</Text>
          </View>
        ) : null}
        {profile?.certAgency ? (
          <View style={s.badge}>
            <Text style={s.badgeText}>{profile.certAgency}</Text>
          </View>
        ) : null}
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{profile?.totalDives ?? 0}</Text>
          <Text style={s.statLabel}>Dives</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{followers}</Text>
          <Text style={s.statLabel}>Followers</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{following}</Text>
          <Text style={s.statLabel}>Following</Text>
        </View>
      </View>

      {/* Follow button */}
      {!isMe && (
        <Pressable
          style={[s.followBtn, isFollowing && s.followBtnActive]}
          onPress={handleToggleFollow}
          disabled={followLoading}
        >
          <Text style={[s.followBtnText, isFollowing && s.followBtnTextActive]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      )}

      {/* Section title */}
      {shares.length > 0 && (
        <Text style={s.sectionTitle}>Shared Dives</Text>
      )}
    </View>
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>{profile?.displayName ?? 'Profile'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={shares}
        keyExtractor={item => item.id}
        ListHeaderComponent={headerComponent}
        renderItem={({ item }) => (
          <View style={s.shareCard}>
            <View style={s.shareStats}>
              {item.siteName ? (
                <Text style={s.shareSite} numberOfLines={1}>{item.siteName}</Text>
              ) : null}
              <View style={s.shareRow}>
                {item.maxDepthM != null && <Text style={s.shareStat}>{item.maxDepthM.toFixed(0)}m</Text>}
                {item.bottomTimeMin != null && <Text style={s.shareStat}>{item.bottomTimeMin}min</Text>}
                {item.date ? <Text style={s.shareDate}>{item.date}</Text> : null}
              </View>
            </View>
            {item.caption ? <Text style={s.shareCaption}>{item.caption}</Text> : null}
          </View>
        )}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          shares.length === 0 ? (
            <Text style={s.empty}>No shared dives yet</Text>
          ) : null
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
  list: { paddingBottom: Spacing.xl },

  profileSection: { alignItems: 'center', padding: Spacing.md, gap: Spacing.xs },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accentBlue + '20',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.accentBlue },
  displayName: { ...Typography.title2, fontWeight: '800', color: Colors.text },
  handle: { ...Typography.subhead, color: Colors.textSecondary },
  bio: { ...Typography.subhead, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg },

  badgeRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs },
  badge: {
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  badgeInstructor: { borderColor: Colors.accentBlue, backgroundColor: Colors.accentBlue + '15' },
  badgeText: { ...Typography.caption1, color: Colors.textSecondary, fontWeight: '500' },
  badgeTextInstructor: { color: Colors.accentBlue },

  statsRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginTop: Spacing.md, paddingVertical: Spacing.sm,
  },
  statItem: { alignItems: 'center' },
  statValue: { ...Typography.headline, fontWeight: '800', color: Colors.text, fontVariant: ['tabular-nums'] },
  statLabel: { ...Typography.caption1, color: Colors.textSecondary },
  statDivider: { width: 1, height: 24, backgroundColor: Colors.border },

  followBtn: {
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.accentBlue,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xs,
    marginTop: Spacing.sm,
  },
  followBtnActive: { backgroundColor: Colors.accentBlue },
  followBtnText: { ...Typography.subhead, fontWeight: '700', color: Colors.accentBlue },
  followBtnTextActive: { color: '#fff' },

  sectionTitle: {
    ...Typography.subhead, fontWeight: '700', color: Colors.text,
    alignSelf: 'flex-start', marginTop: Spacing.md,
  },

  shareCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.xs,
  },
  shareStats: { gap: 2 },
  shareSite: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  shareRow: { flexDirection: 'row', gap: Spacing.md },
  shareStat: { ...Typography.caption1, fontWeight: '600', color: Colors.accentBlue, fontVariant: ['tabular-nums'] },
  shareDate: { ...Typography.caption1, color: Colors.textTertiary },
  shareCaption: { ...Typography.footnote, color: Colors.textSecondary },

  empty: { ...Typography.subhead, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.xl },
});
