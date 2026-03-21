import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/src/ui/theme';
import { useSiteStore } from '@/src/stores/siteStore';
import { EAP } from '@/src/models';

const PROCEDURES = [
  '1. Ensure scene safety — do not enter water until safe',
  '2. Remove diver from the water',
  '3. Administer 100% oxygen immediately',
  '4. Call emergency services',
  '5. Assess ABCs: Airway, Breathing, Circulation',
  '6. Begin CPR if trained and if necessary',
  '7. Keep diver warm and calm',
  '8. Do not leave the diver unattended',
];

interface Contact {
  label: string;
  number: string;
  emoji: string;
}

function buildContacts(eap: EAP | null): Contact[] {
  const contacts: Contact[] = [];

  if (eap?.localEmergencyNumber) {
    contacts.push({ label: 'Local Emergency', number: eap.localEmergencyNumber, emoji: '🚨' });
  } else {
    contacts.push({ label: '911', number: '911', emoji: '🚨' });
  }

  contacts.push({
    label: 'DAN Emergency',
    number: eap?.danEmergencyNumber ?? '+1-919-684-9111',
    emoji: '🏥',
  });

  if (eap?.coastGuardPhone) {
    contacts.push({ label: 'Coast Guard', number: eap.coastGuardPhone, emoji: '⚓' });
  }

  if (eap?.nearestHospitalPhone) {
    contacts.push({
      label: eap.nearestHospitalName ?? 'Hospital',
      number: eap.nearestHospitalPhone,
      emoji: '🏨',
    });
  }

  if (eap?.nearestChamberPhone) {
    contacts.push({
      label: eap.nearestChamberName ?? 'Hyperbaric Chamber',
      number: eap.nearestChamberPhone,
      emoji: '🫧',
    });
  }

  return contacts;
}

export default function EmergencyScreen() {
  const router = useRouter();
  const { siteId } = useLocalSearchParams<{ siteId?: string }>();
  const { sites, getEAP } = useSiteStore();
  const [eap, setEAP] = useState<EAP | null>(null);

  useEffect(() => {
    if (siteId) {
      setEAP(getEAP(siteId));
    }
  }, [siteId]);

  const site = siteId ? sites.find((s) => s.id === siteId) : null;
  const contacts = buildContacts(eap);
  const evacuationText = eap?.evacuationProcedure ?? null;
  const hasEquipment = eap && (eap.oxygenLocation || eap.firstAidKitLocation || eap.aedLocation);

  function handleDial(number: string) {
    Linking.openURL(`tel:${number.replace(/[^+\d]/g, '')}`).catch(() =>
      Alert.alert('Unable to open dialer', `Call ${number} manually.`)
    );
  }

  function handleExit() {
    Alert.alert(
      'Exit Emergency Mode',
      'Are you sure the emergency is resolved?',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => router.back() },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emergencyLabel}>EMERGENCY</Text>
          <Text style={styles.emergencySubtitle}>
            {site ? site.name : 'Diving Emergency Response'}
          </Text>
        </View>

        {/* Dial buttons */}
        <View style={styles.dialGrid}>
          {contacts.map((contact) => (
            <Pressable
              key={contact.label}
              style={({ pressed }) => [styles.dialBtn, pressed && styles.dialPressed]}
              onPress={() => handleDial(contact.number)}
            >
              <Text style={styles.dialEmoji}>{contact.emoji}</Text>
              <Text style={styles.dialLabel}>{contact.label}</Text>
              <Text style={styles.dialNumber}>{contact.number}</Text>
            </Pressable>
          ))}
        </View>

        {/* Equipment locations */}
        {hasEquipment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipment Locations</Text>
            {eap?.oxygenLocation && (
              <InfoItem icon="🫁" label="Oxygen" value={eap.oxygenLocation} />
            )}
            {eap?.firstAidKitLocation && (
              <InfoItem icon="🩹" label="First Aid Kit" value={eap.firstAidKitLocation} />
            )}
            {eap?.aedLocation && (
              <InfoItem icon="⚡" label="AED" value={eap.aedLocation} />
            )}
          </View>
        )}

        {/* Evacuation */}
        {(eap?.nearestExitPoint || eap?.vhfChannel || evacuationText) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evacuation</Text>
            {eap?.nearestExitPoint && (
              <InfoItem icon="🚪" label="Nearest Exit" value={eap.nearestExitPoint} />
            )}
            {eap?.vhfChannel && (
              <InfoItem icon="📻" label="VHF Channel" value={eap.vhfChannel} />
            )}
            {evacuationText && (
              <Text style={styles.procedureText}>{evacuationText}</Text>
            )}
          </View>
        )}

        {/* Standard procedures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Procedures</Text>
          {PROCEDURES.map((step, i) => (
            <Text key={i} style={styles.procedureText}>{step}</Text>
          ))}
        </View>

        {/* Exit button */}
        <Pressable
          style={({ pressed }) => [styles.exitBtn, pressed && styles.exitPressed]}
          onPress={handleExit}
        >
          <Text style={styles.exitLabel}>Exit Emergency Mode</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.emergency,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emergencyLabel: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 4,
  },
  emergencySubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  dialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  dialBtn: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    padding: Spacing.lg,
    alignItems: 'center',
  },
  dialPressed: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dialEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  dialLabel: {
    ...Typography.headline,
    color: Colors.white,
    textAlign: 'center',
  },
  dialNumber: {
    ...Typography.footnote,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  procedureText: {
    ...Typography.body,
    color: Colors.white,
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  infoIcon: {
    fontSize: 20,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    ...Typography.caption1,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 1,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.white,
  },
  exitBtn: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    padding: Spacing.lg,
    alignItems: 'center',
  },
  exitPressed: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  exitLabel: {
    ...Typography.headline,
    color: Colors.white,
  },
});
