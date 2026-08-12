import Link from "next/link";

import {
  getNaveUserContext,
} from "@/lib/auth/nave-user";

export default async function NaveAccessGate() {
  const context =
    await getNaveUserContext();

  if (
    context.reason ===
    "NOT_AUTHENTICATED"
  ) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        Entre com sua conta Google para acessar os recursos do sistema.
      </div>
    );
  }

  /*
   * Falha técnica não é ausência de autorização.
   */
  if (context.ok !== true) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
        <div className="font-semibold text-amber-950">
          Não foi possível verificar suas permissões agora
        </div>

        <div className="mt-1 text-sm text-amber-800">
          Sua conta Google está autenticada, mas a consulta ao cadastro NAVE não foi concluída.
        </div>

        <Link
          href="/"
          className="mt-3 inline-flex rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 shadow-sm transition hover:bg-amber-100"
        >
          Tentar novamente
        </Link>
      </div>
    );
  }

  if (
    context.authorized !== true ||
    !context.user ||
    !context.permissions
  ) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="font-semibold text-slate-900">
          Acesso não autorizado
        </div>

        <div className="mt-1 text-sm text-slate-600">
          Sua conta Google foi autenticada, mas não possui um cadastro ativo e autorizado no NAVE.
        </div>
      </div>
    );
  }

  const {
    user,
    permissions,
  } = context;

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600">
        Perfil NAVE:{" "}
        <span className="font-semibold text-slate-900">
          {user.perfil}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {permissions.buscar && (
          <Link
            href="/banco-questoes"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            Banco de questões
          </Link>
        )}

        {permissions.sequencias && (
          <Link
            href="/sequencias"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            Sequências pedagógicas
          </Link>
        )}

        {permissions.coordenacao && (
          <Link
            href="/coordenacao"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            Coordenação
          </Link>
        )}

        {permissions.editoracao && (
          <Link
            href="/editoracao"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            Editoração
          </Link>
        )}

        {permissions.usuarios && (
          <Link
            href="/usuarios"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            Usuários
          </Link>
        )}
      </div>
    </div>
  );
}
