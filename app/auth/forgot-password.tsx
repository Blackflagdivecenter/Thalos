import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { getSupabase } from '@/src/db/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  async function handleReset() {
    setError('');
    if (!email.trim()) { setError('Email is required.'); return; }
    setLoading(true);
    try {
      const { error: err } = await getSupabase().auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: 'thalos://auth/reset' },
      );
      if (err) { setError(err.message); return; }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.xl }]}>
        {/* Back */}
        <Pressable style={s.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.accentBlue} />
          <Text style={s.backText}>Back</Text>
        </Pressable>

        <View style={s.content}>
          <View style={s.iconWrap}>
            <Ionicons name="mail" size={48} color={Colors.accentBlue} />
          </View>

          {sent ? (
            <>
              <Text style={s.title}>Email Sent</Text>
              <Text style={s.desc}>
                Check your inbox for a password reset link. It may take a minute to arrive.
              </Text>
              <Pressable
                style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
                onPress={() => router.replace('/auth/login')}
              >
                <Text style={s.btnText}>Back to Login</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={s.title}>Reset Password</Text>
              <Text style={s.desc}>
                Enter your email and we'll send you a reset link.
              </Text>

              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Email</Text>
                <TextInput
                  style={s.fieldInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                />
              </View>

              {error ? <Text style={s.error}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
                onPress={handleReset}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={s.btnText}>Send Reset Email</Text>
                }
              </Pressable>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 4,
  },
  backText: { ...Typography.body, color: Colors.accentBlue },

  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.xxxl,
  },

  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.accentBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },

  title: { ...Typography.title2, fontWeight: '700', color: Colors.thalosNavy },
  desc: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  fieldWrap: { gap: 4, width: '100%' },
  fieldLabel: { ...Typography.footnote, fontWeight: '600', color: Colors.textSecondary },
  fieldInput: {
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.surface,
    width: '100%',
  },

  error: { ...Typography.caption1, color: Colors.emergency, textAlign: 'center' },

  btn: {
    backgroundColor: Colors.accentBlue,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
    marginTop: Spacing.sm,
  },
  btnText: { ...Typography.headline, color: '#FFFFFF', fontWeight: '700' },
});
