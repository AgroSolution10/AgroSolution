import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: string;
  iconRight?: string;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.surface : colors.primary} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>
          {iconLeft ? `${iconLeft}  ` : ''}
          {title}
          {iconRight ? `  ${iconRight}` : ''}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    minHeight: 44,
  },
  disabled: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primaryMuted,
  },
  pressed: {
    opacity: 0.86,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryText: {
    color: colors.surface,
  },
  secondaryText: {
    color: colors.text,
  },
  ghostText: {
    color: colors.primary,
  },
});
