import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { z } from 'zod';
import { Button } from '@/components/Button';
import { InfoBox } from '@/components/InfoBox';
import { Input } from '@/components/Input';
import { MapaLocalizacao } from '@/components/MapaLocalizacao';
import { colors } from '@/theme/colors';
import { passo3Schema } from '@/schemas/cadastro/passo3.schema';
import { Passo3Dados } from './types';

type Passo3LocalizacaoProps = {
  dados?: Partial<Passo3Dados>;
  onBack: () => void;
  onFinish: (dados: Passo3Dados) => void;
  loading?: boolean;
};

type Passo3Erros = Partial<Record<keyof Passo3Dados, string>>;

export function Passo3Localizacao({ dados, onBack, onFinish, loading = false }: Passo3LocalizacaoProps) {
  const [latitude, setLatitude] = useState(dados?.latitude ?? '');
  const [longitude, setLongitude] = useState(dados?.longitude ?? '');
  const [areaTotal, setAreaTotal] = useState(dados?.areaTotal ?? '');
  const [arquivoTalhoes, setArquivoTalhoes] = useState(dados?.arquivoTalhoes ?? '');
  const [erros, setErros] = useState<Passo3Erros>({});
  const { width } = useWindowDimensions();
  const colunaUnica = width < 520;

  function finalizar() {
    const resultado = passo3Schema.safeParse({ latitude, longitude, areaTotal, arquivoTalhoes });

    if (!resultado.success) {
      setErros(formatarErros(resultado.error));
      return;
    }

    setErros({});
    onFinish(resultado.data);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Localização e talhões</Text>
        <Text style={styles.subtitle}>
          Informe as coordenadas da propriedade para garantir precisão do clima em tempo real.
        </Text>
      </View>

      <InfoBox
        title="Por que precisamos disso?"
        text="Com coordenadas exatas, entregamos previsões hiperlocais e alertas específicos para sua região."
      />

      <View style={styles.form}>
        <View style={styles.mapBlock}>
          <Text style={styles.mapLabel}>Localização da fazenda *</Text>
          <MapaLocalizacao
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
              setErros((atual) => ({ ...atual, latitude: undefined, longitude: undefined }));
            }}
          />
          {(erros.latitude || erros.longitude) && (
            <Text style={styles.error}>
              {erros.latitude ?? erros.longitude}
            </Text>
          )}
        </View>

        <Input
          label="Área total (hectares) *"
          value={areaTotal}
          onChangeText={setAreaTotal}
          error={erros.areaTotal}
          keyboardType="decimal-pad"
          placeholder="500"
        />
        <View style={styles.uploadGroup}>
          <Text style={styles.uploadLabel}>Arquivo de talhões (opcional)</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setArquivoTalhoes('talhoes.kml')}
            style={styles.upload}
          >
            <Text style={styles.uploadIcon}>↑</Text>
            <Text style={styles.uploadText}>
              {arquivoTalhoes || 'Toque para anexar KML ou shapefile'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.actions, colunaUnica && styles.column]}>
        <Button title="Voltar" iconLeft="←" variant="secondary" onPress={onBack} style={styles.actionButton} />
        <Button title="Finalizar" iconRight="✓" onPress={finalizar} loading={loading} style={styles.actionButton} />
      </View>
    </View>
  );
}

function formatarErros(error: z.ZodError<Passo3Dados>): Passo3Erros {
  return error.issues.reduce<Passo3Erros>((acc, issue) => {
    const campo = issue.path[0] as keyof Passo3Dados;
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
    textTransform: 'capitalize',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 23,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flexDirection: 'column',
  },
  flex: {
    flex: 1,
  },
  mapBlock: {
    gap: 8,
  },
  mapLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  uploadGroup: {
    gap: 8,
  },
  uploadLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  upload: {
    minHeight: 126,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: 8,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  uploadIcon: {
    color: colors.textSoft,
    fontSize: 32,
    fontWeight: '900',
  },
  uploadText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
});
