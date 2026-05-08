import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Button } from '@/components/Button';
import { CulturaCard } from '@/components/CulturaCard';
import { colors } from '@/theme/colors';
import { passo2Schema } from '@/schemas/cadastro/passo2.schema';
import { Cultura, Passo2Dados } from './types';

type Passo2ProducaoProps = {
  dados?: Partial<Passo2Dados>;
  onBack: () => void;
  onNext: (dados: Passo2Dados) => void;
};

const culturasDisponiveis: Array<{ value: Cultura; nome: string; icon: string }> = [
  { value: 'soja', nome: 'Soja', icon: 'S' },
  { value: 'milho', nome: 'Milho', icon: 'M' },
  { value: 'algodao', nome: 'Algodão', icon: 'A' },
  { value: 'pecuaria', nome: 'Pecuária', icon: 'P' },
];

export function Passo2Producao({ dados, onBack, onNext }: Passo2ProducaoProps) {
  const [culturas, setCulturas] = useState<Cultura[]>(dados?.culturas ?? []);
  const [erro, setErro] = useState('');
  const { width } = useWindowDimensions();
  const colunaUnica = width < 430;

  function alternarCultura(cultura: Cultura) {
    setCulturas((atuais) =>
      atuais.includes(cultura)
        ? atuais.filter((item) => item !== cultura)
        : [...atuais, cultura],
    );
    setErro('');
  }

  function continuar() {
    const resultado = passo2Schema.safeParse({ culturas });

    if (!resultado.success) {
      setErro(resultado.error.issues[0]?.message ?? 'Selecione uma atividade.');
      return;
    }

    onNext(resultado.data);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sua produção</Text>
        <Text style={styles.subtitle}>
          Selecione as culturas e atividades da propriedade para personalizar o radar.
        </Text>
      </View>

      <View style={styles.grid}>
        {[0, 2].map((start) => (
          <View key={start} style={[styles.row, colunaUnica && styles.column]}>
            {culturasDisponiveis.slice(start, start + 2).map((cultura) => (
              <CulturaCard
                key={cultura.value}
                {...cultura}
                selecionado={culturas.includes(cultura.value)}
                onPress={alternarCultura}
              />
            ))}
          </View>
        ))}
      </View>

      {erro ? <Text style={styles.error}>{erro}</Text> : null}

      <View style={[styles.actions, colunaUnica && styles.column]}>
        <Button title="Voltar" iconLeft="←" variant="secondary" onPress={onBack} style={styles.actionButton} />
        <Button title="Continuar" iconRight="→" onPress={continuar} style={styles.actionButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
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
  grid: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flexDirection: 'column',
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
});
