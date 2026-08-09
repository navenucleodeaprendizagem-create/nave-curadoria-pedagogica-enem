export async function GET() {
  return Response.json(
    {
      ok: true,
      service: "nave-web",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}