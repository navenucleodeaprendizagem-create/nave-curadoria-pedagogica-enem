export async function POST(request: Request) {
  try {
    const body = await request.json();

    const operations = Array.isArray(body?.operations)
      ? body.operations
      : [];

    return Response.json(
      {
        ok: true,
        received: operations.length,
        processedIds: operations
          .map((operation: { id?: string }) => operation.id)
          .filter(Boolean),
        processedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return Response.json(
      {
        ok: false,
        error: "Payload inválido.",
      },
      {
        status: 400,
      }
    );
  }
}