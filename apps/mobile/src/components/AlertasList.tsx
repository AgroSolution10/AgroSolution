import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  carregarAlertasGerados,
  type AlertaGerado,
  type Coordenada,
  type SeveridadeAlerta,
} from '@/services/motor-alertas.service';
import { colors, radius, shadows } from '@/theme/colors';

const CORES_FUNDO: Record<SeveridadeAlerta, string> = {
  positivo: colors.successSoft,
  info: colors.infoSoft,
  aviso: colors.warningSoft,
  critico: colors.dangerSoft,
};

const CORES_BORDA: Record<SeveridadeAlerta, string> = {
  positivo: colors.success,
  info: colors.info,
  aviso: colors.accent,
  critico: colors.danger,
};

type AlertasListProps = {
  /** Coordenada da fazenda — habilita os alertas de clima. */
  coords?: Coordenada;
  /** Muda este valor para recarregar (ex.: após mexer em dados). */
  refreshKey?: number;
};

export function AlertasList({ coords, refreshKey = 0 }: AlertasListProps) {
  const [alertas, setAlertas] = useState<AlertaGerado[] | null>(null);
  const chaveCoords = coords ? `${coords.latitude},${coords.longitude}` : '';

  useEffect(() => {
    let ativo = true;
    setAlertas(null);
    carregarAlertasGerados(coords).then((dados) => {
      if (ativo) setAlertas(dados);
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveCoords, refreshKey]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alertas inteligentes</Text>
        {alertas && alertas.length > 0 ? (
          <View style={styles.contador}>
            <Text style={styles.contadorText}>{alertas.length}</Text>
          </View>
        ) : null}
      </View>

      {alertas === null ? (
        <View style={styles.estado}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : alertas.length === 0 ? (
        <View style={styles.estado}>
          <Feather name="check-circle" size={22} color={colors.success} />
          <Text style={styles.vazio}>Tudo sob controle — nenhum alerta no momento.</Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {alertas.map((alerta) => (
            <ItemAlerta key={alerta.id} alerta={alerta} />
          ))}
        </View>
      )}
    </View>
  );
}

function ItemAlerta({ alerta }: { alerta: AlertaGerado }) {
  return (
    <View
      style={[
        styles.item,
        { backgroundColor: CORES_FUNDO[alerta.severidade], borderLeftColor: CORES_BORDA[alerta.severidade] },
      ]}
    >
      <View style={[styles.bullet, { backgroundColor: CORES_BORDA[alerta.severidade] }]} />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{alerta.titulo}</Text>
        <Text style={styles.itemText}>{alerta.texto}</Text>
        {alerta.quando ? <Text style={styles.itemQuando}>{alerta.quando}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    gap: 16,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  contador: {
    backgroundColor: colors.primarySoft,
    minWidth: 26,
    height: 24,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  estado: {
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  vazio: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  lista: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderLeftWidth: 3,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  itemText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  itemQuando: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
