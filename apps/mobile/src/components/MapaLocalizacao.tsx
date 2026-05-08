import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { colors } from '@/theme/colors';

// Pin customizado em SVG (sem depender de imagens externas do Leaflet, que
// quebram com o bundler). Cor do AgroSolution + círculo branco no centro.
const PIN_AGRO = L.divIcon({
  className: 'agro-pin',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
      <path d="M17 0C7.611 0 0 7.611 0 17c0 12.75 17 29 17 29s17-16.25 17-29C34 7.611 26.389 0 17 0z" fill="#0F5132" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="17" cy="17" r="6" fill="#FFFFFF"/>
    </svg>
  `,
  iconSize: [34, 46],
  iconAnchor: [17, 46],
});

const COORD_PADRAO: [number, number] = [-15.7801, -47.9292];

type MapaProps = {
  latitude: string;
  longitude: string;
  onChange: (lat: string, lng: string) => void;
};

export function MapaLocalizacao({ latitude, longitude, onChange }: MapaProps) {
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          O mapa interativo está disponível só na versão web por enquanto.
        </Text>
      </View>
    );
  }
  return <MapaWeb latitude={latitude} longitude={longitude} onChange={onChange} />;
}

function MapaWeb({ latitude, longitude, onChange }: MapaProps) {
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState('');

  const lat = parseFloat(latitude.replace(',', '.'));
  const lng = parseFloat(longitude.replace(',', '.'));
  const temCoord = Number.isFinite(lat) && Number.isFinite(lng);
  const center = useMemo<[number, number]>(
    () => (temCoord ? [lat, lng] : COORD_PADRAO),
    [lat, lng, temCoord],
  );

  function selecionar(latNum: number, lngNum: number) {
    onChange(latNum.toFixed(6), lngNum.toFixed(6));
  }

  async function buscarEndereco() {
    const termo = busca.trim();
    if (!termo) return;
    setBuscando(true);
    setErroBusca('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(termo)}&limit=1&countrycodes=br`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (data.length === 0) {
        setErroBusca('Endereço não encontrado.');
        return;
      }
      selecionar(parseFloat(data[0].lat), parseFloat(data[0].lon));
    } catch {
      setErroBusca('Erro ao buscar. Tente novamente.');
    } finally {
      setBuscando(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchRow}>
        <TextInput
          value={busca}
          onChangeText={setBusca}
          onSubmitEditing={buscarEndereco}
          placeholder="Buscar cidade, fazenda ou endereço"
          placeholderTextColor={colors.textSoft}
          style={styles.searchInput}
        />
        <Pressable
          onPress={buscarEndereco}
          disabled={buscando}
          style={({ pressed }) => [styles.searchBtn, pressed && styles.searchBtnPressed]}
        >
          <Text style={styles.searchBtnText}>{buscando ? '...' : 'Buscar'}</Text>
        </Pressable>
      </View>
      {erroBusca ? <Text style={styles.error}>{erroBusca}</Text> : null}

      <View style={styles.mapShell}>
        <MapContainer
          center={center}
          zoom={temCoord ? 13 : 4}
          scrollWheelZoom
          style={{ height: 360, width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Pino temCoord={temCoord} center={center} onSelect={selecionar} />
          <Recentralizar center={center} />
        </MapContainer>
      </View>

      <Text style={styles.confirma}>
        {temCoord
          ? `Local selecionado: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
          : 'Clique no mapa ou busque um endereço para marcar a fazenda.'}
      </Text>
    </View>
  );
}

function Pino({
  temCoord,
  center,
  onSelect,
}: {
  temCoord: boolean;
  center: [number, number];
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  if (!temCoord) return null;
  return (
    <Marker
      position={center}
      icon={PIN_AGRO}
      draggable
      eventHandlers={{
        dragend(e) {
          const pos = e.target.getLatLng();
          onSelect(pos.lat, pos.lng);
        },
      }}
    />
  );
}

function Recentralizar({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 8,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
  },
  searchBtn: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnPressed: { opacity: 0.85 },
  searchBtnText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  mapShell: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  confirma: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  fallback: {
    minHeight: 160,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fallbackText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
