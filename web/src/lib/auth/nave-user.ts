import { auth } from "@/auth";

export type NavePermissions = {
  buscar: boolean;
  visualizar: boolean;
  validar: boolean;
  cadastrar: boolean;
  sequencias: boolean;
  usuarios: boolean;
  coordenacao: boolean;
  editoracao: boolean;
};

export type NaveUser = {
  email: string;
  emailAutenticacao: string;
  idGoogle: string;
  nome: string;
  perfil: string;
  area: string;
  disciplinas: string[];
};

export type NaveUserContext = {
  ok: boolean;
  authorized: boolean;
  reason?: string;
  user?: NaveUser | null;
  permissions?: NavePermissions | null;
};

const TECHNICAL_REASONS = new Set([
  "SERVER_CONFIGURATION_ERROR",
  "INVALID_BACKEND_RESPONSE",
  "BACKEND_ERROR",
  "BACKEND_UNAVAILABLE",
]);

function sleep(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

/* =========================================================
   BACKEND NAVE
========================================================= */

async function fetchNaveUserContextOnce(
  emailAutenticacao: string,
  idGoogle: string
): Promise<NaveUserContext> {
  const appsScriptUrl =
    process.env.NAVE_APPS_SCRIPT_SYNC_URL;

  const secret =
    process.env.NAVE_OFFLINE_SYNC_SECRET;

  if (!appsScriptUrl || !secret) {
    return {
      ok: false,
      authorized: false,
      reason:
        "SERVER_CONFIGURATION_ERROR",
    };
  }

  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () => controller.abort(),
      8000
    );

  try {
    const response =
      await fetch(
        appsScriptUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          cache: "no-store",

          signal:
            controller.signal,

          body: JSON.stringify({
            secret,
            action:
              "resolveNaveUser",
            emailAutenticacao,
            idGoogle,
          }),
        }
      );

    const raw =
      await response.text();

    let result:
      NaveUserContext;

    try {
      result =
        JSON.parse(
          raw
        ) as NaveUserContext;
    } catch {
      return {
        ok: false,
        authorized: false,
        reason:
          "INVALID_BACKEND_RESPONSE",
      };
    }

    /*
     * IMPORTANTE:
     *
     * Uma resposta válida do backend pode ser:
     *
     * ok: true
     * authorized: false
     *
     * Esse é um usuário realmente não autorizado,
     * não uma falha técnica.
     */
    if (
      !response.ok ||
      result.ok !== true
    ) {
      return {
        ok: false,
        authorized: false,
        reason:
          "BACKEND_ERROR",
      };
    }

    return result;
  } catch {
    return {
      ok: false,
      authorized: false,
      reason:
        "BACKEND_UNAVAILABLE",
    };
  } finally {
    clearTimeout(
      timeoutId
    );
  }
}

async function fetchNaveUserContext(
  emailAutenticacao: string,
  idGoogle: string
): Promise<NaveUserContext> {
  /*
   * V0.11.7.1
   *
   * Não usamos unstable_cache aqui.
   *
   * O cache anterior armazenava inclusive respostas
   * técnicas negativas por até 30 segundos. Assim,
   * uma falha transitória do Apps Script podia ser
   * reapresentada em várias navegações como se o
   * usuário estivesse sem autorização.
   *
   * Fazemos até 3 tentativas curtas somente para
   * falhas técnicas.
   */
  const delays =
    [0, 300, 800];

  let lastResult:
    NaveUserContext = {
      ok: false,
      authorized: false,
      reason:
        "BACKEND_UNAVAILABLE",
    };

  for (
    let attempt = 0;
    attempt <
    delays.length;
    attempt += 1
  ) {
    const delay =
      delays[attempt];

    if (delay > 0) {
      await sleep(delay);
    }

    const result =
      await fetchNaveUserContextOnce(
        emailAutenticacao,
        idGoogle
      );

    lastResult =
      result;

    /*
     * Resposta válida:
     * autorizada OU não autorizada.
     * Não repetimos nesses casos.
     */
    if (result.ok === true) {
      return result;
    }

    if (
      !result.reason ||
      !TECHNICAL_REASONS.has(
        result.reason
      )
    ) {
      return result;
    }
  }

  return lastResult;
}

/* =========================================================
   CONTEXTO AUTENTICADO
========================================================= */

export async function getNaveUserContext():
  Promise<NaveUserContext> {
  const session =
    await auth();

  if (
    !session?.user ||
    !session.user.id ||
    !session.user.email
  ) {
    return {
      ok: false,
      authorized: false,
      reason:
        "NOT_AUTHENTICATED",
    };
  }

  const email =
    session.user.email
      .trim()
      .toLowerCase();

  const idGoogle =
    session.user.id.trim();

  return fetchNaveUserContext(
    email,
    idGoogle
  );
}