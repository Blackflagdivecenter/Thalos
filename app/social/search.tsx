import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
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
import { FeedService } from '@/src/services/FeedService';
import { useAuthStore } from '@/src/stores/authStore';

interface SearchResult {
  id: string;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  role: string;
  totalDives: number;
}

function initials(name?: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function SearchUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const myId = useAuthStore(s => s.user?.id);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await FeedService.searchUsers(text);
        setResults(r.filter(u => u.id !== myId));
      } catch { /* silent */ }
    }, 400);
  }, [myId]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>Find Divers</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textTertiary} style={{ marginRight: Spacing.xs }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or @handle..."
          placeholderTextColor={Colors.textTertiary}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={s.row}
            onPress={() => router.push(`/social/profile/${item.id}` as any)}
          >
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials(item.displayName)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.displayName ?? 'Diver'}</Text>
              {item.handle ? <Text style={s.handle}>@{item.handle}</Text> : null}
            </View>
            <View style={s.meta}>
              <Text style={s.diveCount}>{item.totalDives} dives</Text>
              <View style={[s.rolePill, item.role === 'instructor' && s.rolePillInstructor]}>
                <Text style={[s.roleText, item.role === 'instructor' && s.roleTextInstructor]}>
                  {item.role}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </Pressable>
        )}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          query.length >= 2 ? (
            <Text style={s.empty}>No divers found</Text>
          ) : (
            <Text style={s.empty}>Type at least 2 characters to search</Text>
          )
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
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm, height: 44,
  },
  searchInput: { flex: 1, ...Typography.body, color: Colors.text },
  list: { paddingHorizontal: Spacing.md, gap: Spacing.xs, paddingBottom: Spacing.xl },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accentBlue + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.caption1, fontWeight: '700', color: Colors.accentBlue },
  name: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  handle: { ...Typography.caption1, color: Colors.textTertiary },
  meta: { alignItems: 'flex-end', gap: 2 },
  diveCount: { ...Typography.caption2, color: Colors.textSecondary, fontVariant: ['tabular-nums'] },
  rolePill: {
    borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.xs, paddingVertical: 1,
  },
  rolePillInstructor: { borderColor: Colors.accentBlue, backgroundColor: Colors.accentBlue + '15' },
  roleText: { ...Typography.caption2, color: Colors.textSecondary, textTransform: 'capitalize' },
  roleTextInstructor: { color: Colors.accentBlue },
  empty: { ...Typography.subhead, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.xl },
});
