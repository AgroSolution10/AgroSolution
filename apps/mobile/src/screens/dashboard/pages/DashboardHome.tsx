import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertasList } from '@/components/AlertasList';
import { EvolucaoFinanceira } from '@/components/EvolucaoFinanceira';
import { FinanceiroResumo } from '@/components/FinanceiroResumo';
import { FiltrosPeriodo, type FiltroPeriodo } from '@/components/FiltrosPeriodo';
import { ProjecaoCaixa } from '@/components/ProjecaoCaixa';
import { RadarCommodities } from '@/components/RadarCommodities';
import { PageScaffold } from '@/screens/dashboard/components/PageScaffold';
import { colors, radius } from '@/theme/colors';
import { Usuario } from '@/screens/auth/cadastro/types';

type DashboardHomeProps = {
  usuario: Usuario;
  desktop: boolean;
  filtro: FiltroPeriodo;
  onFiltroChange: (f: FiltroPeriodo) => void;
};

/**
 * Página inicial (visão geral) do app. Reúne o panorama do dia:
 * radar de commodities, alertas, resumo financeiro e projeções.
 * Os dados ainda são mockados nos componentes — serão ligados aos
 * serviços reais (cotações + financeiro) nas próximas etapas.
 */
export function DashboardHome({ usuario, desktop, filtro, onFiltroChange }: DashboardHomeProps) {
  return (
    <PageScaffold
      desktop={desktop}
      titulo={`Olá, ${primeiroNome(usuario.nome)} 👋`}
      subtitulo="Aqui está o panorama da sua fazenda hoje."
    >
      <FiltrosPeriodo valor={filtro} onChange={onFiltroChange} />

      <RadarCommodities />

      <View style={styles.colunas}>
        <View style={styles.coluna}>
          <AlertasList coords={coordsDoUsuario(usuario)} />
        </View>
        <View style={styles.coluna}>
          <FinanceiroResumo filtro={filtro} />
        </View>
      </View>

      <View style={styles.colunas}>
        <View style={styles.coluna}>
          <EvolucaoFinanceira />
        </View>
        <View style={styles.coluna}>
          <ProjecaoCaixa />
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
        <Pressable style={({ pressed }) => [styles.acaoBtn, pressed && styles.acaoBtnPressed]}>
          <Text style={styles.acaoBtnText}>Ver detalhes →</Text>
        </Pressable>
      </View>
    </PageScaffold>
  );
}

function primeiroNome(nome: string) {
  return (nome ?? 'Produtor').trim().split(' ')[0];
}

/** Deriva a coordenada da fazenda (ou undefined se não houver) para o clima. */
export function coordsDoUsuario(usuario: Usuario) {
  return usuario.latitude != null && usuario.longitude != null
    ? { latitude: usuario.latitude, longitude: usuario.longitude }
    : undefined;
}

const styles = StyleSheet.create({
  colunas: {
    flexDirection: 'row',
    gap: 22,
    flexWrap: 'wrap',
  },
  coluna: {
    flexGrow: 1,
    flexBasis: 320,
  },
  acaoBox: {
    backgroundColor: colors.primarySoft,
    padding: 22,
    borderRadius: radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
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
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  acaoDescricao: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  acaoBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: radius.sm,
  },
  acaoBtnPressed: {
    opacity: 0.85,
  },
  acaoBtnText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
});
