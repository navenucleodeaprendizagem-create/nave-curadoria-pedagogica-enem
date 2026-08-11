"use client";

import Link from "next/link";

import Image from "next/image";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { SYSTEM_VERSION } from "@/lib/system-version";

import {
  appendLocalSequenceItems,
  createLocalSequence,
  getAllLocalSequences,
  getAllQuestions,
  type NaveQuestionRecord,
  type NaveSequenceRecord,
} from "@/lib/db/nave-db";

import {
  filterQuestions,
  isEligibleQuestion,
  rankQuestions,
  type QuestionSearchFilters,
} from "@/lib/questions/question-search";

type FilterKey =
  keyof QuestionSearchFilters;

type FilterDefinition = {
  key: FilterKey;
  label: string;
  allLabel: string;
  value: (
    question: NaveQuestionRecord
  ) => string;
};

const FILTERS: FilterDefinition[] = [
  {
    key: "componentePrincipal",
    label: "Componente / disciplina",
    allLabel: "Todos",
    value: (q) =>
      q.componentePrincipal,
  },
  {
    key: "competencia",
    label: "Competência",
    allLabel: "Todas",
    value: (q) =>
      q.competencia,
  },
  {
    key: "habilidade",
    label: "Habilidade",
    allLabel: "Todas",
    value: (q) =>
      q.habilidade,
  },
  {
    key: "objetoPrincipal",
    label: "Objeto do conhecimento",
    allLabel: "Todos",
    value: (q) =>
      q.objetoPrincipal,
  },
  {
    key: "dificuldadeRotulo",
    label: "Dificuldade",
    allLabel: "Todas",
    value: (q) =>
      q.dificuldadeRotulo,
  },
  {
    key: "ano",
    label: "Ano",
    allLabel: "Todos",
    value: (q) =>
      q.ano,
  },
  {
    key: "edicao",
    label: "Edição",
    allLabel: "Todas",
    value: (q) =>
      q.edicao,
  },
  {
    key: "funcaoPedagogica",
    label: "Função pedagógica",
    allLabel: "Todas",
    value: (q) =>
      q.funcaoPedagogica,
  },
  {
    key: "statusCuradoria",
    label: "Status da curadoria",
    allLabel: "Todos",
    value: (q) =>
      q.statusCuradoria,
  },
  {
    key: "statusValidacao",
    label: "Status da validação",
    allLabel: "Todos",
    value: (q) =>
      q.statusValidacao,
  },
];

const EMPTY_FILTERS: QuestionSearchFilters =
  {
    componentePrincipal: "",
    competencia: "",
    habilidade: "",
    objetoPrincipal: "",
    dificuldadeRotulo: "",
    ano: "",
    edicao: "",
    funcaoPedagogica: "",
    statusCuradoria: "",
    statusValidacao: "",
  };

/* =========================================================
   ORDENAÇÃO DOS VALORES DOS SELETORES
========================================================= */

function sortValues(
  values: string[],
  key: FilterKey
) {
  if (
    key === "competencia" ||
    key === "habilidade" ||
    key === "ano"
  ) {
    return values.sort(
      (a, b) =>
        a.localeCompare(
          b,
          "pt-BR",
          {
            numeric: true,
          }
        )
    );
  }

  if (
    key ===
    "dificuldadeRotulo"
  ) {
    const order = [
      "Muito fácil",
      "Fácil",
      "Média",
      "Difícil",
      "Muito difícil",
    ];

    return values.sort(
      (a, b) => {
        const indexA =
          order.indexOf(a);

        const indexB =
          order.indexOf(b);

        if (
          indexA !== -1 ||
          indexB !== -1
        ) {
          return (
            (indexA === -1
              ? 999
              : indexA) -
            (indexB === -1
              ? 999
              : indexB)
          );
        }

        return a.localeCompare(
          b,
          "pt-BR"
        );
      }
    );
  }

  return values.sort(
    (a, b) =>
      a.localeCompare(
        b,
        "pt-BR",
        {
          numeric: true,
        }
      )
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function QuestionBankSearchV01132() {
  const [questions, setQuestions] =
    useState<NaveQuestionRecord[]>([]);

  const [filters, setFilters] =
    useState<QuestionSearchFilters>(
      EMPTY_FILTERS
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedQuestionIds, setSelectedQuestionIds] =
    useState<string[]>([]);

  const [sequenceTitle, setSequenceTitle] =
    useState("");

  const [sequenceDescription, setSequenceDescription] =
    useState("");

  const [savingSequence, setSavingSequence] =
    useState(false);

  const [sequenceSaveError, setSequenceSaveError] =
    useState("");

  const [sequenceSaveSuccess, setSequenceSaveSuccess] =
    useState("");

  const [localSequences, setLocalSequences] =
    useState<NaveSequenceRecord[]>([]);

  const [sequenceDestination, setSequenceDestination] =
    useState<"new" | "existing">("new");

  const [existingSequenceId, setExistingSequenceId] =
    useState("");

  const [addingToSequence, setAddingToSequence] =
    useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const [
          localQuestions,
          savedSequences,
        ] =
          await Promise.all([
            getAllQuestions(),
            getAllLocalSequences(),
          ]);

        setQuestions(
          localQuestions
        );

        setLocalSequences(
          savedSequences
        );

        if (
          savedSequences.length > 0
        ) {
          setExistingSequenceId(
            savedSequences[0].id
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao carregar o Banco NAVE local."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  /* =======================================================
     QUESTÕES ELEGÍVEIS
  ======================================================= */

  const eligibleQuestions =
    useMemo(
      () =>
        questions.filter(
          isEligibleQuestion
        ),
      [questions]
    );

 /* =======================================================
   RESULTADO FINAL
======================================================= */

const filteredQuestions =
  useMemo(
    () =>
      filterQuestions(
        questions,
        filters
      ),
    [
      questions,
      filters,
    ]
  );


/* =======================================================
   RANKING PEDAGÓGICO — V0.11.3.3
======================================================= */

const rankedQuestions =
  useMemo(
    () =>
      rankQuestions(
        filteredQuestions
      ),
    [filteredQuestions]
  );
  /* =======================================================
     OPÇÕES DEPENDENTES
  ======================================================= */

  function getOptions(
    definition: FilterDefinition
  ) {
    /*
     * Para calcular as opções de um filtro,
     * aplicamos todos os demais filtros,
     * exceto o próprio campo.
     */

    const filtersWithoutCurrent:
      QuestionSearchFilters =
      {
        ...filters,
        [definition.key]: "",
      };

    const compatibleQuestions =
      filterQuestions(
        questions,
        filtersWithoutCurrent
      );

    const values = [
      ...new Set(
        compatibleQuestions
          .map(
            definition.value
          )
          .map((value) =>
            String(
              value ?? ""
            ).trim()
          )
          .filter(Boolean)
      ),
    ];

    /*
     * Se já existe valor selecionado,
     * garantimos que ele permaneça visível.
     */

    const current =
      String(
        filters[
          definition.key
        ] ?? ""
      ).trim();

    if (
      current &&
      !values.includes(current)
    ) {
      values.push(current);
    }

    return sortValues(
      values,
      definition.key
    );
  }

  /* =======================================================
     ALTERAÇÃO DOS FILTROS
  ======================================================= */

  function updateFilter(
    key: FilterKey,
    value: string
  ) {
    setFilters(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  }

  function clearFilters() {
    setFilters({
      ...EMPTY_FILTERS,
    });
  }

  const activeFilterCount =
    Object.values(filters)
      .filter(
        (value) =>
          String(
            value ?? ""
          ).trim() !== ""
      )
      .length;

  /* =======================================================
     SELEÇÃO ATUAL — {SYSTEM_VERSION}
  ======================================================= */

  const selectedQuestions =
    useMemo(() => {
      const byId =
        new Map(
          questions.map(
            (question) => [
              question.id,
              question,
            ]
          )
        );

      return selectedQuestionIds
        .map((id) => byId.get(id))
        .filter(
          (
            question
          ): question is NaveQuestionRecord =>
            Boolean(question)
        );
    }, [
      questions,
      selectedQuestionIds,
    ]);

  function isSelected(
    questionId: string
  ) {
    return selectedQuestionIds.includes(
      questionId
    );
  }

  function toggleQuestionSelection(
    questionId: string
  ) {
    setSelectedQuestionIds(
      (current) =>
        current.includes(questionId)
          ? current.filter(
              (id) =>
                id !== questionId
            )
          : [
              ...current,
              questionId,
            ]
    );

    setSequenceSaveSuccess("");
    setSequenceSaveError("");
  }

  function clearSelection() {
    setSelectedQuestionIds([]);
    setSequenceSaveSuccess("");
    setSequenceSaveError("");
  }

  function moveSelectedQuestion(
    index: number,
    direction: -1 | 1
  ) {
    setSelectedQuestionIds(
      (current) => {
        const targetIndex =
          index + direction;

        if (
          targetIndex < 0 ||
          targetIndex >= current.length
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

    setSequenceSaveSuccess("");
    setSequenceSaveError("");
  }

  async function saveCurrentSequence() {
    const titulo =
      sequenceTitle.trim();

    if (!titulo) {
      setSequenceSaveError(
        "Informe um nome para a sequência."
      );
      setSequenceSaveSuccess("");
      return;
    }

    if (
      selectedQuestionIds.length === 0
    ) {
      setSequenceSaveError(
        "Selecione pelo menos uma questão antes de salvar."
      );
      setSequenceSaveSuccess("");
      return;
    }

    try {
      setSavingSequence(true);
      setSequenceSaveError("");
      setSequenceSaveSuccess("");

      const saved =
        await createLocalSequence({
          titulo,
          descricao:
            sequenceDescription.trim(),
          questionIds:
            selectedQuestionIds,
        });

      setSequenceSaveSuccess(
        `Sequência “${saved.sequence.titulo}” salva como rascunho com ${saved.sequence.quantidadeItens} questão(ões).`
      );

      const refreshedSequences =
        await getAllLocalSequences();

      setLocalSequences(
        refreshedSequences
      );

      setExistingSequenceId(
        saved.sequence.id
      );

      setSequenceTitle("");
      setSequenceDescription("");
      setSelectedQuestionIds([]);
    } catch (err) {
      setSequenceSaveError(
        err instanceof Error
          ? err.message
          : "Falha ao salvar a sequência."
      );
    } finally {
      setSavingSequence(false);
    }
  }

  async function addSelectionToExistingSequence() {
    if (!existingSequenceId) {
      setSequenceSaveError(
        "Escolha uma sequência existente."
      );
      setSequenceSaveSuccess("");
      return;
    }

    if (
      selectedQuestionIds.length === 0
    ) {
      setSequenceSaveError(
        "Selecione pelo menos uma questão antes de adicionar."
      );
      setSequenceSaveSuccess("");
      return;
    }

    try {
      setAddingToSequence(true);
      setSequenceSaveError("");
      setSequenceSaveSuccess("");

      const result =
        await appendLocalSequenceItems(
          existingSequenceId,
          selectedQuestionIds
        );

      const added =
        result.addedQuestionIds.length;

      const skipped =
        result.skippedQuestionIds.length;

      const duplicateText =
        skipped > 0
          ? ` ${skipped} questão(ões) já estava(m) na sequência e não foi(ram) duplicada(s).`
          : "";

      setSequenceSaveSuccess(
        `${added} questão(ões) adicionada(s) à sequência “${result.sequence.titulo}”.${duplicateText} Você pode conferi-la em Sequências pedagógicas.`
      );

      const refreshedSequences =
        await getAllLocalSequences();

      setLocalSequences(
        refreshedSequences
      );

      setSelectedQuestionIds([]);
    } catch (err) {
      setSequenceSaveError(
        err instanceof Error
          ? err.message
          : "Falha ao adicionar questões à sequência."
      );
    } finally {
      setAddingToSequence(false);
    }
  }

  /* =======================================================
     ESTADOS
  ======================================================= */

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Carregando Banco NAVE local...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-red-700">
          {error}
        </p>
      </div>
    );
  }

  /* =======================================================
     INTERFACE
  ======================================================= */

  return (
    <div className="space-y-6">

      {/* ===================================================
          IDENTIDADE NAVE — {SYSTEM_VERSION}
      =================================================== */}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-teal-50/80 via-white to-slate-50 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:h-24 sm:w-20">
                <Image
                  src="/logo-nave.jpg"
                  alt="Logo NAVE"
                  width={481}
                  height={634}
                  priority
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-700 sm:text-xs">
                  Curadoria Pedagógica ENEM
                </p>

                <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                  Sistema de Inteligência e Gestão da Aprendizagem
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Seleção, organização e preparação de sequências pedagógicas do ENEM.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              <Link
                href="/sequencias"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
              >
                Ver sequências
              </Link>

              <span className="hidden text-xs font-medium text-slate-400 lg:inline">
                Banco de questões
              </span>

              <div className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">
                {SYSTEM_VERSION}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          PAINEL DE BUSCA
      =================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
              Busca local
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Banco de questões
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Filtros dependentes processados diretamente no banco local deste navegador.
            </p>
          </div>

          <p className="text-xs text-slate-400">
            Ordenação pedagógica auditável ativa
          </p>
        </div>

        {/* INDICADORES */}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-medium text-slate-500">
              Banco local
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              {questions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-medium text-slate-500">
              Elegíveis
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              {eligibleQuestions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
            <p className="text-xs font-medium text-teal-700">
              Encontradas
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-teal-800">
              {filteredQuestions.length}
            </p>
          </div>
        </div>

        {/* FILTROS */}

        <div className="mt-7 grid gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
          {FILTERS.map((definition) => {
            const options =
              getOptions(definition);

            const currentValue =
              String(
                filters[
                  definition.key
                ] ?? ""
              );

            return (
              <div
                key={definition.key}
              >
                <label
                  htmlFor={definition.key}
                  className="text-sm font-semibold text-slate-700"
                >
                  {definition.label}
                </label>

                <select
                  id={definition.key}
                  value={currentValue}
                  onChange={(event) =>
                    updateFilter(
                      definition.key,
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">
                    {definition.allLabel}
                  </option>

                  {options.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </div>
            );
          })}
        </div>

        {/* AÇÕES */}

        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={clearFilters}
            disabled={
              activeFilterCount === 0
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpar filtros
          </button>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            {activeFilterCount === 0
              ? "Nenhum filtro ativo"
              : `${activeFilterCount} filtro(s) ativo(s)`}
          </span>
        </div>
      </section>

      {/* ===================================================
          SELEÇÃO ATUAL
      =================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
              Construção da sequência
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              Seleção atual
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Escolha questões nos resultados e organize a ordem pedagógica antes de salvar a sequência.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-800">
              {selectedQuestions.length} selecionada(s)
            </span>

            <button
              type="button"
              onClick={clearSelection}
              disabled={
                selectedQuestions.length === 0
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Limpar seleção
            </button>
          </div>
        </div>

        {sequenceSaveSuccess ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-800">
              {sequenceSaveSuccess}
            </p>
          </div>
        ) : null}

        {sequenceSaveError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-700">
              {sequenceSaveError}
            </p>
          </div>
        ) : null}

        {selectedQuestions.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
            <p className="text-sm font-semibold text-slate-700">
              Nenhuma questão selecionada.
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Use o botão “Selecionar” nos resultados abaixo para iniciar a sequência.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {selectedQuestions.map(
              (
                question,
                index
              ) => (
                <div
                  key={question.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-teal-100 px-2 text-xs font-bold text-teal-800">
                        {index + 1}
                      </span>

                      <span className="font-mono text-xs font-bold text-teal-700">
                        {question.id}
                      </span>

                      <span className="text-xs text-slate-400">
                        {question.competencia}
                      </span>

                      <span className="text-xs text-slate-400">
                        {question.habilidade}
                      </span>
                    </div>

                    <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                      {question.objetoPrincipal ||
                        "Objeto não informado"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {question.dificuldadeRotulo}
                      {" · "}
                      {question.ano}
                      {" · "}
                      {question.edicao}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        moveSelectedQuestion(
                          index,
                          -1
                        )
                      }
                      disabled={index === 0}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↑ Subir
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        moveSelectedQuestion(
                          index,
                          1
                        )
                      }
                      disabled={
                        index ===
                        selectedQuestions.length -
                          1
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↓ Descer
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleQuestionSelection(
                          question.id
                        )
                      }
                      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              )
            )}

            <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
                    Destino da seleção
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Crie uma nova sequência ou acrescente as questões selecionadas a uma sequência já salva.
                  </p>
                </div>

                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setSequenceDestination(
                        "new"
                      );
                      setSequenceSaveError("");
                      setSequenceSaveSuccess("");
                    }}
                    className={
                      sequenceDestination ===
                      "new"
                        ? "rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white"
                        : "rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    }
                  >
                    Nova sequência
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSequenceDestination(
                        "existing"
                      );
                      setSequenceSaveError("");
                      setSequenceSaveSuccess("");
                    }}
                    disabled={
                      localSequences.length ===
                      0
                    }
                    className={
                      sequenceDestination ===
                      "existing"
                        ? "rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white"
                        : "rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    }
                  >
                    Sequência existente
                  </button>
                </div>
              </div>

              {sequenceDestination ===
              "new" ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
                  <div>
                    <label
                      htmlFor="sequenceTitle"
                      className="text-xs font-bold text-slate-700"
                    >
                      Nome da sequência
                    </label>

                    <input
                      id="sequenceTitle"
                      type="text"
                      value={sequenceTitle}
                      onChange={(event) => {
                        setSequenceTitle(
                          event.target.value
                        );
                        setSequenceSaveError("");
                        setSequenceSaveSuccess("");
                      }}
                      placeholder="Ex.: Química orgânica — revisão"
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sequenceDescription"
                      className="text-xs font-bold text-slate-700"
                    >
                      Descrição
                      <span className="ml-1 font-normal text-slate-400">
                        opcional
                      </span>
                    </label>

                    <input
                      id="sequenceDescription"
                      type="text"
                      value={sequenceDescription}
                      onChange={(event) => {
                        setSequenceDescription(
                          event.target.value
                        );
                        setSequenceSaveError("");
                        setSequenceSaveSuccess("");
                      }}
                      placeholder="Objetivo, turma ou observação pedagógica"
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void saveCurrentSequence()
                    }
                    disabled={
                      savingSequence ||
                      selectedQuestions.length ===
                        0
                    }
                    className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingSequence
                      ? "Salvando..."
                      : "Criar sequência"}
                  </button>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <label
                      htmlFor="existingSequence"
                      className="text-xs font-bold text-slate-700"
                    >
                      Sequência de destino
                    </label>

                    <select
                      id="existingSequence"
                      value={
                        existingSequenceId
                      }
                      onChange={(event) => {
                        setExistingSequenceId(
                          event.target.value
                        );
                        setSequenceSaveError("");
                        setSequenceSaveSuccess("");
                      }}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    >
                      {localSequences.map(
                        (sequence) => (
                          <option
                            key={
                              sequence.id
                            }
                            value={
                              sequence.id
                            }
                          >
                            {
                              sequence.titulo
                            }{" "}
                            —{" "}
                            {
                              sequence.quantidadeItens
                            } questão(ões)
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void addSelectionToExistingSequence()
                    }
                    disabled={
                      addingToSequence ||
                      selectedQuestions.length ===
                        0 ||
                      !existingSequenceId
                    }
                    className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingToSequence
                      ? "Adicionando..."
                      : "Adicionar à sequência"}
                  </button>
                </div>
              )}

              <p className="mt-3 text-xs leading-5 text-teal-900/70">
                A ordem atual da seleção será preservada. Ao adicionar a uma sequência existente, as novas questões entram ao final e itens já presentes não são duplicados.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ===================================================
          RESULTADOS
      =================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Resultado da busca
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              Questões recomendadas
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Exibindo os primeiros 20 registros, ordenados pelo score de recomendação.
            </p>
          </div>

          <div className="rounded-full bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-800">
            {filteredQuestions.length}{" "}
            questão(ões)
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">
              Nenhuma questão encontrada.
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Ajuste ou remova algum dos filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-slate-100">
            {rankedQuestions
              .slice(0, 20)
              .map((recommendation, index) => {
                const question =
                  recommendation.question;

                return (
                  <article
                    key={question.id}
                    className="py-5 first:pt-2"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-bold text-slate-500">
                            {index + 1}
                          </span>

                          <span className="font-mono text-xs font-bold text-teal-700">
                            {question.id}
                          </span>

                          <span className="text-xs text-slate-400">
                            {question.componentePrincipal}
                          </span>

                          <span className="text-xs text-slate-400">
                            {question.competencia}
                          </span>

                          <span className="text-xs text-slate-400">
                            {question.habilidade}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {question.objetoPrincipal ||
                            "Objeto não informado"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {question.dificuldadeRotulo}
                          {" · "}
                          {question.ano}
                          {" · "}
                          {question.edicao}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                            Função: {question.funcaoPedagogica || "—"}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                            Curadoria: {question.statusCuradoria || "—"}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                            Validação: {question.statusValidacao || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 lg:min-w-44">
                        <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-left lg:text-right">
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700">
                            Recomendação
                          </p>

                          <p className="mt-1 text-2xl font-black tracking-tight text-teal-900">
                            {recommendation.score}
                          </p>

                          <p className="text-[11px] text-teal-700">
                            score pedagógico
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            toggleQuestionSelection(
                              question.id
                            )
                          }
                          className={
                            isSelected(
                              question.id
                            )
                              ? "rounded-xl border border-teal-600 bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
                              : "rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-50"
                          }
                        >
                          {isSelected(
                            question.id
                          )
                            ? "Selecionada ✓"
                            : "Selecionar"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-700">
                        Critérios da recomendação
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {recommendation.motivos.join(
                          " · "
                        )}
                      </p>
                    </div>
                  </article>
                );
              })}
          </div>
        )}
      </section>

      {/* ===================================================
          RODAPÉ INSTITUCIONAL
      =================================================== */}

      <footer className="px-2 pb-2 pt-1 text-center">
        <p className="text-xs font-medium text-slate-500">
          NAVE — Núcleo de Aprendizagem, Valor e Estratégia
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Uberlândia/MG · naveaprendizagem.com
        </p>
      </footer>
    </div>
  );
}