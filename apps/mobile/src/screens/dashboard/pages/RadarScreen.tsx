import { RadarCommodities } from '@/components/RadarCommodities';
import { EmConstrucao } from '@/screens/dashboard/components/EmConstrucao';
import { PageScaffold } from '@/screens/dashboard/components/PageScaffold';

type RadarScreenProps = {
  desktop: boolean;
};

/**
 * Radar de Mercado — a função-núcleo do AgroSolution. Hoje exibe o painel de
 * cotações (ainda com dados mockados em RadarCommodities). Próxima etapa:
 * ligar ao serviço de cotações real e adicionar histórico/gráficos.
 */
export function RadarScreen({ desktop }: RadarScreenProps) {
  return (
    <PageScaffold
      desktop={desktop}
      titulo="Radar de Mercado"
      subtitulo="Acompanhe as cotações das commodities que importam para a sua fazenda."
    >
      <RadarCommodities />

      <EmConstrucao
        icon="trending-up"
        titulo="Cotações ao vivo e histórico chegando"
        descricao="Os preços acima ainda são exemplos. Estamos conectando o radar a fontes reais de mercado para você acompanhar a evolução e decidir a melhor hora de vender."
        itens={[
          'Preços reais (CEPEA + câmbio USD/BRL) atualizados diariamente',
          'Gráfico de histórico por commodity',
          'Filtro pelas culturas da sua fazenda',
          'Definição de preço-alvo com alerta automático',
        ]}
      />
    </PageScaffold>
  );
}
