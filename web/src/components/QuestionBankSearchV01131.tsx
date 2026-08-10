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
} from "@/lib/questions/question-search";

export default function QuestionBankSearchV01131() {
  const [questions, setQuestions] =
    useState<NaveQuestionRecord[]>([]);

  const [componente, setComponente] =
    useState("");

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
            : "Falha ao carregar o banco local."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const eligibleQuestions =
    useMemo(
      () =>
        questions.filter(
          isEligibleQuestion
        ),
      [questions]
    );

  const componentes =
    useMemo(() => {
      return [
        ...new Set(
          eligibleQuestions
            .map(
              (question) =>
                question.componentePrincipal
            )
            .filter(Boolean)
        ),
      ].sort((a, b) =>
        a.localeCompare(
          b,
          "pt-BR",
          {
            numeric: true,
          }
        )
      );
    }, [eligibleQuestions]);

  const filteredQuestions =
    useMemo(
      () =>
        filterQuestions(
          questions,
          {
            componentePrincipal:
              componente,
          }
        ),
      [
        questions,
        componente,
      ]
    );

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

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-teal-700">
          Busca local — V0.11.3.1
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-900">
          Banco de questões
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          A consulta abaixo é executada diretamente no IndexedDB deste navegador.
        </p>

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
              {eligibleQuestions.length}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              Encontradas
            </p>

            <p className="mt-1 text-2xl font-bold text-teal-700">
              {filteredQuestions.length}
            </p>
          </div>
        </div>

        <div className="mt-6 max-w-sm">
          <label
            htmlFor="componente"
            className="text-sm font-semibold text-slate-700"
          >
            Componente / disciplina
          </label>

          <select
            id="componente"
            value={componente}
            onChange={(event) =>
              setComponente(
                event.target.value
              )
            }
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          >
            <option value="">
              Todos
            </option>

            {componentes.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Amostra dos resultados
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Exibindo somente os primeiros 10 registros nesta etapa.
            </p>
          </div>

          <p className="text-sm font-semibold text-teal-700">
            {filteredQuestions.length} questão(ões)
          </p>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {filteredQuestions
            .slice(0, 10)
            .map(
              (question) => (
                <div
                  key={question.id}
                  className="py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-teal-700">
                      {question.id}
                    </span>

                    <span className="text-xs text-slate-500">
                      {
                        question.componentePrincipal
                      }
                    </span>

                    <span className="text-xs text-slate-500">
                      {
                        question.competencia
                      }
                    </span>

                    <span className="text-xs text-slate-500">
                      {
                        question.habilidade
                      }
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-700">
                    {
                      question.objetoPrincipal ||
                      "Objeto não informado"
                    }
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {
                      question.dificuldadeRotulo
                    }
                    {" · "}
                    {question.ano}
                    {" · "}
                    {question.edicao}
                  </p>
                </div>
              )
            )}
        </div>
      </div>
    </div>
  );
}