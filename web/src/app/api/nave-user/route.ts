import { auth } from "@/auth";

export async function GET() {
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
          authorized: false,
          reason: "NOT_AUTHENTICATED",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const appsScriptUrl =
      process.env.NAVE_APPS_SCRIPT_SYNC_URL;

    const secret =
      process.env.NAVE_OFFLINE_SYNC_SECRET;

    if (!appsScriptUrl) {
      return Response.json(
        {
          ok: false,
          error:
            "NAVE_APPS_SCRIPT_SYNC_URL não configurada.",
        },
        {
          status: 500,
        }
      );
    }

    if (!secret) {
      return Response.json(
        {
          ok: false,
          error:
            "NAVE_OFFLINE_SYNC_SECRET não configurada.",
        },
        {
          status: 500,
        }
      );
    }

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
            "Apps Script não confirmou a resolução do usuário.",
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