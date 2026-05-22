import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stepper } from '@/components/Stepper';
import { cadastrarUsuario } from '@/services/auth.service';
import { colors } from '@/theme/colors';
import {
  CadastroDados,
  Passo1Dados,
  Passo2Dados,
  Passo3Dados,
  Passo4Dados,
  Usuario,
} from './cadastro/types';
import { Passo1Conta } from './cadastro/Passo1Conta';
import { Passo2Producao } from './cadastro/Passo2Producao';
import { Passo3Localizacao } from './cadastro/Passo3Localizacao';
import { Passo4Termos } from './cadastro/Passo4Termos';

type CadastroScreenProps = {
  onSuccess: (usuario: Usuario) => void;
};

export function CadastroScreen({ onSuccess }: CadastroScreenProps) {
  const [passo, setPasso] = useState(1);
  const [dados, setDados] = useState<CadastroDados>({});
  const [loading, setLoading] = useState(false);
  const [erroFinal, setErroFinal] = useState<string | null>(null);

  function salvarPasso1(passo1: Passo1Dados) {
    setErroFinal(null);
    setDados((atual) => ({ ...atual, ...passo1 }));
    setPasso(2);
  }

  function salvarPasso2(passo2: Passo2Dados) {
    setErroFinal(null);
    setDados((atual) => ({ ...atual, ...passo2 }));
    setPasso(3);
  }

  function salvarPasso3(passo3: Passo3Dados) {
    setErroFinal(null);
    setDados((atual) => ({ ...atual, ...passo3 }));
    setPasso(4);
  }

  async function finalizar(passo4: Passo4Dados) {
    const cadastro = { ...dados, ...passo4 };
    setDados(cadastro);
    setLoading(true);
    setErroFinal(null);

    try {
      const usuario = await cadastrarUsuario(cadastro);
      onSuccess(usuario);
    } catch (err) {
      setErroFinal(
        err instanceof Error ? err.message : 'Não foi possível concluir o cadastro.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stepper currentStep={passo} totalSteps={4} />

      {erroFinal && (
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>⚠</Text>
          <Text style={styles.bannerText}>{erroFinal}</Text>
        </View>
      )}

      {passo === 1 && <Passo1Conta dados={dados} onNext={salvarPasso1} />}
      {passo === 2 && (
        <Passo2Producao
          dados={dados}
          onBack={() => setPasso(1)}
          onNext={salvarPasso2}
        />
      )}
      {passo === 3 && (
        <Passo3Localizacao
          dados={dados}
          onBack={() => setPasso(2)}
          onNext={salvarPasso3}
        />
      )}
      {passo === 4 && (
        <Passo4Termos
          dados={dados}
          onBack={() => setPasso(3)}
          onFinish={finalizar}
          loading={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 34,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEE9E7',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    borderRadius: 8,
    padding: 14,
  },
  bannerIcon: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  bannerText: {
    flex: 1,
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});
