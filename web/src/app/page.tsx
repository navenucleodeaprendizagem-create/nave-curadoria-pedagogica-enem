import ConnectivityStatus from "@/components/ConnectivityStatus";
import LocalDatabaseStatus from "@/components/LocalDatabaseStatus";
import LocalQuestionsTest from "@/components/LocalQuestionsTest";
import SyncQueueTest from "@/components/SyncQueueTest";
import AuthStatus from "@/components/AuthStatus";
import NaveAccessGate from "@/components/NaveAccessGate";
import NaveInstitutionalBrandV011160 from "@/components/NaveInstitutionalBrandV011160";
import NaveInstitutionalFooterV011160 from "@/components/NaveInstitutionalFooterV011160";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f7f6] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <NaveInstitutionalBrandV011160 />

          <div className="flex flex-col gap-3 sm:flex-row">
            <ConnectivityStatus />
            <LocalDatabaseStatus />
            <AuthStatus />
          </div>
        </header>

        <section className="flex flex-1 items-center py-16">
          <div className="max-w-4xl">
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
              Curadoria Pedagógica ENEM
            </p>

            <h2 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Direção pedagógica, dados e governança em um único sistema.
            </h2>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600">
              Ambiente para busca e seleção de questões, construção de sequências pedagógicas,
              validação docente, coordenação e fluxo editorial.
            </p>

            <div className="mt-10">
              <NaveAccessGate />
            </div>
          </div>
        </section>

        <section className="space-y-4 pb-10">
          <LocalQuestionsTest />
          <SyncQueueTest />
        </section>

        <NaveInstitutionalFooterV011160 />
      </div>
    </main>
  );
}