// src/constants/theme.js
// Identidade visual do SatAlert - Sistema de Monitoramento de Queimadas via Satélite

export const COLORS = {
  // Cores primárias
  background: '#0D1B2A',      // Azul escuro espacial (fundo principal)
  surface: '#1B2A3B',         // Superfície de cards
  surfaceLight: '#1E3A5F',    // Cards mais claros
  primary: '#FF6B35',         // Laranja-fogo (alertas, destaque)
  primaryDark: '#CC4A1A',     // Laranja escuro
  secondary: '#00B4D8',       // Ciano-satélite (ações secundárias)
  secondaryDark: '#0077A8',   // Ciano escuro

  // Severidade de alertas
  critical: '#FF2D55',        // Vermelho crítico
  high: '#FF6B35',            // Laranja alto
  medium: '#FFD166',          // Amarelo médio
  low: '#06D6A0',             // Verde baixo

  // Textos
  textPrimary: '#F0F4F8',     // Branco suave
  textSecondary: '#8FA3B1',   // Cinza médio
  textMuted: '#4A6378',       // Cinza escuro/muted

  // Status
  active: '#06D6A0',          // Verde ativo
  inactive: '#4A6378',        // Cinza inativo
  warning: '#FFD166',         // Amarelo aviso

  // Bordas
  border: '#1E3A5F',
  borderLight: '#2A4F70',

  // Overlay
  overlay: 'rgba(0,0,0,0.6)',
  white: '#FFFFFF',
};

export const FONTS = {
  regular: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 100,
};

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
};
