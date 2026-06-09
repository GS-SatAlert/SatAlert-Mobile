// src/services/mappers.js
// Tradução entre o modelo da API Java (Ocorrência / Região) e o modelo de
// exibição usado pelas telas do app. Centraliza o mapeamento de enums
// (nivelRisco, status, tipoAlerta) e a derivação de campos de UI.

// ── Mapas de enums da API ──────────────────────────────────────────────────
// nivelRisco da API: BAIXO | MEDIO | CRITICO  (regiões também usam SEGURO)
const NIVEL_TO_SEVERIDADE = {
  CRITICO: 'critical',
  ALTO: 'high', // defensivo (a API não gera, mas o app suporta)
  MEDIO: 'medium',
  BAIXO: 'low',
  SEGURO: 'low',
};

const SEVERIDADE_LABEL = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
};

// status da ocorrência na API: ATIVO | RESOLVIDO
const STATUS_TO_APP = {
  ATIVO: 'ativo',
  RESOLVIDO: 'controlado',
  MONITORANDO: 'monitorando', // defensivo
};

const STATUS_LABEL = {
  ATIVO: 'Ativo',
  RESOLVIDO: 'Resolvido',
  MONITORANDO: 'Monitorando',
};

const TIPO_LABEL = {
  QUEIMADA: 'Queimada',
  DESMATAMENTO: 'Desmatamento',
};

const REGIAO_RISCO_LABEL = {
  CRITICO: 'Crítico',
  MEDIO: 'Médio',
  SEGURO: 'Seguro',
  BAIXO: 'Baixo',
  ALTO: 'Alto',
};

// ── Funções utilitárias de mapeamento ──────────────────────────────────────
export function mapSeveridade(nivel) {
  return NIVEL_TO_SEVERIDADE[String(nivel || '').toUpperCase()] || 'medium';
}

export function severidadeLabel(severidade) {
  return SEVERIDADE_LABEL[severidade] || 'Médio';
}

export function mapStatus(status) {
  return STATUS_TO_APP[String(status || '').toUpperCase()] || 'ativo';
}

export function statusLabel(statusRaw) {
  const key = String(statusRaw || '').toUpperCase();
  return STATUS_LABEL[key] || statusRaw || 'Ativo';
}

function descricaoDe(tipo, nomeRegiao, estado, nivel) {
  const local = estado ? `${nomeRegiao} (${estado})` : nomeRegiao;
  const niv = String(nivel || '').toUpperCase();
  const nivTxt =
    niv === 'CRITICO' ? 'risco crítico' : niv === 'MEDIO' ? 'risco médio' : 'risco baixo';
  if (tipo === 'QUEIMADA') {
    return `Foco de queimada detectado em ${local}, classificado pela central como ${nivTxt}. Dados captados por sensores e satélites de monitoramento.`;
  }
  if (tipo === 'DESMATAMENTO') {
    return `Supressão de vegetação identificada em ${local}, classificada como ${nivTxt} a partir de análise orbital de cobertura vegetal.`;
  }
  return `Ocorrência registrada em ${local}.`;
}

/**
 * Converte um OcorrenciaResponse da API no objeto "alerta" usado pelas telas.
 * Campos como descrição/fonte são derivados, pois a API não os expõe.
 */
export function mapOcorrencia(o) {
  const tipoRaw = String(o.tipoAlerta || '').toUpperCase();
  const nomeRegiao = o.nomeRegiao || 'Região não informada';
  const estado = o.estado || '';
  const tipoLabel = TIPO_LABEL[tipoRaw] || 'Ocorrência';
  const severidade = mapSeveridade(o.nivelRisco);

  return {
    id: String(o.id),
    tipoAlerta: tipoRaw,
    tipoLabel,
    titulo: `${tipoLabel} — ${nomeRegiao}`,
    nomeRegiao,
    estado,
    regiao: estado ? `${nomeRegiao}, ${estado}` : nomeRegiao,
    severidade,
    severidadeLabel: severidadeLabel(severidade),
    nivelRiscoRaw: String(o.nivelRisco || '').toUpperCase(),
    status: mapStatus(o.status),
    statusLabel: statusLabel(o.status),
    statusRaw: String(o.status || '').toUpperCase(),
    dataDeteccao: o.dtOcorrencia || null,
    dataResolucao: o.dtResolucao || null,
    descricao: descricaoDe(tipoRaw, nomeRegiao, estado, o.nivelRisco),
    fonte:
      tipoRaw === 'QUEIMADA'
        ? 'Sensores IoT / Satélite (focos de calor)'
        : 'Análise orbital de cobertura vegetal',
  };
}

/**
 * Converte um RegiaoResponse da API no objeto "regiao" usado pelas telas.
 */
export function mapRegiao(r) {
  const risco = String(r.nivelRisco || 'SEGURO').toUpperCase();
  return {
    id: String(r.id),
    nome: r.nome || '—',
    estado: r.estado || '',
    bioma: r.bioma || '',
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    nivelRiscoRaw: risco,
    riscoLabel: REGIAO_RISCO_LABEL[risco] || risco,
    severidade: mapSeveridade(risco), // para coloração (SEGURO → verde)
  };
}
