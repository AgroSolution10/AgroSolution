import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { login } from '@/services/auth.service';
import { colors } from '@/theme/colors';
import { Usuario } from './cadastro/types';

type LoginScreenProps = {
  onSuccess: (usuario: Usuario) => void;
};

const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
  senha: z.string().min(1, 'Informe sua senha.'),
});

type LoginErrors = Partial<Record<'email' | 'senha', string>>;

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<LoginErrors>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function entrar() {
    setErroGeral(null);
    const resultado = loginSchema.safeParse({ email, senha });

    if (!resultado.success) {
      setErros(formatarErros(resultado.error));
      return;
    }

    setErros({});
    setLoading(true);

    try {
      const usuario = await login(resultado.data);
      onSuccess(usuario);
    } catch (err) {
      setErroGeral(
        err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Entrar no AgroSolution</Text>
        <Text style={styles.subtitle}>Acesse os alertas e números principais da sua fazenda.</Text>
      </View>

      <View style={styles.form}>
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
          label="Senha *"
          value={senha}
          onChangeText={setSenha}
          error={erros.senha}
          secureTextEntry
          textContentType="password"
        />
      </View>

      {erroGeral && (
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>⚠</Text>
          <Text style={styles.bannerText}>{erroGeral}</Text>
        </View>
      )}

      <Button title="Entrar" iconRight="→" onPress={entrar} loading={loading} />
    </View>
  );
}

function formatarErros(error: z.ZodError<{ email: string; senha: string }>): LoginErrors {
  return error.issues.reduce<LoginErrors>((acc, issue) => {
    const campo = issue.path[0] as 'email' | 'senha';
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
