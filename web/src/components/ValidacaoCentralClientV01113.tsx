"use client";

import { useEffect, useRef, useState } from "react";
import {
  getValidationQuestion,
  submitCentralValidation,
  type ValidationQuestion,
} from "@/lib/validation/validation-api";

import {
  getQuestionPdfSource,
  type QuestionPdfSource,
} from "@/lib/sources/question-sources-api";

const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-400";


function pdfWindowName(
  source: QuestionPdfSource
): string {
  const key =
    source.urlPdf ||
    source.nomePublico ||
    source.colecaoOrigem ||
    "pdf-original";

  let hash = 0;

  for (
    let i = 0;
    i < key.length;
    i += 1
  ) {
    hash =
      (hash * 31 +
        key.charCodeAt(i)) |
      0;
  }

  return `nave_pdf_${Math.abs(
    hash
  ).toString(36)}`;
}

function openOriginalPdf(
  source: QuestionPdfSource
) {
  const url =
    source.urlPagina ||
    source.urlPdf;

  if (!url) {
    return;
  }

  const target =
    pdfWindowName(source);

  const pdfWindow =
    window.open(
      url,
      target
    );

  pdfWindow?.focus();
}

type ValidacaoCentralClientProps = {
  initialQuestionId?: string;
  contextual?: boolean;
};

export default function ValidacaoCentralClient({
  initialQuestionId = "",
  contextual = false,
}: ValidacaoCentralClientProps) {
  const messageRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [id, setId] = useState(initialQuestionId);
  const [question, setQuestion] = useState<ValidationQuestion | null>(null);
  const [pdfSource, setPdfSource] = useState<QuestionPdfSource | null>(null);
  const [sourceMessage, setSourceMessage] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    avaliacaoObjeto:"Correto",
    objetoSugerido:"",
    avaliacaoAcao:"Correta",
    acaoSugerida:"",
    avaliacaoDificuldade:"Adequada",
    dificuldadeSugerida:"",
    avaliacaoFuncao:"Adequada",
    funcaoSugerida:"",
    avaliacaoTrecho:"Adequado",
    parecerGeral:"Aprovada para uso",
    observacao:"",
  });

  async function load() {
    try {
      setLoading(true); setMessage("");
      const q = await getValidationQuestion(id.trim());
      setQuestion(q);
    } catch (e) {
      setQuestion(null);
      setMessage(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (!initialQuestionId) return;

    void (async () => {
      try {
        setLoading(true);
        setMessage("");

        const q =
          await getValidationQuestion(
            initialQuestionId
          );

        setQuestion(q);
      } catch (e) {
        setQuestion(null);
        setMessage(
          e instanceof Error
            ? e.message
            : "Falha ao carregar."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [initialQuestionId]);

  useEffect(() => {
    if (!question?.id) {
      setPdfSource(null);
      setSourceMessage("");
      return;
    }

    void (async () => {
      try {
        setSourceMessage("");

        const source =
          await getQuestionPdfSource(
            question.id
          );

        setPdfSource(source);

        if (
          source &&
          !source.disponivel
        ) {
          setSourceMessage(
            source.motivo ||
              "Fonte original indisponível."
          );
        }
      } catch (e) {
        setPdfSource(null);
        setSourceMessage(
          e instanceof Error
            ? e.message
            : "Falha ao consultar a fonte original."
        );
      }
    })();
  }, [question?.id]);

  async function save() {
    if (!question) return;
    try {
      setSaving(true); setMessage("");
      const result = await submitCentralValidation({idQuestao:question.id, ...form});
      setMessage(result?.mensagem || "Validação registrada.");
      if (result?.questao) setQuestion(result.questao);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha ao registrar.");
    } finally { setSaving(false); }
  }

  useEffect(() => {
    if (!message) return;

    window.setTimeout(() => {
      messageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
  }, [message]);

  useEffect(() => {
    if (!question) return;

    window.setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }, [question?.id]);

  return (
    <section className="mt-6 space-y-5">
      {!contextual ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-700">Validação central</p>
          <h2 className="mt-1 text-xl font-bold">Carregar questão</h2>
          <div className="mt-4 flex gap-2">
            <input value={id} onChange={e=>setId(e.target.value)}
              placeholder="Ex.: ESP_H24_Q432"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm"/>
            <button type="button" disabled={loading} onClick={()=>void load()}
              className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
              {loading ? "Carregando..." : "Carregar"}
            </button>
          </div>
        </div>
      ) : loading && !question ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Carregando questão para validação...
        </div>
      ) : null}

      {message ? <div ref={messageRef} className="scroll-mt-24 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900">{message}</div> : null}

      {question ? <>
        <div ref={formRef} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{question.id}</span>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">{question.statusValidacao}</span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-800">{question.maturidadeCuradoria}</span>
          </div>
          <h3 className="mt-4 text-xl font-bold">{question.objeto}</h3>
          <p className="mt-2 text-sm text-slate-500">{question.competencia} · {question.habilidade} · {question.dificuldade} · {question.ano} {question.edicao}</p>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
                Fonte original
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {pdfSource?.nomePublico ||
                  pdfSource?.colecaoOrigem ||
                  "Fonte ainda não localizada"}
                {pdfSource?.paginaPdf
                  ? ` · página ${pdfSource.paginaPdf}`
                  : ""}
              </p>
              {sourceMessage ? (
                <p className="mt-1 text-xs text-amber-700">
                  {sourceMessage}
                </p>
              ) : null}
            </div>

            {pdfSource?.disponivel &&
            pdfSource.urlPagina ? (
              <a
                href={pdfSource.urlPagina}
                onClick={(event) => {
                  event.preventDefault();
                  openOriginalPdf(
                    pdfSource
                  );
                }}
                className="inline-flex shrink-0 justify-center rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
              >
                Ver questão original
              </a>
            ) : null}
          </div>

          <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{question.trecho || "Trecho não disponível."}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold">Parecer docente</h3>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="text-sm font-semibold">Objeto
              <select className={field} value={form.avaliacaoObjeto} onChange={e=>setForm({...form,avaliacaoObjeto:e.target.value})}>
                <option>Correto</option><option>Incorreto</option>
              </select>
            </label>
            <label className="text-sm font-semibold">Objeto sugerido
              <input className={field} value={form.objetoSugerido} onChange={e=>setForm({...form,objetoSugerido:e.target.value})}/>
            </label>

            <label className="text-sm font-semibold">Ação cognitiva
              <select className={field} value={form.avaliacaoAcao} onChange={e=>setForm({...form,avaliacaoAcao:e.target.value})}>
                <option>Correta</option><option>Incorreta</option>
              </select>
            </label>
            <label className="text-sm font-semibold">Ação sugerida
              <input className={field} value={form.acaoSugerida} onChange={e=>setForm({...form,acaoSugerida:e.target.value})}/>
            </label>

            <label className="text-sm font-semibold">Dificuldade
              <select className={field} value={form.avaliacaoDificuldade} onChange={e=>setForm({...form,avaliacaoDificuldade:e.target.value})}>
                <option>Adequada</option><option>Superestimada</option><option>Subestimada</option>
              </select>
            </label>
            <label className="text-sm font-semibold">Dificuldade sugerida
              <select className={field} value={form.dificuldadeSugerida} onChange={e=>setForm({...form,dificuldadeSugerida:e.target.value})}>
                <option value="">—</option><option>Muito fácil</option><option>Fácil</option><option>Média</option><option>Difícil</option><option>Muito difícil</option>
              </select>
            </label>

            <label className="text-sm font-semibold">Função pedagógica
              <select className={field} value={form.avaliacaoFuncao} onChange={e=>setForm({...form,avaliacaoFuncao:e.target.value})}>
                <option>Adequada</option><option>Inadequada</option>
              </select>
            </label>
            <label className="text-sm font-semibold">Função sugerida
              <input className={field} value={form.funcaoSugerida} onChange={e=>setForm({...form,funcaoSugerida:e.target.value})}/>
            </label>

            <label className="text-sm font-semibold">Trecho
              <select className={field} value={form.avaliacaoTrecho} onChange={e=>setForm({...form,avaliacaoTrecho:e.target.value})}>
                <option>Adequado</option><option>Inadequado</option>
              </select>
            </label>
            <label className="text-sm font-semibold">Parecer geral
              <select className={field} value={form.parecerGeral} onChange={e=>setForm({...form,parecerGeral:e.target.value})}>
                <option>Aprovada para uso</option><option>Solicitar ajuste</option><option>Inadequada para uso</option>
              </select>
            </label>
          </div>

          <label className="mt-5 block text-sm font-semibold">Observação docente
            <textarea rows={4} className={field} value={form.observacao} onChange={e=>setForm({...form,observacao:e.target.value})}/>
          </label>

          <div className="mt-6 flex justify-end">
            <button type="button" disabled={saving} onClick={()=>void save()}
              className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? "Registrando..." : "Registrar validação"}
            </button>
          </div>
        </div>
      </> : null}
    </section>
  );
}
