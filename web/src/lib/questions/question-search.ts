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


export type QuestionRecommendation = {
  question: NaveQuestionRecord;
  score: number;
  motivos: string[];
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
   SCORE DE RECOMENDAÇÃO
========================================================= */


export function calculateQuestionRecommendation(
  question: NaveQuestionRecord
): QuestionRecommendation {
  let score = 50;

  const motivos: string[] = [];

  const statusCuradoria =
    String(
      question.statusCuradoria ?? ""
    ).trim();

  const statusValidacao =
    String(
      question.statusValidacao ?? ""
    ).trim();

  const possuiReporteAberto =
    Boolean(
      question.possuiReporteAberto
    );

  const quantidadeReportes =
    Math.max(
      0,
      Number(
        question.quantidadeReportes ?? 0
      ) || 0
    );


  /* -------------------------------------------------------
     CURADORIA
  ------------------------------------------------------- */


  switch (statusCuradoria) {
    case "Corrigida":
      score += 15;
      motivos.push(
        "Questão corrigida pela curadoria"
      );
      break;

    case "Em uso":
      score += 10;
      motivos.push(
        "Questão já utilizada no trabalho pedagógico"
      );
      break;

    case "Com reporte aberto":
      score -= 20;
      motivos.push(
        "Curadoria com reporte aberto"
      );
      break;

    case "Classificação inicial":
      motivos.push(
        "Classificação inicial"
      );
      break;

    default:
      if (statusCuradoria) {
        motivos.push(
          `Curadoria: ${statusCuradoria}`
        );
      }
      break;
  }


  /* -------------------------------------------------------
     VALIDAÇÃO
  ------------------------------------------------------- */


  switch (statusValidacao) {
    case "Divergência resolvida":
      score += 20;
      motivos.push(
        "Divergência pedagógica resolvida"
      );
      break;

    case "Validada por docente":
      score += 15;
      motivos.push(
        "Validada por docente"
      );
      break;

    case "Com divergência aberta":
      score -= 20;
      motivos.push(
        "Possui divergência pedagógica aberta"
      );
      break;

    case "Não avaliada":
      motivos.push(
        "Ainda não avaliada por docente"
      );
      break;

    default:
      if (statusValidacao) {
        motivos.push(
          `Validação: ${statusValidacao}`
        );
      }
      break;
  }


  /* -------------------------------------------------------
     REPORTES
  ------------------------------------------------------- */


  if (possuiReporteAberto) {
    score -= 25;

    motivos.push(
      "Possui reporte aberto"
    );
  } else {
    score += 5;

    motivos.push(
      "Sem reporte aberto"
    );
  }


  if (quantidadeReportes > 0) {
    score -=
      quantidadeReportes * 5;

    motivos.push(
      quantidadeReportes === 1
        ? "1 reporte registrado"
        : `${quantidadeReportes} reportes registrados`
    );
  } else {
    motivos.push(
      "Sem reportes registrados"
    );
  }


  /* -------------------------------------------------------
     LIMITES
  ------------------------------------------------------- */


  score =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(score)
      )
    );


  return {
    question,
    score,
    motivos,
  };
}


/* =========================================================
   ORDENAÇÃO PEDAGÓGICA
========================================================= */


export function rankQuestions(
  questions: NaveQuestionRecord[]
): QuestionRecommendation[] {
  return questions
    .map(
      calculateQuestionRecommendation
    )
    .sort(
      (a, b) => {
        /* 1. Maior score */

        if (a.score !== b.score) {
          return b.score - a.score;
        }


        /* 2. Menos reportes */

        const reportsA =
          Number(
            a.question
              .quantidadeReportes ?? 0
          ) || 0;

        const reportsB =
          Number(
            b.question
              .quantidadeReportes ?? 0
          ) || 0;

        if (reportsA !== reportsB) {
          return reportsA - reportsB;
        }


        /* 3. Sem reporte aberto */

        const openA =
          Boolean(
            a.question
              .possuiReporteAberto
          );

        const openB =
          Boolean(
            b.question
              .possuiReporteAberto
          );

        if (openA !== openB) {
          return openA ? 1 : -1;
        }


        /* 4. Ano mais recente */

        const yearA =
          Number(
            a.question.ano ?? 0
          ) || 0;

        const yearB =
          Number(
            b.question.ano ?? 0
          ) || 0;

        if (yearA !== yearB) {
          return yearB - yearA;
        }


        /* 5. ID estável */

        return String(
          a.question.id ?? ""
        ).localeCompare(
          String(
            b.question.id ?? ""
          ),
          "pt-BR",
          {
            numeric: true,
          }
        );
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