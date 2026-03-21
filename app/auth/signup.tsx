import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThalosLogo } from '@/src/ui/components/ThalosLogo';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useAuthStore } from '@/src/stores/authStore';

// ── Role pill ─────────────────────────────────────────────────────────────────

function RolePill({
  label, icon, selected, onPress,
}: { label: string; icon: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[s.rolePill, selected && s.rolePillActive]}
      onPress={onPress}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={selected ? Colors.accentBlue : Colors.textSecondary}
      />
      <Text style={[s.rolePillText, selected && s.rolePillTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────

function AuthField({
  label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
}) {
  const [secure, setSecure] = useState(secureTextEntry ?? false);
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldRow}>
        <TextInput
          style={[s.fieldInput, secureTextEntry && { paddingRight: 44 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          secureTextEntry={secure}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          autoCorrect={false}
        />
        {secureTextEntry ? (
          <Pressable style={s.eyeBtn} onPress={() => setSecure(v => !v)}>
            <Ionicons
              name={secure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SignupScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { signUp, loading } = useAuthStore();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [role,     setRole]     = useState<'diver' | 'instructor'>('diver');
  const [error,    setError]    = useState('');

  async function handleSignUp() {
    setError('');
    if (!name.trim())           { setError('Full name is required.'); return; }
    if (!email.trim())          { setError('Email is required.'); return; }
    if (password.length < 6)   { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }

    const err = await signUp(email.trim().toLowerCase(), password, name.trim(), role);
    if (err) {
      setError(err);
    } else {
      // Supabase may require email confirmation depending on your project settings.
      // If so, show a prompt. Otherwise, _layout.tsx auth gate handles redirect.
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. Please verify your email, then come back and log in.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }],
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.background }}
        contentContainerStyle={[s.root, { paddingBottom: insets.bottom + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header gradient */}
        <LinearGradient
          colors={[Colors.thalosDeep, Colors.thalosNavy]}
          style={[s.hero, { paddingTop: insets.top + Spacing.lg }]}
        >
          <ThalosLogo size={56} variant="onNavy" />
          <Text style={s.wordmark}>THALOS</Text>
        </LinearGradient>

        {/* Form card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Create Account</Text>

          <AuthField
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            autoCapitalize="words"
          />

          <AuthField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AuthField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="6+ characters"
            secureTextEntry
          />

          <AuthField
            label="Confirm Password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat password"
            secureTextEntry
          />

          {/* Role */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>I AM A</Text>
            <View style={s.roleRow}>
              <RolePill
                label="Diver"
                icon="person"
                selected={role === 'diver'}
                onPress={() => setRole('diver')}
              />
              <RolePill
                label="Instructor"
                icon="school"
                selected={role === 'instructor'}
                onPress={() => setRole('instructor')}
              />
            </View>
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={s.btnText}>Create Account</Text>
            }
          </Pressable>

          <View style={s.loginRow}>
            <Text style={s.loginPrompt}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/auth/login')}>
              <Text style={s.loginLink}>Log In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flexGrow: 1 },

  hero: {
    alignItems: 'center',
    paddingBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  wordmark: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl ?? 20,
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    ...Typography.title2,
    fontWeight: '700',
    color: Colors.thalosNavy,
    marginBottom: Spacing.xs,
  },

  fieldWrap: { gap: 4 },
  fieldLabel: { ...Typography.footnote, fontWeight: '600', color: Colors.textSecondary },
  fieldRow: { position: 'relative' },
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
  eyeBtn: {
    position: 'absolute',
    right: Spacing.md,
    top: 0, bottom: 0,
    justifyContent: 'center',
  },

  roleRow: { flexDirection: 'row', gap: Spacing.sm },
  rolePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  rolePillActive: {
    borderColor: Colors.accentBlue,
    backgroundColor: Colors.accentBlue + '26',
  },
  rolePillText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  rolePillTextActive: { color: Colors.accentBlue, fontWeight: '600' },

  error: {
    ...Typography.caption1,
    color: Colors.emergency,
    textAlign: 'center',
  },

  btn: {
    backgroundColor: Colors.accentBlue,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  btnText: { ...Typography.headline, color: '#FFFFFF', fontWeight: '700' },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  loginPrompt: { ...Typography.subhead, color: Colors.textSecondary },
  loginLink:   { ...Typography.subhead, color: Colors.accentBlue, fontWeight: '700' },
});
