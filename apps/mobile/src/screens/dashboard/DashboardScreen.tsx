import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { type FiltroPeriodo } from '@/components/FiltrosPeriodo';
import { Sidebar, type MenuItemId } from '@/components/Sidebar';
import { contarAlertas } from '@/services/motor-alertas.service';
import { DashboardHome, coordsDoUsuario } from '@/screens/dashboard/pages/DashboardHome';
import { RadarScreen } from '@/screens/dashboard/pages/RadarScreen';
import { AlertasScreen } from '@/screens/dashboard/pages/AlertasScreen';
import { FinanceiroScreen } from '@/screens/dashboard/pages/FinanceiroScreen';
import { TalhoesScreen } from '@/screens/dashboard/pages/TalhoesScreen';
import { ConfiguracoesScreen } from '@/screens/dashboard/pages/ConfiguracoesScreen';
import { VozScreen } from '@/screens/dashboard/pages/VozScreen';
import { colors } from '@/theme/colors';
import { Usuario } from '@/screens/auth/cadastro/types';

type DashboardScreenProps = {
  usuario: Usuario;
  onLogout: () => void;
  onUsuarioAtualizado?: (u: Usuario) => void;
};

export function DashboardScreen({ usuario, onLogout, onUsuarioAtualizado }: DashboardScreenProps) {
  const [paginaAtiva, setPaginaAtiva] = useState<MenuItemId>('dashboard');
  const [menuAberto, setMenuAberto] = useState(false);
  const [filtro, setFiltro] = useState<FiltroPeriodo>({ periodo: 'mes' });
  const [alertasCount, setAlertasCount] = useState(0);
  const { width } = useWindowDimensions();
  const desktop = width >= 1024;

  // Conta os alertas que pedem atenção para o badge. Recarrega ao trocar de
  // página (assim, ao sair da tela Alertas depois de criar/remover, atualiza).
  useEffect(() => {
    let ativo = true;
    contarAlertas(coordsDoUsuario(usuario)).then((n) => {
      if (ativo) setAlertasCount(n);
    });
    return () => {
      ativo = false;
    };
  }, [usuario.latitude, usuario.longitude, paginaAtiva]);

  function selecionar(id: MenuItemId) {
    setPaginaAtiva(id);
    setMenuAberto(false);
  }

  const badges = { alertas: alertasCount };

  return (
    <View style={styles.shell}>
      {desktop && (
        <Sidebar
          ativo={paginaAtiva}
          onSelecionar={selecionar}
          onSair={onLogout}
          usuario={usuario}
          badges={badges}
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
              <Feather name="menu" size={20} color={colors.surface} />
              <Text style={styles.menuBtnText}>Menu</Text>
            </Pressable>
            <Text style={styles.brand}>AgroSolution</Text>
            <View style={{ width: 86 }} />
          </View>
        )}

        <PaginaAtiva
          pagina={paginaAtiva}
          desktop={desktop}
          usuario={usuario}
          filtro={filtro}
          onFiltroChange={setFiltro}
          onUsuarioAtualizado={onUsuarioAtualizado}
        />
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
              badges={badges}
              onFechar={() => setMenuAberto(false)}
            />
          </View>
        </>
      )}
    </View>
  );
}

type PaginaAtivaProps = {
  pagina: MenuItemId;
  desktop: boolean;
  usuario: Usuario;
  filtro: FiltroPeriodo;
  onFiltroChange: (f: FiltroPeriodo) => void;
  onUsuarioAtualizado?: (u: Usuario) => void;
};

/** Roteador por estado: mapeia o item de menu ativo para a página correspondente. */
function PaginaAtiva({
  pagina,
  desktop,
  usuario,
  filtro,
  onFiltroChange,
  onUsuarioAtualizado,
}: PaginaAtivaProps) {
  switch (pagina) {
    case 'dashboard':
      return (
        <DashboardHome
          usuario={usuario}
          desktop={desktop}
          filtro={filtro}
          onFiltroChange={onFiltroChange}
        />
      );
    case 'radar':
      return <RadarScreen desktop={desktop} />;
    case 'alertas':
      return <AlertasScreen desktop={desktop} usuario={usuario} />;
    case 'financeiro':
      return <FinanceiroScreen desktop={desktop} usuario={usuario} />;
    case 'talhoes':
      return <TalhoesScreen desktop={desktop} usuario={usuario} />;
    case 'voz':
      return <VozScreen desktop={desktop} />;
    case 'configuracoes':
      return (
        <ConfiguracoesScreen
          desktop={desktop}
          usuario={usuario}
          onUsuarioAtualizado={onUsuarioAtualizado}
        />
      );
    default:
      return null;
  }
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
});
