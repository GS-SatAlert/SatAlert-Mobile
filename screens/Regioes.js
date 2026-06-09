// src/screens/Regioes.js
// CRUD de Regiões (READ + DELETE; CREATE/UPDATE em RegiaoForm).
// Regiões são pré-requisito para registrar ocorrências (idRegiao).

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { regioesService, extractContent } from '../services/api';
import { mapRegiao } from '../services/mappers';
import LoadingOverlay from '../components/LoadingOverlay';

const RISCO_CONFIG = {
  CRITICO: { color: COLORS.critical, label: 'Crítico' },
  MEDIO: { color: COLORS.warning, label: 'Médio' },
  SEGURO: { color: COLORS.active, label: 'Seguro' },
};

export default function Regioes({ navigation }) {
  const [regioes, setRegioes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = async (refresh = false) => {
    if (refresh) setAtualizando(true);
    try {
      const resp = await regioesService.listar();
      setRegioes(extractContent(resp.data).map(mapRegiao));
    } catch {
      Alert.alert('Erro de conexão', 'Não foi possível carregar as regiões.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => carregar());
    return unsub;
  }, [navigation]);

  const handleDeletar = useCallback((item) => {
    Alert.alert(
      'Remover Região',
      `Remover "${item.nome}"? Regiões com ocorrências vinculadas não podem ser removidas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await regioesService.deletar(item.id);
              setRegioes((prev) => prev.filter((r) => r.id !== item.id));
            } catch (error) {
              const conflito = error?.response?.status === 409 || error?.response?.status === 500;
              Alert.alert(
                'Não foi possível remover',
                conflito
                  ? 'Esta região possui ocorrências vinculadas. Remova as ocorrências antes.'
                  : 'Tente novamente mais tarde.',
              );
            }
          },
        },
      ],
    );
  }, []);

  const renderItem = ({ item }) => {
    const risco = RISCO_CONFIG[item.nivelRiscoRaw] || RISCO_CONFIG.SEGURO;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('RegiaoForm', { regiao: item })}
      >
        <View style={[styles.cardBar, { backgroundColor: risco.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardNome} numberOfLines={1}>{item.nome}</Text>
            <View style={[styles.riscoBadge, { backgroundColor: risco.color + '22' }]}>
              <View style={[styles.riscoDot, { backgroundColor: risco.color }]} />
              <Text style={[styles.riscoText, { color: risco.color }]}>{risco.label}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Feather name="map-pin" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>
              {item.estado}
              {item.bioma ? ` · ${item.bioma}` : ''}
            </Text>
          </View>

          {item.latitude != null && item.longitude != null && (
            <View style={styles.metaRow}>
              <Feather name="navigation" size={13} color={COLORS.textMuted} />
              <Text style={styles.coordText}>
                {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
              </Text>
            </View>
          )}

          <View style={styles.acoes}>
            <TouchableOpacity
              style={styles.acaoBtn}
              onPress={() => navigation.navigate('RegiaoForm', { regiao: item })}
            >
              <Feather name="edit-2" size={14} color={COLORS.secondary} />
              <Text style={[styles.acaoText, { color: COLORS.secondary }]}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acaoBtn, styles.acaoBtnDanger]}
              onPress={() => handleDeletar(item)}
            >
              <Feather name="trash-2" size={14} color={COLORS.critical} />
              <Text style={[styles.acaoText, { color: COLORS.critical }]}>Remover</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (carregando) return <LoadingOverlay mensagem="Carregando regiões..." />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Regiões</Text>
          <Text style={styles.headerSub}>
            {regioes.length} regiã{regioes.length === 1 ? 'o' : 'es'} monitorada
            {regioes.length === 1 ? '' : 's'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('RegiaoForm')}
        >
          <Feather name="plus" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={regioes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregar(true)}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="globe" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Nenhuma região cadastrada</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('RegiaoForm')}
            >
              <Feather name="plus" size={16} color={COLORS.white} />
              <Text style={styles.emptyBtnText}>Cadastrar região</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  headerSub: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginTop: 2 },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.card,
  },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  cardBar: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: SPACING.lg },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  cardNome: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  riscoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  riscoDot: { width: 6, height: 6, borderRadius: 3 },
  riscoText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  coordText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  acoes: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  acaoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.secondary + '15',
  },
  acaoBtnDanger: { backgroundColor: COLORS.critical + '15' },
  acaoText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.sm },
});
