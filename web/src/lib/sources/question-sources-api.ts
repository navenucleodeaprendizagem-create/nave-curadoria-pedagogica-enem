"use client";

export type QuestionPdfSource = {
  idQuestao: string;
  colecaoOrigem: string;
  paginaPdf: number | null;
  nomePublico: string;
  urlPdf: string;
  urlPagina: string;
  statusFonte: string;
  observacao: string;
  disponivel: boolean;
  motivo: string;
};

type SourceApiResponse = {
  ok: boolean;
  sources?: QuestionPdfSource[];
  error?: string;
  reason?: string;
};

export async function getQuestionPdfSources(
  ids: string[]
): Promise<QuestionPdfSource[]> {
  const cleanIds =
    [...new Set(
      ids
        .map((id) =>
          String(id ?? "").trim()
        )
        .filter(Boolean)
    )];

  if (!cleanIds.length) {
    return [];
  }

  const response =
    await fetch(
      "/api/question-sources",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          ids: cleanIds,
        }),
      }
    );

  const raw =
    await response.text();

  let result:
    SourceApiResponse;

  try {
    result =
      JSON.parse(
        raw
      ) as SourceApiResponse;
  } catch {
    throw new Error(
      "Resposta inválida da API de fontes PDF."
    );
  }

  if (
    !response.ok ||
    result.ok !== true
  ) {
    throw new Error(
      result.error ||
        result.reason ||
        "Falha ao consultar a fonte original."
    );
  }

  return Array.isArray(
    result.sources
  )
    ? result.sources
    : [];
}

export async function getQuestionPdfSource(
  id: string
): Promise<QuestionPdfSource | null> {
  const sources =
    await getQuestionPdfSources([
      id,
    ]);

  return sources[0] ?? null;
}
