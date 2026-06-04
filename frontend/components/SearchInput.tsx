import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';

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
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
      />
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} style={styles.trailing} />
      ) : value.length > 0 ? (
        <Pressable
          onPress={() => (onClear ? onClear() : onChangeText(''))}
          hitSlop={12}
          style={styles.trailing}>
          <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: theme.spacing.md,
    minHeight: 52,
    ...theme.shadow.card,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 14,
  },
  trailing: {
    marginLeft: theme.spacing.sm,
  },
});
