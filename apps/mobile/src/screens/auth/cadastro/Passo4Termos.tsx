import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { InfoBox } from '@/components/InfoBox';
import { colors } from '@/theme/colors';
import { passo4Schema } from '@/schemas/cadastro/passo4.schema';
import { Passo4Dados } from './types';

type Passo4TermosProps = {
  dados?: Partial<Passo4Dados>;
  onBack: () => void;
  onFinish: (dados: Passo4Dados) => void;
  loading?: boolean;
};

type Passo4Erros = Partial<Record<keyof Passo4Dados, string>>;

export function Passo4Termos({ dados, onBack, onFinish, loading = false }: Passo4TermosProps) {
  const [aceiteTermos, setAceiteTermos] = useState(dados?.aceiteTermos ?? false);
  const [aceitePrivacidade, setAceitePrivacidade] = useState(dados?.aceitePrivacidade ?? false);
  const [erros, setErros] = useState<Passo4Erros>({});
  const { width } = useWindowDimensions();
  const colunaUnica = width < 520;

  function finalizar() {
    const resultado = passo4Schema.safeParse({ aceiteTermos, aceitePrivacidade });

    if (!resultado.success) {
      setErros(formatarErros(resultado.error));
      return;
    }

    setErros({});
    onFinish(resultado.data);
  }

  const ambosAceitos = aceiteTermos && aceitePrivacidade;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Termos e privacidade</Text>
        <Text style={styles.subtitle}>
          Antes de concluir o cadastro, leia e aceite os termos abaixo. Sem o aceite, sua conta não será criada.
        </Text>
      </View>

      <InfoBox
        title="Por que pedimos isso?"
        text="A Lei Geral de Proteção de Dados (LGPD) exige seu consentimento explícito antes de tratarmos qualquer dado pessoal."
      />

      <ScrollView style={styles.termosBox} contentContainerStyle={styles.termosContent} nestedScrollEnabled>
        <Text style={styles.termosTitulo}>Resumo dos Termos de Uso</Text>
        <Text style={styles.termosParagrafo}>
          Ao usar o AgroSolution, você concorda em fornecer informações verdadeiras sobre sua propriedade e produção,
          utilizar a plataforma apenas para fins lícitos relacionados à gestão da fazenda e respeitar a integridade dos
          dados de outros produtores.
        </Text>

        <Text style={styles.termosTitulo}>Resumo da Política de Privacidade (LGPD)</Text>
        <Text style={styles.termosParagrafo}>
          Coletamos: nome, e-mail, CPF/CNPJ, coordenadas da fazenda, culturas e arquivo de talhões (opcional).
        </Text>
        <Text style={styles.termosParagrafo}>
          Finalidade: prestar previsões hiperlocais de clima, alertas agronômicos e o consultor financeiro do produtor.
        </Text>
        <Text style={styles.termosParagrafo}>
          Base legal: consentimento (art. 7º, I da LGPD) e execução do contrato (art. 7º, V).
        </Text>
        <Text style={styles.termosParagrafo}>
          Seus direitos: acessar, corrigir, exportar e excluir seus dados a qualquer momento na tela "Meu perfil".
        </Text>
        <Text style={styles.termosParagrafo}>
          Compartilhamento: não vendemos dados. Compartilhamos apenas com provedores estritamente necessários (hospedagem
          e serviços de mapa), sob contrato de confidencialidade.
        </Text>
      </ScrollView>

      <View style={styles.checks}>
        <Checkbox
          checked={aceiteTermos}
          onChange={(v) => {
            setAceiteTermos(v);
            if (v) setErros((atual) => ({ ...atual, aceiteTermos: undefined }));
          }}
          label="Li e aceito os Termos de Uso do AgroSolution."
          error={erros.aceiteTermos}
        />
        <Checkbox
          checked={aceitePrivacidade}
          onChange={(v) => {
            setAceitePrivacidade(v);
            if (v) setErros((atual) => ({ ...atual, aceitePrivacidade: undefined }));
          }}
          label="Concordo com o tratamento dos meus dados conforme a Política de Privacidade (LGPD)."
          description="Você pode revogar este consentimento a qualquer momento na tela do seu perfil."
          error={erros.aceitePrivacidade}
        />
      </View>

      <View style={[styles.actions, colunaUnica && styles.column]}>
        <Button title="Voltar" iconLeft="←" variant="secondary" onPress={onBack} style={styles.actionButton} />
        <Button
          title="Criar minha conta"
          iconRight="✓"
          onPress={finalizar}
          loading={loading}
          disabled={!ambosAceitos}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}

function formatarErros(error: z.ZodError<Passo4Dados>): Passo4Erros {
  return error.issues.reduce<Passo4Erros>((acc, issue) => {
    const campo = issue.path[0] as keyof Passo4Dados;
    acc[campo] = issue.message;
    return acc;
  }, {});
}

const styles = StyleSheet.create({
  container: {
    gap: 22,
  },
  header: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 23,
  },
  termosBox: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceSoft,
  },
  termosContent: {
    padding: 16,
    gap: 10,
  },
  termosTitulo: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  termosParagrafo: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  checks: {
    gap: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flexDirection: 'column',
  },
  actionButton: {
    flex: 1,
  },
});
