// src/routes/stack.routes.js
// Stack de navegação principal: Auth + Tabs + Telas de detalhe

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../screens/Login';
import Cadastro from '../screens/Cadastro';
import DetalheAlerta from '../screens/DetalheAlerta';
import NovoAlerta from '../screens/NovoAlerta';
import RegiaoForm from '../screens/RegiaoForm';
import TabRoutes from './tab.routes';

const Stack = createNativeStackNavigator();

export default function StackRoutes() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* ── Fluxo de autenticação ── */}
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Cadastro" component={Cadastro} />

      {/* ── App principal (bottom tabs) ── */}
      <Stack.Screen
        name="MainTabs"
        component={TabRoutes}
        options={{ animation: 'fade' }}
      />

      {/* ── Telas de detalhe (stack sobre os tabs) ── */}
      <Stack.Screen name="DetalheAlerta" component={DetalheAlerta} />
      <Stack.Screen name="NovoAlerta" component={NovoAlerta} />
      <Stack.Screen name="RegiaoForm" component={RegiaoForm} />
    </Stack.Navigator>
  );
}
