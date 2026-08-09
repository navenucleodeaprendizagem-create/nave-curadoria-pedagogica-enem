import {
  getPendingSyncOperations,
  updateSyncOperation,
  type NaveSyncOperation,
} from "@/lib/db/nave-db";

export interface SyncResult {
  sent: number;
  completed: number;
  failed: number;
}

export async function runSync(): Promise<SyncResult> {
  const pending =
    await getPendingSyncOperations();

  if (pending.length === 0) {
    return {
      sent: 0,
      completed: 0,
      failed: 0,
    };
  }

  const operationsToSend: NaveSyncOperation[] =
    pending.map((operation) => ({
      ...operation,
      status: "processing",
      attempts: operation.attempts + 1,
      updatedAt: new Date().toISOString(),
      lastError: undefined,
    }));

  for (const operation of operationsToSend) {
    await updateSyncOperation(
      operation.id,
      {
        status: "processing",
        attempts: operation.attempts,
        lastError: undefined,
      }
    );
  }

  try {
    const response = await fetch(
      "/api/sync",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          operations: operationsToSend,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Falha HTTP ${response.status}`
      );
    }

    const result = await response.json();

    if (!result?.ok) {
      throw new Error(
        result?.error ||
          "Backend não confirmou a sincronização."
      );
    }

    const processedIds = new Set<string>(
      Array.isArray(result.processedIds)
        ? result.processedIds
        : []
    );

    let completed = 0;
    let failed = 0;

    for (const operation of operationsToSend) {
      if (processedIds.has(operation.id)) {
        await updateSyncOperation(
          operation.id,
          {
            status: "completed",
            lastError: undefined,
          }
        );

        completed += 1;
      } else {
        await updateSyncOperation(
          operation.id,
          {
            status: "error",
            lastError:
              "Servidor não confirmou a operação.",
          }
        );

        failed += 1;
      }
    }

    return {
      sent: operationsToSend.length,
      completed,
      failed,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Falha desconhecida";

    for (const operation of operationsToSend) {
      await updateSyncOperation(
        operation.id,
        {
          status: "error",
          lastError: message,
        }
      );
    }

    return {
      sent: operationsToSend.length,
      completed: 0,
      failed: operationsToSend.length,
    };
  }
}