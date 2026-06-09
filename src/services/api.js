// src/services/api.js
// Camada de serviço: toda a comunicação HTTP com a API Java (Spring Boot).
// Contrato 100% alinhado ao código real da API SatAlert.
//
// IMPORTANTE: todos os endpoints (exceto /auth/**) exigem o header
// Authorization: Bearer <token>. O token é obtido no login e injetado
// automaticamente pelo interceptor abaixo.

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────
// CONFIGURAÇÃO BASE
// Por padrão aponta para o deploy de PRODUÇÃO no Railway.
// Para rodar contra a API local, troque BASE_URL por uma das opções comentadas.
// (os controllers já vivem sob /api, por isso o /api faz parte da BASE_URL)
// ─────────────────────────────────────────────────
const BASE_URL = 'https://satalert-java-production.up.railway.app/api';
// const BASE_URL = 'http://10.0.2.2:8080/api';      // Emulador Android → API local
// const BASE_URL = 'http://192.168.0.X:8080/api';   // Dispositivo físico → IP da máquina

export const STORAGE_KEYS = {
  TOKEN: '@satalert:token',
  USER: '@satalert:usuario',
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000, // Railway pode "acordar" o serviço; damos folga no timeout
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─────────────────────────────────────────────────
// INTERCEPTORS
// ─────────────────────────────────────────────────
// Injeta o token JWT em toda requisição (interceptor assíncrono).
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // se o storage falhar, segue sem token (a API responderá 401)
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      console.error('[API Error]', error.response.status, error.response.data);
      // Sessão expirada/!inválida → limpa o token para forçar novo login
      if (error.response.status === 401) {
        try {
          await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
        } catch {
          /* noop */
        }
      }
    } else if (error.request) {
      console.error('[API] Sem resposta do servidor. Verifique a URL e a conexão.');
    } else {
      console.error('[API] Erro ao configurar requisição:', error.message);
    }
    return Promise.reject(error);
  },
);

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────
/**
 * Normaliza o corpo de respostas paginadas do Spring (Page<T>).
 * Aceita tanto um array puro quanto { content: [...] } quanto coleções HATEOAS.
 */
export function extractContent(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  if (data && data._embedded) {
    const vals = Object.values(data._embedded);
    if (vals.length && Array.isArray(vals[0])) return vals[0];
  }
  return [];
}

/**
 * Total de elementos de uma resposta paginada (fallback para o tamanho da lista).
 */
export function extractTotal(data) {
  if (data && typeof data.totalElements === 'number') return data.totalElements;
  return extractContent(data).length;
}

// ─────────────────────────────────────────────────
// AUTENTICAÇÃO  (/api/auth — público)
// ─────────────────────────────────────────────────
export const authService = {
  /** POST /api/auth/login → { token, tipo, expiracao } */
  login: ({ email, senha }) => api.post('/auth/login', { email, senha }),

  /** POST /api/auth/registro → UsuarioResponse (sem token) */
  registrar: ({ nome, email, senha, telefone }) =>
    api.post('/auth/registro', { nome, email, senha, telefone: telefone || null }),
};

// ─────────────────────────────────────────────────
// OCORRÊNCIAS  (/api/ocorrencias — o "alerta" do app)
// ─────────────────────────────────────────────────
export const ocorrenciasService = {
  /** GET /api/ocorrencias → Page<OcorrenciaResponse> */
  listar: ({ status, page = 0, size = 100 } = {}) =>
    api.get('/ocorrencias', {
      params: { status: status || undefined, page, size, sort: 'dtOcorrencia,desc' },
    }),

  /** GET /api/ocorrencias/{id} → EntityModel<OcorrenciaResponse> */
  buscarPorId: (id) => api.get(`/ocorrencias/${id}`),

  /** POST /api/ocorrencias/queimada */
  criarQueimada: ({ idRegiao, temperatura, nivelFumaca }) =>
    api.post('/ocorrencias/queimada', { idRegiao, temperatura, nivelFumaca }),

  /** POST /api/ocorrencias/desmatamento */
  criarDesmatamento: ({ idRegiao, areaHectares, coberturaVegetal }) =>
    api.post('/ocorrencias/desmatamento', { idRegiao, areaHectares, coberturaVegetal }),

  /** PATCH /api/ocorrencias/{id}/resolver — marca como RESOLVIDO */
  resolver: (id) => api.patch(`/ocorrencias/${id}/resolver`),

  /** DELETE /api/ocorrencias/{id} */
  deletar: (id) => api.delete(`/ocorrencias/${id}`),
};

// ─────────────────────────────────────────────────
// REGIÕES  (/api/regioes — CRUD completo)
// ─────────────────────────────────────────────────
export const regioesService = {
  /** GET /api/regioes → Page<RegiaoResponse> */
  listar: ({ page = 0, size = 100 } = {}) =>
    api.get('/regioes', { params: { page, size, sort: 'nome,asc' } }),

  /** GET /api/regioes/{id} */
  buscarPorId: (id) => api.get(`/regioes/${id}`),

  /** POST /api/regioes */
  criar: (dados) => api.post('/regioes', dados),

  /** PUT /api/regioes/{id} */
  atualizar: (id, dados) => api.put(`/regioes/${id}`, dados),

  /** DELETE /api/regioes/{id} */
  deletar: (id) => api.delete(`/regioes/${id}`),
};

// ─────────────────────────────────────────────────
// USUÁRIOS  (/api/usuarios — exige Bearer token)
// ─────────────────────────────────────────────────
export const usuariosService = {
  /** GET /api/usuarios → List<UsuarioResponse> */
  listar: () => api.get('/usuarios'),

  /** GET /api/usuarios/{id} */
  buscarPorId: (id) => api.get(`/usuarios/${id}`),

  /** PUT /api/usuarios/{id} */
  atualizar: (id, dados) => api.put(`/usuarios/${id}`, dados),

  /** DELETE /api/usuarios/{id} */
  deletar: (id) => api.delete(`/usuarios/${id}`),
};

// ─────────────────────────────────────────────────
// SESSÃO — utilidades de token/usuário
// ─────────────────────────────────────────────────
export async function salvarSessao(token, usuario) {
  await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
  if (usuario) await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(usuario));
}

export async function limparSessao() {
  await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
}

export async function getUsuarioLocal() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Após o login só recebemos o token (a API não devolve o usuário no /login).
 * Esta função busca o usuário correspondente em GET /api/usuarios e persiste
 * um objeto de perfil. Se falhar, persiste um perfil mínimo derivado do e-mail.
 */
export async function carregarUsuarioAtual(email) {
  const fallback = { email, nome: email ? email.split('@')[0] : 'Agente', role: 'USER' };
  try {
    const resp = await usuariosService.listar();
    const lista = extractContent(resp.data);
    const encontrado = lista.find(
      (u) => (u.email || '').toLowerCase() === (email || '').toLowerCase(),
    );
    const usuario = encontrado ? { ...encontrado, email: encontrado.email || email } : fallback;
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(usuario));
    return usuario;
  } catch {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fallback));
    return fallback;
  }
}

export default api;
