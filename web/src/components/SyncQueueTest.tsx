"use client";

import { useEffect, useState } from "react";
import {
  enqueueSyncOperation,
  getPendingSyncOperations,
} from "@/lib/db/nave-db";

export default function SyncQueueTest() {
  const [pending, setPending] = useState<number | null>(null);
  const [status, setStatus] = useState(
    "Consultando fila de sincronização"
  );

  async function refreshQueue() {
    try {
      const operations =
        await getPendingSyncOperations();

      setPending(operations.length);

      setStatus(
        operations.length === 0
          ? "Nenhuma operação pendente"
          : `${operations.length} operação(ões) aguardando sincronização`
      );
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
            "Operação criada no teste offline-first V0.4",
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

        <span className="text-sm text-slate-600">
          Pendentes: {pending ?? "—"}
        </span>
      </div>
    </div>
  );
}