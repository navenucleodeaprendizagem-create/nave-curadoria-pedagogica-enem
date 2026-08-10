import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getNaveUserContext,
} from "@/lib/auth/nave-user";

export default async function BancoQuestoesPage() {
  const context =
    await getNaveUserContext();

  if (
    context.reason ===
    "NOT_AUTHENTICATED"
  ) {
    redirect("/");
  }

  if (
    context.authorized !== true ||
    !context.user ||
    !context.permissions
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="text-sm font-semibold text-teal-700"
          >
            ← Voltar
          </Link>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold">
              Acesso não autorizado
            </h1>

            <p className="mt-3 text-slate-600">
              Sua conta está autenticada, mas não possui acesso ativo a este recurso no NAVE.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (
    context.permissions.buscar !== true
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="text-sm font-semibold text-teal-700"
          >
            ← Voltar
          </Link>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold">
              Permissão insuficiente
            </h1>

            <p className="mt-3 text-slate-600">
              Seu perfil NAVE não possui permissão para acessar o Banco de questões.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-semibold text-teal-700"
        >
          ← Voltar ao início
        </Link>

        <div className="mt-10">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            Curadoria Pedagógica ENEM
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Banco de questões
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Área protegida do Sistema NAVE para busca, análise e seleção de questões.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500">
            Usuário autorizado
          </div>

          <div className="mt-1 font-semibold">
            {context.user.nome}
          </div>

          <div className="text-sm text-slate-600">
            {context.user.perfil}
          </div>

          <div className="mt-6 text-sm text-slate-500">
            Estrutura inicial da V0.10. O mecanismo real de busca será migrado nas próximas etapas.
          </div>
        </div>
      </div>
    </main>
  );
}