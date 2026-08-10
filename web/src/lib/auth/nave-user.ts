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

export async function getNaveUserContext():
  Promise<NaveUserContext> {
  const session = await auth();

  if (
    !session?.user ||
    !session.user.id ||
    !session.user.email
  ) {
    return {
      ok: false,
      authorized: false,
      reason: "NOT_AUTHENTICATED",
    };
  }

  const appsScriptUrl =
    process.env.NAVE_APPS_SCRIPT_SYNC_URL;

  const secret =
    process.env.NAVE_OFFLINE_SYNC_SECRET;

  if (!appsScriptUrl || !secret) {
    return {
      ok: false,
      authorized: false,
      reason: "SERVER_CONFIGURATION_ERROR",
    };
  }

  try {
    const response = await fetch(
      appsScriptUrl,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        cache: "no-store",

        body: JSON.stringify({
          secret,
          action:
            "resolveNaveUser",
          emailAutenticacao:
            session.user.email,
          idGoogle:
            session.user.id,
        }),
      }
    );

    const raw =
      await response.text();

    let result:
      NaveUserContext;

    try {
      result =
        JSON.parse(raw) as NaveUserContext;
    } catch {
      return {
        ok: false,
        authorized: false,
        reason:
          "INVALID_BACKEND_RESPONSE",
      };
    }

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
  }
}