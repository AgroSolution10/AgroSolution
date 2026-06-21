import 'leaflet/dist/leaflet.css';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { colors } from '@/theme/colors';

const PIN_AGRO = L.divIcon({
  className: 'agro-pin-talhao',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 34 46">
      <path d="M17 0C7.611 0 0 7.611 0 17c0 12.75 17 29 17 29s17-16.25 17-29C34 7.611 26.389 0 17 0z" fill="#0F5132" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="17" cy="17" r="6" fill="#FFFFFF"/>
    </svg>
  `,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

// Pino da sede da fazenda (amarelo) — referência distinta dos talhões.
const PIN_FAZENDA = L.divIcon({
  className: 'agro-pin-fazenda',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 34 46">
      <path d="M17 0C7.611 0 0 7.611 0 17c0 12.75 17 29 17 29s17-16.25 17-29C34 7.611 26.389 0 17 0z" fill="#FFC107" stroke="#1B1F1A" stroke-width="2"/>
      <circle cx="17" cy="17" r="6" fill="#1B1F1A"/>
    </svg>
  `,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

export type PontoTalhao = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
};

type MapaTalhoesProps = {
  pontos: PontoTalhao[];
  /** Sede da fazenda (do banco) — mostrada como referência + centro inicial. */
  fazenda?: { latitude: number; longitude: number };
};

/** Mapa somente leitura com a sede da fazenda + um pino por talhão. */
export function MapaTalhoes({ pontos, fazenda }: MapaTalhoesProps) {
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>O mapa está disponível só na versão web por enquanto.</Text>
      </View>
    );
  }

  const centro: [number, number] = fazenda
    ? [fazenda.latitude, fazenda.longitude]
    : pontos[0]
      ? [pontos[0].latitude, pontos[0].longitude]
      : [-15.78, -47.93];

  return (
    <View style={styles.shell}>
      <MapContainer center={centro} zoom={11} scrollWheelZoom style={{ height: 320, width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {fazenda ? (
          <Marker position={[fazenda.latitude, fazenda.longitude]} icon={PIN_FAZENDA}>
            <Tooltip>Sede da fazenda</Tooltip>
          </Marker>
        ) : null}
        {pontos.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={PIN_AGRO}>
            <Tooltip>{p.nome}</Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
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
