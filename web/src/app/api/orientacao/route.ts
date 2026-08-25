import {NextResponse} from "next/server";
import {getNaveUserContext} from "@/lib/auth/nave-user";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {status, headers:{"Cache-Control":"no-store"}});
}

export async function POST(request: Request) {
  const auth = await getNaveUserContext();
  if (auth.reason === "NOT_AUTHENTICATED") return json({ok:false, reason:"NOT_AUTHENTICATED"}, 401);
  if (auth.ok !== true) return json({ok:false, reason:auth.reason || "AUTH_BACKEND_ERROR"}, 503);
  if (auth.authorized !== true || !auth.user || !auth.permissions?.sequencias) {
    return json({ok:false, reason:"NOT_AUTHORIZED"}, 403);
  }
  const url = process.env.NAVE_APPS_SCRIPT_SYNC_URL;
  const secret = process.env.NAVE_OFFLINE_SYNC_SECRET;
  if (!url || !secret) return json({ok:false, error:"Configuração do backend de orientação ausente."}, 503);
  let activity: unknown;
  try { activity = await request.json(); }
  catch { return json({ok:false, error:"Corpo JSON inválido."}, 400); }

  try {
    const response = await fetch(url, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      cache:"no-store",
      body:JSON.stringify({
        secret,
        action:"upsertPedagogicalActivity",
        emailAutenticacao:auth.user.emailAutenticacao,
        idGoogle:auth.user.idGoogle,
        activity,
      }),
    });
    const raw = await response.text();
    let result: Record<string, unknown>;
    try { result = JSON.parse(raw) as Record<string, unknown>; }
    catch { throw new Error("Resposta inválida do Apps Script."); }
    if (!response.ok || result.ok !== true) {
      throw new Error(typeof result.error === "string" ? result.error : "Falha no backend de orientação.");
    }
    return json({ok:true, snapshot:result.snapshot ?? null});
  } catch (error) {
    return json({ok:false, error:error instanceof Error ? error.message : "Falha ao salvar a atividade."}, 502);
  }
}
