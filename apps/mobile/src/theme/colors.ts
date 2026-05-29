export const colors = {
  // Marca
  primary: '#0F5132',
  primaryDark: '#0A3521',
  primarySoft: '#E8F3EE',
  primaryMuted: '#9BB5A6',
  accent: '#FFC107',
  accentSoft: '#FFF8E1',

  // Superfícies
  surface: '#FFFFFF',
  surfaceSoft: '#F7F9F8',
  border: '#DDE4E0',
  borderStrong: '#BFD1C7',
  // Borda quase imperceptível — para divisores em cards "flutuantes".
  borderSoft: '#EEF2F0',

  // Texto
  text: '#1B1F1A',
  textMuted: '#5E6A63',
  textSoft: '#8A958E',

  // Semânticas (cor "forte" + fundo suave para badges/blocos)
  danger: '#B42318',
  dangerSoft: '#FDECEA',
  success: '#1D6B43',
  successSoft: '#E6F4EC',
  warning: '#B7791F',
  warningSoft: '#FFF8E1',
  info: '#3B82F6',
  infoSoft: '#EAF1FE',

  shadow: '#0B2F1D',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Cantos arredondados — quanto maior, mais "suave/clean".
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

// Sombras suaves dão a sensação "flutuante" no lugar de bordas duras.
export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
};
