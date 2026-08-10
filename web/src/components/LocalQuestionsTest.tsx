"use client";

import { useEffect, useState } from "react";

import {
  countQuestions,
  getMeta,
} from "@/lib/db/nave-db";

import {
  syncQuestionBank,
  type QuestionBankSyncProgress,
} from "@/lib/questions/question-bank-sync";

type LocalBankStatus = {
  count: number;
  status: string;
  version: string;
  syncedAt: string;
};

export default function LocalQuestionsTest() {
  const [bank, setBank] =
    useState<LocalBankStatus | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [syncing, setSyncing] =
    useState(false);

  const [progress, setProgress] =
    useState<QuestionBankSyncProgress | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function loadStatus() {
    try {
      setLoading(true);
      setError("");

      const [
        count,
        statusMeta,
        versionMeta,
        syncedAtMeta,
      ] = await Promise.all([
        countQuestions(),
        getMeta("question_bank_status"),
        getMeta("question_bank_version"),
        getMeta("question_bank_synced_at"),
      ]);

      setBank({
        count,

        status:
          typeof statusMeta?.value === "string"
            ? statusMeta.value
            : "não sincronizado",

        version:
          typeof versionMeta?.value === "string"
            ? versionMeta.value
            : "—",

        syncedAt:
          typeof syncedAtMeta?.value === "string"
            ? syncedAtMeta.value
            : "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Falha ao consultar banco local."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  function formatDate(value: string) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("pt-BR");
  }

  async function handleSync() {
    try {
      setSyncing(true);
      setError("");
      setMessage("");
      setProgress({
        current: 0,
        total: 0,
      });

      const result =
        await syncQuestionBank(
          (nextProgress) => {
            setProgress(nextProgress);
          }
        );

      setMessage(
        `Sincronização concluída: ${result.downloaded} registros recebidos; ${result.local} registros locais.`
      );

      await loadStatus();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Falha ao sincronizar banco de questões."
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-teal-700">
          Banco de questões local
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Cópia operacional do Banco NAVE armazenada neste navegador.
        </p>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-600">
          Consultando IndexedDB...
        </p>
      ) : (
        <div className="mt-4 grid gap-2 text-sm text-slate-700">
          <p>
            <strong>Questões locais:</strong>{" "}
            {bank?.count ?? 0}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {bank?.status ?? "—"}
          </p>

          <p>
            <strong>Versão:</strong>{" "}
            {bank?.version ?? "—"}
          </p>

          <p>
            <strong>Última sincronização:</strong>{" "}
            {formatDate(
              bank?.syncedAt ?? ""
            )}
          </p>
        </div>
      )}

      {syncing && progress ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold">
            Sincronizando banco...
          </p>

          <p className="mt-1">
            {progress.current} /{" "}
            {progress.total || "—"}
          </p>

          {progress.total > 0 ? (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-teal-700 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (progress.current /
                        progress.total) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p className="mt-4 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={syncing}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {syncing
            ? "Sincronizando..."
            : "Sincronizar banco"}
        </button>
      </div>
    </div>
  );
}