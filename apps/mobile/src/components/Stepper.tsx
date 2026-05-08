import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

type StepperProps = {
  currentStep: number;
  totalSteps?: number;
};

export function Stepper({ currentStep, totalSteps = 3 }: StepperProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const completed = step < currentStep;
        const active = step === currentStep;

        return (
          <View key={step} style={styles.item}>
            <View style={[styles.circle, (active || completed) && styles.circleActive]}>
              <Text style={[styles.circleText, (active || completed) && styles.circleTextActive]}>
                {completed ? '✓' : step}
              </Text>
            </View>
            {step < totalSteps && (
              <View style={[styles.line, step < currentStep && styles.lineActive]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E7EBEF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'transparent',
  },
  circleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primarySoft,
  },
  circleText: {
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: '700',
  },
  circleTextActive: {
    color: colors.surface,
  },
  line: {
    height: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  lineActive: {
    backgroundColor: colors.primary,
  },
});
