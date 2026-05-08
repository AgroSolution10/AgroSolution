import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AlertasList } from '@/components/AlertasList';
import { FinanceiroResumo } from '@/components/FinanceiroResumo';
import { RadarCommodities } from '@/components/RadarCommodities';
import { Sidebar, type MenuItemId } from '@/components/Sidebar';
import { colors } from '@/theme/colors';
import { Usuario } from '@/screens/auth/cadastro/types';

type DashboardScreenProps = {
  usuario: Usuario;
  onLogout: () => void;
};

export function DashboardScreen({ usuario, onLogout }: DashboardScreenProps) {
  const [paginaAtiva, setPaginaAtiva] = useState<MenuItemId>('dashboard');
  const [menuAberto, setMenuAberto] = useState(false);
  const { width } = useWindowDimensions();
  const desktop = width >= 1024;

  function selecionar(id: MenuItemId) {
    setPaginaAtiva(id);
    setMenuAberto(false);
  }

  return (
    <View style={styles.shell}>
      {desktop && (
        <Sidebar
          ativo={paginaAtiva}
          onSelecionar={selecionar}
          onSair={onLogout}
          usuario={usuario}
        />
      )}

      <View style={styles.main}>
        {!desktop && (
          <View style={styles.mobileHeader}>
            <Pressable
              onPress={() => setMenuAberto(true)}
              style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}
              accessibilityLabel="Abrir menu"
            >
              <Text style={styles.menuBtnIcon}>≡</Text>
              <Text style={styles.menuBtnText}>Menu</Text>
            </Pressable>
            <Text style={styles.brand}>AgroSolution</Text>
            <View style={{ width: 86 }} />
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scroll, !desktop && styles.scrollMobile]}
        >
          <View style={styles.topbar}>
            <Text style={[styles.ola, !desktop && styles.olaMobile]}>
              Olá, {primeiroNome(usuario.nome)} 👋
            </Text>
            <Text style={styles.subtitulo}>
              Aqui está o panorama da sua fazenda hoje.
            </Text>
          </View>

          <RadarCommodities />

          <View style={styles.colunas}>
            <View style={styles.coluna}>
              <AlertasList />
            </View>
            <View style={styles.coluna}>
              <FinanceiroResumo />
            </View>
          </View>

          <View style={styles.acaoBox}>
            <View style={styles.acaoTexto}>
              <Text style={styles.acaoTitulo}>Próxima ação sugerida</Text>
              <Text style={styles.acaoDescricao}>
                Verifique a umidade do solo antes da próxima pulverização. As condições
                devem melhorar nas próximas 24 horas.
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.acaoBtn, pressed && styles.acaoBtnPressed]}
            >
              <Text style={styles.acaoBtnText}>Ver detalhes →</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      {/* Drawer (menu lateral em mobile) — overlay escuro + sidebar deslizante */}
      {!desktop && menuAberto && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setMenuAberto(false)} />
          <View style={styles.drawer}>
            <Sidebar
              ativo={paginaAtiva}
              onSelecionar={selecionar}
              onSair={onLogout}
              usuario={usuario}
              onFechar={() => setMenuAberto(false)}
            />
          </View>
        </>
      )}
    </View>
  );
}

function primeiroNome(nome: string) {
  return (nome ?? 'Produtor').trim().split(' ')[0];
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surfaceSoft,
  },
  main: {
    flex: 1,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    minWidth: 86,
  },
  menuBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  menuBtnIcon: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 22,
  },
  menuBtnText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  brand: {
    color: colors.surface,
    fontWeight: '900',
    fontSize: 17,
  },
  scroll: {
    padding: 24,
    gap: 18,
    paddingBottom: 60,
  },
  scrollMobile: {
    padding: 14,
    gap: 14,
    paddingBottom: 40,
  },
  topbar: {
    gap: 4,
  },
  ola: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  olaMobile: {
    fontSize: 22,
  },
  subtitulo: {
    color: colors.textMuted,
    fontSize: 15,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 30, 20, 0.55)',
    zIndex: 100,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 280,
    maxWidth: '85%',
    zIndex: 200,
    // Row + alignItems padrão ('stretch') faz a Sidebar ocupar 100% da altura.
    flexDirection: 'row',
  },
  colunas: {
    flexDirection: 'row',
    gap: 18,
    flexWrap: 'wrap',
  },
  coluna: {
    flexGrow: 1,
    flexBasis: 320,
  },
  acaoBox: {
    backgroundColor: colors.primary,
    padding: 22,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  acaoTexto: {
    flex: 1,
    minWidth: 240,
    gap: 4,
  },
  acaoTitulo: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '900',
  },
  acaoDescricao: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  acaoBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  acaoBtnPressed: {
    opacity: 0.85,
  },
  acaoBtnText: {
    color: '#1B1F1A',
    fontWeight: '900',
    fontSize: 14,
  },
});
