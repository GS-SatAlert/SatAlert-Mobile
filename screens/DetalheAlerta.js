// src/screens/DetalheAlerta.js
// Detalhe da Ocorrência — READ detalhado + resolver (PATCH) + remover (DELETE)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import Header from '../components/Header';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { ocorrenciasService } from '../services/api';

const SEVERITY_CONFIG = {
  critical: { color: COLORS.critical, icon: 'alert-octagon', label: 'CRÍTICO' },
  high:     { color: COLORS.high,     icon: 'alert-triangle', label: 'ALTO' },
  medium:   { color: COLORS.medium,   icon: 'alert-circle',  label: 'MÉDIO' },
  low:      { color: COLORS.low,      icon: 'info',          label: 'BAIXO' },
};

const STATUS_CONFIG = {
  ativo:       { color: COLORS.critical },
  monitorando: { color: COLORS.warning },
  controlado:  { color: COLORS.active },
};

const TIPO_ICON = { QUEIMADA: 'thermometer', DESMATAMENTO: 'scissors' };

export default function DetalheAlerta({ route, navigation }) {
  const [alerta, setAlerta] = useState(route.params.alerta);
  const [resolvendo, setResolvendo] = useState(false);
  const [deletando, setDeletando] = useState(false);

  const severity = SEVERITY_CONFIG[alerta.severidade] || SEVERITY_CONFIG.medium;
  const statusCfg = STATUS_CONFIG[alerta.status] || STATUS_CONFIG.ativo;
  const ativa = alerta.statusRaw === 'ATIVO';

  const formatarData = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleResolver = () => {
    Alert.alert(
      'Resolver Ocorrência',
      `Marcar "${alerta.titulo}" como resolvida?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resolver',
          onPress: async () => {
            setResolvendo(true);
            try {
              await ocorrenciasService.resolver(alerta.id);
              setAlerta((prev) => ({
                ...prev,
                status: 'controlado',
                statusLabel: 'Resolvido',
                statusRaw: 'RESOLVIDO',
                dataResolucao: new Date().toISOString().slice(0, 10),
              }));
              Alert.alert('Pronto ✅', 'Ocorrência marcada como resolvida.');
            } catch {
              Alert.alert('Erro', 'Não foi possível resolver a ocorrência.');
            } finally {
              setResolvendo(false);
            }
          },
        },
      ],
    );
  };

  const handleDeletar = () => {
    Alert.alert(
      'Remover Ocorrência',
      `Confirma a remoção de "${alerta.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setDeletando(true);
            try {
              await ocorrenciasService.deletar(alerta.id);
              navigation.goBack();
            } catch {
              Alert.alert('Erro', 'Não foi possível remover esta ocorrência.');
            } finally {
              setDeletando(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Detalhe" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cabeçalho do alerta */}
        <View style={[styles.heroCard, { borderTopColor: severity.color }]}>
          <View style={styles.heroTop}>
            <View style={[styles.severityBadge, { backgroundColor: severity.color + '22' }]}>
              <Feather name={severity.icon} size={16} color={severity.color} />
              <Text style={[styles.severityLabel, { color: severity.color }]}>
                {severity.label}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '22' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
              <Text style={[styles.statusLabel, { color: statusCfg.color }]}>
                {alerta.statusLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.titulo}>{alerta.titulo}</Text>

          <View style={styles.regiaoRow}>
            <Feather name="map-pin" size={15} color={COLORS.textSecondary} />
            <Text style={styles.regiaoText}>{alerta.regiao}</Text>
          </View>

          {/* Chip de tipo de alerta */}
          <View style={styles.tipoChip}>
            <Feather name={TIPO_ICON[alerta.tipoAlerta] || 'alert-triangle'} size={13} color={COLORS.secondary} />
            <Text style={styles.tipoChipText}>{alerta.tipoLabel}</Text>
          </View>
        </View>

        {/* Métricas */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Feather name="clock" size={18} color={COLORS.warning} />
            <Text style={styles.metricValue} numberOfLines={1}>
              {formatarData(alerta.dataDeteccao)}
            </Text>
            <Text style={styles.metricLabel}>Detecção</Text>
          </View>
          <View style={styles.metricCard}>
            <Feather name="check-circle" size={18} color={COLORS.active} />
            <Text style={styles.metricValue} numberOfLines={1}>
              {formatarData(alerta.dataResolucao)}
            </Text>
            <Text style={styles.metricLabel}>Resolução</Text>
          </View>
          <View style={styles.metricCard}>
            <Feather name="radio" size={18} color={COLORS.secondary} />
            <Text style={styles.metricValue} numberOfLines={1}>
              {alerta.nivelRiscoRaw}
            </Text>
            <Text style={styles.metricLabel}>Nível</Text>
          </View>
        </View>

        {/* Descrição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição do Incidente</Text>
          <Text style={styles.descricaoText}>
            {alerta.descricao || 'Sem descrição disponível.'}
          </Text>
        </View>

        {/* Fonte dos dados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fonte dos Dados</Text>
          <View style={styles.fonteRow}>
            <Feather name="radio" size={18} color={COLORS.secondary} />
            <Text style={styles.fonteText}>{alerta.fonte}</Text>
          </View>
        </View>

        {/* Ações */}
        <View style={styles.acoesRow}>
          {ativa && (
            <TouchableOpacity
              style={styles.btnResolver}
              onPress={handleResolver}
              disabled={resolvendo}
            >
              {resolvendo ? (
                <ActivityIndicator size="small" color={COLORS.active} />
              ) : (
                <>
                  <Feather name="check-circle" size={18} color={COLORS.active} />
                  <Text style={styles.btnResolverText}>Resolver</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.btnDeletar}
            onPress={handleDeletar}
            disabled={deletando}
          >
            {deletando ? (
              <ActivityIndicator size="small" color={COLORS.critical} />
            ) : (
              <>
                <Feather name="trash-2" size={18} color={COLORS.critical} />
                <Text style={styles.btnDeletarText}>Remover</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderTopWidth: 4,
    marginBottom: SPACING.lg,
    ...SHADOW.card,
  },
  heroTop: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  severityLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  titulo: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: SPACING.sm,
  },
  regiaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  regiaoText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  tipoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.secondary + '22',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  tipoChipText: {
    color: COLORS.secondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  descricaoText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    lineHeight: 24,
  },
  fonteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  fonteText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  acoesRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  btnResolver: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.active,
  },
  btnResolverText: {
    color: COLORS.active,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
  btnDeletar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.critical,
  },
  btnDeletarText: {
    color: COLORS.critical,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
});
