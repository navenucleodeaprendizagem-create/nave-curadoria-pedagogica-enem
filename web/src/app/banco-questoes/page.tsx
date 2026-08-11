import Link from "next/link";

import QuestionBankSearchV01132 from "@/components/QuestionBankSearchV01132";

import {
  requireNavePermission,
} from "@/lib/auth/require-nave-permission";

export default async function BancoQuestoesPage() {
  const { user } =
    await requireNavePermission(
      "buscar"
    );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-semibold text-teal-700 hover:underline"
        >
          ← Voltar ao início
        </Link>

        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-700">
            Sistema NAVE
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Banco de questões
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Usuário: {user.nome} · Perfil:{" "}
            {user.perfil}
          </p>
        </div>

        <div className="mt-8">
          <QuestionBankSearchV01132 />
        </div>
      </div>
    </main>
  );
}