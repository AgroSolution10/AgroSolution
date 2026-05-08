import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { Usuario } from '@/screens/auth/cadastro/types';

type DashboardScreenProps = {
  usuario: Usuario;
  onLogout: () => void;
};

const culturaLabel: Record<string, string> = {
  soja: 'Soja',
  milho: 'Milho',
  algodao: 'Algodão',
  pecuaria: 'Pecuária',
};

export function DashboardScreen({ usuario, onLogout }: DashboardScreenProps) {
  const culturas = usuario.culturas.map((cultura) => culturaLabel[cultura] ?? cultura).join(', ');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.brand}>AgroSolution</Text>
          <Text style={styles.greeting}>Olá, {usuario.nome}</Text>
        </View>
        <Button title="Sair" variant="secondary" onPress={onLogout} style={styles.logoutButton} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Resumo da fazenda</Text>
        <Text style={styles.heroText}>
          Dados essenciais para decidir rápido, mesmo no meio do campo.
        </Text>
      </View>

      <View style={styles.cards}>
        <InfoCard title="Clima agora" value="24°C" detail="Chuva leve prevista para 18h" />
        <InfoCard title="Área monitorada" value={`${usuario.areaTotal ?? '500'} ha`} detail="Talhões prontos para alertas" />
        <InfoCard title="Produção" value={culturas || 'Não informado'} detail="Radar personalizado por atividade" />
      </View>

      <View style={styles.alertBox}>
        <Text style={styles.alertTitle}>Próxima ação sugerida</Text>
        <Text style={styles.alertText}>
          Verifique a umidade do solo antes da próxima pulverização. As condições devem melhorar nas próximas 24 horas.
        </Text>
      </View>
    </ScrollView>
  );
}

function InfoCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
  },
  content: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    padding: 24,
    gap: 22,
  },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  brand: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  greeting: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 6,
  },
  logoutButton: {
    minWidth: 96,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 24,
    gap: 8,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '900',
  },
  heroText: {
    color: colors.primarySoft,
    fontSize: 16,
    lineHeight: 24,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    flexGrow: 1,
    flexBasis: 260,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  cardValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  cardDetail: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  alertBox: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    padding: 20,
    gap: 8,
  },
  alertTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  alertText: {
    color: colors.success,
    fontSize: 15,
    lineHeight: 23,
  },
});
