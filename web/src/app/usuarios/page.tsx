// web/src/app/usuarios/page.tsx

import Link from "next/link";

import {
  requireNavePermission,
} from "@/lib/auth/require-nave-permission";

export default async function UsuariosPage() {
  const { user } =
    await requireNavePermission(
      "usuarios"
    );

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
            Sistema NAVE
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Usuários
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Área protegida para gestão de usuários, perfis e permissões.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500">
            Usuário autorizado
          </div>

          <div className="mt-1 font-semibold">
            {user.nome}
          </div>

          <div className="text-sm text-slate-600">
            {user.perfil}
          </div>
        </div>
      </div>
    </main>
  );
}