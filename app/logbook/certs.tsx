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
import { PersonalCertRepository } from '@/src/repositories/PersonalCertRepository';
import type { PersonalCert } from '@/src/models';

const repo = new PersonalCertRepository();

export default function PersonalCertsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [certs, setCerts] = useState<PersonalCert[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [certName, setCertName] = useState('');
  const [agency, setAgency] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  function load() { setCerts(repo.getAll()); }
  useEffect(() => { load(); }, []);

  function handleCreate() {
    if (!certName.trim()) return;
    repo.create({
      certName: certName.trim(),
      agency: agency.trim() || null,
      certNumber: certNumber.trim() || null,
      issuedDate: issuedDate.trim() || null,
      expiryDate: expiryDate.trim() || null,
    });
    load();
    setShowAdd(false);
    setCertName(''); setAgency(''); setCertNumber(''); setIssuedDate(''); setExpiryDate('');
  }

  function handleDelete(cert: PersonalCert) {
    Alert.alert('Delete Certification', `Delete "${cert.certName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { repo.delete(cert.id); load(); } },
    ]);
  }

  const AGENCIES = ['PADI', 'NAUI', 'SSI', 'SDI', 'TDI', 'GUE', 'IANTD', 'BSAC', 'CMAS'];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Certifications</Text>
        <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.accentBlue} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}>
        {certs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏅</Text>
            <Text style={styles.emptyTitle}>No certifications yet</Text>
            <Text style={styles.emptyBody}>Add your dive certifications to keep them in one place.</Text>
          </View>
        ) : (
          certs.map(cert => (
            <Pressable key={cert.id} style={styles.card} onLongPress={() => handleDelete(cert)}>
              <View style={styles.certBadge}>
                <Text style={styles.certBadgeText}>{cert.agency?.[0] ?? '✓'}</Text>
              </View>
              <View style={styles.certInfo}>
                <Text style={styles.certName}>{cert.certName}</Text>
                {cert.agency ? <Text style={styles.certAgency}>{cert.agency}</Text> : null}
                <View style={styles.certMeta}>
                  {cert.certNumber ? <Text style={styles.certMeta1}>#{cert.certNumber}</Text> : null}
                  {cert.issuedDate ? <Text style={styles.certMeta1}>{cert.issuedDate}</Text> : null}
                  {cert.expiryDate ? <Text style={[styles.certMeta1, { color: Colors.emergency }]}>Exp: {cert.expiryDate}</Text> : null}
                </View>
              </View>
              <Pressable onPress={() => handleDelete(cert)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
              </Pressable>
            </Pressable>
          ))
        )}
        <Text style={styles.hint}>Long-press a cert to delete it.</Text>
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <View style={[styles.modal, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Certification</Text>
            <Pressable onPress={() => setShowAdd(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <FieldLabel label="Certification Name *" />
            <TextInput style={styles.input} value={certName} onChangeText={setCertName} placeholder="e.g. Open Water Diver" placeholderTextColor={Colors.textTertiary} autoFocus />
            <FieldLabel label="Agency" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {AGENCIES.map(a => (
                  <Pressable key={a} style={[styles.agencyChip, agency === a && styles.agencyChipActive]} onPress={() => setAgency(a)}>
                    <Text style={[styles.agencyText, agency === a && styles.agencyTextActive]}>{a}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <TextInput style={styles.input} value={agency} onChangeText={setAgency} placeholder="Other agency..." placeholderTextColor={Colors.textTertiary} />
            <FieldLabel label="Cert Number" />
            <TextInput style={styles.input} value={certNumber} onChangeText={setCertNumber} placeholder="e.g. 1234567" placeholderTextColor={Colors.textTertiary} />
            <FieldLabel label="Issued Date (YYYY-MM-DD)" />
            <TextInput style={styles.input} value={issuedDate} onChangeText={setIssuedDate} placeholder="2022-06-15" placeholderTextColor={Colors.textTertiary} keyboardType="numbers-and-punctuation" />
            <FieldLabel label="Expiry Date (optional)" />
            <TextInput style={styles.input} value={expiryDate} onChangeText={setExpiryDate} placeholder="2025-06-15" placeholderTextColor={Colors.textTertiary} keyboardType="numbers-and-punctuation" />
            <Pressable style={[styles.saveBtn, !certName.trim() && styles.saveBtnDisabled]} onPress={handleCreate}>
              <Text style={styles.saveBtnText}>Save Certification</Text>
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
  addBtn: { width: 60, alignItems: 'flex-end' as const },
  content: { padding: Spacing.lg, gap: Spacing.md },
  empty: { alignItems: 'center' as const, paddingTop: 80, gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...Typography.title3, color: Colors.text },
  emptyBody: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' as const },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, flexDirection: 'row' as const, alignItems: 'center' as const, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  certBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accentBlue + '20',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  certBadgeText: { ...Typography.headline, color: Colors.accentBlue, fontWeight: '700' as const },
  certInfo: { flex: 1 },
  certName: { ...Typography.subhead, fontWeight: '700' as const, color: Colors.text },
  certAgency: { ...Typography.footnote, color: Colors.accentBlue, marginTop: 1 },
  certMeta: { flexDirection: 'row' as const, gap: Spacing.md, marginTop: 4 },
  certMeta1: { ...Typography.caption1, color: Colors.textSecondary },
  hint: { ...Typography.caption2, color: Colors.textTertiary, textAlign: 'center' as const, marginTop: Spacing.sm },
  // Modal
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
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
  agencyChip: { borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  agencyChipActive: { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  agencyText: { ...Typography.caption1, color: Colors.textSecondary },
  agencyTextActive: { color: '#FFF', fontWeight: '700' as const },
  saveBtn: { backgroundColor: Colors.accentBlue, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' as const, marginTop: Spacing.lg },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { ...Typography.subhead, color: '#FFF', fontWeight: '700' as const },
});
