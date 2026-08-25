"use client";

export type OrientationCount = Record<string, number>;

export type OrientationQuestion = {
  ordem: number;
  objetoPrincipal: string;
  acaoCognitiva: string;
  dificuldade: string;
  funcaoPedagogica: string;
  tempoEstimadoMin: number;
  gabaritoOficial: string;
  ano: string;
  edicao: string;
};

export type OrientationPedagogy = {
  descricaoCompetencia: string;
  descricaoHabilidade: string;
  verboCentral: string;
  operacaoCognitiva: string;
  interpretacaoPedagogica: string;
  expectativaAprendizagem: string;
  evidenciasDominio: string;
  dificuldadesFrequentes: string;
  perguntasDiagnosticas: string;
  antesDaQuestao: string;
  duranteAQuestao: string;
  depoisDaQuestao: string;
  retomada: string;
  mediacao: string;
  consolidacao: string;
  orientacoesIntervencao: string;
  versao: string;
  revisadoPor: string;
  revisadoEm: string;
};

export type OrientationRecurrence = {
  quantidadeItens2016_2025: number | null;
  mediaArea: number | null;
  posicaoNaArea: number | null;
  totalHabilidadesArea: number | null;
  recorrencia: string;
};

export type OrientationSkill = {
  area: string;
  componente: string;
  competencia: string;
  habilidade: string;
  questoes: number[];
  quantidadeQuestoes: number;
  descricaoCompetencia: string;
  descricaoHabilidade: string;
  recorrencia: OrientationRecurrence;
  pedagogia: OrientationPedagogy | null;
  itens: OrientationQuestion[];
};

export type PedagogicalOrientation = {
  id: string;
  sequenceId: string;
  titulo: string;
  descricao: string;
  professorNome: string;
  quantidadeQuestoes: number;
  status: string;
  panorama: {
    areas: string[];
    componentes: string[];
    competencias: string[];
    habilidades: string[];
    dificuldades: OrientationCount;
    funcoesPedagogicas: OrientationCount;
    tabelaHabilidades: Array<{
      habilidade: string;
      questoes: number[];
      quantidadeItens2016_2025: number | null;
      mediaArea: number | null;
      recorrencia: string;
    }>;
  };
  habilidades: OrientationSkill[];
  sintese: {
    habilidadesMaisPresentes: string[];
    habilidadesMaiorRecorrencia: string[];
    operacoesCognitivas: string[];
    dificuldades: OrientationCount;
    funcoesPedagogicas: OrientationCount;
  };
  matrizPedagogicaCompleta: boolean;
  historicoEnemDisponivel: boolean;
};

export type PedagogicalActivityInput = {
  idAtividade: string;
  titulo: string;
  descricao: string;
  questionIds: string[];
};

export type PedagogicalActivitySnapshot = {
  idAtividade: string;
  quantidadeQuestoes: number;
  versaoSnapshot: number;
  reutilizado: boolean;
};

export async function createOrUpdatePedagogicalActivity(
  activity: PedagogicalActivityInput
): Promise<PedagogicalActivitySnapshot> {
  const response = await fetch("/api/orientacao", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(activity),
  });
  const result = await response.json() as {
    ok?: boolean;
    snapshot?: PedagogicalActivitySnapshot;
    error?: string;
    reason?: string;
  };
  if (!response.ok || result.ok !== true || !result.snapshot) {
    throw new Error(result.error || result.reason || "Falha ao salvar a atividade pedagógica.");
  }
  return result.snapshot;
}

export async function getPedagogicalOrientation(id: string): Promise<PedagogicalOrientation> {
  const response = await fetch(`/api/orientacao/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  const result = await response.json() as {
    ok?: boolean;
    orientation?: PedagogicalOrientation;
    error?: string;
    reason?: string;
  };
  if (!response.ok || result.ok !== true || !result.orientation) {
    throw new Error(result.error || result.reason || "Falha ao carregar a orientação pedagógica.");
  }
  return result.orientation;
}
