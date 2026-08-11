"use client";

import {
  useState,
} from "react";

import {
  signIn,
  signOut,
  useSession,
} from "next-auth/react";

export default function AuthStatus() {
  const {
    data: session,
    status,
  } = useSession();

  const [
    authAction,
    setAuthAction,
  ] =
    useState<
      "signin" |
      "signout" |
      null
    >(null);

  if (
    status === "loading"
  ) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
        Verificando usuário
      </div>
    );
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        disabled={
          authAction !== null
        }
        onClick={() => {
          setAuthAction(
            "signin"
          );

          void signIn(
            "google",
            {
              redirectTo:
                "/",
            }
          ).catch(() => {
            setAuthAction(
              null
            );
          });
        }}
        className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {authAction ===
        "signin"
          ? "Entrando..."
          : "Entrar com Google"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <div className="text-sm font-semibold text-slate-800">
          {session.user.name ||
            "Usuário NAVE"}
        </div>

        <div className="text-xs text-slate-500">
          {session.user.email}
        </div>
      </div>

      <button
        type="button"
        disabled={
          authAction !== null
        }
        onClick={() => {
          setAuthAction(
            "signout"
          );

          /*
           * Limpa o cache apenas de UX do NaveAccessGate
           * antes de encerrar a sessão.
           */
          try {
            window.sessionStorage.removeItem(
              "nave-authorized-context-v01171"
            );

            window.sessionStorage.removeItem(
              "nave-authorized-context-v01172"
            );
          } catch {
            // Cache opcional.
          }

          void signOut({
            redirectTo:
              "/",
          }).catch(() => {
            setAuthAction(
              null
            );
          });
        }}
        className="ml-2 text-xs font-semibold text-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {authAction ===
        "signout"
          ? "Saindo..."
          : "Sair"}
      </button>
    </div>
  );
}
