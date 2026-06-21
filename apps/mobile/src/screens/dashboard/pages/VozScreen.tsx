import { EmConstrucao } from '@/screens/dashboard/components/EmConstrucao';
import { PageScaffold } from '@/screens/dashboard/components/PageScaffold';

type VozScreenProps = {
  desktop: boolean;
};

/**
 * Comando de Voz — funcionalidade pós-MVP. Mantida no menu como placeholder
 * para sinalizar o roadmap; a implementação fica para depois do núcleo.
 */
export function VozScreen({ desktop }: VozScreenProps) {
  return (
    <PageScaffold
      desktop={desktop}
      titulo="Comando de Voz"
      subtitulo="Consulte cotações e lance dados falando, sem tirar a mão do trabalho."
    >
      <EmConstrucao
        icon="mic"
        titulo="Recurso futuro"
        descricao="O comando de voz está no nosso radar para depois do MVP. A ideia é você perguntar o preço da soja ou registrar um custo apenas falando."
        itens={[
          'Perguntar cotações por voz',
          'Registrar receitas e custos falando',
          'Ouvir o resumo do dia em áudio',
        ]}
      />
    </PageScaffold>
  );
}
