const DB_NAME = "nave-offline";
const DB_VERSION = 2;

export const STORES = {
  META: "meta",
  QUESTIONS: "questions",
  SEQUENCES: "sequences",
  SEQUENCE_ITEMS: "sequence_items",
  VALIDATIONS: "validations",
  REPORTS: "reports",
  EDITORIAL_JOBS: "editorial_jobs",
  SYNC_QUEUE: "sync_queue",
} as const;

export type NaveStoreName =
  (typeof STORES)[keyof typeof STORES];

export interface NaveMetaRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}

function createStoreIfMissing(
  db: IDBDatabase,
  name: string,
  options?: IDBObjectStoreParameters
) {
  if (!db.objectStoreNames.contains(name)) {
    db.createObjectStore(name, options);
  }
}

export function openNaveDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(
        new Error(
          "IndexedDB não está disponível neste ambiente."
        )
      );
      return;
    }

    const request = window.indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      createStoreIfMissing(
        db,
        STORES.META,
        { keyPath: "key" }
      );

      createStoreIfMissing(
        db,
        STORES.QUESTIONS,
        { keyPath: "id" }
      );

      createStoreIfMissing(
        db,
        STORES.SEQUENCES,
        { keyPath: "id" }
      );

      createStoreIfMissing(
        db,
        STORES.SEQUENCE_ITEMS,
        { keyPath: "id" }
      );

      createStoreIfMissing(
        db,
        STORES.VALIDATIONS,
        { keyPath: "id" }
      );

      createStoreIfMissing(
        db,
        STORES.REPORTS,
        { keyPath: "id" }
      );

      createStoreIfMissing(
        db,
        STORES.EDITORIAL_JOBS,
        { keyPath: "id" }
      );

      createStoreIfMissing(
        db,
        STORES.SYNC_QUEUE,
        { keyPath: "id" }
      );
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ??
          new Error(
            "Não foi possível abrir o banco local NAVE."
          )
      );
    };

    request.onblocked = () => {
      console.warn(
        "NAVE: atualização do IndexedDB bloqueada por outra aba."
      );
    };
  });
}

export async function putMeta(
  key: string,
  value: unknown
): Promise<void> {
  const db = await openNaveDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORES.META,
      "readwrite"
    );

    const store = transaction.objectStore(
      STORES.META
    );

    const record: NaveMetaRecord = {
      key,
      value,
      updatedAt: new Date().toISOString(),
    };

    store.put(record);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();

      reject(
        transaction.error ??
          new Error(
            "Falha ao gravar metadado local."
          )
      );
    };
  });
}

export async function getMeta(
  key: string
): Promise<NaveMetaRecord | undefined> {
  const db = await openNaveDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORES.META,
      "readonly"
    );

    const store = transaction.objectStore(
      STORES.META
    );

    const request = store.get(key);

    request.onsuccess = () => {
      const result =
        request.result as NaveMetaRecord | undefined;

      db.close();
      resolve(result);
    };

    request.onerror = () => {
      db.close();

      reject(
        request.error ??
          new Error(
            "Falha ao ler metadado local."
          )
      );
    };
  });
}

export async function initializeNaveDb(): Promise<void> {
  const db = await openNaveDb();
  db.close();

  await putMeta(
    "database_version",
    DB_VERSION
  );

  await putMeta(
    "database_initialized",
    true
  );
}

export interface NaveQuestionRecord {
  id: string;

  componentePrincipal: string;

  competencia: string;
  habilidade: string;
  objetoPrincipal: string;

  dificuldadeRotulo: string;
  dificuldadeFaixa: number;

  ano: string;
  edicao: string;

  funcaoPedagogica: string;
  tempoEstimadoMin: number;

  trechoInicial: string;

  statusItem: string;
  statusCuradoria: string;
  statusValidacao: string;
  maturidadeCuradoria: string;

  quantidadeReportes: number;
  possuiReporteAberto: boolean;

  syncedAt: string;
}

export async function putQuestions(
  questions: NaveQuestionRecord[]
): Promise<void> {
  if (questions.length === 0) {
    return;
  }

  const db = await openNaveDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORES.QUESTIONS,
      "readwrite"
    );

    const store = transaction.objectStore(
      STORES.QUESTIONS
    );

    for (const question of questions) {
      store.put(question);
    }

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();

      reject(
        transaction.error ??
          new Error(
            "Falha ao salvar questões locais em lote."
          )
      );
    };
  });
}

export async function getAllQuestions(): Promise<
  NaveQuestionRecord[]
> {
  const db = await openNaveDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORES.QUESTIONS,
      "readonly"
    );

    const store = transaction.objectStore(
      STORES.QUESTIONS
    );

    const request = store.getAll();

    request.onsuccess = () => {
      const result =
        request.result as NaveQuestionRecord[];

      db.close();
      resolve(result);
    };

    request.onerror = () => {
      db.close();

      reject(
        request.error ??
          new Error(
            "Falha ao ler questões locais."
          )
      );
    };
  });
}

export async function countQuestions(): Promise<number> {
  const db = await openNaveDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORES.QUESTIONS,
      "readonly"
    );

    const store = transaction.objectStore(
      STORES.QUESTIONS
    );

    const request = store.count();

    request.onsuccess = () => {
      const count = request.result;

      db.close();
      resolve(count);
    };

    request.onerror = () => {
      db.close();

      reject(
        request.error ??
          new Error(
            "Falha ao contar questões locais."
          )
      );
    };
  });
}


/* =========================================================
   SEQUÊNCIAS PEDAGÓGICAS — V0.11.5.1
========================================================= */

export type NaveSequenceStatus =
  | "rascunho"
  | "pronta"
  | "arquivada";

export interface NaveSequenceRecord {
  id: string;
  titulo: string;
  descricao: string;
  status: NaveSequenceStatus;
  quantidadeItens: number;
  createdAt: string;
  updatedAt: string;
}

export interface NaveSequenceItemRecord {
  id: string;
  sequenceId: string;
  questionId: string;
  position: number;
  addedAt: string;
}

export interface NaveSequenceWithItems {
  sequence: NaveSequenceRecord;
  items: NaveSequenceItemRecord[];
}

export interface CreateNaveSequenceInput {
  titulo: string;
  descricao?: string;
  questionIds: string[];
}


/* ---------------------------------------------------------
   CRIAÇÃO / PERSISTÊNCIA
--------------------------------------------------------- */

export async function createLocalSequence(
  input: CreateNaveSequenceInput
): Promise<NaveSequenceWithItems> {
  const titulo =
    String(input.titulo ?? "").trim();

  const descricao =
    String(input.descricao ?? "").trim();

  const questionIds =
    input.questionIds
      .map((id) =>
        String(id ?? "").trim()
      )
      .filter(Boolean);

  if (!titulo) {
    throw new Error(
      "Informe um nome para a sequência."
    );
  }

  if (questionIds.length === 0) {
    throw new Error(
      "Selecione pelo menos uma questão para salvar a sequência."
    );
  }

  const uniqueQuestionIds =
    [...new Set(questionIds)];

  if (
    uniqueQuestionIds.length !==
    questionIds.length
  ) {
    throw new Error(
      "A sequência contém questões duplicadas."
    );
  }

  const now =
    new Date().toISOString();

  const sequenceId =
    crypto.randomUUID();

  const sequence: NaveSequenceRecord = {
    id: sequenceId,
    titulo,
    descricao,
    status: "rascunho",
    quantidadeItens:
      questionIds.length,
    createdAt: now,
    updatedAt: now,
  };

  const items:
    NaveSequenceItemRecord[] =
    questionIds.map(
      (
        questionId,
        index
      ) => ({
        id: crypto.randomUUID(),
        sequenceId,
        questionId,
        position: index + 1,
        addedAt: now,
      })
    );

  const db =
    await openNaveDb();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          [
            STORES.SEQUENCES,
            STORES.SEQUENCE_ITEMS,
          ],
          "readwrite"
        );

      const sequenceStore =
        transaction.objectStore(
          STORES.SEQUENCES
        );

      const itemStore =
        transaction.objectStore(
          STORES.SEQUENCE_ITEMS
        );

      sequenceStore.put(
        sequence
      );

      for (const item of items) {
        itemStore.put(item);
      }

      transaction.oncomplete =
        () => {
          db.close();

          resolve({
            sequence,
            items,
          });
        };

      transaction.onerror =
        () => {
          db.close();

          reject(
            transaction.error ??
              new Error(
                "Falha ao salvar a sequência no banco local."
              )
          );
        };

      transaction.onabort =
        () => {
          db.close();

          reject(
            transaction.error ??
              new Error(
                "O salvamento da sequência foi interrompido."
              )
          );
        };
    }
  );
}


/* ---------------------------------------------------------
   LEITURA
--------------------------------------------------------- */

export async function getAllLocalSequences(): Promise<
  NaveSequenceRecord[]
> {
  const db =
    await openNaveDb();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORES.SEQUENCES,
          "readonly"
        );

      const store =
        transaction.objectStore(
          STORES.SEQUENCES
        );

      const request =
        store.getAll();

      request.onsuccess =
        () => {
          const sequences =
            (
              request.result as
                NaveSequenceRecord[]
            ).sort(
              (a, b) =>
                b.updatedAt.localeCompare(
                  a.updatedAt
                )
            );

          db.close();
          resolve(sequences);
        };

      request.onerror =
        () => {
          db.close();

          reject(
            request.error ??
              new Error(
                "Falha ao ler as sequências locais."
              )
          );
        };
    }
  );
}


export async function getLocalSequence(
  id: string
): Promise<
  NaveSequenceRecord | undefined
> {
  const db =
    await openNaveDb();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORES.SEQUENCES,
          "readonly"
        );

      const store =
        transaction.objectStore(
          STORES.SEQUENCES
        );

      const request =
        store.get(id);

      request.onsuccess =
        () => {
          const result =
            request.result as
              | NaveSequenceRecord
              | undefined;

          db.close();
          resolve(result);
        };

      request.onerror =
        () => {
          db.close();

          reject(
            request.error ??
              new Error(
                "Falha ao ler a sequência local."
              )
          );
        };
    }
  );
}


export async function getLocalSequenceItems(
  sequenceId: string
): Promise<
  NaveSequenceItemRecord[]
> {
  const db =
    await openNaveDb();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORES.SEQUENCE_ITEMS,
          "readonly"
        );

      const store =
        transaction.objectStore(
          STORES.SEQUENCE_ITEMS
        );

      const request =
        store.getAll();

      request.onsuccess =
        () => {
          const items =
            (
              request.result as
                NaveSequenceItemRecord[]
            )
              .filter(
                (item) =>
                  item.sequenceId ===
                  sequenceId
              )
              .sort(
                (a, b) =>
                  a.position -
                  b.position
              );

          db.close();
          resolve(items);
        };

      request.onerror =
        () => {
          db.close();

          reject(
            request.error ??
              new Error(
                "Falha ao ler os itens da sequência local."
              )
          );
        };
    }
  );
}


export async function getLocalSequenceWithItems(
  sequenceId: string
): Promise<
  NaveSequenceWithItems | undefined
> {
  const sequence =
    await getLocalSequence(
      sequenceId
    );

  if (!sequence) {
    return undefined;
  }

  const items =
    await getLocalSequenceItems(
      sequenceId
    );

  return {
    sequence,
    items,
  };
}


/* ---------------------------------------------------------
   ATUALIZAÇÃO DE METADADOS
--------------------------------------------------------- */

export async function updateLocalSequenceMetadata(
  sequenceId: string,
  updates: {
    titulo: string;
    descricao?: string;
  }
): Promise<NaveSequenceRecord> {
  const titulo =
    String(updates.titulo ?? "").trim();

  const descricao =
    String(updates.descricao ?? "").trim();

  if (!titulo) {
    throw new Error(
      "Informe um nome para a sequência."
    );
  }

  const db =
    await openNaveDb();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORES.SEQUENCES,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          STORES.SEQUENCES
        );

      const request =
        store.get(sequenceId);

      let updated:
        | NaveSequenceRecord
        | undefined;

      request.onsuccess =
        () => {
          const current =
            request.result as
              | NaveSequenceRecord
              | undefined;

          if (!current) {
            transaction.abort();
            return;
          }

          updated = {
            ...current,
            titulo,
            descricao,
            updatedAt:
              new Date().toISOString(),
          };

          store.put(updated);
        };

      request.onerror =
        () => {
          transaction.abort();
        };

      transaction.oncomplete =
        () => {
          db.close();

          if (!updated) {
            reject(
              new Error(
                "Sequência não encontrada."
              )
            );
            return;
          }

          resolve(updated);
        };

      transaction.onerror =
        () => {
          db.close();

          reject(
            transaction.error ??
              new Error(
                "Falha ao atualizar os dados da sequência."
              )
          );
        };

      transaction.onabort =
        () => {
          db.close();

          reject(
            transaction.error ??
              new Error(
                "A atualização da sequência foi interrompida."
              )
          );
        };
    }
  );
}


/* ---------------------------------------------------------
   ATUALIZAÇÃO DA ORDEM
--------------------------------------------------------- */

export async function replaceLocalSequenceItems(
  sequenceId: string,
  questionIds: string[]
): Promise<void> {
  const normalizedIds =
    questionIds
      .map((id) =>
        String(id ?? "").trim()
      )
      .filter(Boolean);

  if (
    normalizedIds.length === 0
  ) {
    throw new Error(
      "A sequência precisa conter pelo menos uma questão."
    );
  }

  if (
    new Set(normalizedIds).size !==
    normalizedIds.length
  ) {
    throw new Error(
      "A sequência contém questões duplicadas."
    );
  }

  const db =
    await openNaveDb();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          [
            STORES.SEQUENCES,
            STORES.SEQUENCE_ITEMS,
          ],
          "readwrite"
        );

      const sequenceStore =
        transaction.objectStore(
          STORES.SEQUENCES
        );

      const itemStore =
        transaction.objectStore(
          STORES.SEQUENCE_ITEMS
        );

      const getSequenceRequest =
        sequenceStore.get(
          sequenceId
        );

      getSequenceRequest.onsuccess =
        () => {
          const sequence =
            getSequenceRequest.result as
              | NaveSequenceRecord
              | undefined;

          if (!sequence) {
            transaction.abort();
            return;
          }

          const getItemsRequest =
            itemStore.getAll();

          getItemsRequest.onsuccess =
            () => {
              const existingItems =
                (
                  getItemsRequest.result as
                    NaveSequenceItemRecord[]
                ).filter(
                  (item) =>
                    item.sequenceId ===
                    sequenceId
                );

              for (
                const item of
                existingItems
              ) {
                itemStore.delete(
                  item.id
                );
              }

              const now =
                new Date().toISOString();

              normalizedIds.forEach(
                (
                  questionId,
                  index
                ) => {
                  itemStore.put({
                    id:
                      crypto.randomUUID(),
                    sequenceId,
                    questionId,
                    position:
                      index + 1,
                    addedAt: now,
                  } satisfies NaveSequenceItemRecord);
                }
              );

              sequenceStore.put({
                ...sequence,
                quantidadeItens:
                  normalizedIds.length,
                updatedAt: now,
              });
            };

          getItemsRequest.onerror =
            () => {
              transaction.abort();
            };
        };

      getSequenceRequest.onerror =
        () => {
          transaction.abort();
        };

      transaction.oncomplete =
        () => {
          db.close();
          resolve();
        };

      transaction.onerror =
        () => {
          db.close();

          reject(
            transaction.error ??
              new Error(
                "Falha ao atualizar a ordem da sequência."
              )
          );
        };

      transaction.onabort =
        () => {
          db.close();

          reject(
            transaction.error ??
              new Error(
                "A atualização da sequência foi interrompida."
              )
          );
        };
    }
  );
}


/* ---------------------------------------------------------
   ADICIONAR ITENS A UMA SEQUÊNCIA EXISTENTE — V0.11.7.0
--------------------------------------------------------- */

export interface AppendLocalSequenceItemsResult {
  sequence: NaveSequenceRecord;
  addedQuestionIds: string[];
  skippedQuestionIds: string[];
}

export async function appendLocalSequenceItems(
  sequenceId: string,
  questionIds: string[]
): Promise<AppendLocalSequenceItemsResult> {
  const normalizedIds =
    questionIds
      .map((id) =>
        String(id ?? "").trim()
      )
      .filter(Boolean);

  if (normalizedIds.length === 0) {
    throw new Error(
      "Selecione pelo menos uma questão para adicionar."
    );
  }

  const sequence =
    await getLocalSequence(
      sequenceId
    );

  if (!sequence) {
    throw new Error(
      "Sequência não encontrada."
    );
  }

  const currentItems =
    await getLocalSequenceItems(
      sequenceId
    );

  const currentQuestionIds =
    currentItems
      .sort(
        (a, b) =>
          a.position -
          b.position
      )
      .map(
        (item) =>
          item.questionId
      );

  const currentSet =
    new Set(
      currentQuestionIds
    );

  const addedQuestionIds:
    string[] = [];

  const skippedQuestionIds:
    string[] = [];

  const seenIncoming =
    new Set<string>();

  for (const questionId of normalizedIds) {
    if (
      currentSet.has(questionId) ||
      seenIncoming.has(questionId)
    ) {
      skippedQuestionIds.push(
        questionId
      );
      continue;
    }

    seenIncoming.add(
      questionId
    );

    addedQuestionIds.push(
      questionId
    );
  }

  if (
    addedQuestionIds.length > 0
  ) {
    await replaceLocalSequenceItems(
      sequenceId,
      [
        ...currentQuestionIds,
        ...addedQuestionIds,
      ]
    );
  }

  const updatedSequence =
    await getLocalSequence(
      sequenceId
    );

  if (!updatedSequence) {
    throw new Error(
      "Não foi possível confirmar a sequência após a atualização."
    );
  }

  return {
    sequence:
      updatedSequence,
    addedQuestionIds,
    skippedQuestionIds,
  };
}


/* ---------------------------------------------------------
   EXCLUSÃO
--------------------------------------------------------- */

export async function deleteLocalSequence(
  sequenceId: string
): Promise<void> {
  const db =
    await openNaveDb();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          [
            STORES.SEQUENCES,
            STORES.SEQUENCE_ITEMS,
          ],
          "readwrite"
        );

      const sequenceStore =
        transaction.objectStore(
          STORES.SEQUENCES
        );

      const itemStore =
        transaction.objectStore(
          STORES.SEQUENCE_ITEMS
        );

      sequenceStore.delete(
        sequenceId
      );

      const getItemsRequest =
        itemStore.getAll();

      getItemsRequest.onsuccess =
        () => {
          const items =
            getItemsRequest.result as
              NaveSequenceItemRecord[];

          for (const item of items) {
            if (
              item.sequenceId ===
              sequenceId
            ) {
              itemStore.delete(
                item.id
              );
            }
          }
        };

      getItemsRequest.onerror =
        () => {
          transaction.abort();
        };

      transaction.oncomplete =
        () => {
          db.close();
          resolve();
        };

      transaction.onerror =
        () => {
          db.close();

          reject(
            transaction.error ??
              new Error(
                "Falha ao excluir a sequência local."
              )
          );
        };

      transaction.onabort =
        () => {
          db.close();

          reject(
            transaction.error ??
              new Error(
                "A exclusão da sequência foi interrompida."
              )
          );
        };
    }
  );
}



/* =========================================================
   EDITORAÇÃO — V0.11.10.0
   Cada envio gera um snapshot independente da sequência.
========================================================= */

export type NaveEditorialJobStatus =
  | "aguardando"
  | "em_producao"
  | "concluido"
  | "cancelado";

export interface NaveEditorialJob {
  id: string;
  sequenceId: string;
  titulo: string;
  descricao: string;
  questionIds: string[];
  quantidadeItens: number;
  status: NaveEditorialJobStatus;
  createdAt: string;
  updatedAt: string;
}

export async function getAllEditorialJobs(): Promise<
  NaveEditorialJob[]
> {
  const db = await openNaveDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORES.EDITORIAL_JOBS,
      "readonly"
    );

    const store = transaction.objectStore(
      STORES.EDITORIAL_JOBS
    );

    const request = store.getAll();

    request.onsuccess = () => {
      const jobs =
        request.result as NaveEditorialJob[];

      db.close();

      resolve(
        jobs.sort((a, b) =>
          b.createdAt.localeCompare(
            a.createdAt
          )
        )
      );
    };

    request.onerror = () => {
      db.close();

      reject(
        request.error ??
          new Error(
            "Falha ao consultar a fila de editoração."
          )
      );
    };
  });
}

export async function createEditorialJobFromSequence(
  sequenceId: string
): Promise<NaveEditorialJob> {
  const sequence =
    await getLocalSequence(
      sequenceId
    );

  if (!sequence) {
    throw new Error(
      "Sequência não encontrada."
    );
  }

  if (
    sequence.status ===
    "arquivada"
  ) {
    throw new Error(
      "Uma sequência arquivada não pode ser enviada para editoração."
    );
  }

  const items =
    await getLocalSequenceItems(
      sequenceId
    );

  if (items.length === 0) {
    throw new Error(
      "A sequência não possui questões para enviar à editoração."
    );
  }

  const existingJobs =
    await getAllEditorialJobs();

  const activeJob =
    existingJobs.find(
      (job) =>
        job.sequenceId ===
          sequenceId &&
        (
          job.status ===
            "aguardando" ||
          job.status ===
            "em_producao"
        )
    );

  if (activeJob) {
    throw new Error(
      "Esta sequência já possui um envio ativo na editoração."
    );
  }

  const now =
    new Date().toISOString();

  const job:
    NaveEditorialJob = {
      id: crypto.randomUUID(),
      sequenceId,
      titulo: sequence.titulo,
      descricao:
        sequence.descricao ?? "",
      questionIds:
        items
          .sort(
            (a, b) =>
              a.position -
              b.position
          )
          .map(
            (item) =>
              item.questionId
          ),
      quantidadeItens:
        items.length,
      status: "aguardando",
      createdAt: now,
      updatedAt: now,
    };

  const db =
    await openNaveDb();

  await new Promise<void>(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          [
            STORES.EDITORIAL_JOBS,
            STORES.SEQUENCES,
          ],
          "readwrite"
        );

      const editorialStore =
        transaction.objectStore(
          STORES.EDITORIAL_JOBS
        );

      const sequenceStore =
        transaction.objectStore(
          STORES.SEQUENCES
        );

      editorialStore.put(job);

      sequenceStore.put({
        ...sequence,
        status: "pronta",
        updatedAt: now,
      } satisfies NaveSequenceRecord);

      transaction.oncomplete =
        () => {
          db.close();
          resolve();
        };

      transaction.onerror =
        () => {
          db.close();

          reject(
            transaction.error ??
              new Error(
                "Falha ao enviar a sequência para editoração."
              )
          );
        };

      transaction.onabort =
        () => {
          db.close();

          reject(
            transaction.error ??
              new Error(
                "O envio para editoração foi interrompido."
              )
          );
        };
    }
  );

  return job;
}

export async function updateEditorialJobStatus(
  id: string,
  status: NaveEditorialJobStatus
): Promise<NaveEditorialJob> {
  const db =
    await openNaveDb();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORES.EDITORIAL_JOBS,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          STORES.EDITORIAL_JOBS
        );

      const request =
        store.get(id);

      request.onsuccess =
        () => {
          const current =
            request.result as
              | NaveEditorialJob
              | undefined;

          if (!current) {
            transaction.abort();

            reject(
              new Error(
                "Envio editorial não encontrado."
              )
            );

            return;
          }

          const updated:
            NaveEditorialJob = {
            ...current,
            status,
            updatedAt:
              new Date().toISOString(),
          };

          store.put(updated);

          transaction.oncomplete =
            () => {
              db.close();
              resolve(updated);
            };
        };

      request.onerror =
        () => {
          transaction.abort();
        };

      transaction.onerror =
        () => {
          db.close();

          reject(
            transaction.error ??
              new Error(
                "Falha ao atualizar o status editorial."
              )
          );
        };

      transaction.onabort =
        () => {
          db.close();

          reject(
            transaction.error ??
              new Error(
                "A atualização editorial foi interrompida."
              )
          );
        };
    }
  );
}


/* =========================================================
   FILA DE SINCRONIZAÇÃO
========================================================= */

export type SyncOperationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "error";

export type SyncOperationAction =
  | "create"
  | "update"
  | "delete";

export interface NaveSyncOperation {
  id: string;
  entity: string;
  entityId: string;
  action: SyncOperationAction;
  payload: unknown;
  status: SyncOperationStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
}

export async function enqueueSyncOperation(
  input: Omit<
    NaveSyncOperation,
    | "id"
    | "status"
    | "attempts"
    | "createdAt"
    | "updatedAt"
  >
): Promise<NaveSyncOperation> {
  const now = new Date().toISOString();

  const operation: NaveSyncOperation = {
    ...input,
    id: crypto.randomUUID(),
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };

  const db = await openNaveDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORES.SYNC_QUEUE,
      "readwrite"
    );

    const store = transaction.objectStore(
      STORES.SYNC_QUEUE
    );

    store.put(operation);

    transaction.oncomplete = () => {
      db.close();
      resolve(operation);
    };

    transaction.onerror = () => {
      db.close();

      reject(
        transaction.error ??
          new Error(
            "Falha ao registrar operação na fila de sincronização."
          )
      );
    };
  });
}

export async function getAllSyncOperations(): Promise<
  NaveSyncOperation[]
> {
  const db = await openNaveDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORES.SYNC_QUEUE,
      "readonly"
    );

    const store = transaction.objectStore(
      STORES.SYNC_QUEUE
    );

    const request = store.getAll();

    request.onsuccess = () => {
      const operations =
        request.result as NaveSyncOperation[];

      db.close();

      resolve(
        operations.sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt)
        )
      );
    };

    request.onerror = () => {
      db.close();

      reject(
        request.error ??
          new Error(
            "Falha ao consultar a fila de sincronização."
          )
      );
    };
  });
}

export async function getPendingSyncOperations(): Promise<
  NaveSyncOperation[]
> {
  const operations =
    await getAllSyncOperations();

  return operations.filter(
    (operation) =>
      operation.status === "pending" ||
      operation.status === "error"
  );
}

export async function updateSyncOperation(
  id: string,
  updates: Partial<
    Pick<
      NaveSyncOperation,
      | "status"
      | "attempts"
      | "lastError"
    >
  >
): Promise<void> {
  const db = await openNaveDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORES.SYNC_QUEUE,
      "readwrite"
    );

    const store = transaction.objectStore(
      STORES.SYNC_QUEUE
    );

    const request = store.get(id);

    request.onsuccess = () => {
      const current =
        request.result as
          | NaveSyncOperation
          | undefined;

      if (!current) {
        transaction.abort();
        db.close();

        reject(
          new Error(
            `Operação de sincronização não encontrada: ${id}`
          )
        );

        return;
      }

      store.put({
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    };

    request.onerror = () => {
      transaction.abort();
    };

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();

      reject(
        transaction.error ??
          new Error(
            "Falha ao atualizar operação de sincronização."
          )
      );
    };
  });
}