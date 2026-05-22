import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { colors } from '@/theme/colors';
import { passo1Schema } from '@/schemas/cadastro/passo1.schema';
import { maskCpfCnpj } from '@/utils/masks';
import { Passo1Dados } from './types';

type Passo1ContaProps = {
  dados?: Partial<Passo1Dados>;
  onNext: (dados: Passo1Dados) => void;
};

type Passo1Erros = Partial<Record<keyof Passo1Dados, string>>;

export function Passo1Conta({ dados, onNext }: Passo1ContaProps) {
  const [nome, setNome] = useState(dados?.nome ?? '');
  const [email, setEmail] = useState(dados?.email ?? '');
  const [cpfCnpj, setCpfCnpj] = useState(dados?.cpfCnpj ?? '');
  const [senha, setSenha] = useState(dados?.senha ?? '');
  const [erros, setErros] = useState<Passo1Erros>({});

  function continuar() {
    const resultado = passo1Schema.safeParse({ nome, email, cpfCnpj, senha });

    if (!resultado.success) {
      setErros(formatarErros(resultado.error));
      return;
    }

    setErros({});
    onNext(resultado.data);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>Informe seus dados para começar o monitoramento da fazenda.</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Nome completo *"
          value={nome}
          onChangeText={setNome}
          error={erros.nome}
          autoCapitalize="words"
          textContentType="name"
        />
        <Input
          label="E-mail *"
          value={email}
          onChangeText={setEmail}
          error={erros.email}
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
        />
        <Input
          label="CPF ou CNPJ *"
          value={cpfCnpj}
          onChangeText={(t) => setCpfCnpj(maskCpfCnpj(t))}
          error={erros.cpfCnpj}
          keyboardType="number-pad"
          placeholder="000.000.000-00"
        />
        <Input
          label="Senha *"
          value={senha}
          onChangeText={setSenha}
          error={erros.senha}
          secureTextEntry
          textContentType="newPassword"
        />
      </View>

      <Button title="Continuar" iconRight="→" onPress={continuar} />
      <Text style={styles.terms}>
        Os Termos de Uso e a Política de Privacidade (LGPD) serão apresentados na última etapa para seu aceite.
      </Text>
    </View>
  );
}

function formatarErros(error: z.ZodError<Passo1Dados>): Passo1Erros {
  return error.issues.reduce<Passo1Erros>((acc, issue) => {
    const campo = issue.path[0] as keyof Passo1Dados;
    acc[campo] = issue.message;
    return acc;
  }, {});
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
  form: {
    gap: 16,
  },
  terms: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
