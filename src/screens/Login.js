// src/screens/Login.js
// Tela 1: Login — autenticação real contra POST /api/auth/login

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import CustomInput from '../components/CustomInput';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { authService, salvarSessao, carregarUsuarioAtual } from '../services/api';

export default function Login({ navigation }) {
  // Credenciais de teste pré-preenchidas (remova em produção).
  const [email, setEmail] = useState('arthur.railway@satalert.com');
  const [senha, setSenha] = useState('senha123');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState({});

  // Validação local antes de enviar à API
  const validar = () => {
    const novosErros = {};
    if (!email.trim()) novosErros.email = 'E-mail é obrigatório.';
    else if (!/\S+@\S+\.\S+/.test(email)) novosErros.email = 'E-mail inválido.';
    if (!senha) novosErros.senha = 'Senha é obrigatória.';
    else if (senha.length < 6) novosErros.senha = 'Senha deve ter no mínimo 6 caracteres.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleLogin = async () => {
    if (!validar()) return;

    setCarregando(true);
    try {
      // 1) Autentica e recebe o token JWT
      const response = await authService.login({ email: email.trim(), senha });
      const token = response.data?.token;
      if (!token) throw new Error('Token não retornado pela API.');

      // 2) Persiste o token e busca o perfil do usuário logado
      await salvarSessao(token);
      await carregarUsuarioAtual(email.trim());

      navigation.replace('MainTabs');
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        status === 401 || status === 403
          ? 'E-mail ou senha incorretos.'
          : 'Não foi possível conectar à API. Verifique sua conexão e tente novamente.';
      Alert.alert('Erro ao entrar', msg, [{ text: 'OK' }]);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Hero */}
          <View style={styles.hero}>
            <View style={styles.logoIcon}>
              <Feather name="radio" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>SatAlert</Text>
            <Text style={styles.appTagline}>
              Monitoramento de Queimadas e Desmatamento via Satélite
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Entrar na plataforma</Text>

            <CustomInput
              label="E-mail"
              icon="mail"
              placeholder="agente@satalert.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (erros.email) setErros((prev) => ({ ...prev, email: null }));
              }}
              error={erros.email}
            />

            <View style={styles.senhaWrapper}>
              <CustomInput
                label="Senha"
                icon="lock"
                placeholder="••••••••"
                secureTextEntry={!senhaVisivel}
                value={senha}
                onChangeText={(text) => {
                  setSenha(text);
                  if (erros.senha) setErros((prev) => ({ ...prev, senha: null }));
                }}
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

            <TouchableOpacity
              style={[styles.btnPrimary, carregando && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={carregando}
              activeOpacity={0.85}
            >
              {carregando ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Feather name="log-in" size={18} color={COLORS.white} />
                  <Text style={styles.btnPrimaryText}>ENTRAR</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Ir para cadastro */}
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => navigation.navigate('Cadastro')}
            >
              <Feather name="user-plus" size={18} color={COLORS.secondary} />
              <Text style={styles.btnSecondaryText}>CRIAR CONTA</Text>
            </TouchableOpacity>
          </View>

          {/* Rodapé */}
          <Text style={styles.footer}>
            Dados fornecidos por NASA FIRMS · ESA Copernicus · INPE
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  appName: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  appTagline: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
    maxWidth: 260,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  formTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  senhaWrapper: {
    position: 'relative',
  },
  senhaToggle: {
    position: 'absolute',
    right: SPACING.lg,
    top: 36,
    height: 52,
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: SPACING.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
  },
  btnSecondary: {
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnSecondaryText: {
    color: COLORS.secondary,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});
