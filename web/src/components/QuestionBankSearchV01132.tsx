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
    <div className="space-y-5">

      {/* ===================================================
          PAINEL DE BUSCA
      =================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div>
          <p className="text-sm font-semibold text-teal-700">
            Busca local — V0.11.3.3
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-900">
            Banco de questões
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Filtros processados diretamente no banco local deste navegador.
          </p>
        </div>

        {/* INDICADORES */}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              Banco local
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {questions.length}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              Elegíveis
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {
                eligibleQuestions.length
              }
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              Encontradas
            </p>

            <p className="mt-1 text-2xl font-bold text-teal-700">
              {
                filteredQuestions.length
              }
            </p>
          </div>

        </div>

        {/* FILTROS */}

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

          {FILTERS.map(
            (definition) => {

              const options =
                getOptions(
                  definition
                );

              const currentValue =
                String(
                  filters[
                    definition.key
                  ] ?? ""
                );

              return (
                <div
                  key={
                    definition.key
                  }
                >
                  <label
                    htmlFor={
                      definition.key
                    }
                    className="text-sm font-semibold text-slate-700"
                  >
                    {
                      definition.label
                    }
                  </label>

                  <select
                    id={
                      definition.key
                    }
                    value={
                      currentValue
                    }
                    onChange={(
                      event
                    ) =>
                      updateFilter(
                        definition.key,
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    <option value="">
                      {
                        definition.allLabel
                      }
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
            }
          )}

        </div>

        {/* AÇÕES */}

        <div className="mt-6 flex flex-wrap items-center gap-3">

          <button
            type="button"
            onClick={
              clearFilters
            }
            disabled={
              activeFilterCount === 0
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpar filtros
          </button>

          <p className="text-xs text-slate-500">
            {activeFilterCount === 0
              ? "Nenhum filtro ativo"
              : `${activeFilterCount} filtro(s) ativo(s)`}
          </p>

        </div>
      </div>

      {/* ===================================================
          RESULTADOS
      =================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Amostra dos resultados
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Exibindo os primeiros 20 registros nesta etapa.
            </p>
          </div>

          <p className="text-sm font-semibold text-teal-700">
            {
              filteredQuestions.length
            }{" "}
            questão(ões)
          </p>

        </div>

        {filteredQuestions.length ===
        0 ? (
          <div className="mt-6 rounded-xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">
              Nenhuma questão encontrada.
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Ajuste ou remova algum dos filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">

            {rankedQuestions
  .slice(0, 20)
  .map(
    (recommendation) => {

      const question =
        recommendation.question;

      return (
        <div
          key={question.id}
          className="py-4"
        >

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div className="flex flex-wrap items-center gap-2">

              <span className="font-mono text-xs font-semibold text-teal-700">
                {question.id}
              </span>

              <span className="text-xs text-slate-500">
                {question.componentePrincipal}
              </span>

              <span className="text-xs text-slate-500">
                {question.competencia}
              </span>

              <span className="text-xs text-slate-500">
                {question.habilidade}
              </span>

            </div>

            <div className="rounded-lg bg-teal-50 px-3 py-1.5">

              <span className="text-xs font-semibold text-teal-700">
                Score de recomendação
              </span>

              <span className="ml-2 text-sm font-bold text-teal-800">
                {recommendation.score}
              </span>

            </div>

          </div>

          <p className="mt-1 text-sm font-medium text-slate-800">
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

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">

            <span>
              Função:{" "}
              {question.funcaoPedagogica ||
                "—"}
            </span>

            <span>
              Curadoria:{" "}
              {question.statusCuradoria ||
                "—"}
            </span>

            <span>
              Validação:{" "}
              {question.statusValidacao ||
                "—"}
            </span>

          </div>

          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">

            <p className="text-xs font-semibold text-slate-600">
              Critérios da recomendação
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {recommendation.motivos.join(
                " · "
              )}
            </p>

          </div>

        </div>
      );
    }
  )}

          </div>
        )}

      </div>
    </div>
  );
}