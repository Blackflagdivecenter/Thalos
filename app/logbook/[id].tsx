import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/src/ui/components/ScreenHeader';
import { Card } from '@/src/ui/components/Card';
import { Button } from '@/src/ui/components/Button';
import { SignaturePad } from '@/src/ui/components/SignaturePad';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useDiveStore } from '@/src/stores/diveStore';
import { useUIStore } from '@/src/stores/uiStore';
import { DiveRepository } from '@/src/repositories/DiveRepository';
import { BuddyRepository } from '@/src/repositories/BuddyRepository';
import { MarineLifeRepository } from '@/src/repositories/MarineLifeRepository';
import { SignatureRepository } from '@/src/repositories/SignatureRepository';
import type { BuddyProfile, DiveCylinder, DiveVersion, MarineLifeSighting, Signature } from '@/src/models';
import { generateId, nowISO } from '@/src/utils/uuid';

const M_TO_FT    = 3.28084;
const BAR_TO_PSI = 14.5038;
const L_TO_CUFT  = 0.0353147;

function fmtDepth(m: number | null, imp: boolean): string {
  if (m == null) return '—';
  return imp ? `${(m * M_TO_FT).toFixed(0)} ft` : `${m.toFixed(1)} m`;
}
function fmtPressure(b: number | null, imp: boolean): string {
  if (b == null) return '—';
  return imp ? `${Math.round(b * BAR_TO_PSI)} psi` : `${Math.round(b)} bar`;
}
function fmtTemp(c: number | null, imp: boolean): string {
  if (c == null) return '—';
  return imp ? `${(c * 9 / 5 + 32).toFixed(1)} °F` : `${c.toFixed(1)} °C`;
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}
function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const diveRepo = new DiveRepository();
const marineLifeRepo = new MarineLifeRepository();
const sigRepo = new SignatureRepository();

export default function DiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dives, loadDives, deleteDive } = useDiveStore();
  const { unitSystem } = useUIStore();
  const imp = unitSystem === 'imperial';

  const [versions, setVersions] = useState<DiveVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [diveBuddies, setDiveBuddies] = useState<BuddyProfile[]>([]);
  const [showBuddyPicker, setShowBuddyPicker] = useState(false);
  const [marineLife, setMarineLife] = useState<MarineLifeSighting[]>([]);
  const [showAddSighting, setShowAddSighting] = useState(false);
  const [newSpecies, setNewSpecies] = useState('');
  const [newCount, setNewCount] = useState('');
  const [showBuddySig, setShowBuddySig] = useState(false);
  const [buddySigName, setBuddySigName] = useState('');
  const [buddySigData, setBuddySigData] = useState('');
  const [buddySignatures, setBuddySignatures] = useState<Signature[]>([]);

  function loadBuddies() {
    setDiveBuddies(BuddyRepository.getBuddiesForDive(id));
  }

  function loadMarineLife() {
    setMarineLife(marineLifeRepo.getForDive(id));
  }

  function loadBuddySigs() {
    setBuddySignatures(sigRepo.getByDiveId(id).filter(s => s.signerType === 'BUDDY'));
  }

  useFocusEffect(
    React.useCallback(() => {
      loadDives();
      setVersions(diveRepo.getVersionHistory(id));
      loadBuddies();
      loadMarineLife();
      loadBuddySigs();
    }, [id])
  );

  const dive = dives.find((d) => d.id === id);

  function handleDelete() {
    Alert.alert(
      'Delete Dive',
      'This dive will be soft-deleted and removed from your logbook. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDive(id);
            router.back();
          },
        },
      ]
    );
  }

  if (!dive) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Dive Detail" back={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>Dive not found.</Text>
        </View>
      </View>
    );
  }

  const isTraining = dive.diveType === 'TRAINING';
  const canEdit = !(isTraining && dive.isSignedByInstructor);

  return (
    <View style={styles.container}>
      <BuddyPickerModal
        visible={showBuddyPicker}
        diveId={id}
        currentBuddyIds={diveBuddies.map(b => b.id)}
        onClose={() => { setShowBuddyPicker(false); loadBuddies(); }}
        insetBottom={insets.bottom}
      />
      <ScreenHeader
        title={`Dive #${dive.diveNumber}`}
        subtitle={fmtDate(dive.date)}
        back={() => router.back()}
        right={
          canEdit ? (
            <Pressable
              onPress={() => router.push(`/logbook/new?editId=${dive.id}`)}
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Card variant="result" style={styles.heroCard}>
          <View style={styles.heroRow}>
            <HeroStat label="Max Depth" value={fmtDepth(dive.maxDepthMeters, imp)} />
            <HeroStat label="Bottom Time" value={dive.bottomTimeMinutes != null ? `${dive.bottomTimeMinutes} min` : '—'} />
            <HeroStat label="Gas" value={dive.gasType ?? '—'} />
          </View>
          <View style={subStyles.badgeRow}>
            <Badge label={isTraining ? 'Training' : 'Recreational'} color={Colors.accentBlue} />
            {dive.isSignedByInstructor && <Badge label="Instructor Signed" color={Colors.success} />}
          </View>
        </Card>

        {/* Activity tags */}
        {(() => {
          let tags: string[] = [];
          if (dive.activityTagsJson) { try { tags = JSON.parse(dive.activityTagsJson); } catch { /* */ } }
          if (tags.length === 0) return null;
          return (
            <View style={styles.tagRow}>
              {tags.map(t => (
                <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
              ))}
            </View>
          );
        })()}

        {/* Site & Conditions */}
        <SectionLabel label="Site & Conditions" />
        <Card style={styles.card}>
          <DetailRow label="Site" value={dive.siteName} />
          <DetailRow label="Water Temp" value={fmtTemp(dive.waterTemperatureCelsius, imp)} />
          <DetailRow label="Surface Interval" value={dive.surfaceIntervalMinutes != null ? `${dive.surfaceIntervalMinutes} min` : null} />
          {dive.visibilityRating != null && (
            <View style={subStyles.detailRow}>
              <Text style={subStyles.detailLabel}>Visibility</Text>
              <Text style={styles.stars}>{'★'.repeat(dive.visibilityRating)}{'☆'.repeat(5 - dive.visibilityRating)}</Text>
            </View>
          )}
          {dive.currentRating != null && (
            <View style={subStyles.detailRow}>
              <Text style={subStyles.detailLabel}>Current</Text>
              <Text style={styles.stars}>{'★'.repeat(dive.currentRating)}{'☆'.repeat(5 - dive.currentRating)}</Text>
            </View>
          )}
          {dive.waveRating != null && (
            <View style={subStyles.detailRow}>
              <Text style={subStyles.detailLabel}>Waves</Text>
              <Text style={styles.stars}>{'★'.repeat(dive.waveRating)}{'☆'.repeat(5 - dive.waveRating)}</Text>
            </View>
          )}
          <DetailRow label="Visibility Notes" value={dive.visibility} />
          <DetailRow label="Conditions" value={dive.conditions} />
        </Card>

        {/* Gas & Cylinder */}
        {(() => {
          const dm = dive.maxDepthMeters;
          const tm = dive.bottomTimeMinutes;

          // Parse multi-cylinder JSON; fall back to legacy single-cylinder fields
          let cylinders: DiveCylinder[] = [];
          if (dive.cylindersJson) {
            try { cylinders = JSON.parse(dive.cylindersJson); } catch { /* ignore */ }
          }
          if (cylinders.length === 0 && (dive.tankSizeLiters != null || dive.startPressureBar != null)) {
            cylinders = [{
              name: dive.tankSizeLiters != null ? `${dive.tankSizeLiters} L` : 'Cylinder',
              internalVolL: dive.tankSizeLiters ?? 0,
              startBar: dive.startPressureBar,
              endBar: dive.endPressureBar,
            }];
          }

          return (
            <>
              <SectionLabel label="Gas & Cylinder" />
              <Card style={styles.card}>
                <DetailRow label="Gas Mix" value={dive.gasType} />
                {cylinders.map((cyl, idx) => {
                  const sp = cyl.startBar;
                  const ep = cyl.endBar;
                  const sac = (sp != null && ep != null && sp > ep && dm != null && dm > 0 && tm != null && tm > 0)
                    ? (sp - ep) / tm / (dm / 10 + 1) : null;
                  const rmv = sac != null && cyl.internalVolL > 0 ? sac * cyl.internalVolL : null;
                  const cylDisplay = cyl.internalVolL > 0
                    ? `${cyl.name}  (${cyl.internalVolL.toFixed(1)} L)`
                    : cyl.name;
                  return (
                    <React.Fragment key={idx}>
                      {cylinders.length > 1 && (
                        <Text style={styles.cylSubheading}>Cylinder {idx + 1}</Text>
                      )}
                      <DetailRow label="Cylinder" value={cylDisplay} />
                      <DetailRow label="Start"    value={fmtPressure(sp, imp)} />
                      <DetailRow label="End"      value={fmtPressure(ep, imp)} />
                      {sp != null && ep != null && (
                        <DetailRow label="Used"   value={fmtPressure(sp - ep, imp)} />
                      )}
                      {sac != null && (
                        <>
                          <DetailRow label="SAC Rate" value={imp ? `${(sac * BAR_TO_PSI).toFixed(1)} psi/min` : `${sac.toFixed(2)} bar/min`} />
                          {rmv != null && (
                            <DetailRow label="RMV" value={imp ? `${(rmv * L_TO_CUFT).toFixed(2)} cuft/min` : `${rmv.toFixed(1)} L/min`} />
                          )}
                        </>
                      )}
                    </React.Fragment>
                  );
                })}
              </Card>
            </>
          );
        })()}

        {/* Equipment */}
        {dive.equipment && (
          <>
            <SectionLabel label="Equipment" />
            <Card style={styles.card}>
              <Text style={styles.bodyText}>{dive.equipment}</Text>
            </Card>
          </>
        )}

        {/* Training */}
        {isTraining && (dive.courseName || dive.skillsCompleted) && (
          <>
            <SectionLabel label="Training" />
            <Card style={styles.card}>
              <DetailRow label="Course" value={dive.courseName} />
              {dive.skillsCompleted && (
                <DetailRow label="Skills" value={dive.skillsCompleted} />
              )}
            </Card>
          </>
        )}

        {/* Notes */}
        {dive.notes && (
          <>
            <SectionLabel label="Notes" />
            <Card style={styles.card}>
              <Text style={styles.bodyText}>{dive.notes}</Text>
            </Card>
          </>
        )}

        {/* Version history */}
        {versions.length > 1 && (
          <>
            <SectionLabel label={`Version History (${versions.length} edits)`} />
            <Pressable
              onPress={() => setShowHistory((v) => !v)}
              style={styles.historyToggle}
            >
              <Text style={styles.historyToggleText}>
                {showHistory ? 'Hide history' : 'Show history'}
              </Text>
            </Pressable>
            {showHistory &&
              versions.map((v, i) => (
                <Card key={v.id} style={styles.versionCard}>
                  <View style={styles.versionHeader}>
                    <Text style={styles.versionNum}>Version {v.versionNumber}</Text>
                    <Text style={styles.versionDate}>{fmtShortDate(v.createdAt)}</Text>
                  </View>
                  {v.changeDescription && (
                    <Text style={styles.versionDesc}>{v.changeDescription}</Text>
                  )}
                  <Text style={styles.versionDetail}>
                    {fmtDepth(v.maxDepthMeters, imp)} · {v.bottomTimeMinutes ?? '—'} min · {v.siteName ?? 'No site'}
                  </Text>
                </Card>
              ))}
          </>
        )}

        {/* Dive Buddies */}
        <View style={styles.buddySection}>
          <View style={styles.buddyHeader}>
            <Text style={styles.buddyTitle}>Dive Buddies</Text>
            <Pressable style={styles.buddyAddBtn} onPress={() => setShowBuddyPicker(true)}>
              <Ionicons name="person-add" size={16} color={Colors.accentBlue} />
              <Text style={styles.buddyAddText}>Add</Text>
            </Pressable>
          </View>
          {diveBuddies.length === 0 ? (
            <Text style={styles.buddyEmpty}>No buddies tagged on this dive</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buddyScroll}>
              {diveBuddies.map(b => {
                const initials = b.name.split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
                return (
                  <Pressable
                    key={b.id}
                    style={styles.buddyChip}
                    onLongPress={() => {
                      Alert.alert('Remove Buddy', `Remove ${b.name} from this dive?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => {
                            BuddyRepository.removeBuddyFromDive(id, b.id);
                            loadBuddies();
                          }
                        },
                      ]);
                    }}
                  >
                    <View style={styles.buddyAvatar}>
                      <Text style={styles.buddyInitials}>{initials}</Text>
                    </View>
                    <Text style={styles.buddyName}>{b.name.split(' ')[0]}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Marine Life */}
        <View style={styles.buddySection}>
          <View style={styles.buddyHeader}>
            <Text style={styles.buddyTitle}>Marine Life</Text>
            <Pressable style={styles.buddyAddBtn} onPress={() => { setNewSpecies(''); setNewCount(''); setShowAddSighting(true); }}>
              <Ionicons name="add" size={16} color={Colors.accentBlue} />
              <Text style={styles.buddyAddText}>Log</Text>
            </Pressable>
          </View>
          {marineLife.length === 0 ? (
            <Text style={styles.buddyEmpty}>No sightings logged for this dive</Text>
          ) : (
            marineLife.map(s => (
              <Pressable key={s.id} style={styles.sightingRow}
                onLongPress={() => {
                  Alert.alert('Remove Sighting', `Remove "${s.species}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => { marineLifeRepo.delete(s.id); loadMarineLife(); } },
                  ]);
                }}
              >
                <Text style={styles.sightingSpecies}>{s.species}</Text>
                {s.count != null && <Text style={styles.sightingCount}>×{s.count}</Text>}
              </Pressable>
            ))
          )}
        </View>

        {/* Buddy Signature */}
        <View style={styles.buddySection}>
          <View style={styles.buddyHeader}>
            <Text style={styles.buddyTitle}>Buddy Signature</Text>
            <Pressable style={styles.buddyAddBtn} onPress={() => { setBuddySigName(''); setBuddySigData(''); setShowBuddySig(true); }}>
              <Ionicons name="pencil" size={14} color={Colors.accentBlue} />
              <Text style={styles.buddyAddText}>Sign</Text>
            </Pressable>
          </View>
          {buddySignatures.length === 0 ? (
            <Text style={styles.buddyEmpty}>No buddy signature yet</Text>
          ) : (
            buddySignatures.map(s => (
              <View key={s.id} style={styles.sightingRow}>
                <Text style={styles.sightingSpecies}>{s.signerName ?? 'Buddy'}</Text>
                <Text style={styles.sightingCount}>{fmtShortDate(s.createdAt)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Marine Life Modal */}
        <Modal visible={showAddSighting} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddSighting(false)}>
          <View style={[styles.mlModal, { paddingTop: insets.top + Spacing.sm }]}>
            <View style={styles.mlModalHeader}>
              <Text style={styles.mlModalTitle}>Log Sighting</Text>
              <Pressable onPress={() => setShowAddSighting(false)} style={styles.mlModalClose}><Text style={styles.mlModalCloseText}>✕</Text></Pressable>
            </View>
            <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
              <Text style={styles.mlLabel}>Species / Common Name</Text>
              <TextInput
                style={styles.mlInput}
                value={newSpecies}
                onChangeText={setNewSpecies}
                placeholder="e.g. Sea Turtle, Nurse Shark"
                placeholderTextColor={Colors.textTertiary}
                autoFocus
              />
              <Text style={styles.mlLabel}>Count (optional)</Text>
              <TextInput
                style={styles.mlInput}
                value={newCount}
                onChangeText={setNewCount}
                placeholder="1"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="number-pad"
              />
              <Pressable
                style={[styles.mlSaveBtn, !newSpecies.trim() && styles.mlSaveBtnDisabled]}
                onPress={() => {
                  if (!newSpecies.trim()) return;
                  marineLifeRepo.create({ diveId: id, species: newSpecies.trim(), count: parseInt(newCount) || null });
                  loadMarineLife();
                  setShowAddSighting(false);
                }}
              >
                <Text style={styles.mlSaveBtnText}>Add Sighting</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Buddy Signature Modal */}
        <Modal visible={showBuddySig} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowBuddySig(false)}>
          <View style={[styles.mlModal, { paddingTop: insets.top + Spacing.sm }]}>
            <View style={styles.mlModalHeader}>
              <Text style={styles.mlModalTitle}>Buddy Signature</Text>
              <Pressable onPress={() => setShowBuddySig(false)} style={styles.mlModalClose}><Text style={styles.mlModalCloseText}>✕</Text></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}>
              <Text style={styles.mlLabel}>Buddy Name</Text>
              <TextInput
                style={styles.mlInput}
                value={buddySigName}
                onChangeText={setBuddySigName}
                placeholder="e.g. Jane Smith"
                placeholderTextColor={Colors.textTertiary}
              />
              <Text style={styles.mlLabel}>Signature</Text>
              <SignaturePad
                onSign={(data) => setBuddySigData(data)}
                height={180}
              />
              <Pressable
                style={[styles.mlSaveBtn, (!buddySigData || !buddySigName.trim()) && styles.mlSaveBtnDisabled]}
                onPress={() => {
                  if (!buddySigData || !buddySigName.trim()) return;
                  sigRepo.insert({ id: generateId(), diveId: id, signerType: 'BUDDY', signerName: buddySigName.trim(), signatureData: buddySigData, createdAt: nowISO() });
                  loadBuddySigs();
                  setShowBuddySig(false);
                }}
              >
                <Text style={styles.mlSaveBtnText}>Save Signature</Text>
              </Pressable>
            </ScrollView>
          </View>
        </Modal>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push(`/logbook/media?diveId=${dive.id}`)}
          >
            <Ionicons name="camera" size={22} color={Colors.text} />
            <Text style={styles.actionBtnLabel}>Photos</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push(`/logbook/share?diveId=${dive.id}`)}
          >
            <Ionicons name="share-social" size={22} color={Colors.accentBlue} />
            <Text style={[styles.actionBtnLabel, { color: Colors.accentBlue }]}>Share</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push(`/collab/session?diveId=${dive.id}`)}
          >
            <Ionicons name="people" size={22} color={Colors.text} />
            <Text style={styles.actionBtnLabel}>Collab</Text>
          </Pressable>
        </View>

        {/* Delete */}
        <View style={styles.deleteSection}>
          <Button
            label="Delete Dive"
            onPress={handleDelete}
            variant="danger"
            style={styles.deleteBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

// ── Buddy Picker Modal ─────────────────────────────────────────────────────────

function BuddyPickerModal({
  visible, diveId, currentBuddyIds, onClose, insetBottom,
}: {
  visible: boolean;
  diveId: string;
  currentBuddyIds: string[];
  onClose: () => void;
  insetBottom: number;
}) {
  const [allBuddies, setAllBuddies] = useState<BuddyProfile[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      setAllBuddies(BuddyRepository.listAll());
      setSearch('');
    }
  }, [visible]);

  const filtered = allBuddies.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(buddy: BuddyProfile) {
    if (currentBuddyIds.includes(buddy.id)) {
      BuddyRepository.removeBuddyFromDive(diveId, buddy.id);
    } else {
      BuddyRepository.addBuddyToDive(diveId, buddy.id);
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[pickerStyles.sheet, { paddingBottom: insetBottom + Spacing.md }]}>
        <View style={pickerStyles.handle} />
        <Text style={pickerStyles.title}>Add Dive Buddy</Text>
        <View style={pickerStyles.searchRow}>
          <Ionicons name="search" size={16} color={Colors.textTertiary} />
          <TextInput
            style={pickerStyles.searchInput}
            placeholder="Search buddies…"
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView style={pickerStyles.list} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <Text style={pickerStyles.empty}>No buddies found. Add them in Dive Buddies.</Text>
          ) : (
            filtered.map(b => {
              const selected = currentBuddyIds.includes(b.id);
              const initials = b.name.split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0,2).join('');
              return (
                <Pressable key={b.id} style={pickerStyles.row} onPress={() => toggle(b)}>
                  <View style={[pickerStyles.avatar, selected && pickerStyles.avatarSelected]}>
                    <Text style={pickerStyles.avatarText}>{initials}</Text>
                  </View>
                  <View style={pickerStyles.rowInfo}>
                    <Text style={pickerStyles.rowName}>{b.name}</Text>
                    {b.certLevel ? <Text style={pickerStyles.rowSub}>{b.certLevel}</Text> : null}
                  </View>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.accentBlue} />
                  )}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '70%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: { ...Typography.title3, color: Colors.text, marginBottom: Spacing.md },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, ...Typography.body, color: Colors.text },
  list: { flexGrow: 0 },
  empty: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: { backgroundColor: Colors.accentBlue + '20' },
  avatarText: { ...Typography.subhead, fontWeight: '700', color: Colors.accentBlue },
  rowInfo: { flex: 1 },
  rowName: { ...Typography.subhead, color: Colors.text },
  rowSub: { ...Typography.footnote, color: Colors.textSecondary },
});

function SectionLabel({ label }: { label: string }) {
  return <Text style={subStyles.sectionLabel}>{label}</Text>;
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={subStyles.heroStat}>
      <Text style={subStyles.heroValue}>{value}</Text>
      <Text style={subStyles.heroLabel}>{label}</Text>
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[subStyles.badge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
      <Text style={[subStyles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === '—') return null;
  return (
    <View style={subStyles.detailRow}>
      <Text style={subStyles.detailLabel}>{label}</Text>
      <Text style={subStyles.detailValue}>{value}</Text>
    </View>
  );
}

const subStyles = StyleSheet.create({
  sectionLabel: {
    ...Typography.footnote,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginHorizontal: 2,
  },
  heroStat: { alignItems: 'center', flex: 1 },
  heroValue: { ...Typography.title3, color: Colors.accentBlue },
  heroLabel: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' },
  badge: {
    borderRadius: Radius.full,
    paddingVertical: 3,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
  },
  badgeText: { ...Typography.caption1, fontWeight: '600' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: { ...Typography.subhead, color: Colors.textSecondary, flex: 1 },
  detailValue: { ...Typography.subhead, color: Colors.text, flex: 2, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
  editBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  editBtnText: { ...Typography.subhead, fontWeight: '600' as TextStyle['fontWeight'], color: Colors.accentBlue },
  heroCard: { marginBottom: 0 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { marginBottom: 0 },
  bodyText: { ...Typography.body, color: Colors.text, lineHeight: 24 },
  cylSubheading: { ...Typography.caption1, fontWeight: '600' as const, color: Colors.accentBlue, marginTop: Spacing.sm, marginBottom: 2 },
  historyToggle: { marginBottom: Spacing.sm },
  historyToggleText: { ...Typography.subhead, color: Colors.accentBlue, fontWeight: '600' },
  versionCard: { marginBottom: 0, borderLeftWidth: 3, borderLeftColor: Colors.accentTeal },
  versionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  versionNum: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  versionDate: { ...Typography.footnote, color: Colors.textSecondary },
  versionDesc: { ...Typography.footnote, color: Colors.textSecondary, marginBottom: Spacing.xs, fontStyle: 'italic' },
  versionDetail: { ...Typography.footnote, color: Colors.text },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnLabel: { ...Typography.footnote, color: Colors.text, fontWeight: '600' },
  deleteSection: { marginTop: Spacing.xl },
  deleteBtn: { width: '100%' },
  // Buddy section
  buddySection: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buddyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  buddyTitle: { ...Typography.subhead, fontWeight: '700', color: Colors.text },
  buddyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.accentBlue + '15',
    borderRadius: Radius.full,
  },
  buddyAddText: { ...Typography.caption1, color: Colors.accentBlue, fontWeight: '600' },
  buddyEmpty: { ...Typography.footnote, color: Colors.textTertiary, fontStyle: 'italic' },
  buddyScroll: { marginTop: 4 },
  buddyChip: { alignItems: 'center', marginRight: Spacing.md, gap: 4 },
  buddyAvatar: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentBlue + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buddyInitials: { ...Typography.subhead, fontWeight: '700', color: Colors.accentBlue },
  buddyName: { ...Typography.caption2, color: Colors.textSecondary },
  // Activity tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  tag: { backgroundColor: Colors.accentBlue + '18', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  tagText: { ...Typography.caption1, color: Colors.accentBlue, fontWeight: '600' as const },
  // Star ratings
  stars: { fontSize: 16, color: '#FFB700', letterSpacing: 2 },
  // Marine life sightings
  sightingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  sightingSpecies: { ...Typography.subhead, color: Colors.text },
  sightingCount: { ...Typography.footnote, color: Colors.textSecondary },
  // Marine life / buddy sig modals
  mlModal: { flex: 1, backgroundColor: Colors.background },
  mlModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  mlModalTitle: { ...Typography.headline, color: Colors.text },
  mlModalClose: { padding: Spacing.sm },
  mlModalCloseText: { ...Typography.body, color: Colors.textSecondary, fontSize: 18 },
  mlLabel: { ...Typography.footnote, fontWeight: '600' as const, color: Colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  mlInput: {
    ...Typography.body, color: Colors.text,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  mlSaveBtn: { backgroundColor: Colors.accentBlue, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' as const, marginTop: Spacing.sm },
  mlSaveBtnDisabled: { opacity: 0.4 },
  mlSaveBtnText: { ...Typography.subhead, color: '#FFF', fontWeight: '700' as const },
});
