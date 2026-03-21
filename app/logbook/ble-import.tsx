import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useUIStore } from '@/src/stores/uiStore';
import { DiveService } from '@/src/services/DiveService';
import { getBleManager, requestBlePermissions } from '@/src/ble/bleManager';
import { SERVICE_UUIDS, detectBrand } from '@/src/ble/protocols/index';
import { downloadDives as shearwaterDownload } from '@/src/ble/protocols/shearwater';
import { downloadDives as suuntoDownload } from '@/src/ble/protocols/suunto';
import { downloadDives as maresDownload } from '@/src/ble/protocols/mares';
import { downloadDives as genericDownload } from '@/src/ble/protocols/generic';
import type { BleDeviceInfo, BlePhase, RawDive, DiveComputerBrand } from '@/src/ble/types';
import type { Device } from 'react-native-ble-plx';

const M_TO_FT = 3.28084;
const diveService = new DiveService();

const BRAND_LABEL: Record<DiveComputerBrand, string> = {
  shearwater: 'Shearwater',
  suunto: 'Suunto',
  mares: 'Mares',
  generic: 'Unknown',
};

const BRAND_ICON: Record<DiveComputerBrand, string> = {
  shearwater: '🔵',
  suunto: '🟡',
  mares: '🔴',
  generic: '⚪',
};

function formatDepth(m: number, imperial: boolean): string {
  if (imperial) return `${(m * M_TO_FT).toFixed(0)} ft`;
  return `${m.toFixed(1)} m`;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  return `${m} min`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

function rssiSignal(rssi: number): number {
  if (rssi >= -70) return 3;
  if (rssi >= -85) return 2;
  return 1;
}

export default function BleImportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unitSystem } = useUIStore();
  const imp = unitSystem === 'imperial';

  const [phase, setPhase] = useState<BlePhase>('idle');
  const [devices, setDevices] = useState<BleDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BleDeviceInfo | null>(null);
  const [progress, setProgress] = useState({ n: 0, total: 0 });
  const [dives, setDives] = useState<RawDive[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  // BLE device ref for connection
  const connectedDeviceRef = useRef<Device | null>(null);

  // Pulse animation for scanning
  const pulseAnim = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    if (phase === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0.2);
    }
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      getBleManager().stopDeviceScan();
      connectedDeviceRef.current?.cancelConnection().catch(() => {});
    };
  }, []);

  async function handleStartScan() {
    setDevices([]);
    setErrorMessage(null);
    setPhase('scanning');

    const ok = await requestBlePermissions();
    if (!ok) {
      setErrorMessage('Bluetooth permission denied. Please enable it in Settings.');
      setPhase('error');
      return;
    }

    const manager = getBleManager();
    const targetUUIDs = (Object.values(SERVICE_UUIDS) as string[]).filter(Boolean);
    let scanTimedOut = false;
    const scanTimer = setTimeout(() => {
      scanTimedOut = true;
      manager.stopDeviceScan();
      // Keep phase as scanning with discovered devices (if any); user taps a device to continue
    }, 15_000);

    manager.startDeviceScan(
      targetUUIDs,
      { allowDuplicates: false },
      (err, device) => {
        if (err) {
          clearTimeout(scanTimer);
          setErrorMessage(err.message ?? 'Scan failed');
          setPhase('error');
          return;
        }
        if (!device) return;
        const brand = detectBrand(device.serviceUUIDs);
        setDevices(prev => {
          if (prev.some(d => d.id === device.id)) return prev;
          return [...prev, {
            id: device.id,
            name: device.name,
            brand,
            rssi: device.rssi ?? -99,
          }];
        });
      }
    );
  }

  function handleStopScan() {
    getBleManager().stopDeviceScan();
    setPhase(devices.length > 0 ? 'scanning' : 'idle');
  }

  async function handleConnect(deviceInfo: BleDeviceInfo) {
    getBleManager().stopDeviceScan();
    setSelectedDevice(deviceInfo);
    setPhase('connecting');
    setErrorMessage(null);

    try {
      const manager = getBleManager();
      const device = await manager.connectToDevice(deviceInfo.id, { autoConnect: false });
      connectedDeviceRef.current = device;

      setPhase('downloading');
      setProgress({ n: 0, total: 0 });

      const onProgress = (n: number, total: number) => {
        setProgress({ n, total });
      };

      let rawDives: RawDive[] = [];
      switch (deviceInfo.brand) {
        case 'shearwater': rawDives = await shearwaterDownload(device, onProgress); break;
        case 'suunto':     rawDives = await suuntoDownload(device, onProgress); break;
        case 'mares':      rawDives = await maresDownload(device, onProgress); break;
        default:           rawDives = await genericDownload(device, onProgress); break;
      }

      await device.cancelConnection();
      connectedDeviceRef.current = null;

      if (rawDives.length === 0) {
        setErrorMessage(
          deviceInfo.brand === 'generic'
            ? 'Could not communicate with device. Protocol not recognized.'
            : 'No dives found on this dive computer.'
        );
        setPhase('error');
        return;
      }

      setDives(rawDives);
      setSelectedIndices(new Set(rawDives.map((_, i) => i)));
      setPhase('review');
    } catch (err: unknown) {
      connectedDeviceRef.current = null;
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setErrorMessage(msg);
      setPhase('error');
    }
  }

  async function handleImport() {
    setPhase('importing');
    const selected = dives.filter((_, i) => selectedIndices.has(i));
    let count = 0;
    for (const raw of selected) {
      try {
        diveService.createDive({
          diveType: 'RECREATIONAL',
          date: raw.startTimeISO.slice(0, 10),
          maxDepthMeters: raw.maxDepthMeters,
          bottomTimeMinutes: Math.round(raw.durationSeconds / 60),
          waterTemperatureCelsius: raw.minTempCelsius,
          startPressureBar: raw.maxPressureBar,
          endPressureBar: raw.minPressureBar,
          gasType: raw.gasO2Percent != null && raw.gasO2Percent > 22
            ? `EAN${raw.gasO2Percent}`
            : 'Air',
          surfaceIntervalMinutes: raw.surfaceIntervalMinutes,
          notes: `Imported via BLE from ${selectedDevice?.name ?? BRAND_LABEL[selectedDevice?.brand ?? 'generic']}`,
        });
        count++;
      } catch {
        // continue on individual errors
      }
    }
    setImportedCount(count);
    setPhase('done');
  }

  function toggleDive(idx: number) {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function handleReset() {
    connectedDeviceRef.current?.cancelConnection().catch(() => {});
    connectedDeviceRef.current = null;
    getBleManager().stopDeviceScan();
    setPhase('idle');
    setDevices([]);
    setSelectedDevice(null);
    setProgress({ n: 0, total: 0 });
    setDives([]);
    setSelectedIndices(new Set());
    setErrorMessage(null);
    setImportedCount(0);
  }

  // ─── Render phases ───────────────────────────────────────────────────────────

  function renderIdle() {
    return (
      <View style={styles.centerContent}>
        <Ionicons name="bluetooth-outline" size={72} color={Colors.accentBlue} />
        <Text style={styles.idleTitle}>Connect Dive Computer</Text>
        <Text style={styles.idleSubtitle}>
          Wirelessly download dives from your Shearwater, Suunto, or Mares dive computer.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={handleStartScan}>
          <Text style={styles.primaryBtnText}>Scan for Devices</Text>
        </Pressable>
      </View>
    );
  }

  function renderScanning() {
    return (
      <View style={styles.fullContent}>
        <View style={styles.scanHeader}>
          <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
          <Text style={styles.scanLabel}>Searching for dive computers…</Text>
          <Pressable style={styles.stopBtn} onPress={handleStopScan}>
            <Text style={styles.stopBtnText}>Stop</Text>
          </Pressable>
        </View>

        {devices.length > 0 && (
          <FlatList
            data={devices}
            keyExtractor={d => d.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable style={styles.deviceCard} onPress={() => handleConnect(item)}>
                <Text style={styles.deviceIcon}>{BRAND_ICON[item.brand]}</Text>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{item.name ?? `${BRAND_LABEL[item.brand]} Dive Computer`}</Text>
                  <Text style={styles.deviceBrand}>{BRAND_LABEL[item.brand]}</Text>
                </View>
                <SignalBars strength={rssiSignal(item.rssi)} />
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </Pressable>
            )}
          />
        )}
        {devices.length === 0 && (
          <View style={styles.scanHintBox}>
            <Text style={styles.scanHint}>Make sure your dive computer is nearby and in Bluetooth pairing mode.</Text>
          </View>
        )}
      </View>
    );
  }

  function renderConnecting() {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.deviceIcon2}>{BRAND_ICON[selectedDevice?.brand ?? 'generic']}</Text>
        <Text style={styles.connectingTitle}>
          {selectedDevice?.name ?? BRAND_LABEL[selectedDevice?.brand ?? 'generic']}
        </Text>
        <ActivityIndicator size="large" color={Colors.accentBlue} style={{ marginTop: Spacing.lg }} />
        <Text style={styles.connectingLabel}>Connecting…</Text>
      </View>
    );
  }

  function renderDownloading() {
    const { n, total } = progress;
    const pct = total > 0 ? Math.round((n / total) * 100) : 0;
    return (
      <View style={styles.centerContent}>
        <Text style={styles.deviceIcon2}>{BRAND_ICON[selectedDevice?.brand ?? 'generic']}</Text>
        <Text style={styles.connectingTitle}>
          {selectedDevice?.name ?? BRAND_LABEL[selectedDevice?.brand ?? 'generic']}
        </Text>
        <ActivityIndicator size="large" color={Colors.accentBlue} style={{ marginTop: Spacing.lg }} />
        <Text style={styles.connectingLabel}>Downloading dives…</Text>
        {total > 0 && (
          <>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${pct}%` as `${number}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{n} / {total} dives</Text>
          </>
        )}
      </View>
    );
  }

  function renderReview() {
    const selCount = selectedIndices.size;
    return (
      <View style={styles.fullContent}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle}>{dives.length} dive{dives.length !== 1 ? 's' : ''} found</Text>
          <Text style={styles.reviewSubtitle}>Select which to import</Text>
        </View>
        <FlatList
          data={dives}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const selected = selectedIndices.has(index);
            return (
              <Pressable style={[styles.diveRow, selected && styles.diveRowSelected]} onPress={() => toggleDive(index)}>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <View style={styles.diveInfo}>
                  <Text style={styles.diveDate}>{formatDate(item.startTimeISO)}</Text>
                  <Text style={styles.diveMeta}>
                    {formatDepth(item.maxDepthMeters, imp)} · {formatDuration(item.durationSeconds)}
                    {item.gasO2Percent != null && item.gasO2Percent > 22
                      ? ` · EAN${item.gasO2Percent}`
                      : ' · Air'}
                  </Text>
                </View>
                <Text style={styles.diveNum}>#{item.diveNumber}</Text>
              </Pressable>
            );
          }}
        />
        <View style={styles.importFooter}>
          <Pressable
            style={[styles.primaryBtn, selCount === 0 && styles.primaryBtnDisabled]}
            onPress={handleImport}
            disabled={selCount === 0}
          >
            <Text style={styles.primaryBtnText}>Import {selCount} Dive{selCount !== 1 ? 's' : ''}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderImporting() {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={Colors.accentBlue} />
        <Text style={styles.connectingLabel}>Importing…</Text>
      </View>
    );
  }

  function renderDone() {
    return (
      <View style={styles.centerContent}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={48} color="#FFF" />
        </View>
        <Text style={styles.doneTitle}>{importedCount} dive{importedCount !== 1 ? 's' : ''} imported</Text>
        <Text style={styles.doneSubtitle}>Your dives have been added to your logbook.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>View Logbook</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={handleReset}>
          <Text style={styles.secondaryBtnText}>Import More</Text>
        </Pressable>
      </View>
    );
  }

  function renderError() {
    return (
      <View style={styles.centerContent}>
        <Ionicons name="warning-outline" size={60} color={Colors.emergency} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <Pressable style={styles.primaryBtn} onPress={handleReset}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Dive Computer</Text>
        <View style={{ width: 60 }} />
      </View>

      {phase === 'idle' && renderIdle()}
      {phase === 'scanning' && renderScanning()}
      {phase === 'connecting' && renderConnecting()}
      {phase === 'downloading' && renderDownloading()}
      {phase === 'review' && renderReview()}
      {phase === 'importing' && renderImporting()}
      {phase === 'done' && renderDone()}
      {phase === 'error' && renderError()}
    </View>
  );
}

function SignalBars({ strength }: { strength: number }) {
  return (
    <View style={sigStyles.row}>
      {[1, 2, 3].map(i => (
        <View
          key={i}
          style={[sigStyles.bar, { height: 4 + i * 4, opacity: i <= strength ? 1 : 0.2 }]}
        />
      ))}
    </View>
  );
}

const sigStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginRight: Spacing.sm },
  bar: { width: 4, backgroundColor: Colors.accentBlue, borderRadius: 2 },
});

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

  // Idle
  centerContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, gap: Spacing.md,
  },
  idleTitle: { ...Typography.title2, color: Colors.text, textAlign: 'center' as const },
  idleSubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' as const, lineHeight: 22 },

  // Scanning
  fullContent: { flex: 1 },
  scanHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pulseDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.accentBlue },
  scanLabel: { ...Typography.subhead, color: Colors.text, flex: 1 },
  stopBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.md, backgroundColor: Colors.surfaceSecondary },
  stopBtnText: { ...Typography.subhead, color: Colors.textSecondary },
  scanHintBox: { padding: Spacing.xl },
  scanHint: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' as const },

  // Device list
  listContent: { padding: Spacing.lg, gap: Spacing.md },
  deviceCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  deviceIcon: { fontSize: 28 },
  deviceInfo: { flex: 1 },
  deviceName: { ...Typography.subhead, fontWeight: '600' as const, color: Colors.text },
  deviceBrand: { ...Typography.footnote, color: Colors.textSecondary, marginTop: 2 },

  // Connecting / Downloading
  deviceIcon2: { fontSize: 48 },
  connectingTitle: { ...Typography.title3, color: Colors.text, textAlign: 'center' as const },
  connectingLabel: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm },
  progressBarBg: {
    width: 200, height: 6, backgroundColor: Colors.border, borderRadius: 3, marginTop: Spacing.md, overflow: 'hidden',
  },
  progressBarFill: { height: 6, backgroundColor: Colors.accentBlue, borderRadius: 3 },
  progressLabel: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 6 },

  // Review
  reviewHeader: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  reviewTitle: { ...Typography.headline, color: Colors.text },
  reviewSubtitle: { ...Typography.subhead, color: Colors.textSecondary, marginTop: 2 },
  diveRow: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  diveRowSelected: { borderColor: Colors.accentBlue },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  diveInfo: { flex: 1 },
  diveDate: { ...Typography.subhead, fontWeight: '600' as const, color: Colors.text },
  diveMeta: { ...Typography.footnote, color: Colors.textSecondary, marginTop: 2 },
  diveNum: { ...Typography.caption1, color: Colors.textTertiary },
  importFooter: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },

  // Done
  successCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.accentBlue, alignItems: 'center', justifyContent: 'center',
  },
  doneTitle: { ...Typography.title2, color: Colors.text, textAlign: 'center' as const },
  doneSubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' as const },

  // Error
  errorTitle: { ...Typography.title3, color: Colors.text, textAlign: 'center' as const, marginTop: Spacing.md },
  errorMessage: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' as const, lineHeight: 22 },

  // Buttons
  primaryBtn: {
    backgroundColor: Colors.accentBlue, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    alignItems: 'center', alignSelf: 'stretch',
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { ...Typography.subhead, color: '#FFF', fontWeight: '700' as const },
  secondaryBtn: {
    borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    alignItems: 'center', alignSelf: 'stretch',
    borderWidth: 1, borderColor: Colors.border,
  },
  secondaryBtnText: { ...Typography.subhead, color: Colors.textSecondary },
});
