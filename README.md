# 🛰️ SatAlert — Monitoramento de Queimadas e Desmatamento via Satélite

> **FIAP Global Solution 2026/1** — Mobile Application Development

Aplicativo React Native (Expo) totalmente integrado à API Java (Spring Boot)
hospedada no Railway. Sem dados mock: todas as telas consomem a API real.

🔗 **API:** `https://satalert-java-production.up.railway.app`
📄 **Swagger:** `https://satalert-java-production.up.railway.app/swagger-ui/index.html`

---

## 👥 Integrantes do Grupo

| Nome | RM | Turma |
|---|---|---|
| Andrei de Paiva Gibbini | 563061 | 2TDSPF |
| Arthur Câmara | 562310 | 2TDSPG |
| Diogo Cunha | 563654 | 2TDSPF |
| Pedro Santos Pequini | 561842 | 2TDSPF |
| Pedro Sakai Silva Zambaca | 565956 | 2TDSPF |


## 📽️ Vídeo de Demonstração

🎬 [Assista no YouTube] Link do vídeo: https://youtu.be/eICsxv7anN0

---

## 🚀 Como Rodar

### Pré-requisitos
- Node.js v18+
- Expo Go no celular **ou** emulador Android/iOS

### Passos
```bash
npm install        # instala as dependências (axios e async-storage já inclusos)
npx expo start     # inicia o Metro bundler
```
Depois: escaneie o QR Code no **Expo Go**, ou pressione `a` (Android) / `i` (iOS).

### 🔑 Credenciais de teste (já pré-preenchidas na tela de login)
```
e-mail: arthur.railway@satalert.com
senha:  senha123

---

## 🔌 Integração com a API Java

A `BASE_URL` fica em **`src/services/api.js`** e já vem apontada para produção:

```js
const BASE_URL = 'https://satalert-java-production.up.railway.app/api';
// const BASE_URL = 'http://10.0.2.2:8080/api';     // Emulador Android → API local
// const BASE_URL = 'http://192.168.0.X:8080/api';  // Dispositivo físico → IP da máquina
```

### Autenticação JWT (automática)
Todos os endpoints — **exceto `/api/auth/**`** — exigem `Authorization: Bearer <token>`.
O fluxo é todo automático:
1. O login (`POST /api/auth/login`) devolve o **token JWT**, que é salvo no `AsyncStorage`.
2. Um **interceptor** no `api.js` injeta esse token em **todas** as requisições.
3. Em caso de `401`, o token é descartado, forçando novo login.

> O token **não** é fixado no código (ele expira). O app sempre faz login para
> obter um token novo.

### Endpoints realmente consumidos

| Recurso | Método / Rota | Onde é usado |
|---|---|---|
| Login | `POST /api/auth/login` | Login |
| Registro | `POST /api/auth/registro` | Cadastro |
| Listar ocorrências | `GET /api/ocorrencias` *(paginado)* | Dashboard, Lista |
| Criar queimada | `POST /api/ocorrencias/queimada` | Nova Ocorrência |
| Criar desmatamento | `POST /api/ocorrencias/desmatamento` | Nova Ocorrência |
| Resolver ocorrência | `PATCH /api/ocorrencias/{id}/resolver` | Lista, Detalhe |
| Remover ocorrência | `DELETE /api/ocorrencias/{id}` | Lista, Detalhe |
| CRUD de regiões | `GET/POST/PUT/DELETE /api/regioes` | Regiões, Form de Região |
| Usuário logado | `GET /api/usuarios` | Perfil |

---

## 🔁 Mapeamento App ↔ API

A API normaliza os dados (ocorrência + região + alerta), enquanto o app exibe um
modelo mais "plano". A tradução é centralizada em **`src/services/mappers.js`**.

### Ocorrência (`OcorrenciaResponse` → card do app)

| Campo da API | Campo no app | Observação |
|---|---|---|
| `tipoAlerta` (`QUEIMADA`/`DESMATAMENTO`) | `tipoLabel` + título derivado | título = "Queimada — {região}" |
| `nomeRegiao` + `estado` | `regiao` | ex.: "Pantanal Norte, MT" |
| `nivelRisco` (`BAIXO`/`MEDIO`/`CRITICO`) | `severidade` (`low`/`medium`/`critical`) | risco é **calculado pela API** |
| `status` (`ATIVO`/`RESOLVIDO`) | `status` + `statusLabel` | "Ativo" / "Resolvido" |
| `dtOcorrencia` / `dtResolucao` | `dataDeteccao` / `dataResolucao` | datas (`LocalDate`) |
| — | `descricao` / `fonte` | **derivados** (a API não os expõe) |

### Região (`RegiaoResponse`)
`nivelRisco` da região usa `CRITICO`/`MEDIO`/`SEGURO` e é mapeado para as cores de
risco do app (`SEGURO` → verde).

### Regra de risco aplicada pela API (somente leitura no app)
- **Queimada:** temperatura ≥ 80 °C → `CRITICO`; ≥ 60 °C → `MEDIO`; senão `BAIXO`.
- **Desmatamento:** área ≥ 1000 ha → `CRITICO`; ≥ 300 ha → `MEDIO`; senão `BAIXO`.

---

## 🧩 O que mudou para integrar com a API real

A versão inicial assumia uma API genérica de "alertas" (`/api/alertas` com título,
descrição, lat/long e severidade manual). A API real é diferente, então os
seguintes ajustes foram feitos (todos **apenas no app mobile** — a API Java e o
banco não foram tocados):

1. **`api.js` reescrito** — `BASE_URL` de produção, interceptor que injeta o JWT
   automaticamente, tratamento de `401`, helper de paginação (`extractContent`) e
   services separados para `auth`, `ocorrencias`, `regioes` e `usuarios`.
2. **`mappers.js` (novo)** — traduz o modelo da API (ocorrência/região + enums)
   para o modelo de exibição do app.
3. **Login/Cadastro reais** — login via `POST /auth/login`; cadastro via
   `POST /auth/registro` seguido de login automático (a API não devolve token no
   registro). O campo "Órgão" virou **Telefone**, que é o que a API aceita.
4. **Nova Ocorrência reescrita** — em vez de título/descrição/coordenadas, agora
   tem: seletor de **tipo** (queimada/desmatamento), seletor de **região** (buscada
   da API) e os **campos de métrica** que a API espera. O nível de risco é
   calculado pela API.
5. **"Editar" virou "Resolver"** — a API não permite editar todos os campos de uma
   ocorrência; a única alteração possível é marcá-la como resolvida
   (`PATCH /resolver`). Lista e Detalhe refletem isso.
6. **Tela de Regiões (nova) + CRUD completo** — necessária porque criar uma
   ocorrência exige uma região (`idRegiao`), e é onde ficam os fluxos de
   **Create/Update/Delete** completos.
7. **Perfil real** — carrega o usuário logado e exibe **estatísticas reais**
   (contagem de ocorrências, ativas e regiões) vindas da API; logout limpa a sessão.
8. **Mock removido** — `mockData.js` foi excluído; nenhuma tela depende mais de
   dados falsos.

---

## 📱 Telas (8)

| # | Tela | Função | API |
|---|---|---|---|
| 1 | **Login** | Autenticação JWT | `POST /auth/login` |
| 2 | **Cadastro** | Criar conta + login automático | `POST /auth/registro` |
| 3 | **Dashboard** | Mapa-resumo das ocorrências | `GET /ocorrencias` |
| 4 | **Lista de Ocorrências** | Listar, buscar, resolver, remover | `GET` · `PATCH` · `DELETE` |
| 5 | **Detalhe** | Visão detalhada + resolver/remover | `PATCH` · `DELETE` |
| 6 | **Nova Ocorrência** | Criar (queimada/desmatamento) | `POST /ocorrencias/...` |
| 7 | **Regiões** | CRUD de regiões monitoradas | `GET` · `DELETE` |
| 8 | **Perfil** | Usuário, estatísticas reais, logout | `GET /usuarios` |

*(Form de Região — criar/editar — é uma tela auxiliar do CRUD de regiões.)*

### CRUD completo via API REST ✅

| Operação | Endpoint | Tela |
|---|---|---|
| **C**reate | `POST /api/ocorrencias/{queimada\|desmatamento}` · `POST /api/regioes` | Nova Ocorrência · Form de Região |
| **R**ead | `GET /api/ocorrencias` · `GET /api/regioes` | Dashboard · Lista · Regiões |
| **U**pdate | `PATCH /api/ocorrencias/{id}/resolver` · `PUT /api/regioes/{id}` | Lista/Detalhe · Form de Região |
| **D**elete | `DELETE /api/ocorrencias/{id}` · `DELETE /api/regioes/{id}` | Lista/Detalhe · Regiões |

---

## 🏗️ Arquitetura

```
satalert/
├── App.js
├── app.json
├── package.json
└── src/
    ├── constants/
    │   └── theme.js              # Cores, fontes, espaçamentos
    ├── services/
    │   ├── api.js                # Axios + JWT + services (auth/ocorrências/regiões/usuários)
    │   └── mappers.js            # Tradução API ↔ app (enums, derivações)
    ├── components/
    │   ├── Header.js
    │   ├── AlertCard.js
    │   ├── CustomInput.js
    │   └── LoadingOverlay.js
    ├── routes/
    │   ├── index.js              # NavigationContainer
    │   ├── stack.routes.js       # Login → Tabs → Detalhe / Nova Ocorrência / Form Região
    │   └── tab.routes.js         # Tabs: Dashboard | Ocorrências | Regiões | Perfil
    └── screens/
        ├── Login.js
        ├── Cadastro.js
        ├── MapaAlertas.js        # Dashboard
        ├── ListaOcorrencias.js
        ├── DetalheAlerta.js
        ├── NovoAlerta.js         # Criar ocorrência
        ├── Regioes.js            # Lista/CRUD de regiões
        ├── RegiaoForm.js         # Criar/editar região
        └── Perfil.js
```

---

## 🎨 Identidade Visual

| Token | Valor | Uso |
|---|---|---|
| `background` | `#0D1B2A` | Fundo (azul espacial escuro) |
| `primary` | `#FF6B35` | Alertas, CTAs principais (laranja-fogo) |
| `secondary` | `#00B4D8` | Ações secundárias (ciano-satélite) |
| `critical` | `#FF2D55` | Risco crítico |
| `medium` | `#FFD166` | Risco médio |
| `low` | `#06D6A0` | Risco baixo / seguro |

---

## 📦 Dependências Principais

| Lib | Versão | Função |
|---|---|---|
| `expo` | ~54.0.0 | Framework base |
| `react-native` | 0.81.5 | Runtime mobile |
| `@react-navigation/native` | ^6.1.17 | Navegação |
| `@react-navigation/native-stack` | ^6.9.26 | Stack de telas |
| `@react-navigation/bottom-tabs` | ^6.5.20 | Bottom tabs |
| `axios` | ^1.7.7 | HTTP client |
| `@react-native-async-storage/async-storage` | 2.2.0 | Persistência do token/sessão |
| `@expo/vector-icons` | ^15.0.3 | Ícones Feather |

> Nenhuma dependência nova foi adicionada na integração — o seletor de região usa
> componentes nativos do React Native (`Modal` + `FlatList`).



*SatAlert · FIAP 2026 · Global Solution ·
