import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { MapaLocalizacao } from '@/components/MapaLocalizacao';
import { criarTalhao } from '@/services/talhoes.service';
import { maskDecimal, parseDecimal } from '@/utils/masks';
import { colors, radius, shadows } from '@/theme/colors';

const CULTURAS = [
  { id: 'soja', label: 'Soja' },
  { id: 'milho', label: 'Milho' },
  { id: 'algodao', label: 'Algodão' },
  { id: 'pecuaria', label: 'Pecuária' },
];

type TalhaoFormModalProps = {
  fazendaId: string;
  /** Coordenada da sede da fazenda (do banco) — vira referência no mapa. */
  fazendaCoord?: { latitude: number; longitude: number };
  onFechar: () => void;
  onSalvo: () => void;
};

export function TalhaoFormModal({ fazendaId, fazendaCoord, onFechar, onSalvo }: TalhaoFormModalProps) {
  const [nome, setNome] = useState('');
  const [cultura, setCultura] = useState<string | null>(null);
  const [area, setArea] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setErro(null);
    if (!nome.trim()) {
      setErro('Dê um nome ao talhão.');
      return;
    }
    const areaNum = parseDecimal(area);
    const lat = parseFloat(latitude.replace(',', '.'));
    const lng = parseFloat(longitude.replace(',', '.'));

    setSalvando(true);
    try {
      await criarTalhao(fazendaId, {
        nome,
        cultura,
        areaHa: Number.isFinite(areaNum) && areaNum > 0 ? areaNum : null,
        latitude: Number.isFinite(lat) ? lat : null,
        longitude: Number.isFinite(lng) ? lng : null,
      });
      onSalvo();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
      setSalvando(false);
    }
  }

  return (
    <>
      <Pressable style={styles.backdrop} onPress={salvando ? undefined : onFechar} />
      <View style={styles.centro} pointerEvents="box-none">
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.cardConteudo} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.titulo}>Novo talhão</Text>
              <Pressable onPress={onFechar} hitSlop={10} accessibilityLabel="Fechar">
                <Text style={styles.fechar}>×</Text>
              </Pressable>
            </View>

            <Input label="Nome do talhão" value={nome} onChangeText={setNome} placeholder="Ex.: Talhão A1" />

            <View style={styles.bloco}>
              <Text style={styles.label}>Cultura (opcional)</Text>
              <View style={styles.culturas}>
                {CULTURAS.map((c) => {
                  const ativa = cultura === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCultura(ativa ? null : c.id)}
                      style={[styles.culturaPill, ativa && styles.culturaPillAtiva]}
                    >
                      <Text style={[styles.culturaText, ativa && styles.culturaTextAtiva]}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Input
              label="Área (ha) — opcional"
              value={area}
              onChangeText={(t) => setArea(maskDecimal(t))}
              keyboardType="numeric"
              placeholder="Ex.: 150,5"
            />

            <View style={styles.bloco}>
              <Text style={styles.label}>Localização no mapa (opcional)</Text>
              <MapaLocalizacao
                latitude={latitude}
                longitude={longitude}
                referencia={fazendaCoord ? { ...fazendaCoord, label: 'Sede da fazenda' } : undefined}
                onChange={(la, lo) => {
                  setLatitude(la);
                  setLongitude(lo);
                }}
              />
            </View>

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <View style={styles.acoes}>
              <Button title="Cancelar" variant="secondary" onPress={onFechar} style={styles.acaoBtn} />
              <Button title="Salvar talhão" onPress={salvar} loading={salvando} style={styles.acaoBtn} />
            </View>
          </ScrollView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 30, 20, 0.55)',
    zIndex: 300,
  },
  centro: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 400,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  cardConteudo: {
    padding: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
  },
  fechar: {
    color: colors.textMuted,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 26,
  },
  bloco: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  culturas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  culturaPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  culturaPillAtiva: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  culturaText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  culturaTextAtiva: {
    color: colors.primary,
  },
  erro: {
    color: colors.danger,
    fontSize: 13,
  },
  acoes: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  acaoBtn: {
    flex: 1,
  },
});
