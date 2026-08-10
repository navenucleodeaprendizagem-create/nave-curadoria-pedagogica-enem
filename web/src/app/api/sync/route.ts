import { auth } from "@/auth";

type SyncOperation = {
  id?: string;
  entity?: string;
  entityId?: string;
  action?: string;
  payload?: Record<string, unknown>;
  status?: string;
  attempts?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export async function POST(request: Request) {
  try {
    // ============================================================
    // 1. IDENTIDADE CONFIÁVEL — OBTIDA NO SERVIDOR
    // ============================================================

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

    // ============================================================
    // 2. LEITURA DAS OPERAÇÕES RECEBIDAS
    // ============================================================

    const body = await request.json();

    const receivedOperations: SyncOperation[] =
      Array.isArray(body?.operations)
        ? body.operations
        : [];

    // ============================================================
    // 3. SOBRESCREVE IDENTIDADE DO CLIENTE
    // ============================================================
    //
    // Não confiamos em:
    // - usuario
    // - emailUsuario
    // - userId
    // - nomeUsuario
    //
    // que eventualmente tenham vindo do navegador.
    //
    // A identidade verdadeira é acrescentada aqui, no servidor.

    const operations = receivedOperations.map(
      (operation) => {
        const originalPayload =
          operation.payload &&
          typeof operation.payload === "object" &&
          !Array.isArray(operation.payload)
            ? operation.payload
            : {};

        const {
          usuario: _usuario,
          emailUsuario: _emailUsuario,
          userId: _userId,
          nomeUsuario: _nomeUsuario,
          authenticatedUser: _authenticatedUser,
          ...safePayload
        } = originalPayload;

        return {
          ...operation,

          payload: {
            ...safePayload,

            authenticatedUser: {
              id: session.user.id,
              email: session.user.email,
              name:
                session.user.name ??
                "",
            },
          },
        };
      }
    );

    // ============================================================
    // 4. CONFIGURAÇÃO DA PONTE COM APPS SCRIPT
    // ============================================================

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

    // ============================================================
    // 5. ENVIO AO APPS SCRIPT
    // ============================================================

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
          statusAppsScript:
            response.status,
        },
        {
          status: 502,
        }
      );
    }

    // ============================================================
    // 6. VALIDAÇÃO DA RESPOSTA DO APPS SCRIPT
    // ============================================================

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          error:
            "Apps Script retornou erro HTTP.",
          statusAppsScript:
            response.status,
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
            "Apps Script não confirmou a operação.",
          result,
        },
        {
          status: 502,
        }
      );
    }

    // ============================================================
    // 7. SUCESSO
    // ============================================================

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