import { Colors } from '@/constants/Colors';

/** Inter font family keys — loaded via useFonts in app/_layout.tsx */
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

export type ThemeColors = {
  primary: string;
  primaryDark: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  error: string;
  chipSelectedBg: string;
  chipSelectedBorder: string;
  heroTop: string;
  heroBottom: string;
  inputBg: string;
  overlay: string;
  tabIconActiveBg: string;
};

export type AppTheme = {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  shadow: {
    card: object;
    tabBar: object;
  };
  fonts: typeof FontFamily;
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  tabBar: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
} as const;

const shared = { spacing, radius, shadow, fonts: FontFamily };

export const lightTheme: AppTheme = {
  ...shared,
  colors: {
    primary: Colors.primary,
    primaryDark: Colors.primaryDark,
    background: Colors.background,
    surface: Colors.surface,
    text: Colors.text,
    textMuted: Colors.textMuted,
    border: Colors.border,
    success: Colors.success,
    error: Colors.error,
    chipSelectedBg: '#EFF6FF',
    chipSelectedBorder: Colors.primary,
    heroTop: '#DBEAFE',
    heroBottom: '#EFF6FF',
    inputBg: '#F8FAFC',
    overlay: 'rgba(15,23,42,0.55)',
    tabIconActiveBg: '#EFF6FF',
  },
};

export const darkTheme: AppTheme = {
  ...shared,
  colors: {
    primary: Colors.primary,
    primaryDark: Colors.primaryDark,
    background: '#0B1220',
    surface: '#151D2E',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    border: '#334155',
    success: Colors.success,
    error: Colors.error,
    chipSelectedBg: '#1E3A5F',
    chipSelectedBorder: Colors.primary,
    heroTop: '#1E3A5F',
    heroBottom: '#151D2E',
    inputBg: '#1E293B',
    overlay: 'rgba(15,23,42,0.55)',
    tabIconActiveBg: '#1E3A5F',
  },
};

/** Apply Inter to any StyleSheet text rule: `{ ...font('semiBold'), fontSize: 16 }` */
export function font(weight: keyof typeof FontFamily) {
  return { fontFamily: FontFamily[weight] };
}

/** @deprecated Use lightTheme/darkTheme via useTheme() */
export const theme = {
  colors: Colors,
  spacing,
  radius,
  shadow,
  fonts: FontFamily,
};
