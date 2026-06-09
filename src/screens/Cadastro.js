// src/screens/Cadastro.js
// Tela de Cadastro — cria usuário via POST /api/auth/registro e já autentica.

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
import { authService, salvarSessao, carregarUsuarioAtual } from '../services/api';

export default function Cadastro({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState({});

  const validar = () => {
    const e = {};
    if (!nome.trim()) e.nome = 'Nome completo é obrigatório.';
    if (!email.trim()) e.email = 'E-mail é obrigatório.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'E-mail inválido.';
    if (!senha) e.senha = 'Senha é obrigatória.';
    else if (senha.length < 6) e.senha = 'Senha deve ter no mínimo 6 caracteres.';
    if (senha !== confirmarSenha) e.confirmarSenha = 'As senhas não coincidem.';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleCadastrar = async () => {
    if (!validar()) return;

    setSalvando(true);
    try {
      // 1) Cria o usuário (a API não devolve token no registro)
      await authService.registrar({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        telefone: telefone.trim() || null,
      });

      // 2) Autentica em seguida para obter o token JWT
      const loginResp = await authService.login({ email: email.trim(), senha });
      const token = loginResp.data?.token;
      if (token) {
        await salvarSessao(token);
        await carregarUsuarioAtual(email.trim());
      }

      Alert.alert(
        'Conta criada! ✅',
        'Seu cadastro foi realizado com sucesso. Bem-vindo ao SatAlert!',
        [{ text: 'Entrar', onPress: () => navigation.replace('MainTabs') }],
      );
    } catch (error) {
      const status = error?.response?.status;
      const apiMsg = error?.response?.data?.message || error?.response?.data?.erro;
      const msg =
        status === 400 || status === 409
          ? apiMsg || 'Dados inválidos ou e-mail já cadastrado.'
          : 'Não foi possível criar sua conta. Verifique a conexão e tente novamente.';
      Alert.alert('Erro no cadastro', msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Criar Conta" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Título da seção */}
          <View style={styles.heroSection}>
            <View style={styles.avatarCircle}>
              <Feather name="user-plus" size={30} color={COLORS.secondary} />
            </View>
            <Text style={styles.heroTitle}>Novo Agente</Text>
            <Text style={styles.heroSubtitle}>
              Cadastre-se para monitorar alertas de queimadas e desmatamento em tempo real
            </Text>
          </View>

          {/* Campos */}
          <CustomInput
            label="Nome Completo *"
            icon="user"
            placeholder="João da Silva"
            value={nome}
            onChangeText={(t) => { setNome(t); setErros((e) => ({ ...e, nome: null })); }}
            autoCapitalize="words"
            error={erros.nome}
          />

          <CustomInput
            label="E-mail *"
            icon="mail"
            placeholder="agente@satalert.com"
            value={email}
            onChangeText={(t) => { setEmail(t); setErros((e) => ({ ...e, email: null })); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={erros.email}
          />

          <CustomInput
            label="Telefone (opcional)"
            icon="phone"
            placeholder="(11) 90000-0000"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />

          <View style={styles.senhaWrapper}>
            <CustomInput
              label="Senha *"
              icon="lock"
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChangeText={(t) => { setSenha(t); setErros((e) => ({ ...e, senha: null })); }}
              secureTextEntry={!senhaVisivel}
              error={erros.senha}
            />
            <TouchableOpacity
              style={styles.senhaToggle}
              onPress={() => setSenhaVisivel((v) => !v)}
            >
              <Feather
                name={senhaVisivel ? 'eye-off' : 'eye'}
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <CustomInput
            label="Confirmar Senha *"
            icon="check-circle"
            placeholder="Repita sua senha"
            value={confirmarSenha}
            onChangeText={(t) => {
              setConfirmarSenha(t);
              setErros((e) => ({ ...e, confirmarSenha: null }));
            }}
            secureTextEntry={!senhaVisivel}
            error={erros.confirmarSenha}
          />

          {/* Botão principal */}
          <TouchableOpacity
            style={[styles.btnCriar, salvando && styles.btnDisabled]}
            onPress={handleCadastrar}
            disabled={salvando}
            activeOpacity={0.85}
          >
            {salvando ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Feather name="user-check" size={20} color={COLORS.white} />
                <Text style={styles.btnCriarText}>CRIAR CONTA</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Link para login */}
          <TouchableOpacity
            style={styles.linkLogin}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.linkLoginText}>
              Já tem conta?{' '}
              <Text style={{ color: COLORS.secondary, fontWeight: '700' }}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.secondary + '44',
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  senhaWrapper: { position: 'relative' },
  senhaToggle: {
    position: 'absolute',
    right: SPACING.lg,
    top: 36,
    height: 52,
    justifyContent: 'center',
  },
  btnCriar: {
    backgroundColor: COLORS.secondary,
    height: 56,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: SPACING.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnCriarText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    letterSpacing: 1,
  },
  linkLogin: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  linkLoginText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
});
