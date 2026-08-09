import {
  getPendingSyncOperations,
  updateSyncOperation,
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

  for (const operation of pending) {
    await updateSyncOperation(
      operation.id,
      {
        status: "processing",
        attempts: operation.attempts + 1,
        lastError: undefined,
      }
    );
  }

  try {
    const response = await fetch(
      "/api/sync-test",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          operations: pending,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Falha HTTP ${response.status}`
      );
    }

    const result = await response.json();

    const processedIds = new Set<string>(
      Array.isArray(result.processedIds)
        ? result.processedIds
        : []
    );

    let completed = 0;
    let failed = 0;

    for (const operation of pending) {
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
      sent: pending.length,
      completed,
      failed,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Falha desconhecida";

    for (const operation of pending) {
      await updateSyncOperation(
        operation.id,
        {
          status: "error",
          lastError: message,
        }
      );
    }

    return {
      sent: pending.length,
      completed: 0,
      failed: pending.length,
    };
  }
}