import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export type MenuItemId =
  | 'dashboard'
  | 'radar'
  | 'alertas'
  | 'financeiro'
  | 'talhoes'
  | 'voz'
  | 'configuracoes';

type MenuItem = {
  id: MenuItemId;
  label: string;
  icon: string;
  badge?: number;
};

const ITENS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'radar', label: 'Radar de Mercado', icon: '◎' },
  { id: 'alertas', label: 'Alertas', icon: '!', badge: 3 },
  { id: 'financeiro', label: 'Financeiro', icon: '$' },
  { id: 'talhoes', label: 'Talhões', icon: '⌖' },
  { id: 'voz', label: 'Comando de Voz', icon: '◌' },
  { id: 'configuracoes', label: 'Configurações', icon: '⚙' },
];

type SidebarProps = {
  ativo: MenuItemId;
  onSelecionar: (id: MenuItemId) => void;
  onSair: () => void;
  usuario: { nome: string; email: string };
  /** Quando passado, exibe um botão X no topo (modo drawer no mobile). */
  onFechar?: () => void;
};

export function Sidebar({ ativo, onSelecionar, onSair, usuario, onFechar }: SidebarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.logoMark}>
          <Text style={styles.logoSymbol}>✓</Text>
        </View>
        <Text style={styles.brandName}>AgroSolution</Text>
        {onFechar && (
          <Pressable
            onPress={onFechar}
            hitSlop={10}
            accessibilityLabel="Fechar menu"
            style={styles.fecharBtn}
          >
            <Text style={styles.fecharIcon}>×</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
        {ITENS.map((item) => {
          const ativoFlag = item.id === ativo;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelecionar(item.id)}
              style={({ pressed }) => [
                styles.item,
                ativoFlag && styles.itemAtivo,
                pressed && !ativoFlag && styles.itemPressed,
              ]}
            >
              <Text style={[styles.icon, ativoFlag && styles.iconAtivo]}>{item.icon}</Text>
              <Text style={[styles.label, ativoFlag && styles.labelAtivo]}>{item.label}</Text>
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.user}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {usuario.nome.trim().charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {usuario.nome || 'Produtor'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {usuario.email}
            </Text>
          </View>
        </View>
        <Pressable onPress={onSair} style={({ pressed }) => [styles.sair, pressed && styles.sairPressed]}>
          <Text style={styles.sairText}>Sair</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    backgroundColor: colors.primary,
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 24,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  fecharBtn: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  fecharIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSymbol: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '900',
  },
  brandName: {
    color: colors.surface,
    fontSize: 19,
    fontWeight: '900',
  },
  menu: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  itemAtivo: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  itemPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  icon: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    width: 22,
    textAlign: 'center',
  },
  iconAtivo: {
    color: colors.accent,
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  labelAtivo: {
    color: colors.surface,
    fontWeight: '800',
  },
  badge: {
    backgroundColor: colors.accent,
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#1B1F1A',
    fontSize: 12,
    fontWeight: '900',
  },
  footer: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    paddingTop: 16,
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#1B1F1A',
    fontSize: 16,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  userEmail: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
  },
  sair: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  sairPressed: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sairText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
});
