"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAllEditorialJobs,
  getAllQuestions,
  updateEditorialJobStatus,
  type NaveEditorialJob,
  type NaveEditorialJobStatus,
  type NaveQuestionRecord,
} from "@/lib/db/nave-db";

function formatDate(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value || "—";
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
  status: NaveEditorialJobStatus
): string {
  switch (status) {
    case "aguardando":
      return "Aguardando";
    case "em_producao":
      return "Em produção";
    case "concluido":
      return "Concluído";
    case "cancelado":
      return "Cancelado";
    default:
      return status;
  }
}

function statusClass(
  status: NaveEditorialJobStatus
): string {
  switch (status) {
    case "aguardando":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "em_producao":
      return "border-indigo-200 bg-indigo-50 text-indigo-800";
    case "concluido":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "cancelado":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

export default function EditoracaoClient() {
  const [
    jobs,
    setJobs,
  ] =
    useState<
      NaveEditorialJob[]
    >([]);

  const [
    questionsById,
    setQuestionsById,
  ] =
    useState<
      Record<
        string,
        NaveQuestionRecord
      >
    >({});

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    actionMessage,
    setActionMessage,
  ] =
    useState("");

  const [
    expandedJobId,
    setExpandedJobId,
  ] =
    useState<string | null>(
      null
    );

  const [
    updatingJobId,
    setUpdatingJobId,
  ] =
    useState<string | null>(
      null
    );

  const loadData =
    useCallback(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [
          nextJobs,
          questions,
        ] =
          await Promise.all([
            getAllEditorialJobs(),
            getAllQuestions(),
          ]);

        setJobs(nextJobs);

        setQuestionsById(
          Object.fromEntries(
            questions.map(
              (question) => [
                question.id,
                question,
              ]
            )
          )
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Falha ao carregar a fila de editoração."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const summary =
    useMemo(
      () => ({
        total: jobs.length,
        aguardando:
          jobs.filter(
            (job) =>
              job.status ===
              "aguardando"
          ).length,
        producao:
          jobs.filter(
            (job) =>
              job.status ===
              "em_producao"
          ).length,
        concluidos:
          jobs.filter(
            (job) =>
              job.status ===
              "concluido"
          ).length,
      }),
      [jobs]
    );

  async function changeStatus(
    job: NaveEditorialJob,
    status: NaveEditorialJobStatus
  ) {
    try {
      setUpdatingJobId(
        job.id
      );

      setActionMessage("");

      await updateEditorialJobStatus(
        job.id,
        status
      );

      await loadData();

      setActionMessage(
        `Status de “${job.titulo}” atualizado para ${statusLabel(
          status
        )}.`
      );
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Falha ao atualizar o status editorial."
      );
    } finally {
      setUpdatingJobId(
        null
      );
    }
  }

  return (
    <section className="mt-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            "Total",
            summary.total,
          ],
          [
            "Aguardando",
            summary.aguardando,
          ],
          [
            "Em produção",
            summary.producao,
          ],
          [
            "Concluídos",
            summary.concluidos,
          ],
        ].map(
          ([label, value]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                {label}
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-950">
                {value}
              </p>
            </div>
          )
        )}
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
              Fila editorial local
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Sequências enviadas
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Cada envio preserva um snapshot da sequência e da ordem das questões no momento do encaminhamento.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/sequencias"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Voltar às sequências
            </Link>

            <button
              type="button"
              onClick={() =>
                void loadData()
              }
              className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
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

        {errorMessage ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-700">
              {errorMessage}
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">
              Carregando fila editorial...
            </p>
          </div>
        ) : null}

        {!loading &&
        jobs.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6">
            <p className="text-sm font-semibold text-slate-800">
              Nenhuma sequência enviada para editoração.
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Abra Sequências pedagógicas e use “Enviar à editoração”.
            </p>
          </div>
        ) : null}

        {jobs.length > 0 ? (
          <div className="mt-6 space-y-4">
            {jobs.map(
              (job) => {
                const expanded =
                  expandedJobId ===
                  job.id;

                return (
                  <article
                    key={job.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${statusClass(
                              job.status
                            )}`}
                          >
                            {statusLabel(
                              job.status
                            )}
                          </span>

                          <span className="text-xs text-slate-400">
                            {job.quantidadeItens} questão(ões)
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-bold text-slate-950">
                          {job.titulo}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {job.descricao ||
                            "Sem descrição."}
                        </p>

                        <p className="mt-3 text-xs text-slate-400">
                          Enviado em{" "}
                          {formatDate(
                            job.createdAt
                          )}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedJobId(
                              expanded
                                ? null
                                : job.id
                            )
                          }
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          {expanded
                            ? "Fechar"
                            : "Ver snapshot"}
                        </button>

                        {job.status ===
                        "aguardando" ? (
                          <button
                            type="button"
                            disabled={
                              updatingJobId ===
                              job.id
                            }
                            onClick={() =>
                              void changeStatus(
                                job,
                                "em_producao"
                              )
                            }
                            className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-50"
                          >
                            Iniciar produção
                          </button>
                        ) : null}

                        {job.status ===
                        "em_producao" ? (
                          <button
                            type="button"
                            disabled={
                              updatingJobId ===
                              job.id
                            }
                            onClick={() =>
                              void changeStatus(
                                job,
                                "concluido"
                              )
                            }
                            className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:opacity-50"
                          >
                            Concluir
                          </button>
                        ) : null}

                        {job.status ===
                          "aguardando" ||
                        job.status ===
                          "em_producao" ? (
                          <button
                            type="button"
                            disabled={
                              updatingJobId ===
                              job.id
                            }
                            onClick={() =>
                              void changeStatus(
                                job,
                                "cancelado"
                              )
                            }
                            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {expanded ? (
                      <div className="mt-5 border-t border-slate-200 pt-5">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          Snapshot enviado
                        </p>

                        <div className="mt-3 space-y-3">
                          {job.questionIds.map(
                            (
                              questionId,
                              index
                            ) => {
                              const question =
                                questionsById[
                                  questionId
                                ];

                              return (
                                <div
                                  key={`${job.id}-${questionId}-${index}`}
                                  className="rounded-xl border border-slate-200 bg-white p-4"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                                      {index + 1}
                                    </span>

                                    <span className="font-mono text-xs font-semibold text-slate-700">
                                      {questionId}
                                    </span>
                                  </div>

                                  {question ? (
                                    <>
                                      <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {question.objetoPrincipal ||
                                          "Objeto não informado"}
                                      </p>

                                      <p className="mt-1 text-xs leading-5 text-slate-500">
                                        {question.competencia} · {question.habilidade} · {question.dificuldadeRotulo}
                                      </p>

                                      <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {question.trechoInicial ||
                                          "Trecho não disponível no banco local."}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="mt-2 text-xs text-amber-700">
                                      Metadados desta questão não estão disponíveis neste navegador.
                                    </p>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              }
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}