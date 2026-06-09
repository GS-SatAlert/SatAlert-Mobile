// src/screens/MapaAlertas.js
// Tela 2: Mapa de Alertas — dashboard principal com alertas ativos por região

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { ocorrenciasService, extractContent } from '../services/api';
import { mapOcorrencia } from '../services/mappers';
import LoadingOverlay from '../components/LoadingOverlay';

// Mapeamento visual de severidade
const SEVERITY_CONFIG = {
  critical: { color: COLORS.critical, label: 'Crítico' },
  high:     { color: COLORS.high,     label: 'Alto'    },
  medium:   { color: COLORS.medium,   label: 'Médio'   },
  low:      { color: COLORS.low,      label: 'Baixo'   },
};

export default function MapaAlertas({ navigation }) {
  const [alertas, setAlertas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [filtroAtivo, setFiltroAtivo] = useState('todos');

  // Carrega usuário logado
  useEffect(() => {
    const carregarUsuario = async () => {
      const data = await AsyncStorage.getItem('@satalert:usuario');
      if (data) setUsuario(JSON.parse(data));
    };
    carregarUsuario();
  }, []);

  const carregarAlertas = async (refresh = false) => {
    if (refresh) setAtualizando(true);
    try {
      const response = await ocorrenciasService.listar();
      const lista = extractContent(response.data).map(mapOcorrencia);
      setAlertas(lista);
    } catch {
      // Mantém os dados anteriores em caso de falha de rede
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => carregarAlertas());
    return unsubscribe;
  }, [navigation]);

  // Filtros de severidade
  const alertasFiltrados =
    filtroAtivo === 'todos'
      ? alertas
      : alertas.filter((a) => a.severidade === filtroAtivo);

  // Contagens para os cards de resumo
  const totalAtivos = alertas.filter((a) => a.status === 'ativo').length;
  const totalCriticos = alertas.filter((a) => a.severidade === 'critical').length;

  if (carregando) return <LoadingOverlay mensagem="Buscando dados de satélite..." />;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header customizado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Olá, {usuario?.nome?.split(' ')[0] || 'Agente'} 👋
          </Text>
          <Text style={styles.headerTitle}>SatAlert Dashboard</Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('NovoAlerta')}
        >
          <Feather name="plus" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregarAlertas(true)}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Cards de resumo */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: COLORS.critical }]}>
            <Feather name="alert-octagon" size={22} color={COLORS.critical} />
            <Text style={styles.summaryNum}>{totalCriticos}</Text>
            <Text style={styles.summaryLabel}>Críticos</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: COLORS.high }]}>
            <Feather name="flame" size={22} color={COLORS.high} />
            <Text style={styles.summaryNum}>{totalAtivos}</Text>
            <Text style={styles.summaryLabel}>Ativos</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: COLORS.secondary }]}>
            <Feather name="radio" size={22} color={COLORS.secondary} />
            <Text style={styles.summaryNum}>{alertas.length}</Text>
            <Text style={styles.summaryLabel}>Monitorados</Text>
          </View>
        </View>

        {/* Visualização de mapa simulado */}
        <View style={styles.mapPlaceholder}>
          <Feather name="map" size={32} color={COLORS.secondary} />
          <Text style={styles.mapText}>Mapa Interativo</Text>
          <Text style={styles.mapSubtext}>
            {alertas.length} alertas georreferenciados detectados por satélite
          </Text>
          {/* Pontos de calor simulados */}
          <View style={styles.heatRow}>
            {alertas.slice(0, 5).map((alerta, i) => (
              <TouchableOpacity
                key={alerta.id}
                style={[
                  styles.heatDot,
                  {
                    backgroundColor:
                      SEVERITY_CONFIG[alerta.severidade]?.color || COLORS.medium,
                    width: 14 + i * 2,
                    height: 14 + i * 2,
                    left: 20 + i * 55,
                    top: 20 + (i % 2) * 25,
                  },
                ]}
                onPress={() => navigation.navigate('DetalheAlerta', { alerta })}
              />
            ))}
          </View>
          <Text style={styles.mapHint}>
            ↑ Toque nos pontos para ver detalhes
          </Text>
        </View>

        {/* Filtros */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtrosContainer}
          contentContainerStyle={styles.filtrosContent}
        >
          {['todos', 'critical', 'medium', 'low'].map((filtro) => {
            const cfg = SEVERITY_CONFIG[filtro];
            const ativo = filtroAtivo === filtro;
            return (
              <TouchableOpacity
                key={filtro}
                style={[
                  styles.filtroChip,
                  ativo && {
                    backgroundColor: cfg ? cfg.color + '33' : COLORS.primary + '33',
                    borderColor: cfg ? cfg.color : COLORS.primary,
                  },
                ]}
                onPress={() => setFiltroAtivo(filtro)}
              >
                <Text
                  style={[
                    styles.filtroText,
                    ativo && {
                      color: cfg ? cfg.color : COLORS.primary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {filtro === 'todos' ? 'Todos' : cfg?.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Título da lista */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alertas Recentes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ListaOcorrencias')}>
            <Text style={styles.sectionLink}>Ver todos →</Text>
          </TouchableOpacity>
        </View>

        {/* Lista resumida */}
        {alertasFiltrados.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="check-circle" size={40} color={COLORS.active} />
            <Text style={styles.emptyText}>Nenhum alerta nesta categoria</Text>
          </View>
        ) : (
          alertasFiltrados.slice(0, 3).map((alerta) => {
            const cfg = SEVERITY_CONFIG[alerta.severidade];
            return (
              <TouchableOpacity
                key={alerta.id}
                style={styles.alertRow}
                onPress={() => navigation.navigate('DetalheAlerta', { alerta })}
              >
                <View
                  style={[
                    styles.alertDot,
                    { backgroundColor: cfg?.color || COLORS.medium },
                  ]}
                />
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle} numberOfLines={1}>
                    {alerta.titulo}
                  </Text>
                  <Text style={styles.alertRegion}>{alerta.regiao}</Text>
                </View>
                <Text
                  style={[
                    styles.alertSeverity,
                    { color: cfg?.color || COLORS.medium },
                  ]}
                >
                  {cfg?.label}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderLeftWidth: 3,
    ...SHADOW.card,
  },
  summaryNum: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xxl,
    fontWeight: '900',
    marginTop: 4,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  mapPlaceholder: {
    height: 180,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mapText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
  },
  mapSubtext: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: SPACING.xl,
  },
  heatRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heatDot: {
    position: 'absolute',
    borderRadius: RADIUS.full,
    opacity: 0.85,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  mapHint: {
    position: 'absolute',
    bottom: 8,
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
  },
  filtrosContainer: { marginBottom: SPACING.lg },
  filtrosContent: { gap: SPACING.sm },
  filtroChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filtroText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  sectionLink: {
    color: COLORS.secondary,
    fontSize: FONTS.sizes.sm,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  alertInfo: { flex: 1 },
  alertTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  alertRegion: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  alertSeverity: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
});
