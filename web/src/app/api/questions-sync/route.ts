import { auth } from "@/auth";

import { getNaveUserContext } from "@/lib/auth/nave-user";

type QuestionBankAction =
  | "info"
  | "chunk";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      !session.user.id ||
      !session.user.email
    ) {
      return Response.json(
        {
          ok: false,
          error: "Autenticação necessária.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const naveContext =
      await getNaveUserContext();

    if (
      naveContext.authorized !== true ||
      !naveContext.permissions?.buscar
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "Usuário sem permissão para acessar o banco de questões.",
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const body = await request.json();

    const action =
      String(body?.action || "") as QuestionBankAction;

    if (
      action !== "info" &&
      action !== "chunk"
    ) {
      return Response.json(
        {
          ok: false,
          error: "Ação inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const appsScriptUrl =
      process.env.NAVE_APPS_SCRIPT_SYNC_URL;

    const secret =
      process.env.NAVE_OFFLINE_SYNC_SECRET;

    if (!appsScriptUrl || !secret) {
      return Response.json(
        {
          ok: false,
          error:
            "Configuração do backend incompleta.",
        },
        {
          status: 500,
        }
      );
    }

    const payload =
      action === "info"
        ? {
            secret,
            action:
              "getQuestionBankInfo",
          }
        : {
            secret,
            action:
              "getQuestionBankChunk",
            offset:
              Number(body?.offset || 0),
            limit:
              Number(body?.limit || 500),
          };

    const response = await fetch(
      appsScriptUrl,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        cache: "no-store",

        body: JSON.stringify(
          payload
        ),
      }
    );

    const raw =
      await response.text();

    let result: unknown;

    try {
      result =
        JSON.parse(raw);
    } catch {
      return Response.json(
        {
          ok: false,
          error:
            "Resposta inválida recebida do Apps Script.",
        },
        {
          status: 502,
        }
      );
    }

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          error:
            "Apps Script retornou erro HTTP.",
          result,
        },
        {
          status: 502,
        }
      );
    }

    if (
      !result ||
      typeof result !== "object" ||
      !("ok" in result) ||
      result.ok !== true
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "Apps Script não confirmou a leitura do banco.",
          result,
        },
        {
          status: 502,
        }
      );
    }

    return Response.json(
      result,
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha desconhecida.",
      },
      {
        status: 500,
      }
    );
  }
}