import {
  countQuestions,
  putMeta,
  putQuestions,
  type NaveQuestionRecord,
} from "@/lib/db/nave-db";

type QuestionBankInfoResponse = {
  ok: true;
  action: "getQuestionBankInfo";

  bank: {
    version: string;
    total: number;
    chunkSize: number;
    generatedAt: string;
  };
};

type QuestionBankChunkRecord =
  Omit<
    NaveQuestionRecord,
    "syncedAt"
  >;

type QuestionBankChunkResponse = {
  ok: true;
  action:
    "getQuestionBankChunk";

  chunk: {
    offset: number;
    limit: number;
    count: number;
    total: number;
    hasMore: boolean;
    nextOffset:
      | number
      | null;
    records:
      QuestionBankChunkRecord[];
  };
};

export type QuestionBankSyncProgress = {
  current: number;
  total: number;
};

export async function syncQuestionBank(
  onProgress?: (
    progress: QuestionBankSyncProgress
  ) => void
) {
  await putMeta(
    "question_bank_status",
    "syncing"
  );

  const infoResponse =
    await fetch(
      "/api/questions-sync",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          action: "info",
        }),
      }
    );

  if (!infoResponse.ok) {
    throw new Error(
      `Falha ao consultar banco: ${infoResponse.status}`
    );
  }

  const info =
    (await infoResponse.json()) as
      QuestionBankInfoResponse;

  if (!info?.ok || !info.bank) {
    throw new Error(
      "Metadados do banco inválidos."
    );
  }

  const total =
    Number(info.bank.total || 0);

  const chunkSize =
    Number(
      info.bank.chunkSize ||
      500
    );

  let offset = 0;
  let downloaded = 0;

  while (offset < total) {
    const response =
      await fetch(
        "/api/questions-sync",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            action: "chunk",
            offset,
            limit: chunkSize,
          }),
        }
      );

    if (!response.ok) {
      throw new Error(
        `Falha ao baixar bloco ${offset}: ${response.status}`
      );
    }

    const result =
      (await response.json()) as
        QuestionBankChunkResponse;

    if (
      !result?.ok ||
      !result.chunk
    ) {
      throw new Error(
        `Bloco inválido em offset ${offset}.`
      );
    }

    const syncedAt =
      new Date().toISOString();

    const records:
      NaveQuestionRecord[] =
      result.chunk.records.map(
        (record) => ({
          ...record,
          syncedAt,
        })
      );

    await putQuestions(records);

    downloaded +=
      records.length;

    onProgress?.({
      current: downloaded,
      total,
    });

    if (
      result.chunk.nextOffset ===
      null
    ) {
      break;
    }

    offset =
      result.chunk.nextOffset;
  }

  const localCount =
    await countQuestions();

  await putMeta(
    "question_bank_version",
    info.bank.version
  );

  await putMeta(
    "question_bank_total",
    total
  );

  await putMeta(
    "question_bank_synced_at",
    new Date().toISOString()
  );

  await putMeta(
    "question_bank_status",
    localCount >= total
      ? "ready"
      : "incomplete"
  );

  return {
    expected: total,
    downloaded,
    local: localCount,
    status:
      localCount >= total
        ? "ready"
        : "incomplete",
  };
}