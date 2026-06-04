import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/config';

type AuthContextType = {
  user: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'userToken';
const USERNAME_KEY = 'username';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [token, username] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USERNAME_KEY),
        ]);
        if (mounted && token && username) {
          setUser(username);
        }
      } catch {
        // Session restore is best-effort on cold start.
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const trimmedIdentifier = identifier.trim();
    const normalizedIdentifier = trimmedIdentifier.includes('@')
      ? trimmedIdentifier.toLowerCase()
      : trimmedIdentifier;

    const loginUrl = `${API_BASE_URL}/api/auth/login`;
    const payload = { identifier: normalizedIdentifier, password };

    console.log('--- AuthContext.login: outgoing request ---');
    console.log('URL:', loginUrl);
    console.log('Payload:', {
      identifier: payload.identifier,
      password: password ? '***' : '(empty)',
    });

    let response: Response;
    try {
      response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (networkError) {
      console.log('AuthContext.login: network error', networkError);
      throw new Error(
        `Cannot reach server at ${API_BASE_URL}. Check Wi‑Fi and API_BASE_URL.`,
      );
    }

    const rawText = await response.text();
    console.log('AuthContext.login: response status', response.status);
    console.log('AuthContext.login: response body', rawText);

    let data: { message?: string; token?: string; user?: { username?: string } };
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      throw new Error(
        `Server returned non-JSON (status ${response.status}). Is the backend running on ${API_BASE_URL}?`,
      );
    }

    if (!response.ok) {
      throw new Error(data.message || 'Login failed. Invalid credentials.');
    }

    if (!data.token || !data.user?.username) {
      throw new Error('Login response missing token or username.');
    }

    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USERNAME_KEY, data.user.username);
    setUser(data.user.username);
  }, []);

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      await login(username, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USERNAME_KEY]);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
