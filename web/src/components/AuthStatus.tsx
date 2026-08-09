"use client";

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

  if (status === "loading") {
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
        onClick={() =>
          void signIn("google")
        }
        className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm"
      >
        Entrar com Google
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
        onClick={() =>
          void signOut()
        }
        className="ml-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        Sair
      </button>
    </div>
  );
}