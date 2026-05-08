import { useState } from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors } from '@/theme/colors';

type InputProps = TextInputProps & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
};

export function Input({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType = 'default',
  ...props
}: InputProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error ? styles.inputError : undefined]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !visible}
          keyboardType={keyboardType}
          placeholderTextColor={colors.textSoft}
          style={styles.input}
          {...props}
        />
        {isPassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => setVisible((current) => !current)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{visible ? 'Ocultar' : 'Ver'}</Text>
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 7,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  inputShell: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#FFF7F6',
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggle: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
});
