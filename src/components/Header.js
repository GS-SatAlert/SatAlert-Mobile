// src/components/Header.js
// Cabeçalho padrão do SatAlert com identidade visual da aplicação

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function Header({ title, onBack, rightIcon, onRightPress }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Botão de voltar (opcional) */}
        {onBack ? (
          <TouchableOpacity style={styles.iconButton} onPress={onBack}>
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        {/* Título */}
        <View style={styles.titleWrapper}>
          <Feather name="radio" size={16} color={COLORS.primary} />
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Ícone direito opcional */}
        {rightIcon ? (
          <TouchableOpacity style={styles.iconButton} onPress={onRightPress}>
            <Feather name={rightIcon} size={22} color={COLORS.secondary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  iconPlaceholder: {
    width: 36,
  },
});
