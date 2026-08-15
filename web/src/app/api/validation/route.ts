import { NextResponse } from "next/server";
import { getNaveUserContext, type NaveUserContext } from "@/lib/auth/nave-user";

type Permission = "validar" | "coordenacao";
type AuthorizedContext = NaveUserContext & {
  ok: true;
  authorized: true;
  user: NonNullable<NaveUserContext["user"]>;
  permissions: NonNullable<NaveUserContext["permissions"]>;
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {"Cache-Control": "no-store"},
  });
}

async function authorize(permission: Permission): Promise<
  | {ok:true; context:AuthorizedContext}
  | {ok:false; response:NextResponse}
> {
  const context = await getNaveUserContext();

  if (context.reason === "NOT_AUTHENTICATED") {
    return {ok:false, response:json({ok:false, reason:"NOT_AUTHENTICATED"}, 401)};
  }

  if (context.ok !== true) {
    return {ok:false, response:json({ok:false, reason:context.reason || "AUTH_BACKEND_ERROR"}, 503)};
  }

  if (
    context.authorized !== true ||
    !context.user ||
    !context.permissions ||
    context.permissions[permission] !== true
  ) {
    return {ok:false, response:json({ok:false, reason:"NOT_AUTHORIZED"}, 403)};
  }

  return {ok:true, context:context as AuthorizedContext};
}

async function callAppsScript(payload: Record<string, unknown>) {
  const url = process.env.NAVE_APPS_SCRIPT_SYNC_URL;
  const secret = process.env.NAVE_OFFLINE_SYNC_SECRET;
  if (!url || !secret) throw new Error("Configuração do backend de validação ausente.");

  const response = await fetch(url, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    cache:"no-store",
    body:JSON.stringify({secret, ...payload}),
  });

  const raw = await response.text();
  let result: Record<string, unknown>;
  try {
    result = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("Resposta inválida do Apps Script.");
  }

  if (!response.ok || result.ok !== true) {
    throw new Error(typeof result.error === "string"
      ? result.error
      : "Falha no backend central de validação.");
  }
  return result;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ok:false, error:"Payload inválido."}, 400);
  }

  const operation = String(body.operation ?? "");
  const coordinationOps = new Set(["listCases","getCase","decideCase"]);
  const permission: Permission = coordinationOps.has(operation) ? "coordenacao" : "validar";

  const authResult = await authorize(permission);
  if (!authResult.ok) return authResult.response;
  const {context} = authResult;

  const identity = {
    emailAutenticacao: context.user.emailAutenticacao,
    idGoogle: context.user.idGoogle,
  };

  try {
    if (operation === "getQuestion") {
      const result = await callAppsScript({
        action:"getValidationQuestion", ...identity, id:String(body.id ?? "")
      });
      return json({ok:true, question:result.question ?? null});
    }

    if (operation === "submitValidation") {
      const validation = body.validation;
      const idOperacao =
        validation &&
        typeof validation === "object"
          ? (validation as Record<string, unknown>).idOperacao
          : null;

      if (
        typeof idOperacao !== "string" ||
        !idOperacao.trim()
      ) {
        return json({ok:false, error:"idOperacao é obrigatório."}, 400);
      }

      const result = await callAppsScript({
        action:"submitCentralValidation", ...identity, validation
      });
      return json({ok:true, result:result.result ?? null});
    }

    if (operation === "listCases") {
      const result = await callAppsScript({
        action:"listCentralCoordinationCases", ...identity
      });
      return json({ok:true, cases:Array.isArray(result.cases) ? result.cases : []});
    }

    if (operation === "getCase") {
      const result = await callAppsScript({
        action:"getCentralCoordinationCase", ...identity, id:String(body.id ?? "")
      });
      return json({ok:true, case:result.case ?? null});
    }

    if (operation === "decideCase") {
      const result = await callAppsScript({
        action:"decideCentralCoordinationCase", ...identity, decision:body.decision ?? {}
      });
      return json({ok:true, result:result.result ?? null});
    }

    return json({ok:false, error:"Operação de validação não reconhecida."}, 400);
  } catch (error) {
    return json({
      ok:false,
      error:error instanceof Error ? error.message : "Falha na validação central."
    }, 502);
  }
}
