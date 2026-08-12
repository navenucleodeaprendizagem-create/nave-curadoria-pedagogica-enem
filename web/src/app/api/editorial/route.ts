import {
  NextResponse,
} from "next/server";

import {
  getNaveUserContext,
  type NaveUserContext,
} from "@/lib/auth/nave-user";

type EditorialStatus =
  | "aguardando"
  | "em_producao"
  | "concluido"
  | "cancelado";

type EditorialRequestBody = {
  operation?:
    | "create"
    | "updateStatus"
    | "preparePackage";

  sequenceId?: string;
  titulo?: string;
  descricao?: string;
  questionIds?: string[];

  id?: string;
  status?: EditorialStatus;
};

type AuthorizedContext =
  NaveUserContext & {
    ok: true;
    authorized: true;
    user: NonNullable<
      NaveUserContext["user"]
    >;
    permissions: NonNullable<
      NaveUserContext[
        "permissions"
      ]
    >;
  };

function json(
  body: unknown,
  status = 200
) {
  return NextResponse.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

async function authorize(
  permission:
    | "sequencias"
    | "editoracao"
): Promise<
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

  if (
    context.ok !== true
  ) {
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

  if (
    context.authorized !==
      true ||
    !context.user ||
    !context.permissions ||
    context.permissions[
      permission
    ] !== true
  ) {
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
      context as
        AuthorizedContext,
  };
}

async function callAppsScript(
  payload: Record<
    string,
    unknown
  >
) {
  const appsScriptUrl =
    process.env
      .NAVE_APPS_SCRIPT_SYNC_URL;

  const secret =
    process.env
      .NAVE_OFFLINE_SYNC_SECRET;

  if (
    !appsScriptUrl ||
    !secret
  ) {
    throw new Error(
      "Configuração do backend de editoração ausente."
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

        cache:
          "no-store",

        body: JSON.stringify({
          secret,
          ...payload,
        }),
      }
    );

  const raw =
    await response.text();

  let result:
    Record<
      string,
      unknown
    >;

  try {
    result =
      JSON.parse(
        raw
      ) as Record<
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
    const message =
      typeof result.error ===
        "string"
        ? result.error
        : typeof result.message ===
            "string"
          ? result.message
          : "Falha no backend central de editoração.";

    throw new Error(
      message
    );
  }

  return result;
}

export async function GET(
  request: Request
) {
  const url =
    new URL(
      request.url
    );

  const scope =
    url.searchParams.get(
      "scope"
    );

  /*
   * Sequências precisa saber somente se um
   * sequenceId já está em fluxo editorial ativo.
   * Isso não expõe a fila completa ao professor.
   */
  if (
    scope ===
    "active-sequences"
  ) {
    const authResult =
      await authorize(
        "sequencias"
      );

    if (!authResult.ok) {
      return authResult.response;
    }

    const {
      context,
    } =
      authResult;

    try {
      const result =
        await callAppsScript({
          action:
            "listActiveEditorialSequenceIds",

          emailAutenticacao:
            context.user.emailAutenticacao,

          idGoogle:
            context.user.idGoogle,
        });

      return json({
        ok: true,

        sequenceIds:
          Array.isArray(
            result.sequenceIds
          )
            ? result.sequenceIds
            : [],
      });
    } catch (error) {
      return json(
        {
          ok: false,

          error:
            error instanceof
            Error
              ? error.message
              : "Falha ao consultar sequências em editoração.",
        },
        502
      );
    }
  }

  /*
   * A fila editorial completa é restrita
   * ao perfil com permissão editoracao.
   */
  const authResult =
    await authorize(
      "editoracao"
    );

  if (!authResult.ok) {
    return authResult.response;
  }

  const {
    context,
  } =
    authResult;

  try {
    const result =
      await callAppsScript({
        action:
          "listEditorialJobs",

        emailAutenticacao:
          context.user.emailAutenticacao,

        idGoogle:
          context.user.idGoogle,
      });

    return json({
      ok: true,

      jobs:
        Array.isArray(
          result.jobs
        )
          ? result.jobs
          : [],
    });
  } catch (error) {
    return json(
      {
        ok: false,

        error:
          error instanceof
          Error
            ? error.message
            : "Falha ao carregar a fila editorial central.",
      },
      502
    );
  }
}

export async function POST(
  request: Request
) {
  let body:
    EditorialRequestBody;

  try {
    body =
      await request.json() as
        EditorialRequestBody;
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

  if (
    body.operation ===
    "create"
  ) {
    const authResult =
      await authorize(
        "sequencias"
      );

    if (!authResult.ok) {
      return authResult.response;
    }

    const {
      context,
    } =
      authResult;

    const sequenceId =
      String(
        body.sequenceId ??
          ""
      ).trim();

    const titulo =
      String(
        body.titulo ?? ""
      ).trim();

    const descricao =
      String(
        body.descricao ?? ""
      ).trim();

    const questionIds =
      Array.isArray(
        body.questionIds
      )
        ? body.questionIds
            .map(
              (value) =>
                String(
                  value ?? ""
                ).trim()
            )
            .filter(Boolean)
        : [];

    if (
      !sequenceId ||
      !titulo ||
      questionIds.length === 0
    ) {
      return json(
        {
          ok: false,
          error:
            "Sequência editorial inválida.",
        },
        400
      );
    }

    try {
      const result =
        await callAppsScript({
          action:
            "createEditorialJob",

          emailAutenticacao:
            context.user.emailAutenticacao,

          idGoogle:
            context.user.idGoogle,

          editorialJob: {
            sequenceId,
            titulo,
            descricao,
            questionIds,
          },
        });

      return json({
        ok: true,
        job:
          result.job ?? null,
      });
    } catch (error) {
      return json(
        {
          ok: false,

          error:
            error instanceof
            Error
              ? error.message
              : "Falha ao enviar a sequência para editoração.",
        },
        502
      );
    }
  }

  if (
    body.operation ===
    "updateStatus"
  ) {
    const authResult =
      await authorize(
        "editoracao"
      );

    if (!authResult.ok) {
      return authResult.response;
    }

    const {
      context,
    } =
      authResult;

    const id =
      String(
        body.id ?? ""
      ).trim();

    const status =
      String(
        body.status ?? ""
      ).trim() as
        EditorialStatus;

    const validStatuses:
      EditorialStatus[] =
      [
        "aguardando",
        "em_producao",
        "concluido",
        "cancelado",
      ];

    if (
      !id ||
      !validStatuses.includes(
        status
      )
    ) {
      return json(
        {
          ok: false,
          error:
            "Atualização editorial inválida.",
        },
        400
      );
    }

    try {
      const result =
        await callAppsScript({
          action:
            "updateEditorialJobStatus",

          emailAutenticacao:
            context.user.emailAutenticacao,

          idGoogle:
            context.user.idGoogle,

          id,
          status,
        });

      return json({
        ok: true,
        job:
          result.job ?? null,
      });
    } catch (error) {
      return json(
        {
          ok: false,

          error:
            error instanceof
            Error
              ? error.message
              : "Falha ao atualizar a fila editorial.",
        },
        502
      );
    }
  }

  if (
    body.operation ===
    "preparePackage"
  ) {
    const authResult =
      await authorize(
        "editoracao"
      );

    if (!authResult.ok) {
      return authResult.response;
    }

    const {
      context,
    } =
      authResult;

    const id =
      String(
        body.id ?? ""
      ).trim();

    if (!id) {
      return json(
        {
          ok: false,
          error:
            "ID editorial ausente.",
        },
        400
      );
    }

    try {
      const result =
        await callAppsScript({
          action:
            "prepareEditorialPackage",

          emailAutenticacao:
            context.user.emailAutenticacao,

          idGoogle:
            context.user.idGoogle,

          id,
        });

      return json({
        ok: true,
        packageInfo:
          result.packageInfo ??
          null,
      });
    } catch (error) {
      return json(
        {
          ok: false,

          error:
            error instanceof
            Error
              ? error.message
              : "Falha ao preparar o pacote editorial.",
        },
        502
      );
    }
  }

  return json(
    {
      ok: false,
      error:
        "Operação editorial não reconhecida.",
    },
    400
  );
}
