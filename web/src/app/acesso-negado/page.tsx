import Link from "next/link";

type AcessoNegadoPageProps = {
  searchParams: Promise<{
    motivo?: string;
    recurso?: string;
  }>;
};

export default async function AcessoNegadoPage({
  searchParams,
}: AcessoNegadoPageProps) {
  const params =
    await searchParams;

  const permissaoInsuficiente =
    params.motivo ===
    "permissao";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-semibold text-teal-700"
        >
          ← Voltar ao início
        </Link>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            Sistema NAVE
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Acesso não autorizado
          </h1>

          <p className="mt-4 text-slate-600">
            {permissaoInsuficiente
              ? "Seu perfil NAVE não possui permissão para acessar este recurso."
              : "Sua conta Google está autenticada, mas não possui um cadastro ativo e autorizado no NAVE."}
          </p>
        </div>
      </div>
    </main>
  );
}