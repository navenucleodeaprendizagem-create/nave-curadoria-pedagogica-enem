"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  deleteLocalSequence,
  getAllLocalSequences,
  getLocalSequenceItems,
  type NaveSequenceItemRecord,
  type NaveSequenceRecord,
} from "@/lib/db/nave-db";

type SequenceState =
  | {
      status: "loading";
      sequences: NaveSequenceRecord[];
    }
  | {
      status: "ready";
      sequences: NaveSequenceRecord[];
    }
  | {
      status: "error";
      sequences: NaveSequenceRecord[];
      message: string;
    };

function formatDate(
  value: string
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(date);
}

function statusLabel(
  status: NaveSequenceRecord["status"]
): string {
  switch (status) {
    case "rascunho":
      return "Rascunho";
    case "pronta":
      return "Pronta";
    case "arquivada":
      return "Arquivada";
    default:
      return status;
  }
}

export default function SequenciasClient() {
  const [state, setState] =
    useState<SequenceState>({
      status: "loading",
      sequences: [],
    });

  const [
    expandedSequenceId,
    setExpandedSequenceId,
  ] =
    useState<string | null>(
      null
    );

  const [
    sequenceItems,
    setSequenceItems,
  ] =
    useState<
      Record<
        string,
        NaveSequenceItemRecord[]
      >
    >({});

  const [
    loadingSequenceId,
    setLoadingSequenceId,
  ] =
    useState<string | null>(
      null
    );

  const [
    actionMessage,
    setActionMessage,
  ] =
    useState("");

  const loadSequences =
    useCallback(async () => {
      try {
        setState(
          (current) => ({
            status: "loading",
            sequences:
              current.sequences,
          })
        );

        const sequences =
          await getAllLocalSequences();

        setState({
          status: "ready",
          sequences,
        });
      } catch (error) {
        setState({
          status: "error",
          sequences: [],
          message:
            error instanceof Error
              ? error.message
              : "Falha ao carregar as sequências locais.",
        });
      }
    }, []);

  useEffect(() => {
    void loadSequences();
  }, [loadSequences]);

  async function handleOpen(
    sequenceId: string
  ) {
    if (
      expandedSequenceId ===
      sequenceId
    ) {
      setExpandedSequenceId(
        null
      );
      return;
    }

    if (
      sequenceItems[
        sequenceId
      ]
    ) {
      setExpandedSequenceId(
        sequenceId
      );
      return;
    }

    try {
      setLoadingSequenceId(
        sequenceId
      );
      setActionMessage("");

      const items =
        await getLocalSequenceItems(
          sequenceId
        );

      setSequenceItems(
        (current) => ({
          ...current,
          [sequenceId]: items,
        })
      );

      setExpandedSequenceId(
        sequenceId
      );
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Falha ao abrir a sequência."
      );
    } finally {
      setLoadingSequenceId(
        null
      );
    }
  }

  async function handleDelete(
    sequence: NaveSequenceRecord
  ) {
    const confirmed =
      window.confirm(
        `Excluir a sequência “${sequence.titulo}”? Esta ação removerá também os itens salvos desta sequência no banco local.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionMessage("");

      await deleteLocalSequence(
        sequence.id
      );

      setExpandedSequenceId(
        (current) =>
          current ===
          sequence.id
            ? null
            : current
      );

      setSequenceItems(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            sequence.id
          ];

          return next;
        }
      );

      setActionMessage(
        `Sequência “${sequence.titulo}” excluída.`
      );

      await loadSequences();
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Falha ao excluir a sequência."
      );
    }
  }

  const sequences =
    state.sequences;

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
            Banco local
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Sequências salvas
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            As sequências abaixo estão armazenadas no IndexedDB deste navegador.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-800">
            {sequences.length} sequência(s)
          </span>

          <button
            type="button"
            onClick={() =>
              void loadSequences()
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Atualizar
          </button>
        </div>
      </div>

      {actionMessage ? (
        <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
          <p className="text-sm font-semibold text-teal-800">
            {actionMessage}
          </p>
        </div>
      ) : null}

      {state.status ===
      "loading" ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-700">
            Carregando sequências...
          </p>
        </div>
      ) : null}

      {state.status ===
      "error" ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700">
            {state.message}
          </p>
        </div>
      ) : null}

      {state.status ===
        "ready" &&
      sequences.length ===
        0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6">
          <p className="text-sm font-semibold text-slate-800">
            Nenhuma sequência salva.
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Crie uma sequência no Banco de questões. Ela aparecerá aqui automaticamente.
          </p>
        </div>
      ) : null}

      {sequences.length >
      0 ? (
        <div className="mt-6 space-y-4">
          {sequences.map(
            (sequence) => {
              const expanded =
                expandedSequenceId ===
                sequence.id;

              const items =
                sequenceItems[
                  sequence.id
                ] ?? [];

              return (
                <article
                  key={
                    sequence.id
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-amber-800">
                          {statusLabel(
                            sequence.status
                          )}
                        </span>

                        <span className="text-xs text-slate-400">
                          {
                            sequence.quantidadeItens
                          }{" "}
                          questão(ões)
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-950">
                        {
                          sequence.titulo
                        }
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {sequence.descricao ||
                          "Sem descrição."}
                      </p>

                      <p className="mt-3 text-xs text-slate-400">
                        Atualizada em{" "}
                        {formatDate(
                          sequence.updatedAt
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void handleOpen(
                            sequence.id
                          )
                        }
                        disabled={
                          loadingSequenceId ===
                          sequence.id
                        }
                        className="rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingSequenceId ===
                        sequence.id
                          ? "Abrindo..."
                          : expanded
                            ? "Fechar"
                            : "Abrir sequência"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(
                            sequence
                          )
                        }
                        className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="mt-5 border-t border-slate-200 pt-5">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Ordem pedagógica
                      </p>

                      {items.length ===
                      0 ? (
                        <p className="mt-3 text-sm text-slate-500">
                          Nenhum item encontrado nesta sequência.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {items.map(
                            (
                              item
                            ) => (
                              <div
                                key={
                                  item.id
                                }
                                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                              >
                                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-teal-100 px-2 text-xs font-bold text-teal-800">
                                  {
                                    item.position
                                  }
                                </span>

                                <span className="font-mono text-xs font-bold text-slate-700">
                                  {
                                    item.questionId
                                  }
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            }
          )}
        </div>
      ) : null}
    </section>
  );
}