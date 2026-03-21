/**
 * QR Scanner Screen — /collab/scan
 * Scans a Thalos collab invite QR and routes to the session.
 */
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  function handleBarcode({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);

    // Parse thalos://collab?session=<uuid>
    try {
      const parsed = Linking.parse(data);
      if (parsed.hostname === 'collab' && parsed.queryParams?.session) {
        const sessionId = parsed.queryParams.session as string;
        router.replace(`/collab/session?sessionId=${sessionId}`);
        return;
      }
    } catch {}

    // Not a valid Thalos collab QR
    setScanned(false);
  }

  if (!permission) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <Text style={styles.bodyText}>Requesting camera permission…</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.navBack}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.navTitle}>Scan QR</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.bodyText}>Camera permission required to scan QR codes.</Text>
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcode}
      />

      {/* Overlay */}
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.navBackDark}>
            <Ionicons name="close" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.navTitleDark}>Scan Dive Session QR</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.viewfinder}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        <Text style={styles.hint}>
          Point your camera at a Thalos dive session QR code
        </Text>

        {scanned && (
          <Pressable style={styles.resetBtn} onPress={() => setScanned(false)}>
            <Text style={styles.resetText}>Tap to scan again</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const CORNER = 28;
const FRAME = 240;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  bodyText: { ...(Typography.body as TextStyle), color: Colors.textSecondary, textAlign: 'center' },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  navBack: { width: 44, alignItems: 'flex-start', justifyContent: 'center' },
  navTitle: { ...(Typography.headline as TextStyle), color: Colors.text },
  permBtn: {
    backgroundColor: Colors.accentBlue, borderRadius: Radius.full,
    paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.xl,
  },
  permBtnText: { ...(Typography.headline as TextStyle), color: '#FFF' },
  // Camera overlay
  overlay: { flex: 1, alignItems: 'center' },
  navBackDark: { width: 44, alignItems: 'flex-start', justifyContent: 'center' },
  navTitleDark: { ...(Typography.headline as TextStyle), color: '#FFF' },
  viewfinder: {
    width: FRAME, height: FRAME,
    marginTop: 80,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER, height: CORNER,
    borderColor: Colors.accentBlue,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  hint: {
    ...(Typography.subhead as TextStyle),
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  resetBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.accentBlue,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
  },
  resetText: { ...(Typography.headline as TextStyle), color: '#FFF' },
});
