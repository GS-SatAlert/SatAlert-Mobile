// src/screens/NovoAlerta.js
// Registrar nova OCORRÊNCIA (CREATE).
// A API não aceita um "alerta" plano: ela espera um tipo (queimada/desmatamento),
// uma região (idRegiao) e métricas específicas, e calcula o nível de risco sozinha.
//   • Queimada     → POST /api/ocorrencias/queimada     { idRegiao, temperatura, nivelFumaca }
//   • Desmatamento → POST /api/ocorrencias/desmatamento { idRegiao, areaHectares, coberturaVegetal }

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import Header from '../components/Header';
import CustomInput from '../components/CustomInput';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { ocorrenciasService, regioesService, extractContent } from '../services/api';
import { mapRegiao } from '../services/mappers';

const TIPOS = [
  { id: 'QUEIMADA', label: 'Queimada', icon: 'thermometer' },
  { id: 'DESMATAMENTO', label: 'Desmatamento', icon: 'scissors' },
];

const RISCO_COR = { CRITICO: COLORS.critical, MEDIO: COLORS.warning, SEGURO: COLORS.active };

export default function NovoAlerta({ navigation }) {
  const [tipo, setTipo] = useState('QUEIMADA');

  // Região
  const [regioes, setRegioes] = useState([]);
  const [regiaoSel, setRegiaoSel] = useState(null);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [carregandoRegioes, setCarregandoRegioes] = useState(true);

  // Métricas (strings — convertidas no submit)
  const [temperatura, setTemperatura] = useState('');
  const [nivelFumaca, setNivelFumaca] = useState('');
  const [areaHectares, setAreaHectares] = useState('');
  const [coberturaVegetal, setCoberturaVegetal] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState({});

  const carregarRegioes = async () => {
    setCarregandoRegioes(true);
    try {
      const resp = await regioesService.listar();
      const lista = extractContent(resp.data).map(mapRegiao);
      setRegioes(lista);
      // Mantém a seleção se a região ainda existir
      setRegiaoSel((atual) =>
        atual ? lista.find((r) => r.id === atual.id) || null : null,
      );
    } catch {
      setRegioes([]);
    } finally {
      setCarregandoRegioes(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', carregarRegioes);
    return unsub;
  }, [navigation]);

  const num = (v) => parseFloat(String(v).replace(',', '.'));

  const validar = () => {
    const e = {};
    if (!regiaoSel) e.regiao = 'Selecione uma região.';

    if (tipo === 'QUEIMADA') {
      const t = num(temperatura);
      const f = num(nivelFumaca);
      if (temperatura === '' || isNaN(t)) e.temperatura = 'Informe a temperatura.';
      else if (t < 0 || t > 120) e.temperatura = 'Temperatura deve estar entre 0 e 120 °C.';
      if (nivelFumaca === '' || isNaN(f)) e.nivelFumaca = 'Informe o nível de fumaça.';
      else if (f < 0 || f > 100) e.nivelFumaca = 'Fumaça deve estar entre 0 e 100%.';
    } else {
      const a = num(areaHectares);
      const c = num(coberturaVegetal);
      if (areaHectares === '' || isNaN(a)) e.areaHectares = 'Informe a área afetada.';
      else if (a < 0.1) e.areaHectares = 'Área mínima de 0,1 hectare.';
      if (coberturaVegetal !== '' && !isNaN(c) && (c < 0 || c > 100))
        e.coberturaVegetal = 'Cobertura deve estar entre 0 e 100%.';
    }
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSalvar = async () => {
    if (!validar()) return;
    setSalvando(true);
    try {
      if (tipo === 'QUEIMADA') {
        await ocorrenciasService.criarQueimada({
          idRegiao: Number(regiaoSel.id),
          temperatura: num(temperatura),
          nivelFumaca: num(nivelFumaca),
        });
      } else {
        await ocorrenciasService.criarDesmatamento({
          idRegiao: Number(regiaoSel.id),
          areaHectares: num(areaHectares),
          coberturaVegetal: coberturaVegetal === '' ? 0 : num(coberturaVegetal),
        });
      }
      Alert.alert(
        'Ocorrência registrada! ✅',
        'O nível de risco foi calculado automaticamente pela central.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      const apiMsg =
        error?.response?.data?.message ||
        error?.response?.data?.erro ||
        'Verifique os dados e a conexão e tente novamente.';
      Alert.alert('Erro ao registrar', apiMsg);
    } finally {
      setSalvando(false);
    }
  };

  const renderRegiaoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.regiaoOpcao}
      onPress={() => {
        setRegiaoSel(item);
        setModalVisivel(false);
        setErros((e) => ({ ...e, regiao: null }));
      }}
    >
      <View style={[styles.riscoDot, { backgroundColor: RISCO_COR[item.nivelRiscoRaw] || COLORS.textMuted }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.regiaoOpcaoNome}>{item.nome}</Text>
        <Text style={styles.regiaoOpcaoSub}>
          {item.estado}
          {item.bioma ? ` · ${item.bioma}` : ''}
        </Text>
      </View>
      {regiaoSel?.id === item.id && (
        <Feather name="check" size={18} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Nova Ocorrência" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* ── Tipo de ocorrência ── */}
          <Text style={styles.label}>Tipo de ocorrência *</Text>
          <View style={styles.tipoRow}>
            {TIPOS.map((t) => {
              const ativo = tipo === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tipoBtn, ativo && styles.tipoBtnAtivo]}
                  onPress={() => setTipo(t.id)}
                  activeOpacity={0.85}
                >
                  <Feather
                    name={t.icon}
                    size={20}
                    color={ativo ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.tipoBtnText, ativo && styles.tipoBtnTextAtivo]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Região ── */}
          <Text style={styles.label}>Região monitorada *</Text>
          {carregandoRegioes ? (
            <View style={styles.selectBox}>
              <ActivityIndicator size="small" color={COLORS.secondary} />
              <Text style={styles.selectPlaceholder}>Carregando regiões...</Text>
            </View>
          ) : regioes.length === 0 ? (
            <View style={styles.avisoCard}>
              <Feather name="alert-circle" size={18} color={COLORS.warning} />
              <Text style={styles.avisoText}>
                Nenhuma região cadastrada. Cadastre uma região antes de registrar a ocorrência.
              </Text>
              <TouchableOpacity
                style={styles.avisoBtn}
                onPress={() => navigation.navigate('RegiaoForm')}
              >
                <Feather name="plus" size={16} color={COLORS.white} />
                <Text style={styles.avisoBtnText}>Cadastrar região</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.selectBox, erros.regiao && styles.inputErro]}
              onPress={() => setModalVisivel(true)}
              activeOpacity={0.85}
            >
              <Feather name="map-pin" size={18} color={COLORS.secondary} />
              <Text
                style={regiaoSel ? styles.selectValue : styles.selectPlaceholder}
                numberOfLines={1}
              >
                {regiaoSel ? `${regiaoSel.nome} — ${regiaoSel.estado}` : 'Selecione a região'}
              </Text>
              <Feather name="chevron-down" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          {erros.regiao && <Text style={styles.erroText}>{erros.regiao}</Text>}

          {/* ── Métricas condicionais ── */}
          {tipo === 'QUEIMADA' ? (
            <>
              <CustomInput
                label="Temperatura (°C) *"
                icon="thermometer"
                placeholder="0 – 120"
                keyboardType="decimal-pad"
                value={temperatura}
                onChangeText={(t) => { setTemperatura(t); setErros((e) => ({ ...e, temperatura: null })); }}
                error={erros.temperatura}
              />
              <CustomInput
                label="Nível de fumaça (%) *"
                icon="cloud"
                placeholder="0 – 100"
                keyboardType="decimal-pad"
                value={nivelFumaca}
                onChangeText={(t) => { setNivelFumaca(t); setErros((e) => ({ ...e, nivelFumaca: null })); }}
                error={erros.nivelFumaca}
              />
              <View style={styles.dica}>
                <Feather name="info" size={13} color={COLORS.textMuted} />
                <Text style={styles.dicaText}>
                  Risco: ≥ 80 °C → Crítico · ≥ 60 °C → Médio · abaixo → Baixo
                </Text>
              </View>
            </>
          ) : (
            <>
              <CustomInput
                label="Área afetada (hectares) *"
                icon="crop"
                placeholder="ex.: 350"
                keyboardType="decimal-pad"
                value={areaHectares}
                onChangeText={(t) => { setAreaHectares(t); setErros((e) => ({ ...e, areaHectares: null })); }}
                error={erros.areaHectares}
              />
              <CustomInput
                label="Cobertura vegetal restante (%)"
                icon="percent"
                placeholder="0 – 100 (opcional)"
                keyboardType="decimal-pad"
                value={coberturaVegetal}
                onChangeText={(t) => { setCoberturaVegetal(t); setErros((e) => ({ ...e, coberturaVegetal: null })); }}
                error={erros.coberturaVegetal}
              />
              <View style={styles.dica}>
                <Feather name="info" size={13} color={COLORS.textMuted} />
                <Text style={styles.dicaText}>
                  Risco: ≥ 1000 ha → Crítico · ≥ 300 ha → Médio · abaixo → Baixo
                </Text>
              </View>
            </>
          )}

          {/* ── Botão salvar ── */}
          <TouchableOpacity
            style={[styles.btnSalvar, salvando && styles.btnDisabled]}
            onPress={handleSalvar}
            disabled={salvando || carregandoRegioes}
            activeOpacity={0.85}
          >
            {salvando ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Feather name="send" size={18} color={COLORS.white} />
                <Text style={styles.btnSalvarText}>REGISTRAR OCORRÊNCIA</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal de seleção de região ── */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Região</Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={regioes}
              keyExtractor={(item) => item.id}
              renderItem={renderRegiaoItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={{ paddingBottom: SPACING.lg }}
            />
            <TouchableOpacity
              style={styles.modalNovaRegiao}
              onPress={() => {
                setModalVisivel(false);
                navigation.navigate('RegiaoForm');
              }}
            >
              <Feather name="plus-circle" size={18} color={COLORS.secondary} />
              <Text style={styles.modalNovaRegiaoText}>Cadastrar nova região</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  tipoRow: { flexDirection: 'row', gap: SPACING.md },
  tipoBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tipoBtnAtivo: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  tipoBtnText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: FONTS.sizes.md },
  tipoBtnTextAtivo: { color: COLORS.primary },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 52,
  },
  selectValue: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  selectPlaceholder: { flex: 1, color: COLORS.textMuted, fontSize: FONTS.sizes.md },
  inputErro: { borderColor: COLORS.critical },
  erroText: { color: COLORS.critical, fontSize: FONTS.sizes.xs, marginTop: SPACING.xs },
  avisoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.warning + '55',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avisoText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    lineHeight: 19,
  },
  avisoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  avisoBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.sm },
  dica: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  dicaText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, flex: 1 },
  btnSalvar: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: SPACING.xl,
  },
  btnDisabled: { opacity: 0.6 },
  btnSalvarText: { color: COLORS.white, fontWeight: '800', fontSize: FONTS.sizes.md, letterSpacing: 1 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: '800' },
  regiaoOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  riscoDot: { width: 10, height: 10, borderRadius: 5 },
  regiaoOpcaoNome: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  regiaoOpcaoSub: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginTop: 2 },
  separator: { height: 1, backgroundColor: COLORS.border },
  modalNovaRegiao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalNovaRegiaoText: { color: COLORS.secondary, fontWeight: '700', fontSize: FONTS.sizes.md },
});
