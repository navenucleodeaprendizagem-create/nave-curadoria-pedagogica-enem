import {
  getNaveUserContext,
} from "@/lib/auth/nave-user";

export async function GET() {
  const context =
    await getNaveUserContext();

  if (
    context.reason ===
    "NOT_AUTHENTICATED"
  ) {
    return Response.json(
      context,
      {
        status: 401,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  /*
   * Falha técnica:
   * não converter em "usuário não autorizado".
   */
  if (context.ok !== true) {
    return Response.json(
      context,
      {
        status: 503,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  /*
   * Resolução concluída corretamente,
   * mas conta sem autorização.
   */
  if (
    context.authorized !== true
  ) {
    return Response.json(
      context,
      {
        status: 403,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  return Response.json(
    context,
    {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}