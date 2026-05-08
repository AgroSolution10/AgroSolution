import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stepper } from '@/components/Stepper';
import { cadastrarUsuario } from '@/services/auth.service';
import { CadastroDados, Passo1Dados, Passo2Dados, Passo3Dados, Usuario } from './cadastro/types';
import { Passo1Conta } from './cadastro/Passo1Conta';
import { Passo2Producao } from './cadastro/Passo2Producao';
import { Passo3Localizacao } from './cadastro/Passo3Localizacao';

type CadastroScreenProps = {
  onSuccess: (usuario: Usuario) => void;
};

export function CadastroScreen({ onSuccess }: CadastroScreenProps) {
  const [passo, setPasso] = useState(1);
  const [dados, setDados] = useState<CadastroDados>({});
  const [loading, setLoading] = useState(false);

  function salvarPasso1(passo1: Passo1Dados) {
    setDados((atual) => ({ ...atual, ...passo1 }));
    setPasso(2);
  }

  function salvarPasso2(passo2: Passo2Dados) {
    setDados((atual) => ({ ...atual, ...passo2 }));
    setPasso(3);
  }

  async function finalizar(passo3: Passo3Dados) {
    const cadastro = { ...dados, ...passo3 };
    setDados(cadastro);
    setLoading(true);

    try {
      const usuario = await cadastrarUsuario(cadastro);
      onSuccess(usuario);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stepper currentStep={passo} />

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
});
