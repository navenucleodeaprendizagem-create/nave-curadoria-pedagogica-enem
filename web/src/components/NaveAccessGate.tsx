"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type NavePermissions = {
  buscar: boolean;
  visualizar: boolean;
  validar: boolean;
  cadastrar: boolean;
  sequencias: boolean;
  usuarios: boolean;
  coordenacao: boolean;
  editoracao: boolean;
};

type NaveUser = {
  email: string;
  emailAutenticacao: string;
  idGoogle: string;
  nome: string;
  perfil: string;
  area: string;
  disciplinas: string[];
};

type NaveContext = {
  ok: boolean;
  authorized: boolean;
  reason?: string;
  user?: NaveUser | null;
  permissions?: NavePermissions | null;
};

export default function NaveAccessGate() {
  const {
    data: session,
    status,
  } = useSession();

  const [context, setContext] =
    useState<NaveContext | null>(null);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function loadContext() {
      if (
        status !== "authenticated" ||
        !session?.user
      ) {
        setContext(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(
          "/api/nave-user",
          {
            cache: "no-store",
          }
        );

        const result =
          (await response.json()) as NaveContext;

        if (!active) {
          return;
        }

        setContext(result);
      } catch {
        if (!active) {
          return;
        }

        setContext({
          ok: false,
          authorized: false,
          reason: "CONTEXT_LOAD_FAILED",
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadContext();

    return () => {
      active = false;
    };
  }, [
    session?.user,
    status,
  ]);

  if (
    status === "loading" ||
    loading
  ) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
        Verificando permissões NAVE...
      </div>
    );
  }

  if (
    status !== "authenticated"
  ) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        Entre com sua conta Google para acessar os recursos do sistema.
      </div>
    );
  }

  if (
    !context ||
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
          <span className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium shadow-sm">
            Sequências pedagógicas
          </span>
        )}

        {permissions.validar && (
          <span className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium shadow-sm">
            Validação
          </span>
        )}

        {permissions.coordenacao && (
          <span className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium shadow-sm">
            Coordenação
          </span>
        )}

        {permissions.editoracao && (
          <span className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium shadow-sm">
            Editoração
          </span>
        )}

        {permissions.usuarios && (
          <span className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium shadow-sm">
            Usuários
          </span>
        )}
      </div>
    </div>
  );
}