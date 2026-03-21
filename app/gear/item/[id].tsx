import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Modal, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useGearStore } from '@/src/stores/gearStore';
import { getServiceStatus, GEAR_TYPE_MAP } from '@/src/utils/gearUtils';
import type { GearItem, ServiceRecord } from '@/src/models';
import { todayISO } from '@/src/utils/uuid';

// ── Service Status Card ────────────────────────────────────────────────────────

function ServiceStatusCard({ item }: { item: GearItem }) {
  const s = getServiceStatus(item);

  if (!item.requiresService) {
    return (
      <View style={[ssc.card, { borderColor: Colors.border }]}>
        <Text style={ssc.noServiceLabel}>Total Dives</Text>
        <Text style={ssc.noServiceCount}>{item.diveCount}</Text>
        <Text style={ssc.noServiceSub}>No service tracking for this gear type</Text>
      </View>
    );
  }

  const bgColor  = s.isDue ? Colors.emergency + '15' : s.isWarning ? '#FF950015' : Colors.accentBlue + '12';
  const bdColor  = s.isDue ? Colors.emergency       : s.isWarning ? '#FF9500'    : Colors.accentBlue;
  const iconName = s.isDue ? 'warning-outline' as const : s.isWarning ? 'time-outline' as const : 'checkmark-circle-outline' as const;
  const iconColor = s.isDue ? Colors.emergency : s.isWarning ? '#FF9500' : Colors.accentBlue;

  let statusText: string;
  if (s.isDue) {
    statusText = 'Service overdue';
  } else if (s.isWarning) {
    const parts: string[] = [];
    if (s.daysUntilDue != null && s.daysUntilDue <= 30) parts.push(`${s.daysUntilDue}d`);
    if (s.divesUntilDue != null && s.divesUntilDue <= 15) parts.push(`${s.divesUntilDue} dives`);
    statusText = `Due in ${parts.join(' / ')}`;
  } else {
    const parts: string[] = [];
    if (s.daysUntilDue != null) parts.push(`${s.daysUntilDue}d`);
    if (s.divesUntilDue != null) parts.push(`${s.divesUntilDue} dives`);
    statusText = parts.length ? `Next service in ${parts.join(' / ')}` : 'Service up to date';
  }

  return (
    <View style={[ssc.card, { backgroundColor: bgColor, borderColor: bdColor }]}>
      <View style={ssc.row}>
        <Ionicons name={iconName} size={22} color={iconColor} />
        <View style={ssc.textWrap}>
          <Text style={[ssc.statusText, { color: bdColor }]}>{statusText}</Text>
          <View style={ssc.statsRow}>
            <Text style={ssc.statItem}>
              <Text style={ssc.statVal}>{item.diveCount}</Text>
              <Text style={ssc.statLbl}> total dives</Text>
            </Text>
            <Text style={ssc.dot}>·</Text>
            <Text style={ssc.statItem}>
              <Text style={ssc.statVal}>{item.diveCount - item.diveCountAtLastService}</Text>
              <Text style={ssc.statLbl}> since service</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const ssc = StyleSheet.create({
  card: {
    borderWidth: 1, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  row:      { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  textWrap: { flex: 1 },
  statusText: { ...Typography.subhead, fontWeight: '700', marginBottom: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statItem: {},
  statVal:  { ...Typography.subhead, color: Colors.text, fontWeight: '600' },
  statLbl:  { ...Typography.footnote, color: Colors.textSecondary },
  dot:      { ...Typography.footnote, color: Colors.textTertiary },
  noServiceLabel: { ...Typography.caption1, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  noServiceCount: { ...Typography.title3, color: Colors.accentBlue, fontWeight: '700', marginTop: 2 },
  noServiceSub:   { ...Typography.footnote, color: Colors.textSecondary, marginTop: 4 },
});

// ── Add Service Record Modal ───────────────────────────────────────────────────

function AddServiceModal({
  visible, onSave, onCancel,
}: {
  visible: boolean;
  onSave: (date: string, description: string, provider: string, notes: string) => void;
  onCancel: () => void;
}) {
  const [date,        setDate]        = useState(todayISO());
  const [description, setDescription] = useState('');
  const [provider,    setProvider]    = useState('');
  const [notes,       setNotes]       = useState('');

  function handleSave() {
    if (!date.trim()) { Alert.alert('Required', 'Please enter a service date.'); return; }
    onSave(date.trim(), description.trim(), provider.trim(), notes.trim());
    // Reset
    setDate(todayISO());
    setDescription('');
    setProvider('');
    setNotes('');
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={sm.overlay}>
        <View style={sm.sheet}>
          <Text style={sm.sheetTitle}>Add Service Record</Text>

          <Text style={sm.fieldLabel}>Service Date *</Text>
          <TextInput
            style={sm.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textTertiary}
          />

          <Text style={sm.fieldLabel}>Provider / Shop</Text>
          <TextInput
            style={sm.input}
            value={provider}
            onChangeText={setProvider}
            placeholder="e.g. Dive Shop Pro"
            placeholderTextColor={Colors.textTertiary}
          />

          <Text style={sm.fieldLabel}>Description</Text>
          <TextInput
            style={sm.input}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Annual overhaul"
            placeholderTextColor={Colors.textTertiary}
          />

          <Text style={sm.fieldLabel}>Notes</Text>
          <TextInput
            style={[sm.input, sm.multiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Parts replaced, observations…"
            placeholderTextColor={Colors.textTertiary}
            multiline
          />

          <View style={sm.btns}>
            <Pressable style={sm.cancelBtn} onPress={onCancel}>
              <Text style={sm.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={sm.saveBtn} onPress={handleSave}>
              <Text style={sm.saveText}>Save Record</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const sm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.lg, paddingBottom: Spacing.xxxl,
  },
  sheetTitle: { ...Typography.title3, color: Colors.text, fontWeight: '700', marginBottom: Spacing.lg },
  fieldLabel: { ...Typography.caption1, color: Colors.textSecondary, marginBottom: 4, marginTop: Spacing.sm },
  input: {
    ...Typography.body, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  btns:     { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.full, alignItems: 'center', paddingVertical: Spacing.md,
  },
  cancelText: { ...Typography.subhead, color: Colors.textSecondary },
  saveBtn: {
    flex: 2, backgroundColor: Colors.accentBlue,
    borderRadius: Radius.full, alignItems: 'center', paddingVertical: Spacing.md,
  },
  saveText: { ...Typography.headline, color: '#FFF' },
});

// ── Service Record Row ─────────────────────────────────────────────────────────

function ServiceRecordRow({ record }: { record: ServiceRecord }) {
  return (
    <View style={srr.row}>
      <View style={srr.dateCol}>
        <Text style={srr.date}>{record.serviceDate}</Text>
        <Text style={srr.diveCount}>{record.diveCountAtService} dives</Text>
      </View>
      <View style={srr.details}>
        {record.provider   ? <Text style={srr.provider}>{record.provider}</Text>   : null}
        {record.description ? <Text style={srr.desc}>{record.description}</Text>  : null}
        {record.notes       ? <Text style={srr.notes}>{record.notes}</Text>        : null}
      </View>
    </View>
  );
}

const srr = StyleSheet.create({
  row: {
    flexDirection: 'row', padding: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  dateCol:   { width: 72, alignItems: 'flex-start' },
  date:      { ...Typography.subhead, color: Colors.text, fontWeight: '600', fontSize: 12 },
  diveCount: { ...Typography.caption1, color: Colors.textTertiary, marginTop: 2 },
  details:   { flex: 1 },
  provider:  { ...Typography.subhead, color: Colors.text },
  desc:      { ...Typography.footnote, color: Colors.textSecondary, marginTop: 2 },
  notes:     { ...Typography.footnote, color: Colors.textTertiary, marginTop: 2 },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export default function GearItemDetailScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { id }  = useLocalSearchParams<{ id: string }>();
  const { items, deleteItem, addServiceRecord, getServiceHistory } = useGearStore();

  const [serviceModal,   setServiceModal]   = useState(false);
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);

  const item = items.find(i => i.id === id);

  const loadHistory = useCallback(() => {
    if (id) setServiceHistory(getServiceHistory(id));
  }, [id, getServiceHistory]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  if (!item) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Item not found.</Text>
        </View>
      </View>
    );
  }

  const meta = GEAR_TYPE_MAP[item.gearType];

  function confirmDelete() {
    Alert.alert('Delete Gear Item', `Remove "${item!.name}" and all its service records?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteItem(item!.id); router.back(); } },
    ]);
  }

  function handleAddService(date: string, description: string, provider: string, notes: string) {
    addServiceRecord({
      gearItemId:  item!.id,
      serviceDate: date,
      description: description || null,
      provider:    provider    || null,
      notes:       notes       || null,
    });
    setServiceModal(false);
    loadHistory();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push({ pathname: '/gear/item/new', params: { editId: item.id } })}
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
        {/* Hero row */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name={meta.icon as any} size={32} color={Colors.accentBlue} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{item.name}</Text>
            <Text style={styles.heroSub}>
              {[item.brand, item.model, meta.label].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>

        {/* Service status */}
        <ServiceStatusCard item={item} />

        {/* Details card */}
        <View style={styles.card}>
          {item.serialNumber && (
            <>
              <DetailRow label="Serial Number" value={item.serialNumber} />
              <View style={styles.divider} />
            </>
          )}
          {item.purchaseDate && (
            <>
              <DetailRow label="Purchase Date" value={item.purchaseDate} />
              <View style={styles.divider} />
            </>
          )}
          {item.lastServiceDate && (
            <>
              <DetailRow label="Last Service" value={item.lastServiceDate} />
              <View style={styles.divider} />
            </>
          )}
          <DetailRow label="Dive Count" value={String(item.diveCount)} />
          {item.notes && (
            <>
              <View style={styles.divider} />
              <DetailRow label="Notes" value={item.notes} />
            </>
          )}
        </View>

        {/* Service History */}
        {item.requiresService && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>SERVICE HISTORY</Text>
              <Pressable onPress={() => setServiceModal(true)} style={styles.addServiceBtn}>
                <Ionicons name="add" size={14} color={Colors.accentBlue} />
                <Text style={styles.addServiceText}>Add Record</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              {serviceHistory.length === 0 ? (
                <View style={styles.emptyService}>
                  <Text style={styles.emptyServiceText}>No service records yet.</Text>
                  <Pressable onPress={() => setServiceModal(true)} style={styles.addServiceBtnFull}>
                    <Text style={styles.addServiceBtnFullText}>+ Add First Record</Text>
                  </Pressable>
                </View>
              ) : (
                serviceHistory.map(r => <ServiceRecordRow key={r.id} record={r} />)
              )}
            </View>
          </>
        )}
      </ScrollView>

      <AddServiceModal
        visible={serviceModal}
        onSave={handleAddService}
        onCancel={() => setServiceModal(false)}
      />
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={dr.row}>
      <Text style={dr.label}>{label}</Text>
      <Text style={dr.value}>{value}</Text>
    </View>
  );
}

const dr = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, alignItems: 'flex-start' },
  label: { ...Typography.subhead, color: Colors.textSecondary },
  value: { ...Typography.subhead, color: Colors.text, textAlign: 'right', flex: 1, marginLeft: Spacing.md },
});

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  backBtn:      { width: 60 },
  back:         { ...Typography.body, color: Colors.accentBlue },
  headerTitle:  { ...Typography.headline, color: Colors.text, flex: 1, textAlign: 'center' },
  headerActions: { flexDirection: 'row', gap: Spacing.sm, width: 60, justifyContent: 'flex-end' },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll:  { flex: 1 },
  content: { padding: Spacing.lg },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  heroIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.accentBlue + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroName: { ...Typography.title3, color: Colors.text, fontWeight: '700' },
  heroSub:  { ...Typography.body, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: Colors.border },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.footnote, color: Colors.textSecondary,
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  addServiceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accentBlue + '18',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 5,
  },
  addServiceText: { ...Typography.caption1, color: Colors.accentBlue, fontWeight: '600' },
  emptyService: { padding: Spacing.lg, alignItems: 'center' },
  emptyServiceText: { ...Typography.body, color: Colors.textSecondary },
  addServiceBtnFull: { marginTop: Spacing.md },
  addServiceBtnFullText: { ...Typography.subhead, color: Colors.accentBlue },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { ...Typography.body, color: Colors.textSecondary },
});
