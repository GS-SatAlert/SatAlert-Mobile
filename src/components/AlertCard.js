// src/components/AlertCard.js
// Card de alerta exibido na lista de ocorrências

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../constants/theme';

// Mapeamento de severidade → cores e ícones
const SEVERITY_CONFIG = {
  critical: { color: COLORS.critical, icon: 'alert-octagon', label: 'CRÍTICO' },
  high:     { color: COLORS.high,     icon: 'alert-triangle', label: 'ALTO' },
  medium:   { color: COLORS.medium,   icon: 'alert-circle',  label: 'MÉDIO' },
  low:      { color: COLORS.low,      icon: 'info',          label: 'BAIXO' },
};

const STATUS_COLORS = {
  ativo:        COLORS.critical,
  monitorando:  COLORS.warning,
  controlado:   COLORS.active,
};

export default function AlertCard({ alerta, onPress }) {
  const severity = SEVERITY_CONFIG[alerta.severidade] || SEVERITY_CONFIG.medium;
  const statusColor = STATUS_COLORS[alerta.status] || COLORS.textMuted;

  // Formata data para exibição
  const dataFormatada = alerta.dataDeteccao
    ? new Date(alerta.dataDeteccao).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Barra lateral de severidade */}
      <View style={[styles.severityBar, { backgroundColor: severity.color }]} />

      <View style={styles.content}>
        {/* Linha superior: ícone de severidade + título */}
        <View style={styles.topRow}>
          <View style={[styles.iconWrapper, { backgroundColor: severity.color + '22' }]}>
            <Feather name={severity.icon} size={18} color={severity.color} />
          </View>
          <View style={styles.titleWrapper}>
            <Text style={styles.title} numberOfLines={2}>{alerta.titulo}</Text>
          </View>
        </View>

        {/* Região */}
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={13} color={COLORS.textSecondary} />
          <Text style={styles.region}>{alerta.regiao}</Text>
        </View>

        {/* Linha de rodapé: data + área + status */}
        <View style={styles.bottomRow}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={11} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{dataFormatada}</Text>
          </View>

          {alerta.tipoLabel && (
            <View style={styles.metaItem}>
              <Feather
                name={alerta.tipoAlerta === 'DESMATAMENTO' ? 'scissors' : 'thermometer'}
                size={11}
                color={COLORS.textMuted}
              />
              <Text style={styles.metaText}>{alerta.tipoLabel}</Text>
            </View>
          )}

          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {(alerta.statusLabel || alerta.status || 'Ativo').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Seta de navegação */}
      <Feather name="chevron-right" size={18} color={COLORS.textMuted} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  severityBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  region: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
    marginLeft: 'auto',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  chevron: {
    marginRight: SPACING.sm,
  },
});
