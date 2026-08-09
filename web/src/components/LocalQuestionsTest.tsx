"use client";

import { useEffect, useState } from "react";
import {
  getAllQuestions,
  putQuestion,
  type NaveQuestionRecord,
} from "@/lib/db/nave-db";

const TEST_QUESTIONS: NaveQuestionRecord[] = [
  {
    id: "TEST_Q001",
    area: "CN",
    disciplina: "Química",
    competencia: "C1",
    habilidade: "H1",
    objeto: "Transformações químicas",
    dificuldade: "Média",
    gabarito: "B",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "TEST_Q002",
    area: "CN",
    disciplina: "Física",
    competencia: "C2",
    habilidade: "H6",
    objeto: "Energia",
    dificuldade: "Média",
    gabarito: "C",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "TEST_Q003",
    area: "CN",
    disciplina: "Biologia",
    competencia: "C4",
    habilidade: "H14",
    objeto: "Ecologia",
    dificuldade: "Difícil",
    gabarito: "A",
    updatedAt: new Date().toISOString(),
  },
];

export default function LocalQuestionsTest() {
  const [count, setCount] = useState<number | null>(
    null
  );

  const [status, setStatus] =
    useState("Lendo questões locais");

  async function refreshCount() {
    const questions = await getAllQuestions();
    setCount(questions.length);

    setStatus(
      questions.length === 0
        ? "Nenhuma questão local"
        : `${questions.length} questão(ões) armazenada(s)`
    );
  }

  useEffect(() => {
    void refreshCount();
  }, []);

  async function seedQuestions() {
    setStatus("Salvando questões de teste");

    for (const question of TEST_QUESTIONS) {
      await putQuestion(question);
    }

    await refreshCount();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-800">
        Teste do banco de questões local
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {status}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void seedQuestions()}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Gravar 3 questões de teste
        </button>

        <span className="text-sm text-slate-600">
          Total local: {count ?? "—"}
        </span>
      </div>
    </div>
  );
}