import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/src/ui/components/ScreenHeader';
import { Card } from '@/src/ui/components/Card';
import { Button } from '@/src/ui/components/Button';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useSiteStore } from '@/src/stores/siteStore';
import { useUIStore } from '@/src/stores/uiStore';
import { EAP } from '@/src/models';
import { AuditService } from '@/src/services/AuditService';
import { generateEAPFromCoords } from '@/src/utils/eapAutoGen';

const audit = new AuditService();

function fmtDepth(m: number | null, imp: boolean): string {
  if (m == null) return '—';
  return imp ? `${(m * 3.28084).toFixed(0)} ft` : `${m.toFixed(1)} m`;
}

export default function SiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { sites, loadSites, deleteSite, getEAP, updateEAP } = useSiteStore();
  const { unitSystem } = useUIStore();
  const imp = unitSystem === 'imperial';

  const [eap, setEAP] = useState<EAP | null>(null);
  const [eapGenerating, setEapGenerating] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadSites();
      setEAP(getEAP(id));
    }, [id])
  );

  const site = sites.find((s) => s.id === id);

  function handleDelete() {
    Alert.alert(
      'Delete Site',
      `Delete "${site?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSite(id);
            router.back();
          },
        },
      ]
    );
  }

  function handleActivateEmergency() {
    audit.log('EMERGENCY_MODE_ACTIVATED', id, 'site');
    router.push(`/emergency?siteId=${id}`);
  }

  function handleDial(number: string) {
    Linking.openURL(`tel:${number}`).catch(() =>
      Alert.alert('Unable to open dialer', `Call ${number} manually.`)
    );
  }

  async function handleGenerateEAP() {
    if (!site?.latitude || !site?.longitude) return;
    setEapGenerating(true);
    try {
      const data = await generateEAPFromCoords(site.latitude, site.longitude);
      updateEAP(id, {
        nearestHospitalName:    data.nearestHospitalName,
        nearestHospitalAddress: data.nearestHospitalAddress,
        nearestHospitalPhone:   data.nearestHospitalPhone,
        nearestChamberName:     data.nearestChamberName,
        nearestChamberAddress:  data.nearestChamberAddress,
        nearestChamberPhone:    data.nearestChamberPhone,
        coastGuardPhone:        data.coastGuardPhone,
        localEmergencyNumber:   data.localEmergencyNumber,
        danEmergencyNumber:     data.danEmergencyNumber,
      });
      setEAP(getEAP(id));
    } catch {
      Alert.alert('Generation Failed', 'Could not reach the emergency services database. Check your connection and try again.');
    } finally {
      setEapGenerating(false);
    }
  }

  if (!site) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Site Detail" back={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>Site not found.</Text>
        </View>
      </View>
    );
  }

  const hasEAPContacts = eap && (
    eap.nearestHospitalPhone || eap.nearestChamberPhone ||
    eap.coastGuardPhone || eap.localEmergencyNumber
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={site.name}
        subtitle={site.location ?? undefined}
        back={() => router.back()}
        right={
          <Pressable
            onPress={() => router.push(`/sites/new?editId=${site.id}`)}
            style={styles.editBtn}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
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
            <HeroStat label="Max Depth" value={fmtDepth(site.maxDepthMeters, imp)} />
            <HeroStat label="Location" value={site.location ?? '—'} />
          </View>
        </Card>

        {/* Site Info */}
        {(site.description || site.conditions || site.accessNotes) && (
          <>
            <SectionLabel label="Site Info" />
            <Card style={styles.card}>
              {site.description && <InfoRow label="Description" value={site.description} />}
              {site.conditions && <InfoRow label="Conditions" value={site.conditions} />}
              {site.accessNotes && <InfoRow label="Access" value={site.accessNotes} />}
            </Card>
          </>
        )}

        {/* Emergency Action Plan */}
        <SectionLabel label="Emergency Action Plan" />
        <Card style={styles.card}>
          {hasEAPContacts ? (
            <>
              {eap?.nearestHospitalPhone && (
                <ContactRow
                  label={eap.nearestHospitalName ?? 'Hospital'}
                  number={eap.nearestHospitalPhone}
                  onDial={handleDial}
                />
              )}
              {eap?.nearestChamberPhone && (
                <ContactRow
                  label={eap.nearestChamberName ?? 'Hyperbaric Chamber'}
                  number={eap.nearestChamberPhone}
                  onDial={handleDial}
                />
              )}
              {eap?.coastGuardPhone && (
                <ContactRow label="Coast Guard" number={eap.coastGuardPhone} onDial={handleDial} />
              )}
              {eap?.localEmergencyNumber && (
                <ContactRow label="Local Emergency" number={eap.localEmergencyNumber} onDial={handleDial} />
              )}
              <ContactRow
                label="DAN Emergency"
                number={eap?.danEmergencyNumber ?? '+1-919-684-9111'}
                onDial={handleDial}
              />
            </>
          ) : (
            <Text style={styles.eapEmpty}>
              No emergency contacts yet.{site?.latitude != null ? ' Tap below to auto-generate from GPS.' : ' Add coordinates when editing the site, or fill in manually.'}
            </Text>
          )}

          {/* Generate from GPS — shown when site has coordinates */}
          {site?.latitude != null && site?.longitude != null && (
            <Pressable
              style={[styles.eapGpsBtn, eapGenerating && styles.eapGpsBtnLoading]}
              onPress={handleGenerateEAP}
              disabled={eapGenerating}
            >
              {eapGenerating ? (
                <ActivityIndicator size="small" color={Colors.accentBlue} />
              ) : (
                <Ionicons name="flash" size={15} color={Colors.accentBlue} />
              )}
              <Text style={styles.eapGpsBtnText}>
                {eapGenerating
                  ? 'Searching nearby services…'
                  : hasEAPContacts ? 'Regenerate EAP from GPS' : 'Generate EAP from GPS'}
              </Text>
            </Pressable>
          )}

          <Button
            label="Edit Emergency Action Plan"
            onPress={() => router.push(`/sites/${id}/eap`)}
            variant="ghost"
            style={styles.eapBtn}
          />
        </Card>

        {/* Equipment locations */}
        {eap && (eap.oxygenLocation || eap.firstAidKitLocation || eap.aedLocation) && (
          <>
            <SectionLabel label="Equipment Locations" />
            <Card style={styles.card}>
              {eap.oxygenLocation && <InfoRow label="Oxygen" value={eap.oxygenLocation} />}
              {eap.firstAidKitLocation && <InfoRow label="First Aid Kit" value={eap.firstAidKitLocation} />}
              {eap.aedLocation && <InfoRow label="AED" value={eap.aedLocation} />}
            </Card>
          </>
        )}

        {/* Evacuation */}
        {eap && (eap.evacuationProcedure || eap.nearestExitPoint || eap.vhfChannel) && (
          <>
            <SectionLabel label="Evacuation" />
            <Card style={styles.card}>
              {eap.nearestExitPoint && <InfoRow label="Nearest Exit" value={eap.nearestExitPoint} />}
              {eap.vhfChannel && <InfoRow label="VHF Channel" value={eap.vhfChannel} />}
              {eap.evacuationProcedure && <InfoRow label="Procedure" value={eap.evacuationProcedure} />}
            </Card>
          </>
        )}

        {/* Share */}
        <Pressable
          style={styles.shareQrBtn}
          onPress={() => router.push(`/qr?type=site&id=${site.id}`)}
        >
          <Ionicons name="qr-code" size={20} color={Colors.accentBlue} />
          <Text style={styles.shareQrText}>Share Site QR</Text>
        </Pressable>

        {/* Activate Emergency */}
        <Pressable
          style={({ pressed }) => [styles.emergencyBtn, pressed && styles.emergencyBtnPressed]}
          onPress={handleActivateEmergency}
        >
          <Ionicons name="alert-circle" size={22} color={Colors.white} />
          <Text style={styles.emergencyBtnText}>Activate Emergency Mode</Text>
        </Pressable>

        {/* Delete */}
        <View style={styles.deleteSection}>
          <Button label="Delete Site" onPress={handleDelete} variant="danger" style={styles.deleteBtn} />
        </View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={subStyles.sectionLabel}>{label}</Text>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={subStyles.heroStat}>
      <Text style={subStyles.heroValue}>{value}</Text>
      <Text style={subStyles.heroLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={subStyles.infoRow}>
      <Text style={subStyles.infoLabel}>{label}</Text>
      <Text style={subStyles.infoValue}>{value}</Text>
    </View>
  );
}

function ContactRow({ label, number, onDial }: {
  label: string; number: string; onDial: (n: string) => void;
}) {
  return (
    <View style={subStyles.contactRow}>
      <View style={subStyles.contactLeft}>
        <Text style={subStyles.contactLabel}>{label}</Text>
        <Text style={subStyles.contactNumber}>{number}</Text>
      </View>
      <Pressable
        style={({ pressed }) => [subStyles.dialBtn, pressed && subStyles.dialBtnPressed]}
        onPress={() => onDial(number.replace(/[^+\d]/g, ''))}
      >
        <Text style={subStyles.dialBtnText}>Call</Text>
      </Pressable>
    </View>
  );
}

const subStyles = StyleSheet.create({
  sectionLabel: {
    ...Typography.footnote, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.xl, marginBottom: Spacing.sm, marginHorizontal: 2,
  },
  heroStat: { alignItems: 'center', flex: 1 },
  heroValue: { ...Typography.title3, color: Colors.accentBlue, textAlign: 'center' },
  heroLabel: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  infoRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoLabel: { ...Typography.caption1, color: Colors.textSecondary, marginBottom: 2 },
  infoValue: { ...Typography.body, color: Colors.text },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  contactLeft: { flex: 1 },
  contactLabel: { ...Typography.subhead, fontWeight: '500', color: Colors.text },
  contactNumber: { ...Typography.footnote, color: Colors.textSecondary, marginTop: 1 },
  dialBtn: {
    backgroundColor: Colors.accentTeal, borderRadius: Radius.sm,
    paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md,
  },
  dialBtnPressed: { opacity: 0.8 },
  dialBtnText: { ...Typography.footnote, fontWeight: '700', color: Colors.white },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
  editBtn: {
    paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.sm,
  },
  editBtnText: { ...Typography.subhead, fontWeight: '600', color: Colors.white },
  heroCard: { marginBottom: 0 },
  heroRow: { flexDirection: 'row' },
  card: { marginBottom: 0 },
  eapEmpty: { ...Typography.subhead, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 22 },
  eapGpsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: Spacing.md,
    backgroundColor: Colors.accentBlue + '15',
    borderWidth: 1, borderColor: Colors.accentBlue + '40',
    borderRadius: Radius.sm, paddingVertical: Spacing.sm,
  },
  eapGpsBtnLoading: { opacity: 0.7 },
  eapGpsBtnText: { ...Typography.subhead, color: Colors.accentBlue, fontWeight: '600' },
  eapBtn: { marginTop: Spacing.sm },
  shareQrBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareQrText: { ...Typography.body, color: Colors.accentBlue, fontWeight: '600' },
  emergencyBtn: {
    backgroundColor: Colors.emergency, borderRadius: Radius.md,
    padding: Spacing.lg + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  emergencyBtnPressed: { opacity: 0.85 },
  emergencyBtnText: { fontSize: 18, fontWeight: '700', color: Colors.white, letterSpacing: 0.5 },
  deleteSection: { marginTop: Spacing.xl },
  deleteBtn: { width: '100%' },
});
