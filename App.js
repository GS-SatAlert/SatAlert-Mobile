// App.js
// Componente raiz do SatAlert — ponto de entrada do Expo

import 'react-native-gesture-handler';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Routes from './src/routes';

export default function App() {
  return (
    <SafeAreaProvider>
      {/*
        StatusBar "light" combina com o tema escuro do SatAlert.
        O fundo escuro (#0D1B2A) requer ícones claros na barra de status.
      */}
      <StatusBar style="light" backgroundColor="#0D1B2A" />

      {/*
        Routes: NavigationContainer + StackRoutes
        Fluxo: Login → (Cadastro) → MainTabs → (DetalheAlerta | NovoAlerta)
      */}
      <Routes />
    </SafeAreaProvider>
  );
}
