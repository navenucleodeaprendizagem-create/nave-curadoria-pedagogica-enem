"use client";

export type NaveEditorialCentralStatus =
  | "aguardando"
  | "em_producao"
  | "concluido"
  | "cancelado";

export type NaveEditorialCentralJob = {
  id: string;
  sequenceId: string;
  titulo: string;
  descricao: string;
  questionIds: string[];
  quantidadeItens: number;
  status: NaveEditorialCentralStatus;

  professorEmail: string;
  professorNome: string;

  responsavelEditoracaoEmail: string;
  responsavelEditoracaoNome: string;

  createdAt: string;
  updatedAt: string;
  startedAt: string;
  completedAt: string;
  cancelledAt: string;
};

type EditorialApiResponse = {
  ok: boolean;
  jobs?: NaveEditorialCentralJob[];
  job?: NaveEditorialCentralJob;
  sequenceIds?: string[];

  packageInfo?: {
    idEnvio: string;
    idProjeto: string;
    quantidadeQuestoes?: number;
    fontesIncompletas?: number;
    itensNaoLiberados?: number;
    statusPacote: string;
    reutilizado?: boolean;
  };

  error?: string;
  reason?: string;
};

async function readJsonResponse(
  response: Response
): Promise<EditorialApiResponse> {
  const raw =
    await response.text();

  try {
    return JSON.parse(
      raw
    ) as EditorialApiResponse;
  } catch {
    throw new Error(
      "Resposta inválida da API de editoração."
    );
  }
}

async function requestEditorialApi(
  init?: RequestInit
): Promise<EditorialApiResponse> {
  const response =
    await fetch(
      "/api/editorial",
      {
        ...init,

        headers: {
          "Content-Type":
            "application/json",

          ...(init?.headers ?? {}),
        },

        cache: "no-store",
      }
    );

  const result =
    await readJsonResponse(
      response
    );

  if (
    !response.ok ||
    result.ok !== true
  ) {
    throw new Error(
      result.error ||
        result.reason ||
        "Falha na fila central de editoração."
    );
  }

  return result;
}

export async function getCentralEditorialJobs():
  Promise<NaveEditorialCentralJob[]> {
  const result =
    await requestEditorialApi();

  return Array.isArray(
    result.jobs
  )
    ? result.jobs
    : [];
}


export async function getCentralEditorialActiveSequenceIds():
  Promise<string[]> {
  /*
   * A rota distingue o escopo pela query string.
   * Aqui fazemos uma chamada separada para o contexto
   * de Sequências, que não expõe a fila editorial completa.
   */
  const response =
    await fetch(
      "/api/editorial?scope=active-sequences",
      {
        method: "GET",
        cache: "no-store",
      }
    );

  const raw =
    await response.text();

  let scoped:
    EditorialApiResponse;

  try {
    scoped =
      JSON.parse(
        raw
      ) as EditorialApiResponse;
  } catch {
    throw new Error(
      "Resposta inválida da API de editoração."
    );
  }

  if (
    !response.ok ||
    scoped.ok !== true
  ) {
    throw new Error(
      scoped.error ||
        scoped.reason ||
        "Falha ao consultar sequências em editoração."
    );
  }

  return Array.isArray(
    scoped.sequenceIds
  )
    ? scoped.sequenceIds
        .map(String)
        .filter(Boolean)
    : [];
}

export async function createCentralEditorialJob(
  input: {
    sequenceId: string;
    titulo: string;
    descricao: string;
    questionIds: string[];
  }
): Promise<NaveEditorialCentralJob> {
  const result =
    await requestEditorialApi({
      method: "POST",

      body: JSON.stringify({
        operation:
          "create",
        ...input,
      }),
    });

  if (!result.job) {
    throw new Error(
      "A API não retornou o envio editorial criado."
    );
  }

  return result.job;
}

export async function updateCentralEditorialJobStatus(
  id: string,
  status: NaveEditorialCentralStatus
): Promise<NaveEditorialCentralJob> {
  const result =
    await requestEditorialApi({
      method: "POST",

      body: JSON.stringify({
        operation:
          "updateStatus",
        id,
        status,
      }),
    });

  if (!result.job) {
    throw new Error(
      "A API não retornou o envio editorial atualizado."
    );
  }

  return result.job;
}


export async function prepareCentralEditorialPackage(
  id: string
): Promise<{
  idEnvio: string;
  idProjeto: string;
  quantidadeQuestoes?: number;
  fontesIncompletas?: number;
  itensNaoLiberados?: number;
  statusPacote: string;
  reutilizado?: boolean;
}> {
  const result =
    await requestEditorialApi({
      method: "POST",

      body: JSON.stringify({
        operation:
          "preparePackage",
        id,
      }),
    });

  if (!result.packageInfo) {
    throw new Error(
      "A API não retornou os dados do pacote editorial."
    );
  }

  return result.packageInfo;
}
