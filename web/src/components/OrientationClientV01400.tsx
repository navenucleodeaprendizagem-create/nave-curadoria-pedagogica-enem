"use client";

import {useEffect, useState} from "react";
import {
  getPedagogicalOrientation,
  type OrientationCount,
  type PedagogicalOrientation,
} from "@/lib/orientation/orientation-api";

function Counts({values}:{values:OrientationCount}) {
  return <div className="flex flex-wrap gap-2">{Object.entries(values).map(([label,count]) => (
    <span key={label} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {label}: {count}
    </span>
  ))}</div>;
}

function TextBlock({title, text}:{title:string; text?:string}) {
  if (!text) return null;
  return <div><h4 className="text-xs font-bold uppercase tracking-[0.12em] text-teal-700">{title}</h4>
    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{text}</p></div>;
}

export default function OrientationClient({id}:{id:string}) {
  const [data, setData] = useState<PedagogicalOrientation | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getPedagogicalOrientation(id)
      .then((orientation) => { if (active) setData(orientation); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Falha ao carregar."); });
    return () => { active = false; };
  }, [id]);

  if (error) return <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</div>;
  if (!data) return <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando orientação pedagógica…</div>;

  return <div className="space-y-6">
    <header className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Orientação pedagógica</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{data.titulo}</h1>
      {data.descricao ? <p className="mt-2 text-slate-600">{data.descricao}</p> : null}
      <p className="mt-3 text-sm font-semibold text-slate-700">Professor: {data.professorNome || "Não informado"}</p>
    </header>

    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">1. Panorama da atividade</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Questões" value={String(data.quantidadeQuestoes)} />
        <Metric label="Área" value={data.panorama.areas.join(", ") || "—"} />
        <Metric label="Componentes" value={data.panorama.componentes.join(", ") || "—"} />
        <Metric label="Habilidades" value={data.panorama.habilidades.join(", ") || "—"} />
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div><h3 className="mb-2 text-sm font-bold">Dificuldade</h3><Counts values={data.panorama.dificuldades} /></div>
        <div><h3 className="mb-2 text-sm font-bold">Funções pedagógicas</h3><Counts values={data.panorama.funcoesPedagogicas} /></div>
      </div>
      <div className="mt-6 overflow-x-auto">
        {!data.historicoEnemDisponivel ? <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Frequência histórica temporariamente indisponível até a conexão da base analítica ENEM 2016–2025.</p> : null}
        <table className="min-w-full text-left text-sm"><thead className="border-b text-xs uppercase text-slate-500"><tr>
          <th className="px-3 py-2">Habilidade</th><th className="px-3 py-2">Questões</th>
          <th className="px-3 py-2">Itens ENEM 2016–2025</th><th className="px-3 py-2">Média da área</th><th className="px-3 py-2">Recorrência</th>
        </tr></thead><tbody>{data.panorama.tabelaHabilidades.map((row) => <tr key={row.habilidade} className="border-b border-slate-100">
          <td className="px-3 py-3 font-bold">{row.habilidade}</td><td className="px-3 py-3">{row.questoes.join(", ")}</td>
          <td className="px-3 py-3">{row.quantidadeItens2016_2025 ?? "—"}</td><td className="px-3 py-3">{row.mediaArea ?? "—"}</td><td className="px-3 py-3">{row.recorrencia}</td>
        </tr>)}</tbody></table>
      </div>
    </section>

    <section className="space-y-5"><h2 className="text-xl font-bold">2. Orientação por habilidade</h2>
      {data.habilidades.map((skill) => {
        const p = skill.pedagogia;
        const hasHow = Boolean(p?.antesDaQuestao || p?.duranteAQuestao || p?.depoisDaQuestao);
        const hasIntervention = Boolean(p?.retomada || p?.mediacao || p?.consolidacao || p?.orientacoesIntervencao);
        return <article key={`${skill.area}-${skill.competencia}-${skill.habilidade}`} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div>
            <p className="text-sm font-bold text-teal-700">{skill.area} · {skill.componente}</p>
            <h3 className="mt-1 text-2xl font-bold">{skill.competencia} · {skill.habilidade}</h3>
          </div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">Questões {skill.questoes.join(", ")}</span></div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <TextBlock title="Competência" text={skill.descricaoCompetencia} />
            <TextBlock title="Habilidade" text={skill.descricaoHabilidade} />
            <div><h4 className="text-xs font-bold uppercase tracking-[0.12em] text-teal-700">Recorrência no ENEM</h4>
              <p className="mt-1 text-sm leading-6 text-slate-700">{data.historicoEnemDisponivel ? `${skill.recorrencia.quantidadeItens2016_2025} itens · média da área ${skill.recorrencia.mediaArea} · posição ${skill.recorrencia.posicaoNaArea} de ${skill.recorrencia.totalHabilidadesArea} · ${skill.recorrencia.recorrencia}` : "Base analítica ENEM 2016–2025 ainda não conectada."}</p></div>
            <TextBlock title="Verbo / operação cognitiva" text={p?.operacaoCognitiva} />
            <TextBlock title="Interpretação pedagógica" text={p?.interpretacaoPedagogica} />
            <TextBlock title="Expectativa de aprendizagem" text={p?.expectativaAprendizagem} />
            <TextBlock title="Evidências de domínio" text={p?.evidenciasDominio} />
            <TextBlock title="Dificuldades frequentes" text={p?.dificuldadesFrequentes} />
            <TextBlock title="Perguntas de mediação" text={p?.perguntasDiagnosticas} />
          </div>
          {hasHow ? <div className="mt-6 rounded-2xl bg-slate-50 p-5"><h4 className="font-bold">Como trabalhar</h4><div className="mt-3 grid gap-4 md:grid-cols-3">
            <TextBlock title="Antes da questão" text={p?.antesDaQuestao} /><TextBlock title="Durante" text={p?.duranteAQuestao} /><TextBlock title="Depois" text={p?.depoisDaQuestao} />
          </div></div> : null}
          {hasIntervention ? <div className="mt-4 rounded-2xl bg-teal-50/60 p-5"><h4 className="font-bold">Intervenção</h4><div className="mt-3 grid gap-4 md:grid-cols-3">
            <TextBlock title="Retomada" text={p?.retomada} /><TextBlock title="Mediação" text={p?.mediacao} /><TextBlock title="Consolidação" text={p?.consolidacao} />
          </div><TextBlock title="Orientações aprovadas" text={p?.orientacoesIntervencao} /></div> : null}
          {!p ? <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Conteúdo pedagógico aprovado ainda não cadastrado para esta habilidade.</p> : null}
          <div className="mt-6"><h4 className="font-bold">Questões da atividade</h4><div className="mt-3 grid gap-3 lg:grid-cols-2">{skill.itens.map((item) => <div key={item.ordem} className="rounded-2xl border border-slate-200 p-4">
            <p className="font-bold">Questão {item.ordem}</p><dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-slate-700">
              <dt className="font-semibold">Objeto</dt><dd>{item.objetoPrincipal || "—"}</dd><dt className="font-semibold">Ação</dt><dd>{item.acaoCognitiva || "—"}</dd>
              <dt className="font-semibold">Dificuldade</dt><dd>{item.dificuldade || "—"}</dd><dt className="font-semibold">Função</dt><dd>{item.funcaoPedagogica || "—"}</dd>
              <dt className="font-semibold">Tempo</dt><dd>{item.tempoEstimadoMin || "—"} min</dd><dt className="font-semibold">Gabarito</dt><dd>{item.gabaritoOficial || "—"}</dd>
              <dt className="font-semibold">Ano / edição</dt><dd>{[item.ano,item.edicao].filter(Boolean).join(" / ") || "—"}</dd>
            </dl></div>)}</div></div>
        </article>;
      })}
    </section>

    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">3. Síntese para o professor</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><Metric label="Habilidades mais presentes" value={data.sintese.habilidadesMaisPresentes.join(", ") || "—"} />
        <Metric label="Maior recorrência histórica" value={data.sintese.habilidadesMaiorRecorrencia.join(", ") || "—"} />
        <Metric label="Operações cognitivas" value={data.sintese.operacoesCognitivas.join(", ") || "—"} />
        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Distribuições</p><div className="mt-2"><Counts values={data.sintese.dificuldades} /></div><div className="mt-2"><Counts values={data.sintese.funcoesPedagogicas} /></div></div>
      </div></section>
  </div>;
}

function Metric({label,value}:{label:string;value:string}) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value}</p></div>;
}
