import { type ChangeEvent, type CSSProperties, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '@/theme/colors';

export type Periodo = 'mes' | 'mesPassado' | 'trimestre' | 'ano' | 'personalizado';

export type FiltroPeriodo = {
  periodo: Periodo;
  /** 'YYYY-MM-DD' — usados só quando periodo === 'personalizado'. */
  inicio?: string;
  fim?: string;
};

const OPCOES: { id: Periodo; label: string }[] = [
  { id: 'mes', label: 'Este mês' },
  { id: 'mesPassado', label: 'Mês passado' },
  { id: 'trimestre', label: 'Trimestre' },
  { id: 'ano', label: 'Ano' },
  { id: 'personalizado', label: 'Personalizado' },
];

type FiltrosPeriodoProps = {
  valor: FiltroPeriodo;
  onChange: (filtro: FiltroPeriodo) => void;
};

export function FiltrosPeriodo({ valor, onChange }: FiltrosPeriodoProps) {
  // Datas locais do modo personalizado (default: do 1º dia do mês até hoje).
  const [inicio, setInicio] = useState(valor.inicio ?? primeiroDiaDoMes());
  const [fim, setFim] = useState(valor.fim ?? hojeIso());

  const personalizado = valor.periodo === 'personalizado';
  const datasInvalidas = !validaData(inicio) || !validaData(fim) || inicio > fim;

  function selecionar(id: Periodo) {
    if (id === 'personalizado') {
      onChange({ periodo: 'personalizado', inicio, fim });
    } else {
      onChange({ periodo: id });
    }
  }

  function aplicarDatas(novoInicio: string, novoFim: string) {
    setInicio(novoInicio);
    setFim(novoFim);
    if (validaData(novoInicio) && validaData(novoFim) && novoInicio <= novoFim) {
      onChange({ periodo: 'personalizado', inicio: novoInicio, fim: novoFim });
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.barra}>
        {OPCOES.map((op) => {
          const ativo = op.id === valor.periodo;
          return (
            <Pressable
              key={op.id}
              onPress={() => selecionar(op.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativo }}
              style={({ pressed }) => [
                styles.pill,
                ativo && styles.pillAtivo,
                pressed && !ativo && styles.pillPressed,
              ]}
            >
              <Text style={[styles.texto, ativo && styles.textoAtivo]}>{op.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {personalizado && (
        <View style={styles.datas}>
          <CampoData label="De" valor={inicio} onChange={(v) => aplicarDatas(v, fim)} />
          <CampoData label="Até" valor={fim} onChange={(v) => aplicarDatas(inicio, v)} />
          {datasInvalidas ? (
            <Text style={styles.aviso}>Informe datas válidas (AAAA-MM-DD), com “De” ≤ “Até”.</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

function CampoData({
  label,
  valor,
  onChange,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      {Platform.OS === 'web' ? (
        // No web usamos o seletor de calendário nativo do navegador.
        // O value de <input type="date"> já é 'YYYY-MM-DD' — bate com o formato guardado.
        <input
          type="date"
          value={valor}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          style={webDateStyle}
        />
      ) : (
        <TextInput
          value={valor}
          onChangeText={onChange}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={colors.textSoft}
          autoCapitalize="none"
          style={styles.campoInput}
        />
      )}
    </View>
  );
}

// Estilo do seletor de data nativo (web) — espelha o visual e a tipografia
// dos demais campos do app (o default do <input type="date"> foge do padrão).
const webDateStyle: CSSProperties = {
  minWidth: 150,
  height: 42,
  boxSizing: 'border-box',
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  backgroundColor: colors.surface,
  padding: '0 12px',
  color: colors.text,
  fontSize: 15,
  fontWeight: 600,
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  outlineColor: colors.primary,
};

function validaData(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function primeiroDiaDoMes() {
  return hojeIso().slice(0, 8) + '01';
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  barra: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 5,
    alignSelf: 'flex-start',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  pillAtivo: {
    backgroundColor: colors.primary,
  },
  pillPressed: {
    backgroundColor: colors.surfaceSoft,
  },
  texto: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  textoAtivo: {
    color: colors.surface,
  },
  datas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 10,
  },
  campo: {
    gap: 5,
  },
  campoLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  campoInput: {
    minWidth: 140,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 15,
  },
  aviso: {
    color: colors.danger,
    fontSize: 12,
    flexBasis: '100%',
  },
});
