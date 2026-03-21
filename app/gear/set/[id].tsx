import React, { useEffect, useState } from 'react';
import {
  Alert, FlatList, Modal, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useGearStore } from '@/src/stores/gearStore';
import { getServiceStatus, GEAR_TYPE_MAP, DIVING_TYPE_LABELS } from '@/src/utils/gearUtils';
import type { GearItem } from '@/src/models';

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusDot(item: GearItem): string | null {
  if (!item.requiresService) return null;
  const s = getServiceStatus(item);
  if (s.isDue)     return Colors.emergency;
  if (s.isWarning) return '#FF9500';
  return Colors.accentBlue;
}

// ── Add Item Picker Modal ─────────────────────────────────────────────────────

function AddItemModal({
  visible,
  availableItems,
  onAdd,
  onClose,
}: {
  visible: boolean;
  availableItems: GearItem[];
  onAdd: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={aim.overlay}>
        <View style={aim.sheet}>
          <View style={aim.sheetHeader}>
            <Text style={aim.sheetTitle}>Add Item to Set</Text>
            <Pressable onPress={onClose} style={aim.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </Pressable>
          </View>

          {availableItems.length === 0 ? (
            <View style={aim.empty}>
              <Text style={aim.emptyText}>All items are already in this set.</Text>
            </View>
          ) : (
            <FlatList
              data={availableItems}
              keyExtractor={i => i.id}
              style={aim.list}
              renderItem={({ item }) => {
                const meta = GEAR_TYPE_MAP[item.gearType];
                return (
                  <Pressable onPress={() => onAdd(item.id)} style={aim.itemRow}>
                    <View style={aim.iconWrap}>
                      <Ionicons name={meta.icon as any} size={18} color={Colors.accentBlue} />
                    </View>
                    <View style={aim.itemInfo}>
                      <Text style={aim.itemName}>{item.name}</Text>
                      <Text style={aim.itemSub}>
                        {[item.brand, item.model].filter(Boolean).join(' · ') || meta.label}
                      </Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={Colors.accentBlue} />
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const aim = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    maxHeight: '75%',
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sheetTitle: { ...Typography.title3, color: Colors.text, fontWeight: '700' },
  closeBtn:   { padding: 4 },
  list:       { paddingBottom: Spacing.xl },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accentBlue + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { ...Typography.subhead, color: Colors.text },
  itemSub:  { ...Typography.footnote, color: Colors.textSecondary },
  empty:    { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
});

// ── Item Row (in-set) ─────────────────────────────────────────────────────────

function SetItemRow({
  item,
  onPress,
  onRemove,
}: {
  item: GearItem;
  onPress: () => void;
  onRemove: () => void;
}) {
  const meta = GEAR_TYPE_MAP[item.gearType];
  const dot  = statusDot(item);

  return (
    <View style={sir.row}>
      <Pressable onPress={onPress} style={sir.main}>
        <View style={sir.iconWrap}>
          <Ionicons name={meta.icon as any} size={18} color={Colors.accentBlue} />
        </View>
        <View style={sir.info}>
          <View style={sir.nameRow}>
            <Text style={sir.name}>{item.name}</Text>
            {dot && <View style={[sir.dot, { backgroundColor: dot }]} />}
          </View>
          <Text style={sir.sub}>
            {[item.brand, item.model].filter(Boolean).join(' · ') || meta.label}
            {'  ·  '}{item.diveCount} dives
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
      </Pressable>
      <Pressable onPress={onRemove} style={sir.removeBtn}>
        <Ionicons name="remove-circle-outline" size={20} color={Colors.emergency} />
      </Pressable>
    </View>
  );
}

const sir = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  main: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, padding: Spacing.md,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accentBlue + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  info:    { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:    { ...Typography.subhead, color: Colors.text },
  dot:     { width: 7, height: 7, borderRadius: 3.5 },
  sub:     { ...Typography.footnote, color: Colors.textSecondary, marginTop: 1 },
  removeBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function GearSetDetailScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { id }  = useLocalSearchParams<{ id: string }>();
  const { items, sets, deleteSet, addItemToSet, removeItemFromSet, loadGear } = useGearStore();
  const [addModal, setAddModal] = useState(false);

  useEffect(() => { loadGear(); }, []);

  const gs = sets.find(s => s.id === id);

  if (!gs) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Set not found.</Text>
        </View>
      </View>
    );
  }

  // Items not already in this set
  const setItemIds = new Set(gs.items.map(i => i.id));
  const availableItems = items.filter(i => !setItemIds.has(i.id));

  function confirmDelete() {
    Alert.alert('Delete Gear Set', `Remove "${gs!.name}"? Items will not be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { deleteSet(gs!.id); router.back(); },
      },
    ]);
  }

  function handleAddItem(itemId: string) {
    addItemToSet(gs!.id, itemId);
    setAddModal(false);
  }

  function handleRemoveItem(itemId: string, itemName: string) {
    Alert.alert('Remove from Set', `Remove "${itemName}" from "${gs!.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => removeItemFromSet(gs!.id, itemId),
      },
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{gs.name}</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push({ pathname: '/gear/set/new', params: { editId: gs.id } })}
            style={styles.iconBtn}
          >
            <Ionicons name="pencil-outline" size={18} color={Colors.accentBlue} />
          </Pressable>
          <Pressable onPress={confirmDelete} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={18} color={Colors.emergency} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Set Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.typePill}>
              <Text style={styles.typeText}>{DIVING_TYPE_LABELS[gs.divingType]}</Text>
            </View>
            {gs.isDefault && (
              <View style={styles.defaultPill}>
                <Text style={styles.defaultText}>DEFAULT</Text>
              </View>
            )}
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{gs.items.length}</Text>
              <Text style={styles.statLbl}>Items</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{gs.diveCount}</Text>
              <Text style={styles.statLbl}>Dives</Text>
            </View>
          </View>
        </View>

        {/* Items in set */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>ITEMS IN SET</Text>
          <Pressable onPress={() => setAddModal(true)} style={styles.addItemBtn}>
            <Ionicons name="add" size={14} color={Colors.accentBlue} />
            <Text style={styles.addItemText}>Add Item</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          {gs.items.length === 0 ? (
            <View style={styles.emptyItems}>
              <Ionicons name="cube-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No items in this set yet.</Text>
              <Pressable onPress={() => setAddModal(true)} style={styles.addItemBtnFull}>
                <Text style={styles.addItemBtnFullText}>+ Add First Item</Text>
              </Pressable>
            </View>
          ) : (
            gs.items.map(item => (
              <SetItemRow
                key={item.id}
                item={item}
                onPress={() => router.push({ pathname: '/gear/item/[id]', params: { id: item.id } })}
                onRemove={() => handleRemoveItem(item.id, item.name)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <AddItemModal
        visible={addModal}
        availableItems={availableItems}
        onAdd={handleAddItem}
        onClose={() => setAddModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  backBtn:       { width: 60 },
  back:          { ...Typography.body, color: Colors.accentBlue },
  headerTitle:   { ...Typography.headline, color: Colors.text, flex: 1, textAlign: 'center' },
  headerActions: { flexDirection: 'row', gap: Spacing.sm, width: 60, justifyContent: 'flex-end' },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll:  { flex: 1 },
  content: { padding: Spacing.lg },

  infoCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  infoRow:    { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  typePill: {
    borderWidth: 1, borderColor: Colors.accentBlue,
    backgroundColor: Colors.accentBlue + '26',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  typeText:  { ...Typography.caption1, color: Colors.accentBlue, fontWeight: '600' },
  defaultPill: {
    borderWidth: 1, borderColor: Colors.accentBlue,
    backgroundColor: Colors.accentBlue + '26',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  defaultText: { ...Typography.caption1, color: Colors.accentBlue, fontWeight: '700', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox:  { flex: 1, alignItems: 'center' },
  statVal:  { ...Typography.title3, color: Colors.accentBlue, fontWeight: '700' },
  statLbl:  { ...Typography.caption1, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.footnote, color: Colors.textSecondary,
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accentBlue + '18',
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 5,
  },
  addItemText: { ...Typography.caption1, color: Colors.accentBlue, fontWeight: '600' },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  emptyItems: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  emptyText:  { ...Typography.body, color: Colors.textSecondary },
  addItemBtnFull: {},
  addItemBtnFullText: { ...Typography.subhead, color: Colors.accentBlue },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { ...Typography.body, color: Colors.textSecondary },
});
