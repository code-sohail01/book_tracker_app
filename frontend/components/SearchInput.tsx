import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { font } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  loading?: boolean;
  onClear?: () => void;
};

export default function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search by title, author, or ISBN…',
  loading = false,
  onClear,
}: SearchInputProps) {
  const { theme } = useTheme();
  const { colors, spacing, radius, shadow } = theme;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
          ...shadow.card,
        },
      ]}>
      <Ionicons
        name="search"
        size={20}
        color={colors.textMuted}
        style={[styles.icon, { marginRight: spacing.sm }]}
      />
      <TextInput
        style={[styles.input, font('regular'), { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
      />
      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={[styles.trailing, { marginLeft: spacing.sm }]}
        />
      ) : value.length > 0 ? (
        <Pressable
          onPress={() => (onClear ? onClear() : onChangeText(''))}
          hitSlop={12}
          style={[styles.trailing, { marginLeft: spacing.sm }]}>
          <Ionicons name="close-circle" size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 52,
  },
  icon: {},
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  trailing: {},
});
