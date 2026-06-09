// src/screens/RegiaoForm.js
// CREATE / UPDATE de Região.
//   • Criar  → POST /api/regioes        { nome, estado, bioma, latitude, longitude }
//   • Editar → PUT  /api/regioes/{id}   (mesmo corpo)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import Header from '../components/Header';
import CustomInput from '../components/CustomInput';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { regioesService } from '../services/api';

export default function RegiaoForm({ route, navigation }) {
  const regiaoEdicao = route.params?.regiao || null;
  const editando = !!regiaoEdicao;

  const [nome, setNome] = useState(regiaoEdicao?.nome || '');
  const [estado, setEstado] = useState(regiaoEdicao?.estado || '');
  const [bioma, setBioma] = useState(regiaoEdicao?.bioma || '');
  const [latitude, setLatitude] = useState(
    regiaoEdicao?.latitude != null ? String(regiaoEdicao.latitude) : '',
  );
  const [longitude, setLongitude] = useState(
    regiaoEdicao?.longitude != null ? String(regiaoEdicao.longitude) : '',
  );
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState({});

  const num = (v) => parseFloat(String(v).replace(',', '.'));

  const validar = () => {
    const e = {};
    if (!nome.trim()) e.nome = 'Nome é obrigatório.';
    else if (nome.trim().length > 100) e.nome = 'Máximo de 100 caracteres.';
    if (!estado.trim()) e.estado = 'Estado é obrigatório.';

    const lat = num(latitude);
    const lng = num(longitude);
    if (latitude === '' || isNaN(lat)) e.latitude = 'Latitude é obrigatória.';
    else if (lat < -90 || lat > 90) e.latitude = 'Latitude deve estar entre -90 e 90.';
    if (longitude === '' || isNaN(lng)) e.longitude = 'Longitude é obrigatória.';
    else if (lng < -180 || lng > 180) e.longitude = 'Longitude deve estar entre -180 e 180.';

    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSalvar = async () => {
    if (!validar()) return;
    setSalvando(true);
    const payload = {
      nome: nome.trim(),
      estado: estado.trim(),
      bioma: bioma.trim() || null,
      latitude: num(latitude),
      longitude: num(longitude),
    };
    try {
      if (editando) {
        await regioesService.atualizar(regiaoEdicao.id, payload);
      } else {
        await regioesService.criar(payload);
      }
      Alert.alert(
        editando ? 'Região atualizada ✅' : 'Região cadastrada ✅',
        editando
          ? 'As alterações foram salvas com sucesso.'
          : 'A nova região já pode receber ocorrências.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      const apiMsg =
        error?.response?.data?.message ||
        error?.response?.data?.erro ||
        'Verifique os dados e a conexão e tente novamente.';
      Alert.alert('Erro ao salvar', apiMsg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={editando ? 'Editar Região' : 'Nova Região'}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.heroSection}>
            <View style={styles.iconCircle}>
              <Feather name="globe" size={28} color={COLORS.secondary} />
            </View>
            <Text style={styles.heroTitle}>
              {editando ? 'Atualizar dados da região' : 'Cadastrar região monitorada'}
            </Text>
            <Text style={styles.heroSub}>
              As coordenadas posicionam a região no monitoramento por satélite.
            </Text>
          </View>

          <CustomInput
            label="Nome da região *"
            icon="map"
            placeholder="ex.: Pantanal Norte"
            value={nome}
            onChangeText={(t) => { setNome(t); setErros((e) => ({ ...e, nome: null })); }}
            autoCapitalize="words"
            error={erros.nome}
          />

          <CustomInput
            label="Estado (UF) *"
            icon="flag"
            placeholder="ex.: MT"
            value={estado}
            onChangeText={(t) => { setEstado(t); setErros((e) => ({ ...e, estado: null })); }}
            autoCapitalize="characters"
            error={erros.estado}
          />

          <CustomInput
            label="Bioma (opcional)"
            icon="feather"
            placeholder="ex.: Cerrado, Amazônia, Pantanal"
            value={bioma}
            onChangeText={setBioma}
            autoCapitalize="words"
          />

          <View style={styles.coordRow}>
            <View style={styles.coordCol}>
              <CustomInput
                label="Latitude *"
                icon="navigation"
                placeholder="-16.6869"
                keyboardType="numbers-and-punctuation"
                value={latitude}
                onChangeText={(t) => { setLatitude(t); setErros((e) => ({ ...e, latitude: null })); }}
                error={erros.latitude}
              />
            </View>
            <View style={styles.coordCol}>
              <CustomInput
                label="Longitude *"
                icon="navigation"
                placeholder="-57.4131"
                keyboardType="numbers-and-punctuation"
                value={longitude}
                onChangeText={(t) => { setLongitude(t); setErros((e) => ({ ...e, longitude: null })); }}
                error={erros.longitude}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btnSalvar, salvando && styles.btnDisabled]}
            onPress={handleSalvar}
            disabled={salvando}
            activeOpacity={0.85}
          >
            {salvando ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Feather name={editando ? 'save' : 'plus-circle'} size={18} color={COLORS.white} />
                <Text style={styles.btnSalvarText}>
                  {editando ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR REGIÃO'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  heroSection: { alignItems: 'center', marginBottom: SPACING.lg },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.secondary + '44',
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSub: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  coordRow: { flexDirection: 'row', gap: SPACING.md },
  coordCol: { flex: 1 },
  btnSalvar: {
    backgroundColor: COLORS.secondary,
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
});
