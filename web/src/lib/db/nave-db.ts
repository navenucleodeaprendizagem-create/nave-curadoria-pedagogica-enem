const DB_NAME = "nave-offline";
const DB_VERSION = 1;

export const STORES = {
  META: "meta",
  QUESTIONS: "questions",
  SEQUENCES: "sequences",
  SEQUENCE_ITEMS: "sequence_items",
  VALIDATIONS: "validations",
  REPORTS: "reports",
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
  area: string;
  disciplina: string;
  competencia: string;
  habilidade: string;
  objeto: string;
  dificuldade: string;
  gabarito: string;
  updatedAt: string;
}

export async function putQuestion(
  question: NaveQuestionRecord
): Promise<void> {
  const db = await openNaveDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORES.QUESTIONS,
      "readwrite"
    );

    const store = transaction.objectStore(
      STORES.QUESTIONS
    );

    store.put(question);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();

      reject(
        transaction.error ??
          new Error(
            "Falha ao salvar questão local."
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