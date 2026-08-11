import {
  auth,
  signIn,
  signOut,
} from "@/auth";

export default async function AuthStatus() {
  const session =
    await auth();

  if (!session?.user) {
    return (
      <form
        action={async () => {
          "use server";

          await signIn(
            "google",
            {
              redirectTo: "/",
            }
          );
        }}
      >
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Entrar com Google
        </button>
      </form>
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

      <form
        action={async () => {
          "use server";

          await signOut({
            redirectTo: "/",
          });
        }}
      >
        <button
          type="submit"
          className="ml-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
        >
          Sair
        </button>
      </form>
    </div>
  );
}