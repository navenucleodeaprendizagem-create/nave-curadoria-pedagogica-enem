import {
  getAllQuestions,
  type NaveQuestionRecord,
} from "@/lib/db/nave-db";

export type QuestionSearchFilters = {
  componentePrincipal?: string;
  competencia?: string;
  habilidade?: string;
  objetoPrincipal?: string;
  dificuldadeRotulo?: string;
  ano?: string;
  edicao?: string;
  funcaoPedagogica?: string;
  statusCuradoria?: string;
  statusValidacao?: string;
};

export type QuestionSearchResult = {
  totalLocal: number;
  totalElegivel: number;
  totalEncontrado: number;
  questions: NaveQuestionRecord[];
};

/* =========================================================
   NORMALIZAÇÃO
========================================================= */

function normalizeFilter(
  value: string | undefined
): string {
  const normalized =
    String(value ?? "").trim();

  if (
    !normalized ||
    normalized === "Todos" ||
    normalized === "Todas"
  ) {
    return "";
  }

  return normalized;
}

function matches(
  value: string,
  filter: string | undefined
): boolean {
  const normalizedFilter =
    normalizeFilter(filter);

  if (!normalizedFilter) {
    return true;
  }

  return (
    String(value ?? "").trim() ===
    normalizedFilter
  );
}

/* =========================================================
   ELEGIBILIDADE
========================================================= */

export function isEligibleQuestion(
  question: NaveQuestionRecord
): boolean {
  const statusItem =
    String(
      question.statusItem ?? ""
    ).trim();

  if (
    statusItem === "Arquivada" ||
    statusItem === "Devolvida"
  ) {
    return false;
  }

  const statusCuradoria =
    String(
      question.statusCuradoria ?? ""
    ).trim();

  if (
    statusCuradoria ===
    "Suspensa para revisão"
  ) {
    return false;
  }

  return true;
}

/* =========================================================
   FILTROS
========================================================= */

export function filterQuestions(
  questions: NaveQuestionRecord[],
  filters: QuestionSearchFilters = {}
): NaveQuestionRecord[] {
  return questions.filter(
    (question) => {
      if (
        !isEligibleQuestion(question)
      ) {
        return false;
      }

      if (
        !matches(
          question.componentePrincipal,
          filters.componentePrincipal
        )
      ) {
        return false;
      }

      if (
        !matches(
          question.competencia,
          filters.competencia
        )
      ) {
        return false;
      }

      if (
        !matches(
          question.habilidade,
          filters.habilidade
        )
      ) {
        return false;
      }

      if (
        !matches(
          question.objetoPrincipal,
          filters.objetoPrincipal
        )
      ) {
        return false;
      }

      if (
        !matches(
          question.dificuldadeRotulo,
          filters.dificuldadeRotulo
        )
      ) {
        return false;
      }

      if (
        !matches(
          question.ano,
          filters.ano
        )
      ) {
        return false;
      }

      if (
        !matches(
          question.edicao,
          filters.edicao
        )
      ) {
        return false;
      }

      if (
        !matches(
          question.funcaoPedagogica,
          filters.funcaoPedagogica
        )
      ) {
        return false;
      }

      if (
        !matches(
          question.statusCuradoria,
          filters.statusCuradoria
        )
      ) {
        return false;
      }

      if (
        !matches(
          question.statusValidacao,
          filters.statusValidacao
        )
      ) {
        return false;
      }

      return true;
    }
  );
}

/* =========================================================
   BUSCA NO INDEXEDDB
========================================================= */

export async function searchLocalQuestions(
  filters: QuestionSearchFilters = {}
): Promise<QuestionSearchResult> {
  const all =
    await getAllQuestions();

  const eligible =
    all.filter(
      isEligibleQuestion
    );

  const questions =
    filterQuestions(
      all,
      filters
    );

  return {
    totalLocal:
      all.length,

    totalElegivel:
      eligible.length,

    totalEncontrado:
      questions.length,

    questions,
  };
}