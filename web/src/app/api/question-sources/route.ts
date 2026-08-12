import { NextResponse } from "next/server";

import {
  getNaveUserContext,
  type NaveUserContext,
} from "@/lib/auth/nave-user";

type AuthorizedContext = NaveUserContext & {
  ok: true;
  authorized: true;
  user: NonNullable<NaveUserContext["user"]>;
  permissions: NonNullable<NaveUserContext["permissions"]>;
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

async function authorize(): Promise<
  | {
      ok: true;
      context: AuthorizedContext;
    }
  | {
      ok: false;
      response: NextResponse;
    }
> {
  const context =
    await getNaveUserContext();

  if (
    context.reason ===
    "NOT_AUTHENTICATED"
  ) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          reason:
            "NOT_AUTHENTICATED",
        },
        401
      ),
    };
  }

  if (context.ok !== true) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          reason:
            context.reason ||
            "AUTH_BACKEND_ERROR",
        },
        503
      ),
    };
  }

  const permissions =
    context.permissions;

  const allowed =
    context.authorized === true &&
    Boolean(context.user) &&
    Boolean(permissions) &&
    (
      permissions?.sequencias === true ||
      permissions?.validar === true ||
      permissions?.coordenacao === true ||
      permissions?.editoracao === true
    );

  if (!allowed) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          reason:
            "NOT_AUTHORIZED",
        },
        403
      ),
    };
  }

  return {
    ok: true,
    context:
      context as AuthorizedContext,
  };
}

async function callAppsScript(
  payload: Record<
    string,
    unknown
  >
) {
  const url =
    process.env
      .NAVE_APPS_SCRIPT_SYNC_URL;

  const secret =
    process.env
      .NAVE_OFFLINE_SYNC_SECRET;

  if (!url || !secret) {
    throw new Error(
      "Configuração do backend de fontes PDF ausente."
    );
  }

  const response =
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        secret,
        ...payload,
      }),
    });

  const raw =
    await response.text();

  let result:
    Record<string, unknown>;

  try {
    result =
      JSON.parse(raw) as Record<
        string,
        unknown
      >;
  } catch {
    throw new Error(
      "Resposta inválida do Apps Script."
    );
  }

  if (
    !response.ok ||
    result.ok !== true
  ) {
    throw new Error(
      typeof result.error ===
        "string"
        ? result.error
        : "Falha ao consultar fontes PDF."
    );
  }

  return result;
}

export async function POST(
  request: Request
) {
  let body:
    Record<string, unknown>;

  try {
    body =
      await request.json() as Record<
        string,
        unknown
      >;
  } catch {
    return json(
      {
        ok: false,
        error:
          "Payload inválido.",
      },
      400
    );
  }

  const rawIds =
    Array.isArray(body.ids)
      ? body.ids
      : [];

  const ids =
    rawIds
      .map((id) =>
        String(id ?? "").trim()
      )
      .filter(Boolean)
      .slice(0, 200);

  if (!ids.length) {
    return json({
      ok: true,
      sources: [],
    });
  }

  const authResult =
    await authorize();

  if (!authResult.ok) {
    return authResult.response;
  }

  const { context } =
    authResult;

  try {
    const result =
      await callAppsScript({
        action:
          "getQuestionPdfSources",
        emailAutenticacao:
          context.user
            .emailAutenticacao,
        idGoogle:
          context.user.idGoogle,
        ids,
      });

    return json({
      ok: true,
      sources:
        Array.isArray(
          result.sources
        )
          ? result.sources
          : [],
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao consultar fontes PDF.",
      },
      502
    );
  }
}
