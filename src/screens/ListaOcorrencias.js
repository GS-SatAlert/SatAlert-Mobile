// src/screens/ListaOcorrencias.js
// Tela 3: Lista de Ocorrências — READ do CRUD com filtro e busca

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import Header from '../components/Header';
import AlertCard from '../components/AlertCard';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { ocorrenciasService, extractContent } from '../services/api';
import { mapOcorrencia } from '../services/mappers';

export default function ListaOcorrencias({ navigation }) {
  const [alertas, setAlertas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [busca, setBusca] = useState('');

  const carregarAlertas = async (refresh = false) => {
    if (refresh) setAtualizando(true);
    try {
      const response = await ocorrenciasService.listar();
      const lista = extractContent(response.data).map(mapOcorrencia);
      setAlertas(lista);
    } catch {
      Alert.alert('Erro de conexão', 'Não foi possível carregar as ocorrências.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  };

  useEffect(() => {
    // Recarrega toda vez que a tela recebe foco (após criar/editar)
    const unsubscribe = navigation.addListener('focus', () => {
      carregarAlertas();
    });
    return unsubscribe;
  }, [navigation]);

  const handleDeletar = useCallback(
    (id) => {
      Alert.alert(
        'Remover Ocorrência',
        'Deseja remover esta ocorrência do sistema?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: async () => {
              try {
                await ocorrenciasService.deletar(id);
                setAlertas((prev) => prev.filter((a) => a.id !== id));
              } catch {
                Alert.alert('Erro', 'Não foi possível remover a ocorrência.');
              }
            },
          },
        ],
      );
    },
    [],
  );

  const handleResolver = useCallback((item) => {
    Alert.alert(
      'Resolver Ocorrência',
      `Marcar "${item.titulo}" como resolvida?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resolver',
          onPress: async () => {
            try {
              await ocorrenciasService.resolver(item.id);
              carregarAlertas();
            } catch {
              Alert.alert('Erro', 'Não foi possível resolver a ocorrência.');
            }
          },
        },
      ],
    );
  }, []);

  // Filtra por busca de texto
  const alertasFiltrados = alertas.filter(
    (a) =>
      a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      a.regiao.toLowerCase().includes(busca.toLowerCase()),
  );

  const renderItem = useCallback(
    ({ item }) => (
      <View>
        <AlertCard
          alerta={item}
          onPress={() => navigation.navigate('DetalheAlerta', { alerta: item })}
        />
        {/* Ações rápidas: resolver e remover */}
        <View style={styles.actions}>
          {item.statusRaw === 'ATIVO' ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleResolver(item)}
            >
              <Feather name="check-circle" size={14} color={COLORS.active} />
              <Text style={[styles.actionText, { color: COLORS.active }]}>Resolver</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionBtn, { opacity: 0.6 }]}>
              <Feather name="check" size={14} color={COLORS.textMuted} />
              <Text style={[styles.actionText, { color: COLORS.textMuted }]}>Resolvida</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => handleDeletar(item.id)}
          >
            <Feather name="trash-2" size={14} color={COLORS.critical} />
            <Text style={[styles.actionText, { color: COLORS.critical }]}>Remover</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [navigation, handleDeletar, handleResolver],
  );

  if (carregando) return <LoadingOverlay mensagem="Carregando ocorrências..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title="Ocorrências"
        rightIcon="plus-circle"
        onRightPress={() => navigation.navigate('NovoAlerta')}
      />

      {/* Campo de busca */}
      <View style={styles.searchWrapper}>
        <Feather name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por título ou região..."
          placeholderTextColor={COLORS.textMuted}
          value={busca}
          onChangeText={setBusca}
          returnKeyType="search"
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <Feather name="x-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Contador */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {alertasFiltrados.length} ocorrência{alertasFiltrados.length !== 1 ? 's' : ''} encontrada
          {alertasFiltrados.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={alertasFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregarAlertas(true)}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="search" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Nenhuma ocorrência encontrada</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('NovoAlerta')}
            >
              <Text style={styles.emptyBtnText}>Registrar novo alerta</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    height: 48,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    height: '100%',
  },
  countRow: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  countText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnDanger: {
    borderColor: COLORS.critical + '44',
  },
  actionText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: SPACING.lg,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  emptyBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
});
