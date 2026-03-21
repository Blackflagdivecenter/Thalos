/**
 * Cert Lookup — agency quick-links + verification log.
 * Since no agency offers a public API, this opens each agency's
 * official verification page and lets you record the result.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, FlatList, Keyboard, Linking, Modal,
  Pressable, ScrollView, StyleSheet, Switch, Text,
  TextInput, TextStyle, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { CertVerificationRepository } from '@/src/repositories/CertVerificationRepository';
import type { CertVerification } from '@/src/models';
import { todayISO } from '@/src/utils/uuid';

// ── Agency definitions ────────────────────────────────────────────────────────

interface Agency {
  key: string;
  label: string;
  color: string;
  url: string;
  note: string;
}

const AGENCIES: Agency[] = [
  { key: 'PADI',   label: 'PADI',   color: '#0033A0', url: 'https://certifications.padi.com/',                  note: 'Search by first name, last name, or cert number.' },
  { key: 'SSI',    label: 'SSI',    color: '#00AEEF', url: 'https://www.divessi.com/en/certi-check',             note: 'Enter diver name or email address.' },
  { key: 'NAUI',   label: 'NAUI',   color: '#CC0000', url: 'https://naui.org/membership/certification-verify/', note: 'Verification available for NAUI members.' },
  { key: 'SDI',    label: 'SDI',    color: '#003087', url: 'https://www.tdisdi.com/sdi/',                       note: 'Contact your SDI regional office.' },
  { key: 'TDI',    label: 'TDI',    color: '#1A237E', url: 'https://www.tdisdi.com/tdi/',                       note: 'Contact your TDI regional office.' },
  { key: 'GUE',    label: 'GUE',    color: '#B71C1C', url: 'https://www.gue.com/',                              note: 'Contact GUE HQ for cert verification.' },
  { key: 'IANTD',  label: 'IANTD',  color: '#2E7D32', url: 'https://iantd.com/',                               note: 'Contact an IANTD instructor or HQ.' },
  { key: 'BSAC',   label: 'BSAC',   color: '#003082', url: 'https://www.bsac.com/membership/',                  note: 'BSAC member portal for cert records.' },
  { key: 'CMAS',   label: 'CMAS',   color: '#0A5E9B', url: 'https://www.cmas.org/',                             note: 'Contact your national CMAS affiliate.' },
  { key: 'RAID',   label: 'RAID',   color: '#FF6F00', url: 'https://www.diveraid.com/',                         note: 'Log in to RAID portal for verification.' },
];

const CERT_LEVELS = [
  'Open Water', 'Advanced Open Water', 'Rescue Diver', 'Divemaster',
  'Assistant Instructor', 'Instructor', 'Master Instructor',
  'Cave Diver', 'Technical Diver', 'CCR Diver', 'Other',
];

const repo = new CertVerificationRepository();

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CertLookupScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [verifications, setVerifications] = useState<CertVerification[]>([]);
  const [query, setQuery]                 = useState('');
  const [showLog, setShowLog]             = useState(false);

  // Add-verification form state
  const [showAdd, setShowAdd]           = useState(false);
  const [fDiverName, setFDiverName]     = useState('');
  const [fAgency, setFAgency]           = useState('PADI');
  const [fCertLevel, setFCertLevel]     = useState('Open Water');
  const [fCertNumber, setFCertNumber]   = useState('');
  const [fDate, setFDate]               = useState(todayISO());
  const [fNotes, setFNotes]             = useState('');
  const [fCustomLevel, setFCustomLevel] = useState(false);

  // Agency info sheet
  const [infoAgency, setInfoAgency] = useState<Agency | null>(null);

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function load(q = query) {
    const result = q.trim().length >= 2 ? repo.search(q) : repo.getAll();
    setVerifications(result);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => load(query), 300);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [query]);

  function handleAdd() {
    if (!fDiverName.trim()) {
      Alert.alert('Required', 'Please enter the diver\'s name.');
      return;
    }
    repo.create({
      diverName:  fDiverName.trim(),
      agency:     fAgency,
      certLevel:  fCertLevel.trim() || null,
      certNumber: fCertNumber.trim() || null,
      verifiedAt: fDate,
      notes:      fNotes.trim() || null,
    });
    resetForm();
    setShowAdd(false);
    load('');
    setQuery('');
  }

  function resetForm() {
    setFDiverName(''); setFAgency('PADI'); setFCertLevel('Open Water');
    setFCertNumber(''); setFDate(todayISO()); setFNotes(''); setFCustomLevel(false);
  }

  function handleDelete(v: CertVerification) {
    Alert.alert('Delete Record', `Remove verification for ${v.diverName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { repo.delete(v.id); load(); } },
    ]);
  }

  function handleOpenAgency(a: Agency) {
    setInfoAgency(a);
  }

  async function openAgencyUrl(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open', 'Please visit the agency website manually.');
    }
    setInfoAgency(null);
  }

  const agencyColor = (key: string) => AGENCIES.find(a => a.key === key)?.color ?? Colors.textSecondary;

  return (
    <View style={[s.root, { paddingTop: insets.top, backgroundColor: Colors.background }]}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: Colors.surface, borderBottomColor: Colors.border }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Verify Certification</Text>
        <Pressable style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={20} color={Colors.accentBlue} />
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Agency grid ──────────────────────────────────────────────────── */}
        <View style={[s.section, { overflow: 'hidden' as const }]}>
          <BlurView intensity={80} tint="regular" style={s.sectionBlur}>
            <View style={s.sectionHeader}>
              <Ionicons name="globe-outline" size={16} color={Colors.text} />
              <Text style={s.sectionLabel}>Agency Verification Pages</Text>
            </View>
            <Text style={s.sectionNote}>
              Tap an agency to open their official certification verification page in your browser.
            </Text>
            <View style={s.agencyGrid}>
              {AGENCIES.map(a => (
                <Pressable
                  key={a.key}
                  style={({ pressed }) => [s.agencyPill, { borderColor: a.color + '66', backgroundColor: a.color + '18' }, pressed && { opacity: 0.7 }]}
                  onPress={() => handleOpenAgency(a)}
                >
                  <Text style={[s.agencyPillText, { color: a.color }]}>{a.label}</Text>
                  <Ionicons name="open-outline" size={11} color={a.color} />
                </Pressable>
              ))}
            </View>
          </BlurView>
        </View>

        {/* ── Verification log ─────────────────────────────────────────────── */}
        <View style={[s.section, { overflow: 'hidden' as const }]}>
          <BlurView intensity={80} tint="regular" style={s.sectionBlur}>
            <Pressable
              style={s.logToggleRow}
              onPress={() => setShowLog(v => !v)}
            >
              <View style={s.sectionHeader}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.text} />
                <Text style={s.sectionLabel}>Verification Log</Text>
                <View style={s.countBubble}>
                  <Text style={s.countText}>{verifications.length}</Text>
                </View>
              </View>
              <Ionicons
                name={showLog ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.textSecondary}
              />
            </Pressable>

            {showLog && (
              <>
                {/* Search */}
                <View style={s.searchBar}>
                  <Ionicons name="search-outline" size={15} color={Colors.textSecondary} />
                  <TextInput
                    style={s.searchInput}
                    placeholder="Search by name, agency, cert level…"
                    placeholderTextColor={Colors.textTertiary}
                    value={query}
                    onChangeText={setQuery}
                    returnKeyType="search"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  {query.length > 0 && (
                    <Pressable onPress={() => setQuery('')}>
                      <Ionicons name="close-circle" size={15} color={Colors.textSecondary} />
                    </Pressable>
                  )}
                </View>

                {verifications.length === 0 ? (
                  <Text style={s.emptyText}>
                    {query.trim() ? 'No matches.' : 'No verifications logged yet.\nTap + to record one.'}
                  </Text>
                ) : (
                  verifications.map((v, i) => (
                    <React.Fragment key={v.id}>
                      {i > 0 && <View style={[s.divider, { backgroundColor: Colors.border }]} />}
                      <View style={s.logRow}>
                        {/* Agency dot */}
                        <View style={[s.agencyDot, { backgroundColor: agencyColor(v.agency) }]} />
                        <View style={s.logBody}>
                          <Text style={s.logName}>{v.diverName}</Text>
                          <View style={s.logMeta}>
                            <View style={[s.agencyTag, { backgroundColor: agencyColor(v.agency) + '22', borderColor: agencyColor(v.agency) + '55' }]}>
                              <Text style={[s.agencyTagText, { color: agencyColor(v.agency) }]}>{v.agency}</Text>
                            </View>
                            {v.certLevel && <Text style={s.logCert}>{v.certLevel}</Text>}
                          </View>
                          {v.certNumber && (
                            <Text style={s.logCertNum}>#{v.certNumber}</Text>
                          )}
                          <Text style={s.logDate}>Verified {fmtDate(v.verifiedAt)}</Text>
                          {v.notes && <Text style={s.logNotes}>{v.notes}</Text>}
                        </View>
                        <Pressable onPress={() => handleDelete(v)} hitSlop={8}>
                          <Ionicons name="trash-outline" size={16} color={Colors.textTertiary} />
                        </Pressable>
                      </View>
                    </React.Fragment>
                  ))
                )}
              </>
            )}
          </BlurView>
        </View>

        {/* Footer note */}
        <Text style={s.footerNote}>
          Thalos has no affiliation with any certification agency. Always verify certifications on each agency's official website.
        </Text>
      </ScrollView>

      {/* ── Agency info sheet ────────────────────────────────────────────────── */}
      {infoAgency && (
        <View style={s.overlay}>
          <Pressable style={s.overlayBg} onPress={() => setInfoAgency(null)} />
          <View style={s.sheet}>
            <View style={[s.sheetAgencyRow, { borderBottomColor: Colors.border }]}>
              <View style={[s.sheetAgencyBadge, { backgroundColor: infoAgency.color + '22', borderColor: infoAgency.color + '55' }]}>
                <Text style={[s.sheetAgencyLabel, { color: infoAgency.color }]}>{infoAgency.label}</Text>
              </View>
              <Pressable onPress={() => setInfoAgency(null)} hitSlop={8}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={s.sheetNote}>{infoAgency.note}</Text>
            <Text style={s.sheetUrl}>{infoAgency.url}</Text>
            <Pressable
              style={[s.openBtn, { backgroundColor: infoAgency.color }]}
              onPress={() => openAgencyUrl(infoAgency.url)}
            >
              <Ionicons name="open-outline" size={18} color="#fff" />
              <Text style={s.openBtnText}>Open Verification Page</Text>
            </Pressable>
            <Pressable
              style={s.logAfterBtn}
              onPress={() => { setInfoAgency(null); setShowAdd(true); setFAgency(infoAgency.key); setShowLog(true); }}
            >
              <Text style={s.logAfterBtnText}>Log verification after checking →</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Add verification modal ───────────────────────────────────────────── */}
      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setShowAdd(false); resetForm(); }}
      >
        <View style={[m.root, { backgroundColor: Colors.background }]}>
          {/* Modal header */}
          <View style={[m.header, { backgroundColor: Colors.surface, borderBottomColor: Colors.border }]}>
            <Pressable onPress={() => { setShowAdd(false); resetForm(); }}>
              <Text style={m.cancel}>Cancel</Text>
            </Pressable>
            <Text style={m.title}>Log Verification</Text>
            <Pressable onPress={handleAdd}>
              <Text style={m.save}>Save</Text>
            </Pressable>
          </View>

          <ScrollView
            style={m.scroll}
            contentContainerStyle={[m.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Diver name */}
            <Text style={m.fieldLabel}>Diver Name *</Text>
            <TextInput
              style={m.field}
              placeholder="First and last name"
              placeholderTextColor={Colors.textTertiary}
              value={fDiverName}
              onChangeText={setFDiverName}
              autoCapitalize="words"
            />

            {/* Agency */}
            <Text style={m.fieldLabel}>Agency *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={m.pillScroll}>
              <View style={m.pillRow}>
                {AGENCIES.map(a => {
                  const sel = fAgency === a.key;
                  return (
                    <Pressable
                      key={a.key}
                      style={[m.pill, { borderColor: sel ? a.color : Colors.border, backgroundColor: sel ? a.color + '22' : 'transparent' }]}
                      onPress={() => setFAgency(a.key)}
                    >
                      <Text style={[m.pillText, { color: sel ? a.color : Colors.textSecondary, fontWeight: sel ? '600' : '500' as TextStyle['fontWeight'] }]}>
                        {a.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Cert level */}
            <View style={m.labelRow}>
              <Text style={m.fieldLabel}>Certification Level</Text>
              <View style={m.customToggle}>
                <Text style={m.customToggleLabel}>Custom</Text>
                <Switch
                  value={fCustomLevel}
                  onValueChange={setFCustomLevel}
                  trackColor={{ false: Colors.systemGray5, true: Colors.accentBlue + '66' }}
                  thumbColor={fCustomLevel ? Colors.accentBlue : Colors.textTertiary}
                />
              </View>
            </View>
            {fCustomLevel ? (
              <TextInput
                style={m.field}
                placeholder="e.g. Cavern Diver, AOWI Specialties…"
                placeholderTextColor={Colors.textTertiary}
                value={fCertLevel}
                onChangeText={setFCertLevel}
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={m.pillScroll}>
                <View style={m.pillRow}>
                  {CERT_LEVELS.filter(l => l !== 'Other').map(l => {
                    const sel = fCertLevel === l;
                    return (
                      <Pressable
                        key={l}
                        style={[m.pill, sel && m.pillActive]}
                        onPress={() => setFCertLevel(l)}
                      >
                        <Text style={[m.pillText, sel && m.pillTextActive]}>{l}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* Cert number */}
            <Text style={m.fieldLabel}>Cert Number (optional)</Text>
            <TextInput
              style={m.field}
              placeholder="e.g. 1234567"
              placeholderTextColor={Colors.textTertiary}
              value={fCertNumber}
              onChangeText={setFCertNumber}
              autoCapitalize="characters"
            />

            {/* Date verified */}
            <Text style={m.fieldLabel}>Date Verified</Text>
            <TextInput
              style={m.field}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textTertiary}
              value={fDate}
              onChangeText={setFDate}
              keyboardType="numbers-and-punctuation"
            />

            {/* Notes */}
            <Text style={m.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[m.field, m.fieldMulti]}
              placeholder="e.g. Verified via PADI website, card seen…"
              placeholderTextColor={Colors.textTertiary}
              value={fNotes}
              onChangeText={setFNotes}
              multiline
              numberOfLines={3}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:        { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn:     { width: 60 },
  backText:    { ...(Typography.body as TextStyle), color: Colors.accentBlue },
  headerTitle: { ...(Typography.headline as TextStyle), color: Colors.text, fontWeight: '600' as TextStyle['fontWeight'], flex: 1, textAlign: 'center' as const },
  addBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.accentBlue + '18',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  scroll:      { flex: 1 },
  content:     { padding: Spacing.lg, gap: Spacing.md },

  // Sections
  section:     { borderRadius: Radius.lg },
  sectionBlur: { padding: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
  sectionLabel:{ ...(Typography.headline as TextStyle), color: Colors.text, fontWeight: '600' as TextStyle['fontWeight'] },
  sectionNote: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, marginBottom: Spacing.md },

  // Agency grid
  agencyGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: Spacing.sm },
  agencyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  agencyPillText: { ...(Typography.caption1 as TextStyle), fontWeight: '600' as TextStyle['fontWeight'] },

  // Log section
  logToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' as const },
  countBubble: {
    backgroundColor: Colors.accentBlue + '22', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, marginLeft: 6,
  },
  countText: { ...(Typography.caption2 as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.background, marginTop: Spacing.md, marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, ...(Typography.body as TextStyle), color: Colors.text },
  emptyText: {
    ...(Typography.body as TextStyle), color: Colors.textSecondary,
    textAlign: 'center' as const, marginTop: Spacing.lg, lineHeight: 24,
  },
  divider: { height: 1, marginVertical: Spacing.sm },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: Spacing.xs },
  agencyDot: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  logBody: { flex: 1 },
  logName: { ...(Typography.subhead as TextStyle), color: Colors.text, fontWeight: '600' as TextStyle['fontWeight'] },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 3, flexWrap: 'wrap' as const },
  agencyTag: {
    borderRadius: Radius.sm, borderWidth: 1,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  agencyTagText: { ...(Typography.caption2 as TextStyle), fontWeight: '600' as TextStyle['fontWeight'] },
  logCert: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
  logCertNum: { ...(Typography.caption1 as TextStyle), color: Colors.textTertiary, marginTop: 2, fontFamily: 'Menlo' },
  logDate: { ...(Typography.caption2 as TextStyle), color: Colors.textTertiary, marginTop: 2 },
  logNotes: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, marginTop: 4, fontStyle: 'italic' as const },

  // Footer
  footerNote: {
    ...(Typography.caption2 as TextStyle), color: Colors.textTertiary,
    textAlign: 'center' as const, lineHeight: 16, marginTop: Spacing.sm,
  },

  // Agency info overlay
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, justifyContent: 'flex-end' as const },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.xl, gap: Spacing.md,
  },
  sheetAgencyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' as const,
    paddingBottom: Spacing.md, borderBottomWidth: 1,
  },
  sheetAgencyBadge: {
    borderRadius: Radius.sm, borderWidth: 1,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  sheetAgencyLabel: { ...(Typography.headline as TextStyle), fontWeight: '700' as TextStyle['fontWeight'] },
  sheetNote: { ...(Typography.body as TextStyle), color: Colors.textSecondary, lineHeight: 22 },
  sheetUrl:  { ...(Typography.caption1 as TextStyle), color: Colors.textTertiary, fontFamily: 'Menlo' },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center' as const,
    gap: 8, paddingVertical: Spacing.md, borderRadius: Radius.md,
  },
  openBtnText: { ...(Typography.body as TextStyle), color: '#fff', fontWeight: '600' as TextStyle['fontWeight'] },
  logAfterBtn: { alignItems: 'center' as const, paddingVertical: Spacing.sm },
  logAfterBtnText: { ...(Typography.subhead as TextStyle), color: Colors.accentBlue },
});

// Modal styles
const m = StyleSheet.create({
  root:    { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' as const,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  cancel: { ...(Typography.body as TextStyle), color: Colors.textSecondary },
  title:  { ...(Typography.headline as TextStyle), color: Colors.text, fontWeight: '600' as TextStyle['fontWeight'] },
  save:   { ...(Typography.body as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  scroll:  { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  fieldLabel: { ...(Typography.footnote as TextStyle), color: Colors.textSecondary, marginBottom: 4, marginTop: Spacing.sm },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' as const },
  customToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  customToggleLabel: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
  field: {
    height: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, ...(Typography.body as TextStyle), color: Colors.text,
    backgroundColor: Colors.surface,
  },
  fieldMulti: { height: 80, paddingTop: Spacing.sm, textAlignVertical: 'top' as const },
  pillScroll:  { marginBottom: Spacing.sm },
  pillRow:     { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  pill: {
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: 'transparent',
  },
  pillActive:     { borderColor: Colors.accentBlue, backgroundColor: Colors.accentBlue + '26' },
  pillText:       { ...(Typography.caption1 as TextStyle), fontWeight: '500' as TextStyle['fontWeight'], color: Colors.textSecondary },
  pillTextActive: { color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
});
