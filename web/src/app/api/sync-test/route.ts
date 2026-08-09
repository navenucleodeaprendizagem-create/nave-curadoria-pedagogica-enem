export async function POST(request: Request) {
  try {
    const body = await request.json();

    const operations = Array.isArray(body?.operations)
      ? body.operations
      : [];

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

    const response = await fetch(
      appsScriptUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          secret,
          operations,
        }),
      }
    );

    const raw = await response.text();

    let result: unknown;

    try {
      result = JSON.parse(raw);
    } catch {
      return Response.json(
        {
          ok: false,
          error:
            "Resposta inválida recebida do Apps Script.",
          statusAppsScript: response.status,
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
          statusAppsScript: response.status,
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
          "Cache-Control": "no-store",
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