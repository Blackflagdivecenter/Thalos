import React, { useState } from 'react';
import {
  ActivityIndicator,
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
          autoComplete={secureTextEntry ? 'current-password' : 'email'}
          textContentType={secureTextEntry ? 'password' : 'emailAddress'}
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

export default function LoginScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { signIn, loading } = useAuthStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  async function handleLogin() {
    setError('');
    if (!email.trim())    { setError('Email is required.'); return; }
    if (!password)        { setError('Password is required.'); return; }
    const err = await signIn(email.trim().toLowerCase(), password);
    if (err) setError(err);
    // On success, authStore updates → _layout.tsx redirects to (tabs)
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
          style={[s.hero, { paddingTop: insets.top + Spacing.xl }]}
        >
          <ThalosLogo size={72} variant="onNavy" />
          <Text style={s.wordmark}>THALOS</Text>
          <Text style={s.heroSub}>Your dive companion</Text>
        </LinearGradient>

        {/* Form card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Sign In</Text>

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
            placeholder="••••••••"
            secureTextEntry
          />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable
            style={[s.forgotLink, { marginTop: -Spacing.xs }]}
            onPress={() => router.push('/auth/forgot-password')}
          >
            <Text style={s.forgotText}>Forgot password?</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={s.btnText}>Log In</Text>
            }
          </Pressable>

          <View style={s.signupRow}>
            <Text style={s.signupPrompt}>Don't have an account? </Text>
            <Pressable onPress={() => router.replace('/auth/signup')}>
              <Text style={s.signupLink}>Sign Up</Text>
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
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
  },
  heroSub: {
    ...Typography.subhead,
    color: 'rgba(255,255,255,0.65)',
    marginTop: -Spacing.xs,
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

  error: {
    ...Typography.caption1,
    color: Colors.emergency,
    textAlign: 'center',
  },

  forgotLink: { alignSelf: 'flex-end' },
  forgotText: {
    ...Typography.caption1,
    color: Colors.accentBlue,
    fontWeight: '600',
  },

  btn: {
    backgroundColor: Colors.accentBlue,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  btnText: { ...Typography.headline, color: '#FFFFFF', fontWeight: '700' },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  signupPrompt: { ...Typography.subhead, color: Colors.textSecondary },
  signupLink:   { ...Typography.subhead, color: Colors.accentBlue, fontWeight: '700' },
});
