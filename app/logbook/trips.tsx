import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useTripStore } from '@/src/stores/tripStore';
import { TripRepository } from '@/src/repositories/TripRepository';
import type { Trip } from '@/src/models';

const repo = new TripRepository();

export default function TripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trips, loadTrips, createTrip, deleteTrip } = useTripStore();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { loadTrips(); }, []);

  function handleCreate() {
    if (!name.trim()) return;
    createTrip({
      name: name.trim(),
      destination: destination.trim() || null,
      startDate: startDate.trim() || null,
      endDate: endDate.trim() || null,
    });
    setShowAdd(false);
    setName(''); setDestination(''); setStartDate(''); setEndDate('');
  }

  function handleDelete(trip: Trip) {
    Alert.alert('Delete Trip', `Delete "${trip.name}"? Dives in this trip will not be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTrip(trip.id) },
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Trips</Text>
        <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.accentBlue} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}>
        {trips.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🗺</Text>
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptyBody}>Group your dives into trips or expeditions.</Text>
          </View>
        ) : (
          trips.map(trip => {
            const diveCount = repo.getDiveCount(trip.id);
            return (
              <View key={trip.id} style={styles.card}>
                <View style={styles.cardContent}>
                  <Text style={styles.tripName}>{trip.name}</Text>
                  {trip.destination ? <Text style={styles.tripDest}>{trip.destination}</Text> : null}
                  <View style={styles.tripMeta}>
                    {(trip.startDate || trip.endDate) && (
                      <Text style={styles.tripDate}>{trip.startDate ?? '?'}{trip.endDate ? ` – ${trip.endDate}` : ''}</Text>
                    )}
                    <Text style={styles.tripDives}>{diveCount} dive{diveCount !== 1 ? 's' : ''}</Text>
                  </View>
                  {trip.notes ? <Text style={styles.tripNotes}>{trip.notes}</Text> : null}
                </View>
                <Pressable style={styles.deleteBtn} onPress={() => handleDelete(trip)}>
                  <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <View style={[styles.modal, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Trip</Text>
            <Pressable onPress={() => setShowAdd(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <FieldLabel label="Trip Name *" />
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Cozumel 2026" placeholderTextColor={Colors.textTertiary} autoFocus />
            <FieldLabel label="Destination" />
            <TextInput style={styles.input} value={destination} onChangeText={setDestination} placeholder="e.g. Mexico" placeholderTextColor={Colors.textTertiary} />
            <FieldLabel label="Start Date (YYYY-MM-DD)" />
            <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2026-06-01" placeholderTextColor={Colors.textTertiary} keyboardType="numbers-and-punctuation" />
            <FieldLabel label="End Date (YYYY-MM-DD)" />
            <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="2026-06-08" placeholderTextColor={Colors.textTertiary} keyboardType="numbers-and-punctuation" />
            <Pressable style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]} onPress={handleCreate}>
              <Text style={styles.saveBtnText}>Create Trip</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 60 },
  backText: { ...Typography.body, color: Colors.accentBlue },
  headerTitle: { ...Typography.headline, color: Colors.text },
  addBtn: { width: 60, alignItems: 'flex-end' },
  content: { padding: Spacing.lg, gap: Spacing.md },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...Typography.title3, color: Colors.text },
  emptyBody: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start',
    borderWidth: 1, borderColor: Colors.border,
  },
  cardContent: { flex: 1 },
  tripName: { ...Typography.subhead, fontWeight: '700' as const, color: Colors.text },
  tripDest: { ...Typography.footnote, color: Colors.textSecondary, marginTop: 2 },
  tripMeta: { flexDirection: 'row', gap: Spacing.md, marginTop: 4, alignItems: 'center' },
  tripDate: { ...Typography.caption1, color: Colors.textSecondary },
  tripDives: { ...Typography.caption1, color: Colors.accentBlue, fontWeight: '600' as const },
  tripNotes: { ...Typography.caption2, color: Colors.textTertiary, marginTop: 4, fontStyle: 'italic' as const },
  deleteBtn: { padding: Spacing.sm },
  // Modal
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  modalTitle: { ...Typography.headline, color: Colors.text },
  modalClose: { padding: Spacing.sm },
  modalCloseText: { ...Typography.body, color: Colors.textSecondary, fontSize: 18 },
  modalContent: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 80 },
  fieldLabel: { ...Typography.footnote, fontWeight: '600' as const, color: Colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4, marginTop: Spacing.md },
  input: {
    ...Typography.body, color: Colors.text,
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minHeight: 44,
  },
  saveBtn: { backgroundColor: Colors.accentBlue, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' as const, marginTop: Spacing.lg },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { ...Typography.subhead, color: '#FFF', fontWeight: '700' as const },
});
