import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { font } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_CHECK_MS = 500;

type UsernameStatus = 'idle' | 'checking' | 'available' | 'unavailable';

async function simulateUsernameCheck(username: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, USERNAME_CHECK_MS));
  return username.length >= 3;
}

export default function AuthScreen() {
  const { register, login } = useAuth();
  const { theme } = useTheme();
  const { colors, spacing, radius, shadow } = theme;
  const palette = colors;

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');

  useEffect(() => {
    if (!isRegister) {
      setUsernameStatus('idle');
      return;
    }

    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    let cancelled = false;

    simulateUsernameCheck(trimmed).then((available) => {
      if (!cancelled) {
        setUsernameStatus(available ? 'available' : 'unavailable');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [username, isRegister]);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (isRegister && (!trimmedEmail || !trimmedUsername || !password)) {
      Alert.alert('Missing fields', 'Please fill in email, username, and password.');
      return;
    }

    if (isRegister && !EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert(
        'Invalid email',
        'Enter a valid email address (e.g. name@example.com).',
      );
      return;
    }

    if (isRegister && usernameStatus === 'checking') {
      Alert.alert('Please wait', 'Still checking username availability…');
      return;
    }

    if (isRegister && usernameStatus === 'unavailable') {
      Alert.alert('Username unavailable', 'Choose a username with at least 3 characters.');
      return;
    }

    if (!isRegister && (!trimmedUsername || !password)) {
      Alert.alert('Missing fields', 'Enter your username or email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        setUsernameStatus('checking');
        const available = await simulateUsernameCheck(trimmedUsername);
        if (!available) {
          setUsernameStatus('unavailable');
          Alert.alert('Username unavailable', 'That username is not available. Try another.');
          return;
        }
        setUsernameStatus('available');
        await register(trimmedEmail, trimmedUsername, password);
      } else {
        await login(trimmedUsername, password);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Something went wrong',
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: palette.background },
        scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
        brand: { alignItems: 'center', marginBottom: spacing.lg },
        brandMark: {
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: palette.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md,
        },
        brandLetter: { color: '#fff', fontSize: 28, ...font('extraBold') },
        card: {
          backgroundColor: palette.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: palette.border,
          ...shadow.card,
        },
        title: {
          fontSize: 26,
          ...font('extraBold'),
          color: palette.text,
          textAlign: 'center',
          letterSpacing: -0.5,
        },
        subtitle: {
          fontSize: 15,
          ...font('regular'),
          color: palette.textMuted,
          textAlign: 'center',
          marginTop: spacing.sm,
          marginBottom: spacing.lg,
          lineHeight: 22,
        },
        field: { marginBottom: spacing.md },
        label: {
          fontSize: 13,
          ...font('semiBold'),
          color: palette.textMuted,
          marginBottom: spacing.sm,
          marginLeft: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        input: {
          borderWidth: 1.5,
          borderColor: palette.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: 14,
          fontSize: 16,
          ...font('regular'),
          backgroundColor: palette.inputBg,
          color: palette.text,
        },
        inputFocused: {
          borderColor: palette.primary,
        },
        hint: {
          marginTop: 6,
          marginLeft: 4,
          fontSize: 12,
          ...font('regular'),
          color: palette.textMuted,
        },
        hintSuccess: { color: palette.success },
        hintError: { color: palette.error },
        button: {
          backgroundColor: palette.primary,
          borderRadius: radius.md,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: spacing.sm,
        },
        buttonDisabled: { opacity: 0.65 },
        buttonText: { color: '#fff', fontSize: 16, ...font('bold') },
        toggle: {
          color: palette.primary,
          textAlign: 'center',
          marginTop: spacing.lg,
          fontSize: 15,
          ...font('semiBold'),
        },
      }),
    [palette, spacing, radius, shadow],
  );

  const usernameHint = useCallback(() => {
    if (!isRegister || username.trim().length < 3) return null;
    if (usernameStatus === 'checking') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={styles.hint}>Checking username availability…</Text>
        </View>
      );
    }
    if (usernameStatus === 'available') {
      return <Text style={[styles.hint, styles.hintSuccess]}>Username is available</Text>;
    }
    if (usernameStatus === 'unavailable') {
      return (
        <Text style={[styles.hint, styles.hintError]}>
          Username must be at least 3 characters
        </Text>
      );
    }
    return null;
  }, [isRegister, username, usernameStatus, palette.primary, styles]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>B</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Book Tracker</Text>
            <Text style={styles.subtitle}>
              {isRegister
                ? 'Create your reading profile'
                : 'Welcome back — sign in to continue'}
            </Text>

            {isRegister && (
              <View style={styles.field}>
                <Text style={styles.label}>Email address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>
                {isRegister ? 'Username' : 'Username or email'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={isRegister ? 'Choose a username' : 'Username or email'}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
              {usernameHint()}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isRegister ? 'Create account' : 'Sign in'}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setIsRegister(!isRegister);
                setEmail('');
                setUsernameStatus('idle');
              }}>
              <Text style={styles.toggle}>
                {isRegister
                  ? 'Already have an account? Sign in'
                  : 'New here? Create an account'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
