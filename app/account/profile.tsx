import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { useAuthStore } from '@/src/stores/authStore';

function Field({
  label, value, onChangeText, placeholder, keyboardType, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={false}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { user, profile, updateProfile, signOut } = useAuthStore();

  const [displayName,      setDisplayName]      = useState('');
  const [certLevel,        setCertLevel]        = useState('');
  const [certAgency,       setCertAgency]       = useState('');
  const [phone,            setPhone]            = useState('');
  const [instructorNumber, setInstructorNumber] = useState('');
  const [saving,           setSaving]           = useState(false);

  const role = profile?.role ?? 'diver';

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '');
      setCertLevel(profile.certLevel ?? '');
      setCertAgency(profile.certAgency ?? '');
      setPhone(profile.phone ?? '');
      setInstructorNumber(profile.instructorNumber ?? '');
    }
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    const err = await updateProfile({
      displayName: displayName.trim() || null,
      certLevel:        certLevel.trim()        || null,
      certAgency:       certAgency.trim()        || null,
      phone:            phone.trim()             || null,
      instructorNumber: instructorNumber.trim()  || null,
    });
    setSaving(false);
    if (err) {
      Alert.alert('Error', err);
    } else {
      router.back();
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          // Auth gate in _layout.tsx will redirect to /auth/login
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[s.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.headerBtn}>
            <Text style={s.backText}>Cancel</Text>
          </Pressable>
          <Text style={s.headerTitle}>My Profile</Text>
          <Pressable onPress={handleSave} style={s.headerBtn} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color={Colors.accentBlue} />
              : <Text style={s.saveText}>Save</Text>
            }
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar / email */}
          <View style={s.avatarSection}>
            <View style={s.avatarCircle}>
              <Ionicons name="person" size={40} color={Colors.thalosNavy} />
            </View>
            <Text style={s.emailText}>{user?.email}</Text>
          </View>

          {/* Fields */}
          <Text style={s.sectionLabel}>PROFILE</Text>
          <View style={s.card}>
            <Field
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              autoCapitalize="words"
            />

            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>ACCOUNT TYPE</Text>
              <View style={s.roleBadgeRow}>
                <Ionicons
                  name={role === 'instructor' ? 'school' : 'person'}
                  size={15}
                  color={Colors.accentBlue}
                />
                <Text style={s.roleBadgeText}>
                  {role === 'instructor' ? 'Instructor' : 'Diver'}
                </Text>
                <Text style={s.roleBadgeHint}> · set at signup</Text>
              </View>
            </View>
          </View>

          <Text style={s.sectionLabel}>CERTIFICATION</Text>
          <View style={s.card}>
            <Field
              label="Cert Level"
              value={certLevel}
              onChangeText={setCertLevel}
              placeholder="e.g. Open Water, Divemaster"
              autoCapitalize="words"
            />
            <Field
              label="Agency"
              value={certAgency}
              onChangeText={setCertAgency}
              placeholder="e.g. PADI, SSI, NAUI"
              autoCapitalize="words"
            />
            {role === 'instructor' ? (
              <Field
                label="Instructor Number"
                value={instructorNumber}
                onChangeText={setInstructorNumber}
                placeholder="Optional"
              />
            ) : null}
          </View>

          <Text style={s.sectionLabel}>CONTACT</Text>
          <View style={s.card}>
            <Field
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 000-0000"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          {/* Sign out */}
          <Pressable
            style={({ pressed }) => [s.signOutBtn, pressed && { opacity: 0.7 }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.emergency} />
            <Text style={s.signOutText}>Sign Out</Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerBtn: { width: 60 },
  backText:  { ...Typography.body, color: Colors.textSecondary },
  saveText:  { ...Typography.body, color: Colors.accentBlue, fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', ...Typography.headline, color: Colors.text },

  content: { padding: Spacing.lg, gap: Spacing.sm },

  avatarSection: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accentBlue + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  emailText: { ...Typography.subhead, color: Colors.textSecondary },

  sectionLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: Spacing.sm,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  fieldWrap: { gap: 4 },
  fieldLabel: { ...Typography.footnote, fontWeight: '600', color: Colors.textSecondary },
  fieldInput: {
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.background,
  },

  roleBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
  roleBadgeText: { ...Typography.subhead, color: Colors.accentBlue, fontWeight: '600' },
  roleBadgeHint: { ...Typography.footnote, color: Colors.textTertiary },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.emergency + '40',
    backgroundColor: Colors.emergency + '08',
  },
  signOutText: { ...Typography.body, color: Colors.emergency, fontWeight: '600' },
});
