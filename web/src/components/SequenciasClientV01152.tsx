"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { SYSTEM_VERSION } from "@/lib/system-version";

import {
  getQuestionPdfSources,
  type QuestionPdfSource,
} from "@/lib/sources/question-sources-api";

import {
  createEditorialJobFromSequence,
  deleteLocalSequence,
  getAllEditorialJobs,
  getAllLocalSequences,
  getAllQuestions,
  getLocalSequenceItems,
  replaceLocalSequenceItems,
  updateLocalSequenceMetadata,
  type NaveQuestionRecord,
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
  const searchParams = useSearchParams();
  const sequenceFromValidation = searchParams.get("sequencia");
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
    pdfSourcesByQuestionId,
    setPdfSourcesByQuestionId,
  ] =
    useState<
      Record<
        string,
        QuestionPdfSource
      >
    >({});

  const [
    sourceError,
    setSourceError,
  ] =
    useState("");

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

  const [
    editingSequenceId,
    setEditingSequenceId,
  ] =
    useState<string | null>(
      null
    );

  const [
    editTitle,
    setEditTitle,
  ] =
    useState("");

  const [
    editDescription,
    setEditDescription,
  ] =
    useState("");

  const [
    editQuestionIds,
    setEditQuestionIds,
  ] =
    useState<string[]>([]);

  const [
    savingEdit,
    setSavingEdit,
  ] =
    useState(false);

  const [
    sendingEditorialSequenceId,
    setSendingEditorialSequenceId,
  ] =
    useState<string | null>(
      null
    );

  const [
    activeEditorialSequenceIds,
    setActiveEditorialSequenceIds,
  ] =
    useState<Set<string>>(
      new Set()
    );

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

        const [
          sequences,
          questions,
          editorialJobs,
        ] =
          await Promise.all([
            getAllLocalSequences(),
            getAllQuestions(),
            getAllEditorialJobs(),
          ]);

        const nextQuestionsById =
          Object.fromEntries(
            questions.map(
              (question) => [
                question.id,
                question,
              ]
            )
          );

        setQuestionsById(
          nextQuestionsById
        );

        setActiveEditorialSequenceIds(
          new Set(
            editorialJobs
              .filter(
                (job) =>
                  job.status ===
                    "aguardando" ||
                  job.status ===
                    "em_producao"
              )
              .map(
                (job) =>
                  job.sequenceId
              )
          )
        );

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

  useEffect(() => {
    if (
      !sequenceFromValidation ||
      state.status !== "ready" ||
      expandedSequenceId === sequenceFromValidation
    ) {
      return;
    }

    void handleOpen(
      sequenceFromValidation
    );
  }, [
    sequenceFromValidation,
    state.status,
    expandedSequenceId,
  ]);

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
      const cachedItems =
        sequenceItems[
          sequenceId
        ];

      const missingIds =
        cachedItems
          .map(
            (item) =>
              item.questionId
          )
          .filter(
            (id) =>
              !pdfSourcesByQuestionId[
                id
              ]
          );

      if (missingIds.length) {
        try {
          const sources =
            await getQuestionPdfSources(
              missingIds
            );

          setPdfSourcesByQuestionId(
            (current) => ({
              ...current,
              ...Object.fromEntries(
                sources.map(
                  (source) => [
                    source.idQuestao,
                    source,
                  ]
                )
              ),
            })
          );
        } catch (error) {
          setSourceError(
            error instanceof Error
              ? error.message
              : "Falha ao consultar as fontes PDF."
          );
        }
      }

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

      setSourceError("");

      try {
        const sources =
          await getQuestionPdfSources(
            items.map(
              (item) =>
                item.questionId
            )
          );

        setPdfSourcesByQuestionId(
          (current) => ({
            ...current,
            ...Object.fromEntries(
              sources.map(
                (source) => [
                  source.idQuestao,
                  source,
                ]
              )
            ),
          })
        );
      } catch (error) {
        setSourceError(
          error instanceof Error
            ? error.message
            : "Falha ao consultar as fontes PDF."
        );
      }

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

  async function startEditing(
    sequence: NaveSequenceRecord
  ) {
    try {
      setActionMessage("");
      setLoadingSequenceId(
        sequence.id
      );

      const items =
        sequenceItems[
          sequence.id
        ] ??
        (await getLocalSequenceItems(
          sequence.id
        ));

      setSequenceItems(
        (current) => ({
          ...current,
          [sequence.id]: items,
        })
      );

      setExpandedSequenceId(
        sequence.id
      );

      setEditingSequenceId(
        sequence.id
      );

      setEditTitle(
        sequence.titulo
      );

      setEditDescription(
        sequence.descricao ?? ""
      );

      setEditQuestionIds(
        items
          .sort(
            (a, b) =>
              a.position -
              b.position
          )
          .map(
            (item) =>
              item.questionId
          )
      );
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Falha ao iniciar a edição da sequência."
      );
    } finally {
      setLoadingSequenceId(
        null
      );
    }
  }

  function cancelEditing() {
    setEditingSequenceId(
      null
    );
    setEditTitle("");
    setEditDescription("");
    setEditQuestionIds([]);
    setActionMessage("");
  }

  function moveEditQuestion(
    index: number,
    direction: -1 | 1
  ) {
    setEditQuestionIds(
      (current) => {
        const targetIndex =
          index + direction;

        if (
          targetIndex < 0 ||
          targetIndex >=
            current.length
        ) {
          return current;
        }

        const next = [
          ...current,
        ];

        [
          next[index],
          next[targetIndex],
        ] = [
          next[targetIndex],
          next[index],
        ];

        return next;
      }
    );
  }

  function removeEditQuestion(
    questionId: string
  ) {
    setEditQuestionIds(
      (current) =>
        current.filter(
          (id) =>
            id !== questionId
        )
    );
  }

  async function saveEditing(
    sequenceId: string
  ) {
    const titulo =
      editTitle.trim();

    if (!titulo) {
      setActionMessage(
        "Informe um nome para a sequência."
      );
      return;
    }

    if (
      editQuestionIds.length === 0
    ) {
      setActionMessage(
        "A sequência precisa conter pelo menos uma questão."
      );
      return;
    }

    try {
      setSavingEdit(true);
      setActionMessage("");

      await updateLocalSequenceMetadata(
        sequenceId,
        {
          titulo,
          descricao:
            editDescription.trim(),
        }
      );

      await replaceLocalSequenceItems(
        sequenceId,
        editQuestionIds
      );

      const refreshedItems =
        await getLocalSequenceItems(
          sequenceId
        );

      setSequenceItems(
        (current) => ({
          ...current,
          [sequenceId]:
            refreshedItems,
        })
      );

      setEditingSequenceId(
        null
      );

      setEditTitle("");
      setEditDescription("");
      setEditQuestionIds([]);

      await loadSequences();

      setExpandedSequenceId(
        sequenceId
      );

      setActionMessage(
        "Alterações da sequência salvas com sucesso."
      );
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Falha ao salvar as alterações da sequência."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleSendToEditorial(
    sequence: NaveSequenceRecord
  ) {
    const confirmed =
      window.confirm(
        `Enviar a sequência “${sequence.titulo}” para editoração? Será criado um snapshot com a ordem atual das questões.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSendingEditorialSequenceId(
        sequence.id
      );

      setActionMessage("");

      await createEditorialJobFromSequence(
        sequence.id
      );

      setActionMessage(
        `Sequência “${sequence.titulo}” enviada para editoração.`
      );

      await loadSequences();
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Falha ao enviar a sequência para editoração."
      );
    } finally {
      setSendingEditorialSequenceId(
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

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-950">
              Sequências salvas
            </h2>

            <span className="rounded-full border border-teal-200 bg-white px-2.5 py-1 text-[10px] font-bold text-teal-800">
              {SYSTEM_VERSION}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            As sequências abaixo estão armazenadas no IndexedDB deste navegador e vinculadas aos dados pedagógicos do banco local.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/banco-questoes"
            className="rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50"
          >
            Adicionar questões
          </Link>

          <Link
            href="/editoracao"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
          >
            Editoração
          </Link>

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

      {sourceError ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            Não foi possível consultar a fonte original agora: {sourceError}
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

          <Link
            href="/banco-questoes"
            className="mt-4 inline-flex rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
          >
            Ir para o Banco de questões
          </Link>
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

              const inEditorial =
                activeEditorialSequenceIds.has(
                  sequence.id
                );

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
                          void startEditing(
                            sequence
                          )
                        }
                        disabled={
                          loadingSequenceId ===
                            sequence.id ||
                          editingSequenceId ===
                            sequence.id
                        }
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {editingSequenceId ===
                        sequence.id
                          ? "Editando"
                          : "Editar"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleSendToEditorial(
                            sequence
                          )
                        }
                        disabled={
                          inEditorial ||
                          sendingEditorialSequenceId ===
                            sequence.id
                        }
                        className="rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sendingEditorialSequenceId ===
                        sequence.id
                          ? "Enviando..."
                          : inEditorial
                            ? "Na editoração"
                            : "Enviar à editoração"}
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
                      {editingSequenceId ===
                      sequence.id ? (
                        <div>
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                              <label className="text-xs font-bold text-slate-700">
                                Nome da sequência
                              </label>

                              <input
                                type="text"
                                value={
                                  editTitle
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditTitle(
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-700">
                                Descrição
                              </label>

                              <input
                                type="text"
                                value={
                                  editDescription
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditDescription(
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                              />
                            </div>
                          </div>

                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                Editar ordem pedagógica
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  editQuestionIds.length
                                }{" "}
                                questão(ões) na sequência
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={
                                  cancelEditing
                                }
                                disabled={
                                  savingEdit
                                }
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                              >
                                Cancelar
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void saveEditing(
                                    sequence.id
                                  )
                                }
                                disabled={
                                  savingEdit ||
                                  editQuestionIds.length ===
                                    0
                                }
                                className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {savingEdit
                                  ? "Salvando..."
                                  : "Salvar alterações"}
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            {editQuestionIds.map(
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
                                    key={
                                      questionId
                                    }
                                    className="rounded-2xl border border-slate-200 bg-white p-4"
                                  >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                      <div className="flex min-w-0 items-start gap-3">
                                        <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 px-2 text-xs font-bold text-teal-800">
                                          {
                                            index +
                                            1
                                          }
                                        </span>

                                        <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-teal-700">
                                              {
                                                questionId
                                              }
                                            </span>

                                            {question ? (
                                              <>
                                                <span className="text-xs text-slate-400">
                                                  {
                                                    question.competencia
                                                  }
                                                </span>

                                                <span className="text-xs text-slate-400">
                                                  {
                                                    question.habilidade
                                                  }
                                                </span>
                                              </>
                                            ) : null}
                                          </div>

                                          <p className="mt-1 text-sm font-bold text-slate-950">
                                            {question?.objetoPrincipal ||
                                              "Questão não localizada no banco local"}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex shrink-0 flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            moveEditQuestion(
                                              index,
                                              -1
                                            )
                                          }
                                          disabled={
                                            index ===
                                            0
                                          }
                                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          ↑ Subir
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            moveEditQuestion(
                                              index,
                                              1
                                            )
                                          }
                                          disabled={
                                            index ===
                                            editQuestionIds.length -
                                              1
                                          }
                                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          ↓ Descer
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeEditQuestion(
                                              questionId
                                            )
                                          }
                                          disabled={
                                            editQuestionIds.length <=
                                            1
                                          }
                                          title={
                                            editQuestionIds.length <=
                                            1
                                              ? "A sequência precisa manter pelo menos uma questão."
                                              : undefined
                                          }
                                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          Remover
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
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
                                ) => {
                                  const question =
                                    questionsById[
                                      item.questionId
                                    ];

                                  const pdfSource =
                                    pdfSourcesByQuestionId[
                                      item.questionId
                                    ];

                                  return (
                                    <div
                                      key={
                                        item.id
                                      }
                                      className="rounded-2xl border border-slate-200 bg-white p-4"
                                    >
                                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                                        <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 px-2 text-xs font-bold text-teal-800">
                                          {
                                            item.position
                                          }
                                        </span>

                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-teal-700">
                                              {
                                                item.questionId
                                              }
                                            </span>

                                            {question ? (
                                              <>
                                                <span className="text-xs text-slate-400">
                                                  {
                                                    question.competencia
                                                  }
                                                </span>

                                                <span className="text-xs text-slate-400">
                                                  {
                                                    question.habilidade
                                                  }
                                                </span>
                                              </>
                                            ) : null}
                                          </div>

                                          {question ? (
                                            <>
                                              <h4 className="mt-2 text-sm font-bold text-slate-950">
                                                {
                                                  question.objetoPrincipal ||
                                                  "Objeto do conhecimento não informado"
                                                }
                                              </h4>

                                              <div className="mt-2 flex flex-wrap gap-2">
                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                  {
                                                    question.dificuldadeRotulo
                                                  }
                                                </span>

                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                  {
                                                    question.ano
                                                  }
                                                  {" · "}
                                                  {
                                                    question.edicao
                                                  }
                                                </span>

                                                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800">
                                                  {
                                                    question.funcaoPedagogica ||
                                                    "Função pedagógica não informada"
                                                  }
                                                </span>
                                              </div>

                                              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                  <p className="text-xs text-slate-600">
                                                    <span className="font-semibold text-slate-700">
                                                      Fonte:
                                                    </span>{" "}
                                                    {pdfSource?.nomePublico ||
                                                      pdfSource?.colecaoOrigem ||
                                                      "não localizada"}
                                                    {pdfSource?.paginaPdf
                                                      ? ` · pág. ${pdfSource.paginaPdf}`
                                                      : ""}
                                                  </p>

                                                  <div className="flex flex-wrap gap-2">
                                                    {pdfSource?.disponivel &&
                                                    pdfSource.urlPagina ? (
                                                      <a
                                                        href={pdfSource.urlPagina}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                                                      >
                                                        Ver original
                                                      </a>
                                                    ) : (
                                                      <span
                                                        title={pdfSource?.motivo || "Fonte não localizada."}
                                                        className="inline-flex rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800"
                                                      >
                                                        Fonte indisponível
                                                      </span>
                                                    )}

                                                    <Link
                                                      href={`/validacao?id=${encodeURIComponent(
                                                        item.questionId
                                                      )}&origem=sequencias&sequencia=${encodeURIComponent(
                                                        sequence.id
                                                      )}`}
                                                      className="inline-flex rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-bold text-teal-800 shadow-sm transition hover:bg-teal-50"
                                                    >
                                                      Validar
                                                    </Link>
                                                  </div>
                                                </div>
                                              </div>

                                              <p className="mt-3 text-sm leading-6 text-slate-600">
                                                {
                                                  question.trechoInicial ||
                                                  "Trecho inicial não disponível."
                                                }
                                              </p>
                                            </>
                                          ) : (
                                            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                                              <p className="text-xs font-semibold text-amber-800">
                                                Questão não localizada no banco local.
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </>
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
