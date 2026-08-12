export default function NaveInstitutionalBrandV011160() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-nave.jpg"
          alt="Logo institucional NAVE"
          className="h-full w-full object-contain"
        />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
          NAVE
        </p>

        <p className="mt-1 text-sm font-bold leading-5 text-slate-950 sm:text-base">
          Sistema de Inteligência e Gestão da Aprendizagem
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Núcleo de Aprendizagem, Valor e Estratégia
        </p>
      </div>
    </div>
  );
}
