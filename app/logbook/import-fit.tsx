import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Radius, Spacing, Typography, Shadow } from '@/src/ui/theme';
import { useDiveStore } from '@/src/stores/diveStore';
import { useUIStore } from '@/src/stores/uiStore';
import { parseFitBuffer, type FitDiveSummary } from '@/src/utils/fitParser';
import type { CreateDiveInput } from '@/src/models';

const M_TO_FT = 3.28084;

function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

function depthLabel(m: number, imperial: boolean): string {
  return imperial ? `${fmt(m * M_TO_FT)} ft` : `${fmt(m)} m`;
}

function durationLabel(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function ImportFitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createDive } = useDiveStore();
  const imperial = useUIStore(s => s.unitSystem === 'imperial');

  const [summaries, setSummaries] = useState<FitDiveSummary[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setLoading(true);
      setFileName(asset.name);
      setSummaries([]);
      setSelected(new Set());

      const response = await fetch(asset.uri);
      const buffer = await response.arrayBuffer();
      const parsed = parseFitBuffer(buffer);

      if (parsed.length === 0) {
        Alert.alert('No dives found', 'No dive summary records were found in this FIT file.');
        setLoading(false);
        return;
      }

      setSummaries(parsed);
      setSelected(new Set(parsed.map((_, i) => i)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Parse error', msg);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function importSelected() {
    if (selected.size === 0) return;
    let count = 0;
    for (const i of selected) {
      const s = summaries[i];
      const input: CreateDiveInput = {
        diveType: 'RECREATIONAL',
        date: s.startTime.slice(0, 10),
        siteId: null,
        maxDepthMeters: s.maxDepthM,
        bottomTimeMinutes: Math.round(s.durationSec / 60),
        waterTemperatureCelsius: s.waterTempC,
        gasType: s.o2Percent != null ? `EAN${Math.round(s.o2Percent)}` : null,
        notes: `Imported from FIT file: ${fileName ?? 'unknown'}`,
      };
      createDive(input);
      count++;
    }
    Alert.alert('Imported', `${count} dive${count !== 1 ? 's' : ''} added to your logbook.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Import FIT File</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pick file button */}
        <Pressable style={styles.pickBtn} onPress={pickFile}>
          <Text style={styles.pickIcon}>📂</Text>
          <Text style={styles.pickLabel}>
            {fileName ? fileName : 'Choose FIT File'}
          </Text>
          <Text style={styles.pickSub}>
            Supports Garmin Descent and compatible devices
          </Text>
        </Pressable>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.accentBlue} />
            <Text style={styles.loadingText}>Parsing FIT file…</Text>
          </View>
        )}

        {summaries.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>
              {summaries.length} DIVE{summaries.length !== 1 ? 'S' : ''} FOUND
            </Text>

            {summaries.map((s, i) => {
              const isSelected = selected.has(i);
              return (
                <Pressable
                  key={i}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => toggleSelect(i)}
                >
                  <View style={styles.cardRow}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardDate}>
                        {new Date(s.startTime).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.cardStats}>
                        {depthLabel(s.maxDepthM, imperial)} · {durationLabel(s.durationSec)}
                        {s.waterTempC != null ? ` · ${fmt(s.waterTempC)}°C` : ''}
                        {s.o2Percent != null ? ` · ${fmt(s.o2Percent)}% O₂` : ''}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}

            <Pressable
              style={[styles.importBtn, selected.size === 0 && styles.importBtnDisabled]}
              onPress={importSelected}
              disabled={selected.size === 0}
            >
              <Text style={styles.importBtnText}>
                Import {selected.size} Dive{selected.size !== 1 ? 's' : ''}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 64 },
  backText: { ...Typography.body, color: Colors.accentBlue },
  title: { ...Typography.headline, color: Colors.text },
  content: { padding: Spacing.lg, gap: Spacing.md },
  pickBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.accentBlue,
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    ...Shadow.sm,
  },
  pickIcon: { fontSize: 36, marginBottom: Spacing.sm },
  pickLabel: { ...Typography.headline, color: Colors.accentBlue, textAlign: 'center' },
  pickSub: { ...Typography.footnote, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  loadingText: { ...Typography.body, color: Colors.textSecondary },
  sectionLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardSelected: {
    borderColor: Colors.accentBlue,
    backgroundColor: Colors.accentTealLight,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  checkbox: {
    width: 24, height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardDate: { ...Typography.headline, color: Colors.text },
  cardStats: { ...Typography.footnote, color: Colors.textSecondary, marginTop: 2 },
  importBtn: {
    backgroundColor: Colors.accentBlue,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadow.md,
  },
  importBtnDisabled: { opacity: 0.4 },
  importBtnText: { ...Typography.headline, color: '#FFF' },
});
