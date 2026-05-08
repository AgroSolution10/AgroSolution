import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SidePanel } from '@/components/SidePanel';
import { colors } from '@/theme/colors';
import { CadastroScreen } from '@/screens/auth/CadastroScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { Usuario } from '@/screens/auth/cadastro/types';

type AuthMode = 'cadastro' | 'login';

export default function App() {
  const [mode, setMode] = useState<AuthMode>('cadastro');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  if (usuario) {
    return (
      <>
        <StatusBar style="dark" />
        <DashboardScreen usuario={usuario} onLogout={() => setUsuario(null)} />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDesktop ? 'light' : 'dark'} />
      <View style={[styles.authShell, !isDesktop && styles.authShellMobile]}>
        <SidePanel compact={!isDesktop} />

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={[
            styles.formScrollContent,
            isDesktop ? styles.formScrollDesktop : styles.formScrollMobile,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formWrap}>
            <View style={styles.modeSwitch}>
              <ModeButton label="Criar conta" active={mode === 'cadastro'} onPress={() => setMode('cadastro')} />
              <ModeButton label="Entrar" active={mode === 'login'} onPress={() => setMode('login')} />
            </View>

            {mode === 'cadastro' ? (
              <CadastroScreen onSuccess={setUsuario} />
            ) : (
              <LoginScreen onSuccess={setUsuario} />
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.modeButton, active && styles.modeButtonActive]}
    >
      <Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  authShell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surface,
  },
  authShellMobile: {
    flexDirection: 'column',
  },
  formScroll: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  formScrollContent: {
    flexGrow: 1,
  },
  formScrollDesktop: {
    justifyContent: 'center',
    paddingHorizontal: 64,
    paddingVertical: 42,
  },
  formScrollMobile: {
    paddingHorizontal: 20,
    paddingVertical: 26,
  },
  formWrap: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    gap: 28,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSoft,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '800',
  },
  modeTextActive: {
    color: colors.surface,
  },
});
