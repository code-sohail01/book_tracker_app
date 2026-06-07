import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { font } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export type ToastType = 'success' | 'error' | 'info';

type ToastState = {
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors } = theme;
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [opacity]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, type });
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
      hideTimer.current = setTimeout(hide, 3200);
    },
    [hide, opacity],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  const accent =
    toast?.type === 'success'
      ? colors.success
      : toast?.type === 'error'
        ? colors.error
        : colors.primary;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.host, { top: insets.top + 12, opacity }]}>
          <Pressable
            onPress={hide}
            style={[
              styles.toast,
              {
                backgroundColor: colors.surface,
                borderColor: accent,
              },
            ]}>
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <Text style={[styles.message, font('semiBold'), { color: colors.text }]}>
              {toast.message}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 9999,
    elevation: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
});
