"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAllQuestions,
  type NaveQuestionRecord,
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

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const localQuestions =
          await getAllQuestions();

        setQuestions(
          localQuestions
        );
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
          IDENTIDADE NAVE
      =================================================== */}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50 via-white to-slate-50 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-teal-200 bg-white shadow-sm">
                <span className="text-lg font-black tracking-[0.14em] text-teal-800">
                  NAVE
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                  Curadoria Pedagógica ENEM
                </p>

                <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                  NAVE | Sistema de Inteligência e Gestão da Aprendizagem
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Banco inteligente para seleção, validação e organização pedagógica de questões.
                </p>
              </div>
            </div>

            <div className="self-start rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 sm:self-center">
              V0.11.4.0
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

                      <div className="shrink-0 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-left lg:min-w-40 lg:text-right">
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
