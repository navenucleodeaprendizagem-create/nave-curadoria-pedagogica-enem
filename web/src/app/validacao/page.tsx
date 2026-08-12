import Link from "next/link";
import ValidacaoCentralClient from "@/components/ValidacaoCentralClientV01113";
import { SYSTEM_VERSION } from "@/lib/system-version";
import { requireNavePermission } from "@/lib/auth/require-nave-permission";

type ValidacaoPageProps = {
  searchParams: Promise<{
    id?: string;
    origem?: string;
    sequencia?: string;
  }>;
};

export default async function ValidacaoPage({
  searchParams,
}: ValidacaoPageProps) {
  const { user } = await requireNavePermission("validar");
  const params = await searchParams;

  const questionId =
    String(params.id ?? "").trim();

  const sequenceId =
    String(params.sequencia ?? "").trim();

  const contextual =
    params.origem === "sequencias" &&
    Boolean(questionId);

  const returnHref =
    sequenceId
      ? `/sequencias?sequencia=${encodeURIComponent(sequenceId)}`
      : "/sequencias";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link href={returnHref} className="text-sm font-semibold text-teal-700">← Voltar às sequências</Link>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-nave.jpg" alt="Logo institucional NAVE" className="h-full w-full object-contain"/>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Curadoria Pedagógica ENEM</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Validação docente</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Registro central compartilhado das validações pedagógicas das questões.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex gap-2">
                <Link href={returnHref} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold">Sequências</Link>
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800">{SYSTEM_VERSION}</span>
              </div>
              <p className="text-xs text-slate-500">Usuário: {user.nome} · Perfil: {user.perfil}</p>
            </div>
          </div>
        </section>

        <ValidacaoCentralClient
          initialQuestionId={questionId}
          contextual={contextual}
        />
      </div>
    </main>
  );
}
