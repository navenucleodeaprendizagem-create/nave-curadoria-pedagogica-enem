"use client";

export type ValidationQuestion = {
  id: string;
  ano: string | number;
  edicao: string;
  competencia: string;
  habilidade: string;
  objeto: string;
  acaoCognitiva: string;
  dificuldade: string;
  funcao: string;
  trecho: string;
  statusCuradoria: string;
  statusValidacao: string;
  maturidadeCuradoria: string;
  versaoRegistro: number;
};

export type ValidationForm = {
  idQuestao: string;
  avaliacaoObjeto: string;
  objetoSugerido?: string;
  avaliacaoAcao: string;
  acaoSugerida?: string;
  avaliacaoDificuldade: string;
  dificuldadeSugerida?: string;
  avaliacaoFuncao: string;
  funcaoSugerida?: string;
  avaliacaoTrecho: string;
  parecerGeral: string;
  observacao?: string;
};

export type CoordinationCaseSummary = {
  prioridade: string;
  statusFila: string;
  idValidacao: string;
  idQuestao: string;
  dataEntrada: string;
  professor: string;
  habilidade: string;
  objetoAtual: string;
  tiposDivergencia: string;
  parecerGeral: string;
  observacaoDocente: string;
  responsavelCoordenacao: string;
  decisao: string;
  justificativa: string;
  resolvido: boolean;
};

export type CoordinationCase = CoordinationCaseSummary & {
  dataValidacao: string;
  objetoSugerido: string;
  avaliacaoObjeto: string;
  acaoAtual: string;
  acaoSugerida: string;
  avaliacaoAcao: string;
  dificuldadeAtual: string;
  dificuldadeSugerida: string;
  avaliacaoDificuldade: string;
  funcaoAtual: string;
  funcaoSugerida: string;
  avaliacaoFuncao: string;
  avaliacaoTrecho: string;
  decisaoAtual: string;
  questao: ValidationQuestion;
};

type ApiResponse = {
  ok: boolean;
  question?: ValidationQuestion;
  result?: {
    idValidacao?: string;
    possuiDivergencia?: boolean;
    divergencias?: string[];
    mensagem?: string;
    decisao?: string;
    idQuestao?: string;
    camposAlterados?: string[];
    questao?: ValidationQuestion;
  };
  cases?: CoordinationCaseSummary[];
  case?: CoordinationCase;
  error?: string;
  reason?: string;
};

async function request(body: Record<string, unknown>): Promise<ApiResponse> {
  const response = await fetch("/api/validation", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  let result: ApiResponse;
  try {
    result = JSON.parse(raw) as ApiResponse;
  } catch {
    throw new Error("Resposta inválida da API de validação.");
  }

  if (!response.ok || result.ok !== true) {
    throw new Error(result.error || result.reason || "Falha na validação central.");
  }
  return result;
}

export async function getValidationQuestion(id: string): Promise<ValidationQuestion> {
  const result = await request({operation:"getQuestion", id});
  if (!result.question) throw new Error("Questão não retornada pela API.");
  return result.question;
}

export async function submitCentralValidation(validation: ValidationForm) {
  return (await request({operation:"submitValidation", validation})).result;
}

export async function listCentralCoordinationCases(): Promise<CoordinationCaseSummary[]> {
  const result = await request({operation:"listCases"});
  return Array.isArray(result.cases) ? result.cases : [];
}

export async function getCentralCoordinationCase(id: string): Promise<CoordinationCase> {
  const result = await request({operation:"getCase", id});
  if (!result.case) throw new Error("Caso não retornado pela API.");
  return result.case;
}

export async function decideCentralCoordinationCase(input: {
  idValidacao: string;
  decisao: string;
  justificativa: string;
}) {
  return (await request({operation:"decideCase", decision: input})).result;
}
