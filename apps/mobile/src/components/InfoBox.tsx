import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

type InfoBoxProps = {
  icon?: string;
  title: string;
  text: string;
};

export function InfoBox({ icon = '⌖', title, text }: InfoBoxProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    padding: 18,
  },
  icon: {
    color: colors.primary,
    fontSize: 18,
    lineHeight: 24,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  text: {
    color: colors.success,
    fontSize: 14,
    lineHeight: 21,
  },
});
