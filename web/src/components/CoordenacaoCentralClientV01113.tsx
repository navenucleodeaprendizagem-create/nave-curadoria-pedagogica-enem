"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  decideCentralCoordinationCase,
  getCentralCoordinationCase,
  listCentralCoordinationCases,
  type CoordinationCase,
  type CoordinationCaseSummary,
} from "@/lib/validation/validation-api";

const DECISIONS = [
  "Manter classificação atual",
  "Aceitar sugestão docente",
  "Solicitar nova avaliação",
  "Suspender questão",
  "Homologar questão",
];

export default function CoordenacaoCentralClient() {
  const analysisRef = useRef<HTMLDivElement | null>(null);
  const messageRef = useRef<HTMLDivElement | null>(null);
  const [cases,setCases]=useState<CoordinationCaseSummary[]>([]);
  const [selected,setSelected]=useState<CoordinationCase|null>(null);
  const [loading,setLoading]=useState(true);
  const [loadingCase,setLoadingCase]=useState(false);
  const [decision,setDecision]=useState("Manter classificação atual");
  const [justification,setJustification]=useState("");
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);

  const loadCases=useCallback(async()=>{
    try{
      setLoading(true); setMessage("");
      setCases(await listCentralCoordinationCases());
    }catch(e){setMessage(e instanceof Error?e.message:"Falha ao carregar a fila.");}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{void loadCases();},[loadCases]);

  async function openCase(id:string){
    try{
      setLoadingCase(true); setMessage("");
      const c=await getCentralCoordinationCase(id);
      setSelected(c);
      setDecision(c.decisaoAtual||"Manter classificação atual");
      setJustification("");
    }catch(e){setMessage(e instanceof Error?e.message:"Falha ao carregar o caso.");}
    finally{setLoadingCase(false);}
  }

  async function apply(){
    if(!selected)return;
    try{
      setSaving(true); setMessage("");
      const r=await decideCentralCoordinationCase({
        idValidacao:selected.idValidacao,
        decisao:decision,
        justificativa:justification
      });
      setMessage(r?.mensagem||"Decisão registrada.");
      setSelected(null); setJustification("");
      await loadCases();
    }catch(e){setMessage(e instanceof Error?e.message:"Falha ao registrar decisão.");}
    finally{setSaving(false);}
  }

  const pending=cases.filter(c=>!c.resolvido);
  const resolved=cases.filter(c=>c.resolvido);

  useEffect(() => {
    if (!selected) return;

    window.setTimeout(() => {
      analysisRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }, [selected?.idValidacao]);

  useEffect(() => {
    if (!message) return;

    window.setTimeout(() => {
      messageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
  }, [message]);

  return <section className="mt-6 space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ["Total",cases.length,"text-slate-500"],
        ["Pendentes",pending.length,"text-amber-700"],
        ["Resolvidos",resolved.length,"text-emerald-700"],
      ].map(([l,v,c])=><div key={String(l)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className={`text-xs font-bold uppercase tracking-[0.12em] ${c}`}>{l}</p>
        <p className="mt-2 text-2xl font-bold">{v}</p>
      </div>)}
    </div>

    {message?<div ref={messageRef} className="scroll-mt-24 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900">{message}</div>:null}

    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-700">Fila central</p>
          <h2 className="mt-1 text-xl font-bold">Divergências para coordenação</h2>
        </div>
        <button type="button" onClick={()=>void loadCases()} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Atualizar</button>
      </div>

      {loading?<p className="mt-5 text-sm text-slate-500">Carregando...</p>:null}
      {!loading&&cases.length===0?<p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">Nenhum caso registrado.</p>:null}

      <div className="mt-5 space-y-3">
        {cases.map(item=><article key={item.idValidacao} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">{item.prioridade}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold">{item.statusFila}</span>
              </div>
              <p className="mt-3 font-mono text-xs font-semibold text-slate-600">{item.idQuestao}</p>
              <h3 className="mt-1 font-bold">{item.objetoAtual}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.tiposDivergencia}</p>
              <p className="mt-2 text-xs text-slate-400">Professor: {item.professor}</p>
            </div>
            <button type="button" disabled={loadingCase} onClick={()=>void openCase(item.idValidacao)}
              className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 disabled:opacity-50">
              {item.resolvido?"Ver caso":"Analisar"}
            </button>
          </div>
        </article>)}
      </div>
    </div>

    {selected?<div ref={analysisRef} className="scroll-mt-24 rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-700">Análise da coordenação</p>
        <h2 className="mt-1 text-xl font-bold">{selected.idQuestao}</h2></div>
        <button type="button" onClick={()=>setSelected(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold">Fechar</button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {[
          ["Objeto atual",selected.objetoAtual],["Objeto sugerido",selected.objetoSugerido],
          ["Ação atual",selected.acaoAtual],["Ação sugerida",selected.acaoSugerida],
          ["Dificuldade atual",selected.dificuldadeAtual],["Dificuldade sugerida",selected.dificuldadeSugerida],
          ["Função atual",selected.funcaoAtual],["Função sugerida",selected.funcaoSugerida],
        ].map(([l,v])=><div key={l} className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{l}</p>
          <p className="mt-2 text-sm font-semibold">{v||"—"}</p>
        </div>)}
      </div>

      <div className="mt-4 rounded-2xl bg-amber-50 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-amber-800">Divergências</p>
        <p className="mt-2 text-sm">{selected.tiposDivergencia}</p>
        <p className="mt-3 text-sm">{selected.observacaoDocente||"Sem observação adicional."}</p>
      </div>

      {!selected.resolvido?<>
        <label className="mt-5 block text-sm font-semibold">Decisão
          <select value={decision} onChange={e=>setDecision(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5">
            {DECISIONS.map(d=><option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="mt-4 block text-sm font-semibold">Justificativa
          <textarea rows={4} value={justification} onChange={e=>setJustification(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"/>
        </label>
        <div className="mt-5 flex justify-end">
          <button type="button" disabled={saving} onClick={()=>void apply()}
            className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
            {saving?"Aplicando...":"Aplicar decisão"}
          </button>
        </div>
      </>:<div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
        Caso já resolvido: {selected.decisaoAtual||"decisão registrada"}.
      </div>}
    </div>:null}
  </section>;
}
