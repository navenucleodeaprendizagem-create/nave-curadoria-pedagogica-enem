export default function NaveInstitutionalFooterV011160() {
  return (
    <footer className="mt-10 border-t border-slate-200 pt-6 text-xs leading-6 text-slate-500">
      <p className="font-semibold text-slate-700">
        NAVE — Núcleo de Aprendizagem, Valor e Estratégia
      </p>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <span>Uberlândia/MG</span>
        <a
          href="mailto:nave.nucleodeaprendizagem@gmail.com"
          className="transition hover:text-teal-700"
        >
          nave.nucleodeaprendizagem@gmail.com
        </a>
        <a
          href="https://naveaprendizagem.com"
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-teal-700"
        >
          naveaprendizagem.com
        </a>
      </div>

      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        <span>Instagram: @nave.robson</span>
        <span>YouTube: @nave.nucleodeaprendizagem</span>
      </div>
    </footer>
  );
}
