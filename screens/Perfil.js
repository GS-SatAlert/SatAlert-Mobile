// src/screens/Perfil.js
// Tela 7: Perfil do Usuário — visualização de dados e logout

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Header from '../components/Header';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import {
  getUsuarioLocal,
  limparSessao,
  ocorrenciasService,
  regioesService,
  extractContent,
  extractTotal,
} from '../services/api';

export default function Perfil({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [stats, setStats] = useState({ ocorrencias: null, ativas: null, regioes: null });

  useEffect(() => {
    const carregar = async () => {
      const u = await getUsuarioLocal();
      if (u) setUsuario(u);

      // Estatísticas reais a partir da API
      try {
        const [ocResp, regResp] = await Promise.all([
          ocorrenciasService.listar(),
          regioesService.listar(),
        ]);
        const ocorrencias = extractContent(ocResp.data);
        const ativas = ocorrencias.filter(
          (o) => String(o.status).toUpperCase() === 'ATIVO',
        ).length;
        setStats({
          ocorrencias: extractTotal(ocResp.data),
          ativas,
          regioes: extractTotal(regResp.data),
        });
      } catch {
        setStats({ ocorrencias: '—', ativas: '—', regioes: '—' });
      }
    };
    const unsub = navigation.addListener('focus', carregar);
    return unsub;
  }, [navigation]);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await limparSessao();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const iniciais = usuario?.nome
    ? usuario.nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'SA';

  const menuItems = [
    { icon: 'bell', label: 'Notificações de Alerta', desc: 'Gerencie seus alertas automáticos' },
    {
      icon: 'globe',
      label: 'Regiões Monitoradas',
      desc: 'Gerencie as áreas de interesse',
      onPress: () => navigation.navigate('Regioes'),
    },
    { icon: 'shield', label: 'Segurança', desc: 'Altere sua senha' },
    { icon: 'info', label: 'Sobre o SatAlert', desc: 'Versão 1.0.0 · Global Solution 2026' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Meu Perfil" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Card de avatar e dados */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{iniciais}</Text>
          </View>
          <Text style={styles.userName}>{usuario?.nome || 'Agente SatAlert'}</Text>
          <Text style={styles.userEmail}>{usuario?.email || '—'}</Text>
          <View style={styles.orgaoBadge}>
            <Feather name="shield" size={12} color={COLORS.secondary} />
            <Text style={styles.orgaoText}>{(usuario?.role || 'USER').toUpperCase()}</Text>
          </View>
          {usuario?.telefone ? (
            <View style={styles.telefoneRow}>
              <Feather name="phone" size={12} color={COLORS.textMuted} />
              <Text style={styles.telefoneText}>{usuario.telefone}</Text>
            </View>
          ) : null}
        </View>

        {/* Estatísticas rápidas */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.ocorrencias ?? '…'}</Text>
            <Text style={styles.statLabel}>Ocorrências{'\n'}Registradas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.ativas ?? '…'}</Text>
            <Text style={styles.statLabel}>Ocorrências{'\n'}Ativas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.regioes ?? '…'}</Text>
            <Text style={styles.statLabel}>Regiões{'\n'}Monitoradas</Text>
          </View>
        </View>

        {/* Menu de opções */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={item.onPress}
              disabled={!item.onPress}
              activeOpacity={item.onPress ? 0.7 : 1}
            >
              <View style={styles.menuIconWrapper}>
                <Feather name={item.icon} size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.menuTextWrapper}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Fontes de dados */}
        <View style={styles.sourcesCard}>
          <Text style={styles.sourcesTitle}>Fontes de Dados Integradas</Text>
          {['NASA FIRMS · MODIS / VIIRS', 'ESA Copernicus · Sentinel-2', 'INPE AQUA/TERRA', 'Space Charter · Desastres'].map((s) => (
            <View key={s} style={styles.sourceRow}>
              <Feather name="radio" size={13} color={COLORS.active} />
              <Text style={styles.sourceText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Botão logout */}
        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={COLORS.critical} />
          <Text style={styles.btnLogoutText}>ENCERRAR SESSÃO</Text>
        </TouchableOpacity>

        <Text style={styles.version}>
          SatAlert v1.0.0 · FIAP Global Solution 2026/1{'\n'}
          ODS 13 · Ação pelo Clima | ODS 2 · Fome Zero
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOW.card,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '33',
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xxl,
    fontWeight: '900',
  },
  userName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    marginBottom: 4,
  },
  userEmail: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.md,
  },
  orgaoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary + '22',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  orgaoText: {
    color: COLORS.secondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  telefoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
  },
  telefoneText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNum: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xxl,
    fontWeight: '900',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.secondary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrapper: { flex: 1 },
  menuLabel: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  menuDesc: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  sourcesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  sourcesTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.critical + '66',
    marginBottom: SPACING.xl,
  },
  btnLogoutText: {
    color: COLORS.critical,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    letterSpacing: 1,
  },
  version: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});
