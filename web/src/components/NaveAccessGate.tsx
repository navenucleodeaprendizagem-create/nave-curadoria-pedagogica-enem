"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useSession,
} from "next-auth/react";

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

type CachedAuthorizedContext = {
  email: string;
  savedAt: number;
  context: NaveContext;
};

const SESSION_CACHE_KEY =
  "nave-authorized-context-v01172";

const SESSION_CACHE_TTL_MS =
  60_000;

function sleep(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

function readCachedContext(
  email: string
): NaveContext | null {
  try {
    const raw =
      window.sessionStorage.getItem(
        SESSION_CACHE_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(
        raw
      ) as CachedAuthorizedContext;

    if (
      parsed.email !== email ||
      Date.now() -
        parsed.savedAt >
        SESSION_CACHE_TTL_MS ||
      parsed.context.ok !== true ||
      parsed.context.authorized !== true ||
      !parsed.context.user ||
      !parsed.context.permissions
    ) {
      window.sessionStorage.removeItem(
        SESSION_CACHE_KEY
      );

      return null;
    }

    return parsed.context;
  } catch {
    return null;
  }
}

function writeCachedContext(
  email: string,
  context: NaveContext
) {
  try {
    const payload:
      CachedAuthorizedContext = {
        email,
        savedAt:
          Date.now(),
        context,
      };

    window.sessionStorage.setItem(
      SESSION_CACHE_KEY,
      JSON.stringify(
        payload
      )
    );
  } catch {
    // O cache de UX é opcional.
  }
}

function clearCachedContext() {
  try {
    window.sessionStorage.removeItem(
      SESSION_CACHE_KEY
    );
  } catch {
    // Sem ação.
  }
}

export default function NaveAccessGate() {
  const {
    data: session,
    status,
  } = useSession();

  const [context, setContext] =
    useState<NaveContext | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [
    retryToken,
    setRetryToken,
  ] =
    useState(0);

  const email =
    session?.user?.email
      ?.trim()
      .toLowerCase() ?? "";

  const googleId =
    session?.user?.id ?? "";

  useEffect(() => {
    let active = true;

    async function loadContext() {
      if (
        status !==
          "authenticated" ||
        !session?.user ||
        !email
      ) {
        setContext(null);
        setLoading(false);

        if (
          status ===
          "unauthenticated"
        ) {
          clearCachedContext();
        }

        return;
      }

      const cached =
        readCachedContext(
          email
        );

      /*
       * Se já existe um contexto autorizado recente,
       * mostramos imediatamente. A validação real das
       * páginas protegidas continua sendo feita no servidor.
       */
      if (cached) {
        setContext(
          cached
        );
        setLoading(false);
      } else {
        setLoading(true);
      }

      const delays =
        [0, 400, 900];

      let lastResult:
        NaveContext | null =
        null;

      try {
        for (
          let attempt = 0;
          attempt <
          delays.length;
          attempt += 1
        ) {
          if (
            delays[attempt] >
            0
          ) {
            await sleep(
              delays[attempt]
            );
          }

          const response =
            await fetch(
              "/api/nave-user",
              {
                cache:
                  "no-store",
              }
            );

          const result =
            (await response.json()) as
              NaveContext;

          lastResult =
            result;

          if (!active) {
            return;
          }

          /*
           * Resposta válida do NAVE:
           * autorizada ou não autorizada.
           */
          if (
            result.ok === true
          ) {
            if (
              result.authorized ===
                true &&
              result.user &&
              result.permissions
            ) {
              writeCachedContext(
                email,
                result
              );
            } else {
              clearCachedContext();
            }

            setContext(
              result
            );

            return;
          }

          /*
           * 401 pode ocorrer imediatamente após o
           * retorno do Google enquanto a sessão do
           * cliente ainda está estabilizando.
           *
           * 5xx representa falha técnica temporária.
           * Nesses casos tentamos novamente.
           */
          const retriable =
            response.status ===
              401 ||
            response.status >=
              500;

          if (!retriable) {
            setContext(
              result
            );

            return;
          }
        }

        /*
         * Se havia um contexto autorizado recente,
         * não apagamos a interface por causa de uma
         * falha técnica transitória. A segurança das
         * páginas continua no servidor.
         */
        if (!cached) {
          setContext(
            lastResult ?? {
              ok: false,
              authorized:
                false,
              reason:
                "CONTEXT_LOAD_FAILED",
            }
          );
        }
      } catch {
        if (
          !active
        ) {
          return;
        }

        if (!cached) {
          setContext({
            ok: false,
            authorized:
              false,
            reason:
              "CONTEXT_LOAD_FAILED",
          });
        }
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
    email,
    googleId,
    retryToken,
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
    status !==
    "authenticated"
  ) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        Entre com sua conta Google para acessar os recursos do sistema.
      </div>
    );
  }

  /*
   * Falha técnica não é acesso negado.
   */
  if (
    context &&
    context.ok !== true
  ) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
        <div className="font-semibold text-amber-950">
          Não foi possível verificar suas permissões agora
        </div>

        <div className="mt-1 text-sm text-amber-800">
          Sua conta Google está autenticada, mas a consulta ao cadastro NAVE não foi concluída. Tente novamente.
        </div>

        <button
          type="button"
          onClick={() =>
            setRetryToken(
              (current) =>
                current + 1
            )
          }
          className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 shadow-sm transition hover:bg-amber-100"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (
    !context ||
    context.authorized !==
      true ||
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

        {permissions.validar && (
          <Link
            href="/validacao"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            Validação
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
