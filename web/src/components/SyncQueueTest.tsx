"use client";

import { useEffect, useState } from "react";
import {
  enqueueSyncOperation,
  getAllSyncOperations,
  getPendingSyncOperations,
} from "@/lib/db/nave-db";

import { runSync } from "@/lib/sync/sync-engine";

export default function SyncQueueTest() {
  const [pending, setPending] = useState<number | null>(null);
  const [completed, setCompleted] = useState<number | null>(null);

  const [status, setStatus] = useState(
    "Consultando fila de sincronização"
  );

  const [syncing, setSyncing] = useState(false);

  async function refreshQueue() {
    try {
      const pendingOperations =
        await getPendingSyncOperations();

      const allOperations =
        await getAllSyncOperations();

      const completedOperations =
        allOperations.filter(
          (operation) =>
            operation.status === "completed"
        );

      setPending(pendingOperations.length);
      setCompleted(completedOperations.length);

      if (pendingOperations.length === 0) {
        setStatus("Nenhuma operação pendente");
      } else {
        setStatus(
          `${pendingOperations.length} operação(ões) aguardando sincronização`
        );
      }
    } catch (error) {
      console.error(
        "NAVE: falha ao consultar fila.",
        error
      );

      setStatus(
        "Não foi possível consultar a fila"
      );
    }
  }

  useEffect(() => {
    void refreshQueue();
  }, []);

  async function createTestOperation() {
    try {
      setStatus(
        "Registrando operação local"
      );

      await enqueueSyncOperation({
        entity: "validation",
        entityId: "TEST_Q001",
        action: "update",
        payload: {
          statusValidacao:
            "Validada por docente",
          observacao:
            "Operação criada no teste offline-first V0.5",
        },
      });

      await refreshQueue();
    } catch (error) {
      console.error(
        "NAVE: falha ao criar operação.",
        error
      );

      setStatus(
        "Falha ao registrar operação"
      );
    }
  }

  async function synchronizeNow() {
    if (syncing) return;

    try {
      setSyncing(true);
      setStatus("Sincronizando");

      const result = await runSync();

      if (
        result.sent === 0
      ) {
        setStatus(
          "Nenhuma operação para sincronizar"
        );
      } else if (
        result.failed === 0
      ) {
        setStatus(
          `${result.completed} operação(ões) sincronizada(s) com sucesso`
        );
      } else {
        setStatus(
          `${result.completed} concluída(s) · ${result.failed} com erro`
        );
      }

      await refreshQueue();
    } catch (error) {
      console.error(
        "NAVE: falha na sincronização.",
        error
      );

      setStatus(
        "Falha ao executar sincronização"
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-800">
        Fila de sincronização
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {status}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            void createTestOperation()
          }
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
        >
          Criar operação pendente
        </button>

        <button
          type="button"
          disabled={syncing}
          onClick={() =>
            void synchronizeNow()
          }
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncing
            ? "Sincronizando..."
            : "Sincronizar agora"}
        </button>

        <span className="text-sm text-slate-600">
          Pendentes: {pending ?? "—"}
        </span>

        <span className="text-sm text-slate-600">
          Concluídas: {completed ?? "—"}
        </span>
      </div>
    </div>
  );
}