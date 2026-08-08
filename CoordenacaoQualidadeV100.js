/**
 * NAVE — COORDENAÇÃO E QUALIDADE
 * Consolidação estrutural V1.0
 *
 * Reúne, sem alterar a lógica validada:
 * - DecisaoCoordenacaoV053.gs
 * - PainelQualidadeV054.gs
 * - PainelCoordenacaoV056.gs
 *
 * Os nomes públicos das funções foram preservados.
 */


/* ==========================================================
   DECISÕES DA COORDENAÇÃO V0.5.3
   ========================================================== */

/**
 * NAVE — DECISÃO DA COORDENAÇÃO — V0.5.3
 *
 * Adicione este arquivo ao projeto com o nome:
 * DecisaoCoordenacaoV053.gs
 *
 * Adicione também:
 * DecidirValidacaoV05.html
 *
 * Depois, no menu da versão 0.5, acrescente:
 * .addItem('Decidir caso selecionado', 'abrirDecisaoCoordenacaoV05')
 *
 * Este módulo:
 * - abre a validação vinculada à linha selecionada;
 * - permite decisão governada da coordenação;
 * - aplica sugestões docentes quando aprovadas;
 * - atualiza QUESTOES_GERAL;
 * - atualiza VALIDACOES_DOCENTES;
 * - atualiza FILA_COORDENACAO_V05;
 * - registra alterações em HISTORICO_ALTERACOES;
 * - controla versão do registro;
 * - preserva a fila original de reportes.
 */

const DECISAO_V053 = Object.freeze({
  ABA_BASE: 'QUESTOES_GERAL',
  ABA_VALIDACOES: 'VALIDACOES_DOCENTES',
  ABA_FILA: 'FILA_COORDENACAO_V05',
  ABA_HISTORICO: 'HISTORICO_ALTERACOES',

  DECISOES: [
    'Manter classificação atual',
    'Aceitar sugestão docente',
    'Solicitar nova avaliação',
    'Suspender questão',
    'Homologar questão'
  ]
});


/* =========================================================
   INSTALAÇÃO COMPLEMENTAR
   ========================================================= */

/**
 * Execute uma vez após adicionar este arquivo.
 */
function instalarDecisaoCoordenacaoV053() {
  const ss = SpreadsheetApp.getActive();

  garantirCamposDecisaoValidacoesV053_(ss);
  garantirCamposDecisaoFilaV053_(ss);

  SpreadsheetApp.getUi().alert(
    'Decisão da coordenação instalada',
    [
      'Foram preparados os campos de decisão em:',
      '• VALIDACOES_DOCENTES;',
      '• FILA_COORDENACAO_V05.',
      '',
      'Agora selecione uma linha da fila e use:',
      'NAVE — Versão 0.5 → Decidir caso selecionado.'
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


function garantirCamposDecisaoValidacoesV053_(ss) {
  const aba = ss.getSheetByName(DECISAO_V053.ABA_VALIDACOES);
  if (!aba) throw new Error('A aba VALIDACOES_DOCENTES não foi encontrada.');

  garantirCabecalhosDecisaoV053_(aba, [
    'decisao_coordenacao',
    'justificativa_coordenacao',
    'data_decisao_coordenacao',
    'coordenador_responsavel'
  ]);
}


function garantirCamposDecisaoFilaV053_(ss) {
  const aba = ss.getSheetByName(DECISAO_V053.ABA_FILA);
  if (!aba) throw new Error('A aba FILA_COORDENACAO_V05 não foi encontrada.');

  garantirCabecalhosDecisaoV053_(aba, [
    'responsavel_coordenacao',
    'decisao_coordenacao',
    'justificativa_coordenacao',
    'data_decisao',
    'resolvido'
  ]);

  const idx = indexarCabecalhosDecisaoV053_(
    aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0]
  );

  const n = Math.max(aba.getMaxRows() - 1, 1);

  aba.getRange(2, idx.decisao_coordenacao + 1, n, 1)
    .setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(DECISAO_V053.DECISOES, true)
        .setAllowInvalid(false)
        .build()
    );

  aba.getRange(2, idx.resolvido + 1, n, 1).insertCheckboxes();
}


function garantirCabecalhosDecisaoV053_(aba, novos) {
  const atuais = aba.getRange(
    1, 1, 1, Math.max(aba.getLastColumn(), 1)
  ).getValues()[0].map(v => String(v || '').trim());

  const ausentes = novos.filter(h => !atuais.includes(h));

  if (!ausentes.length) return;

  const inicio = aba.getLastColumn() + 1;
  aba.getRange(1, inicio, 1, ausentes.length).setValues([ausentes]);

  aba.getRange(1, inicio, 1, ausentes.length)
    .setBackground('#0F766E')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
}


/* =========================================================
   ABERTURA DO FORMULÁRIO
   ========================================================= */

function abrirDecisaoCoordenacaoV05() {
  const ss = SpreadsheetApp.getActive();
  const fila = ss.getSheetByName(DECISAO_V053.ABA_FILA);

  if (!fila) {
    throw new Error('A aba FILA_COORDENACAO_V05 não foi encontrada.');
  }

  if (ss.getActiveSheet().getName() !== DECISAO_V053.ABA_FILA) {
    SpreadsheetApp.getUi().alert(
      'Abra FILA_COORDENACAO_V05 e selecione uma linha.'
    );
    return;
  }

  const linha = fila.getActiveRange().getRow();

  if (linha < 2) {
    SpreadsheetApp.getUi().alert('Selecione uma linha da fila.');
    return;
  }

  const idx = indexarCabecalhosDecisaoV053_(
    fila.getRange(1, 1, 1, fila.getLastColumn()).getValues()[0]
  );

  const idValidacao = String(
    fila.getRange(linha, idx.id_validacao + 1).getDisplayValue() || ''
  ).trim();

  if (!idValidacao) {
    SpreadsheetApp.getUi().alert(
      'A linha selecionada não possui id_validacao.'
    );
    return;
  }

  const template = HtmlService.createTemplateFromFile('DecidirValidacaoV100');
  template.idValidacao = idValidacao;

  SpreadsheetApp.getUi().showSidebar(
    template.evaluate()
      .setTitle('Decisão da coordenação — V0.5')
      .setWidth(520)
  );
}


/* =========================================================
   DADOS PARA O FORMULÁRIO
   ========================================================= */

function obterDadosDecisaoCoordenacaoV05(idValidacao) {
  const ss = SpreadsheetApp.getActive();
  const validacoes = ss.getSheetByName(DECISAO_V053.ABA_VALIDACOES);
  const fila = ss.getSheetByName(DECISAO_V053.ABA_FILA);
  const base = ss.getSheetByName(DECISAO_V053.ABA_BASE);

  const dv = validacoes.getDataRange().getValues();
  const iv = indexarCabecalhosDecisaoV053_(dv[0]);

  const linhaVal = dv.findIndex((r, i) =>
    i > 0 &&
    String(r[iv.id_validacao] || '').trim() ===
      String(idValidacao || '').trim()
  );

  if (linhaVal < 0) {
    throw new Error('Validação não localizada: ' + idValidacao);
  }

  const v = dv[linhaVal];
  const idQuestao = String(v[iv.id_ocorrencia] || '').trim();

  const db = base.getDataRange().getValues();
  const ib = indexarCabecalhosDecisaoV053_(db[0]);

  const linhaBase = db.findIndex((r, i) =>
    i > 0 &&
    String(r[ib.id_ocorrencia] || '').trim() === idQuestao
  );

  if (linhaBase < 0) {
    throw new Error('Questão não localizada: ' + idQuestao);
  }

  const b = db[linhaBase];

  const df = fila.getDataRange().getValues();
  const iFila = indexarCabecalhosDecisaoV053_(df[0]);

  const linhaFila = df.findIndex((r, i) =>
    i > 0 &&
    String(r[iFila.id_validacao] || '').trim() ===
      String(idValidacao || '').trim()
  );

  const f = linhaFila >= 0 ? df[linhaFila] : [];

  return {
    idValidacao,
    idQuestao,
    professor: v[iv.professor] || '',
    dataValidacao: formatarDataDecisaoV053_(v[iv.data_validacao]),
    habilidade: v[iv.habilidade_atual] || '',
    objetoAtual: b[ib.objeto_principal] || '',
    objetoSugerido: v[iv.objeto_sugerido] || '',
    avaliacaoObjeto: v[iv.avaliacao_objeto] || '',
    acaoAtual:
      ib.acao_cognitiva_especifica !== undefined
        ? b[ib.acao_cognitiva_especifica] || ''
        : '',
    acaoSugerida: v[iv.acao_cognitiva_sugerida] || '',
    avaliacaoAcao: v[iv.avaliacao_acao_cognitiva] || '',
    dificuldadeAtual: b[ib.dificuldade_rotulo] || '',
    dificuldadeSugerida: v[iv.dificuldade_sugerida] || '',
    avaliacaoDificuldade: v[iv.avaliacao_dificuldade] || '',
    funcaoAtual: b[ib.funcao_pedagogica_sugerida] || '',
    funcaoSugerida:
      v[iv.funcao_pedagogica_sugerida_docente] || '',
    avaliacaoFuncao: v[iv.avaliacao_funcao_pedagogica] || '',
    avaliacaoTrecho: v[iv.avaliacao_trecho] || '',
    parecerGeral: v[iv.parecer_geral] || '',
    observacaoDocente: v[iv.observacao_docente] || '',
    tiposDivergencia: v[iv.tipos_divergencia] || '',
    statusFila:
      linhaFila >= 0 && iFila.status_fila !== undefined
        ? f[iFila.status_fila] || ''
        : '',
    decisaoAtual:
      linhaFila >= 0 && iFila.decisao_coordenacao !== undefined
        ? f[iFila.decisao_coordenacao] || ''
        : ''
  };
}


/* =========================================================
   APLICAÇÃO DA DECISÃO
   ========================================================= */

function salvarDecisaoCoordenacaoV05(form) {
  if (!form || !form.idValidacao) {
    throw new Error('Validação não informada.');
  }

  const decisao = String(form.decisao || '').trim();
  const justificativa = String(form.justificativa || '').trim();

  if (!DECISAO_V053.DECISOES.includes(decisao)) {
    throw new Error('Selecione uma decisão válida.');
  }

  if (justificativa.length < 10) {
    throw new Error(
      'A justificativa precisa ter pelo menos 10 caracteres.'
    );
  }

  const ss = SpreadsheetApp.getActive();
  const base = ss.getSheetByName(DECISAO_V053.ABA_BASE);
  const validacoes = ss.getSheetByName(DECISAO_V053.ABA_VALIDACOES);
  const fila = ss.getSheetByName(DECISAO_V053.ABA_FILA);
  const historico = ss.getSheetByName(DECISAO_V053.ABA_HISTORICO);

  const dv = validacoes.getDataRange().getValues();
  const iv = indexarCabecalhosDecisaoV053_(dv[0]);

  const linhaVal = dv.findIndex((r, i) =>
    i > 0 &&
    String(r[iv.id_validacao] || '').trim() ===
      String(form.idValidacao).trim()
  );

  if (linhaVal < 0) throw new Error('Validação não localizada.');

  const v = dv[linhaVal];
  const idQuestao = String(v[iv.id_ocorrencia] || '').trim();

  const db = base.getDataRange().getValues();
  const ib = indexarCabecalhosDecisaoV053_(db[0]);

  const linhaBase = db.findIndex((r, i) =>
    i > 0 &&
    String(r[ib.id_ocorrencia] || '').trim() === idQuestao
  );

  if (linhaBase < 0) throw new Error('Questão não localizada.');

  const df = fila.getDataRange().getValues();
  const iFila = indexarCabecalhosDecisaoV053_(df[0]);

  const linhaFila = df.findIndex((r, i) =>
    i > 0 &&
    String(r[iFila.id_validacao] || '').trim() ===
      String(form.idValidacao).trim()
  );

  if (linhaFila < 0) throw new Error('Registro não localizado na fila.');

  const jaResolvido = iFila.resolvido !== undefined &&
    df[linhaFila][iFila.resolvido] === true;

  if (jaResolvido) {
    throw new Error('Este caso já foi marcado como resolvido.');
  }

  const coordenador =
    Session.getActiveUser().getEmail() ||
    'Coordenador não identificado';

  const agora = new Date();
  const versaoAnterior = Number(db[linhaBase][ib.versao_registro]) || 1;
  let versaoNova = versaoAnterior;
  const alteracoes = [];

  if (decisao === 'Aceitar sugestão docente') {
    aplicarSugestoesDocentesV053_(
      base,
      linhaBase + 1,
      db[linhaBase],
      ib,
      v,
      iv,
      alteracoes
    );
  }

  if (decisao === 'Suspender questão') {
    adicionarAlteracaoDecisaoV053_(
      base, linhaBase + 1, db[linhaBase], ib,
      'status_curadoria', 'Suspensa para revisão', alteracoes
    );

    adicionarAlteracaoDecisaoV053_(
      base, linhaBase + 1, db[linhaBase], ib,
      'maturidade_curadoria', 'Suspensa', alteracoes
    );

    adicionarAlteracaoDecisaoV053_(
      base, linhaBase + 1, db[linhaBase], ib,
      'status_validacao', 'Suspensa pela coordenação', alteracoes
    );
  }

  if (decisao === 'Homologar questão') {
    adicionarAlteracaoDecisaoV053_(
      base, linhaBase + 1, db[linhaBase], ib,
      'status_curadoria', 'Homologada', alteracoes
    );

    adicionarAlteracaoDecisaoV053_(
      base, linhaBase + 1, db[linhaBase], ib,
      'maturidade_curadoria', 'Homologada', alteracoes
    );

    adicionarAlteracaoDecisaoV053_(
      base, linhaBase + 1, db[linhaBase], ib,
      'status_validacao', 'Homologada', alteracoes
    );

    if (ib.homologada_em !== undefined) {
      base.getRange(linhaBase + 1, ib.homologada_em + 1).setValue(agora);
    }

    if (ib.homologada_por !== undefined) {
      base.getRange(linhaBase + 1, ib.homologada_por + 1)
        .setValue(coordenador);
    }
  }

  if (decisao === 'Manter classificação atual') {
    adicionarAlteracaoDecisaoV053_(
      base, linhaBase + 1, db[linhaBase], ib,
      'status_validacao', 'Resolvida pela coordenação', alteracoes
    );

    adicionarAlteracaoDecisaoV053_(
      base, linhaBase + 1, db[linhaBase], ib,
      'maturidade_curadoria', 'Ajustada pela coordenação', alteracoes
    );
  }

  if (decisao === 'Aceitar sugestão docente') {
    adicionarAlteracaoDecisaoV053_(
      base, linhaBase + 1, db[linhaBase], ib,
      'status_validacao', 'Resolvida pela coordenação', alteracoes
    );

    adicionarAlteracaoDecisaoV053_(
      base, linhaBase + 1, db[linhaBase], ib,
      'maturidade_curadoria', 'Ajustada pela coordenação', alteracoes
    );
  }

  if (decisao === 'Solicitar nova avaliação') {
    adicionarAlteracaoDecisaoV053_(
      base, linhaBase + 1, db[linhaBase], ib,
      'status_validacao', 'Aguardando nova avaliação', alteracoes
    );

    adicionarAlteracaoDecisaoV053_(
      base, linhaBase + 1, db[linhaBase], ib,
      'maturidade_curadoria', 'Em validação', alteracoes
    );
  }

  if (alteracoes.length > 0) {
    versaoNova = versaoAnterior + 1;

    if (ib.versao_registro !== undefined) {
      base.getRange(linhaBase + 1, ib.versao_registro + 1)
        .setValue(versaoNova);
    }

    if (ib.ultima_revisao_em !== undefined) {
      base.getRange(linhaBase + 1, ib.ultima_revisao_em + 1)
        .setValue(agora);
    }

    if (ib.ultima_revisao_por !== undefined) {
      base.getRange(linhaBase + 1, ib.ultima_revisao_por + 1)
        .setValue(coordenador);
    }
  }

  const resolveFila = decisao !== 'Solicitar nova avaliação';

  atualizarFilaAposDecisaoV053_(
    fila,
    linhaFila + 1,
    iFila,
    coordenador,
    decisao,
    justificativa,
    agora,
    resolveFila
  );

  atualizarValidacaoAposDecisaoV053_(
    validacoes,
    linhaVal + 1,
    iv,
    coordenador,
    decisao,
    justificativa,
    agora,
    resolveFila
  );

  if (historico && alteracoes.length) {
    registrarHistoricoDecisaoV053_(
      historico,
      idQuestao,
      coordenador,
      justificativa,
      decisao,
      versaoAnterior,
      versaoNova,
      alteracoes
    );
  }

  if (typeof recalcularValidacoesV05 === 'function') {
    recalcularValidacoesV05();
  }
  sincronizarIndicadoresValidacaoV05();
  SpreadsheetApp.flush();

  return {
    mensagem: resolveFila
      ? 'Decisão aplicada e caso resolvido.'
      : 'Caso devolvido para nova avaliação.',
    decisao,
    idQuestao,
    camposAlterados: alteracoes.map(a => a.campo)
  };
}


/* =========================================================
   REGRAS DE APLICAÇÃO
   ========================================================= */

function aplicarSugestoesDocentesV053_(
  base,
  linhaPlanilha,
  linhaBase,
  ib,
  validacao,
  iv,
  alteracoes
) {
  const objeto = String(validacao[iv.objeto_sugerido] || '').trim();
  const acao = String(validacao[iv.acao_cognitiva_sugerida] || '').trim();
  const dificuldade = String(
    validacao[iv.dificuldade_sugerida] || ''
  ).trim();
  const funcao = String(
    validacao[iv.funcao_pedagogica_sugerida_docente] || ''
  ).trim();

  if (
    validacao[iv.avaliacao_objeto] === 'Incorreto' &&
    objeto
  ) {
    adicionarAlteracaoDecisaoV053_(
      base, linhaPlanilha, linhaBase, ib,
      'objeto_principal', objeto, alteracoes
    );
  }

  if (
    validacao[iv.avaliacao_acao_cognitiva] === 'Incorreta' &&
    acao
  ) {
    adicionarAlteracaoDecisaoV053_(
      base, linhaPlanilha, linhaBase, ib,
      'acao_cognitiva_especifica', acao, alteracoes
    );
  }

  if (
    ['Superestimada', 'Subestimada'].includes(
      validacao[iv.avaliacao_dificuldade]
    ) &&
    dificuldade
  ) {
    adicionarAlteracaoDecisaoV053_(
      base, linhaPlanilha, linhaBase, ib,
      'dificuldade_rotulo', dificuldade, alteracoes
    );

    const faixa = faixaDificuldadeV053_(dificuldade);

    if (faixa !== null) {
      adicionarAlteracaoDecisaoV053_(
        base, linhaPlanilha, linhaBase, ib,
        'dificuldade_faixa', faixa, alteracoes
      );
    }
  }

  if (
    validacao[iv.avaliacao_funcao_pedagogica] === 'Inadequada' &&
    funcao
  ) {
    adicionarAlteracaoDecisaoV053_(
      base, linhaPlanilha, linhaBase, ib,
      'funcao_pedagogica_sugerida', funcao, alteracoes
    );
  }

  const sugestoesAplicaveis = [objeto, acao, dificuldade, funcao]
    .filter(Boolean);

  if (!sugestoesAplicaveis.length) {
    throw new Error(
      'A validação não possui sugestão preenchida para ser aplicada.'
    );
  }
}


function adicionarAlteracaoDecisaoV053_(
  base,
  linhaPlanilha,
  linhaBase,
  ib,
  campo,
  novoValor,
  alteracoes
) {
  if (ib[campo] === undefined) return;

  const anterior = linhaBase[ib[campo]];

  if (
    normalizarDecisaoV053_(anterior) ===
    normalizarDecisaoV053_(novoValor)
  ) {
    return;
  }

  base.getRange(linhaPlanilha, ib[campo] + 1).setValue(novoValor);

  alteracoes.push({
    campo,
    anterior,
    novo: novoValor
  });
}


function faixaDificuldadeV053_(rotulo) {
  const mapa = {
    'Muito fácil': 1,
    'Fácil': 2,
    'Média': 3,
    'Difícil': 4,
    'Muito difícil': 5
  };

  return Object.prototype.hasOwnProperty.call(mapa, rotulo)
    ? mapa[rotulo]
    : null;
}


/* =========================================================
   ATUALIZAÇÃO DAS ABAS DE GOVERNANÇA
   ========================================================= */

function atualizarFilaAposDecisaoV053_(
  fila,
  linha,
  idx,
  coordenador,
  decisao,
  justificativa,
  data,
  resolvido
) {
  preencherCelulaDecisaoV053_(
    fila, linha, idx, 'responsavel_coordenacao', coordenador
  );
  preencherCelulaDecisaoV053_(
    fila, linha, idx, 'decisao_coordenacao', decisao
  );
  preencherCelulaDecisaoV053_(
    fila, linha, idx, 'justificativa_coordenacao', justificativa
  );
  preencherCelulaDecisaoV053_(
    fila, linha, idx, 'data_decisao', data
  );
  preencherCelulaDecisaoV053_(
    fila, linha, idx, 'resolvido', resolvido
  );

  const status = resolvido
    ? 'Resolvida'
    : 'Devolvida ao docente';

  preencherCelulaDecisaoV053_(
    fila, linha, idx, 'status_fila', status
  );
}


function atualizarValidacaoAposDecisaoV053_(
  validacoes,
  linha,
  idx,
  coordenador,
  decisao,
  justificativa,
  data,
  resolvido
) {
  preencherCelulaDecisaoV053_(
    validacoes, linha, idx, 'decisao_coordenacao', decisao
  );
  preencherCelulaDecisaoV053_(
    validacoes, linha, idx, 'justificativa_coordenacao', justificativa
  );
  preencherCelulaDecisaoV053_(
    validacoes, linha, idx, 'data_decisao_coordenacao', data
  );
  preencherCelulaDecisaoV053_(
    validacoes, linha, idx, 'coordenador_responsavel', coordenador
  );
  preencherCelulaDecisaoV053_(
    validacoes,
    linha,
    idx,
    'status_validacao',
    resolvido ? 'Resolvida pela coordenação' : 'Nova avaliação solicitada'
  );
}


function preencherCelulaDecisaoV053_(aba, linha, idx, campo, valor) {
  if (idx[campo] === undefined) return;
  aba.getRange(linha, idx[campo] + 1).setValue(valor);
}


/* =========================================================
   HISTÓRICO
   ========================================================= */

function registrarHistoricoDecisaoV053_(
  historico,
  idQuestao,
  coordenador,
  justificativa,
  decisao,
  versaoAnterior,
  versaoNova,
  alteracoes
) {
  alteracoes.forEach(a => {
    historico.appendRow([
      gerarIdDecisaoV053_('ALT'),
      new Date(),
      coordenador,
      idQuestao,
      a.campo,
      a.anterior,
      a.novo,
      justificativa,
      `DECISAO_COORDENACAO_V053 — ${decisao}`,
      versaoAnterior,
      versaoNova
    ]);
  });
}


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function indexarCabecalhosDecisaoV053_(headers) {
  const idx = {};

  headers.forEach((valor, i) => {
    const chave = String(valor || '').trim();
    if (chave) idx[chave] = i;
  });

  return idx;
}


function normalizarDecisaoV053_(valor) {
  return String(valor === null || valor === undefined ? '' : valor)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .normalize('NFC')
    .toLocaleLowerCase('pt-BR');
}


function formatarDataDecisaoV053_(valor) {
  if (!valor) return '';

  const data = Object.prototype.toString.call(valor) === '[object Date]'
    ? valor
    : new Date(valor);

  if (isNaN(data.getTime())) return String(valor);

  return Utilities.formatDate(
    data,
    Session.getScriptTimeZone() || 'America/Sao_Paulo',
    'dd/MM/yyyy HH:mm:ss'
  );
}


function gerarIdDecisaoV053_(prefixo) {
  const agora = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'America/Sao_Paulo',
    'yyyyMMddHHmmss'
  );

  return `${prefixo}_${agora}_${Utilities.getUuid()
    .slice(0, 8)
    .toUpperCase()}`;
}


/* ==========================================================
   PAINEL DE QUALIDADE V0.5.4
   ========================================================== */

/**
 * NAVE — PAINEL DE QUALIDADE DA CURADORIA — V0.5.4
 *
 * Adicione este arquivo ao projeto com o nome:
 * PainelQualidadeV054.gs
 *
 * No menu da versão 0.5, acrescente:
 * .addItem('Atualizar painel de qualidade', 'atualizarPainelQualidadeV05')
 * .addItem('Abrir painel de qualidade', 'abrirPainelQualidadeV05')
 *
 * Execute uma vez:
 * instalarPainelQualidadeV054()
 *
 * O painel consolida:
 * - total de questões de Química;
 * - questões avaliadas e não avaliadas;
 * - validações docentes;
 * - concordâncias e divergências;
 * - casos aguardando coordenação;
 * - casos resolvidos;
 * - questões homologadas e suspensas;
 * - desempenho por professor;
 * - validações por habilidade;
 * - distribuição por maturidade da curadoria;
 * - percentual de cobertura e concordância.
 */

const PAINEL_QUALIDADE_V054 = Object.freeze({
  ABA_BASE: 'QUESTOES_GERAL',
  ABA_VALIDACOES: 'VALIDACOES_DOCENTES',
  ABA_FILA: 'FILA_COORDENACAO_V05',
  ABA_PAINEL: 'PAINEL_QUALIDADE',
  COR_PRINCIPAL: '#0F766E',
  COR_SECUNDARIA: '#D1FAE5',
  COR_ALERTA: '#FEF3C7',
  COR_ERRO: '#FECACA',
  COR_INFO: '#E0F2FE',
  COR_NEUTRA: '#F8FAFC'
});


/* =========================================================
   INSTALAÇÃO E ABERTURA
   ========================================================= */

function instalarPainelQualidadeV054() {
  const ss = SpreadsheetApp.getActive();

  if (!ss.getSheetByName(PAINEL_QUALIDADE_V054.ABA_BASE)) {
    throw new Error('A aba QUESTOES_GERAL não foi encontrada.');
  }

  if (!ss.getSheetByName(PAINEL_QUALIDADE_V054.ABA_VALIDACOES)) {
    throw new Error('A aba VALIDACOES_DOCENTES não foi encontrada.');
  }

  criarOuPrepararPainelQualidadeV054_(ss);
  atualizarPainelQualidadeV05();

  SpreadsheetApp.getUi().alert(
    'Painel de qualidade instalado',
    [
      'A aba PAINEL_QUALIDADE foi criada e atualizada.',
      '',
      'Use o menu NAVE — Versão 0.5 para atualizar ou abrir o painel.'
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


function abrirPainelQualidadeV05() {
  const ss = SpreadsheetApp.getActive();
  let aba = ss.getSheetByName(PAINEL_QUALIDADE_V054.ABA_PAINEL);

  if (!aba) {
    instalarPainelQualidadeV054();
    aba = ss.getSheetByName(PAINEL_QUALIDADE_V054.ABA_PAINEL);
  }

  ss.setActiveSheet(aba);
}


function criarOuPrepararPainelQualidadeV054_(ss) {
  let aba = ss.getSheetByName(PAINEL_QUALIDADE_V054.ABA_PAINEL);

  if (!aba) {
    aba = ss.insertSheet(PAINEL_QUALIDADE_V054.ABA_PAINEL);
  }

  aba.clear();
  aba.clearConditionalFormatRules();

  const graficos = aba.getCharts();
  graficos.forEach(g => aba.removeChart(g));

  aba.setFrozenRows(3);
  aba.setHiddenGridlines(true);

  return aba;
}


/* =========================================================
   ATUALIZAÇÃO PRINCIPAL
   ========================================================= */

function atualizarPainelQualidadeV05() {
  const inicio = Date.now();
  const ss = SpreadsheetApp.getActive();

  const base = ss.getSheetByName(PAINEL_QUALIDADE_V054.ABA_BASE);
  const validacoes = ss.getSheetByName(PAINEL_QUALIDADE_V054.ABA_VALIDACOES);
  const fila = ss.getSheetByName(PAINEL_QUALIDADE_V054.ABA_FILA);
  const painel = criarOuPrepararPainelQualidadeV054_(ss);

  if (!base || !validacoes) {
    throw new Error(
      'As abas QUESTOES_GERAL e VALIDACOES_DOCENTES são obrigatórias.'
    );
  }

  const dadosBase = base.getDataRange().getValues();
  const idxBase = indexarCabecalhosPainelV054_(dadosBase[0]);

  validarCabecalhosPainelV054_(
    idxBase,
    [
      'id_ocorrencia',
      'componente_principal',
      'habilidade',
      'status_validacao',
      'quantidade_validacoes',
      'quantidade_concordancias',
      'quantidade_divergencias',
      'maturidade_curadoria'
    ],
    'QUESTOES_GERAL'
  );

  const dadosVal = validacoes.getDataRange().getValues();
  const idxVal = indexarCabecalhosPainelV054_(dadosVal[0]);

  validarCabecalhosPainelV054_(
    idxVal,
    [
      'id_validacao',
      'data_validacao',
      'professor',
      'id_ocorrencia',
      'habilidade_atual',
      'possui_divergencia',
      'status_validacao'
    ],
    'VALIDACOES_DOCENTES'
  );

  const dadosFila = fila && fila.getLastRow() >= 1
    ? fila.getDataRange().getValues()
    : [];

  const idxFila = dadosFila.length
    ? indexarCabecalhosPainelV054_(dadosFila[0])
    : {};

  const linhasQuimica = dadosBase.slice(1).filter(r =>
    textoPainelV054_(r[idxBase.componente_principal]) === 'Química'
  );

  const validacoesReais = dadosVal.slice(1).filter(r =>
    textoPainelV054_(r[idxVal.id_validacao])
  );

  const filasReais = dadosFila.length > 1
    ? dadosFila.slice(1).filter(r =>
        idxFila.id_validacao !== undefined &&
        textoPainelV054_(r[idxFila.id_validacao])
      )
    : [];

  const metricas = calcularMetricasPainelV054_(
    linhasQuimica,
    idxBase,
    validacoesReais,
    idxVal,
    filasReais,
    idxFila
  );

  const porProfessor = agruparValidacoesPorProfessorV054_(
    validacoesReais,
    idxVal
  );

  const porHabilidade = agruparValidacoesPorHabilidadeV054_(
    validacoesReais,
    idxVal
  );

  const porMaturidade = agruparBasePorCampoV054_(
    linhasQuimica,
    idxBase.maturidade_curadoria
  );

  const porStatus = agruparBasePorCampoV054_(
    linhasQuimica,
    idxBase.status_validacao
  );

  desenharPainelQualidadeV054_(
    painel,
    metricas,
    porProfessor,
    porHabilidade,
    porMaturidade,
    porStatus
  );

  SpreadsheetApp.flush();

  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);

  ss.toast(
    `Painel atualizado em ${segundos}s.`,
    'NAVE — Qualidade da curadoria',
    7
  );

  return metricas;
}


/* =========================================================
   CÁLCULO DAS MÉTRICAS
   ========================================================= */

function calcularMetricasPainelV054_(
  base,
  idxBase,
  validacoes,
  idxVal,
  fila,
  idxFila
) {
  const totalQuestoes = base.length;

  const avaliadas = base.filter(r =>
    Number(r[idxBase.quantidade_validacoes] || 0) > 0
  ).length;

  const naoAvaliadas = totalQuestoes - avaliadas;

  const comDivergencia = base.filter(r =>
    Number(r[idxBase.quantidade_divergencias] || 0) > 0
  ).length;

  const semDivergencia = base.filter(r =>
    Number(r[idxBase.quantidade_validacoes] || 0) > 0 &&
    Number(r[idxBase.quantidade_divergencias] || 0) === 0
  ).length;

  const homologadas = base.filter(r =>
    textoPainelV054_(r[idxBase.maturidade_curadoria]) === 'Homologada'
  ).length;

  const suspensas = base.filter(r =>
    textoPainelV054_(r[idxBase.maturidade_curadoria]) === 'Suspensa'
  ).length;

  const ajustadasCoordenacao = base.filter(r =>
    textoPainelV054_(r[idxBase.maturidade_curadoria]) ===
      'Ajustada pela coordenação'
  ).length;

  const totalValidacoes = validacoes.length;

  const validacoesComDivergencia = validacoes.filter(r =>
    textoPainelV054_(r[idxVal.possui_divergencia]) === 'Sim'
  ).length;

  const validacoesConcordantes =
    totalValidacoes - validacoesComDivergencia;

  const aguardandoCoordenacao = fila.filter(r => {
    const status = idxFila.status_fila !== undefined
      ? textoPainelV054_(r[idxFila.status_fila])
      : '';
    const resolvido = idxFila.resolvido !== undefined
      ? r[idxFila.resolvido] === true
      : false;

    return !resolvido &&
      ['Aguardando coordenação', 'Em análise'].includes(status);
  }).length;

  const resolvidasCoordenacao = fila.filter(r => {
    const status = idxFila.status_fila !== undefined
      ? textoPainelV054_(r[idxFila.status_fila])
      : '';
    const resolvido = idxFila.resolvido !== undefined
      ? r[idxFila.resolvido] === true
      : false;

    return resolvido || status === 'Resolvida';
  }).length;

  const cobertura = totalQuestoes > 0
    ? avaliadas / totalQuestoes
    : 0;

  const concordancia = totalValidacoes > 0
    ? validacoesConcordantes / totalValidacoes
    : 0;

  const taxaDivergencia = totalValidacoes > 0
    ? validacoesComDivergencia / totalValidacoes
    : 0;

  return {
    totalQuestoes,
    avaliadas,
    naoAvaliadas,
    comDivergencia,
    semDivergencia,
    homologadas,
    suspensas,
    ajustadasCoordenacao,
    totalValidacoes,
    validacoesConcordantes,
    validacoesComDivergencia,
    aguardandoCoordenacao,
    resolvidasCoordenacao,
    cobertura,
    concordancia,
    taxaDivergencia,
    atualizadoEm: new Date()
  };
}


function agruparValidacoesPorProfessorV054_(validacoes, idx) {
  const mapa = new Map();

  validacoes.forEach(r => {
    const professor =
      textoPainelV054_(r[idx.professor]) ||
      'Professor não identificado';

    if (!mapa.has(professor)) {
      mapa.set(professor, {
        professor,
        validacoes: 0,
        concordantes: 0,
        divergentes: 0,
        ultimaValidacao: null
      });
    }

    const item = mapa.get(professor);
    item.validacoes++;

    if (textoPainelV054_(r[idx.possui_divergencia]) === 'Sim') {
      item.divergentes++;
    } else {
      item.concordantes++;
    }

    const data = r[idx.data_validacao];

    if (
      data &&
      (!item.ultimaValidacao ||
       new Date(data).getTime() > new Date(item.ultimaValidacao).getTime())
    ) {
      item.ultimaValidacao = data;
    }
  });

  return [...mapa.values()]
    .map(x => [
      x.professor,
      x.validacoes,
      x.concordantes,
      x.divergentes,
      x.validacoes > 0 ? x.concordantes / x.validacoes : 0,
      x.ultimaValidacao || ''
    ])
    .sort((a, b) => b[1] - a[1]);
}


function agruparValidacoesPorHabilidadeV054_(validacoes, idx) {
  const mapa = new Map();

  validacoes.forEach(r => {
    const habilidade =
      textoPainelV054_(r[idx.habilidade_atual]) ||
      'Não informada';

    if (!mapa.has(habilidade)) {
      mapa.set(habilidade, {
        habilidade,
        validacoes: 0,
        concordantes: 0,
        divergentes: 0,
        questoes: new Set()
      });
    }

    const item = mapa.get(habilidade);
    item.validacoes++;
    item.questoes.add(textoPainelV054_(r[idx.id_ocorrencia]));

    if (textoPainelV054_(r[idx.possui_divergencia]) === 'Sim') {
      item.divergentes++;
    } else {
      item.concordantes++;
    }
  });

  return [...mapa.values()]
    .map(x => [
      x.habilidade,
      x.questoes.size,
      x.validacoes,
      x.concordantes,
      x.divergentes,
      x.validacoes > 0 ? x.concordantes / x.validacoes : 0
    ])
    .sort((a, b) =>
      String(a[0]).localeCompare(String(b[0]), 'pt-BR', {numeric: true})
    );
}


function agruparBasePorCampoV054_(linhas, coluna) {
  const mapa = new Map();

  linhas.forEach(r => {
    const valor = textoPainelV054_(r[coluna]) || 'Não informado';
    mapa.set(valor, (mapa.get(valor) || 0) + 1);
  });

  return [...mapa.entries()]
    .map(([valor, quantidade]) => [valor, quantidade])
    .sort((a, b) => b[1] - a[1]);
}


/* =========================================================
   DESENHO DO PAINEL
   ========================================================= */

function desenharPainelQualidadeV054_(
  aba,
  m,
  porProfessor,
  porHabilidade,
  porMaturidade,
  porStatus
) {
  aba.getRange('A1:L1')
    .merge()
    .setValue('NAVE — PAINEL DE QUALIDADE DA CURADORIA — QUÍMICA')
    .setBackground(PAINEL_QUALIDADE_V054.COR_PRINCIPAL)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(15)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  aba.setRowHeight(1, 34);

  aba.getRange('A2:L2')
    .merge()
    .setValue(
      `Atualizado em ${formatarDataPainelV054_(m.atualizadoEm)}`
    )
    .setFontColor('#475569')
    .setHorizontalAlignment('center');

  escreverKpiPainelV054_(
    aba, 'A4:C6',
    'QUESTÕES DE QUÍMICA',
    m.totalQuestoes,
    PAINEL_QUALIDADE_V054.COR_INFO
  );

  escreverKpiPainelV054_(
    aba, 'D4:F6',
    'QUESTÕES AVALIADAS',
    m.avaliadas,
    PAINEL_QUALIDADE_V054.COR_SECUNDARIA
  );

  escreverKpiPainelV054_(
    aba, 'G4:I6',
    'COBERTURA DA VALIDAÇÃO',
    m.cobertura,
    PAINEL_QUALIDADE_V054.COR_SECUNDARIA,
    '0.0%'
  );

  escreverKpiPainelV054_(
    aba, 'J4:L6',
    'QUESTÕES NÃO AVALIADAS',
    m.naoAvaliadas,
    PAINEL_QUALIDADE_V054.COR_NEUTRA
  );

  escreverKpiPainelV054_(
    aba, 'A8:C10',
    'VALIDAÇÕES REGISTRADAS',
    m.totalValidacoes,
    PAINEL_QUALIDADE_V054.COR_INFO
  );

  escreverKpiPainelV054_(
    aba, 'D8:F10',
    'CONCORDÂNCIA',
    m.concordancia,
    PAINEL_QUALIDADE_V054.COR_SECUNDARIA,
    '0.0%'
  );

  escreverKpiPainelV054_(
    aba, 'G8:I10',
    'VALIDAÇÕES DIVERGENTES',
    m.validacoesComDivergencia,
    PAINEL_QUALIDADE_V054.COR_ALERTA
  );

  escreverKpiPainelV054_(
    aba, 'J8:L10',
    'AGUARDANDO COORDENAÇÃO',
    m.aguardandoCoordenacao,
    PAINEL_QUALIDADE_V054.COR_ERRO
  );

  escreverKpiPainelV054_(
    aba, 'A12:C14',
    'RESOLVIDAS PELA COORDENAÇÃO',
    m.resolvidasCoordenacao,
    PAINEL_QUALIDADE_V054.COR_INFO
  );

  escreverKpiPainelV054_(
    aba, 'D12:F14',
    'AJUSTADAS PELA COORDENAÇÃO',
    m.ajustadasCoordenacao,
    PAINEL_QUALIDADE_V054.COR_INFO
  );

  escreverKpiPainelV054_(
    aba, 'G12:I14',
    'HOMOLOGADAS',
    m.homologadas,
    PAINEL_QUALIDADE_V054.COR_SECUNDARIA
  );

  escreverKpiPainelV054_(
    aba, 'J12:L14',
    'SUSPENSAS',
    m.suspensas,
    PAINEL_QUALIDADE_V054.COR_ERRO
  );

  escreverTabelaPainelV054_(
    aba,
    17,
    1,
    'VALIDAÇÕES POR PROFESSOR',
    [
      'Professor',
      'Validações',
      'Concordantes',
      'Divergentes',
      '% concordância',
      'Última validação'
    ],
    porProfessor,
    [260, 95, 105, 100, 110, 155]
  );

  escreverTabelaPainelV054_(
    aba,
    17,
    8,
    'DISTRIBUIÇÃO POR MATURIDADE',
    ['Maturidade', 'Questões'],
    porMaturidade,
    [240, 100]
  );

  const linhaHabilidade = Math.max(
    24,
    20 + porProfessor.length
  );

  escreverTabelaPainelV054_(
    aba,
    linhaHabilidade,
    1,
    'VALIDAÇÕES POR HABILIDADE',
    [
      'Habilidade',
      'Questões avaliadas',
      'Validações',
      'Concordantes',
      'Divergentes',
      '% concordância'
    ],
    porHabilidade,
    [110, 120, 95, 105, 100, 110]
  );

  const linhaStatus = Math.max(
    linhaHabilidade,
    20 + porMaturidade.length
  );

  escreverTabelaPainelV054_(
    aba,
    linhaStatus,
    8,
    'STATUS DA VALIDAÇÃO',
    ['Status', 'Questões'],
    porStatus,
    [240, 100]
  );

  aplicarFormatosPainelV054_(
    aba,
    porProfessor.length,
    porHabilidade.length,
    linhaHabilidade
  );

  adicionarGraficosPainelV054_(
    aba,
    porMaturidade.length,
    porStatus.length,
    linhaStatus
  );

  aba.setColumnWidths(1, 12, 95);
  aba.setColumnWidth(1, 220);
  aba.setColumnWidth(8, 220);
  aba.setColumnWidth(9, 110);
  aba.setColumnWidth(10, 110);
  aba.setColumnWidth(11, 110);
  aba.setColumnWidth(12, 110);
}


function escreverKpiPainelV054_(
  aba,
  intervalo,
  titulo,
  valor,
  cor,
  formato
) {
  const range = aba.getRange(intervalo);
  range.merge();
  range.setBackground(cor)
    .setBorder(true, true, true, true, false, false, '#CBD5E1',
      SpreadsheetApp.BorderStyle.SOLID)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  const celula = range.getCell(1, 1);

  celula.setValue(`${titulo}\n${valor}`)
    .setFontWeight('bold')
    .setFontSize(12)
    .setWrap(true);

  if (formato) {
    celula.setNumberFormat(formato);
    celula.setValue(valor);
    celula.setNote(titulo);
  }
}


function escreverTabelaPainelV054_(
  aba,
  linha,
  coluna,
  titulo,
  headers,
  dados,
  larguras
) {
  const totalColunas = headers.length;

  aba.getRange(linha, coluna, 1, totalColunas)
    .merge()
    .setValue(titulo)
    .setBackground(PAINEL_QUALIDADE_V054.COR_PRINCIPAL)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  aba.getRange(linha + 1, coluna, 1, totalColunas)
    .setValues([headers])
    .setBackground(PAINEL_QUALIDADE_V054.COR_SECUNDARIA)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setWrap(true);

  if (dados.length) {
    aba.getRange(
      linha + 2,
      coluna,
      dados.length,
      totalColunas
    )
      .setValues(dados)
      .setVerticalAlignment('top')
      .setWrap(true);
  } else {
    aba.getRange(linha + 2, coluna)
      .setValue('Sem registros.')
      .setFontColor('#64748B');
  }

  larguras.forEach((largura, i) => {
    aba.setColumnWidth(coluna + i, largura);
  });
}


function aplicarFormatosPainelV054_(
  aba,
  qtdProfessores,
  qtdHabilidades,
  linhaHabilidade
) {
  if (qtdProfessores > 0) {
    aba.getRange(19, 5, qtdProfessores, 1)
      .setNumberFormat('0.0%');

    aba.getRange(19, 6, qtdProfessores, 1)
      .setNumberFormat('dd/MM/yyyy HH:mm');
  }

  if (qtdHabilidades > 0) {
    aba.getRange(linhaHabilidade + 2, 6, qtdHabilidades, 1)
      .setNumberFormat('0.0%');
  }

  aba.getDataRange()
    .setVerticalAlignment('middle');

  const regras = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThan(0)
      .setBackground(PAINEL_QUALIDADE_V054.COR_ERRO)
      .setRanges([aba.getRange('J8:L10')])
      .build()
  ];

  aba.setConditionalFormatRules(regras);
}


function adicionarGraficosPainelV054_(
  aba,
  qtdMaturidade,
  qtdStatus,
  linhaStatus
) {
  if (qtdMaturidade > 0) {
    const chart = aba.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(
        aba.getRange(19, 8, qtdMaturidade, 2)
      )
      .setPosition(17, 10, 0, 0)
      .setOption('title', 'Maturidade da curadoria')
      .setOption('legend', {position: 'right'})
      .build();

    aba.insertChart(chart);
  }

  if (qtdStatus > 0) {
    const chart = aba.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(
        aba.getRange(linhaStatus + 2, 8, qtdStatus, 2)
      )
      .setPosition(linhaStatus, 10, 0, 0)
      .setOption('title', 'Status das questões')
      .setOption('legend', {position: 'none'})
      .build();

    aba.insertChart(chart);
  }
}


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function indexarCabecalhosPainelV054_(headers) {
  const idx = {};

  headers.forEach((valor, i) => {
    const chave = textoPainelV054_(valor);
    if (chave) idx[chave] = i;
  });

  return idx;
}


function validarCabecalhosPainelV054_(idx, obrigatorios, nomeAba) {
  const faltantes = obrigatorios.filter(campo =>
    idx[campo] === undefined
  );

  if (faltantes.length) {
    throw new Error(
      `Campos ausentes em ${nomeAba}: ${faltantes.join(', ')}`
    );
  }
}


function textoPainelV054_(valor) {
  if (valor === null || valor === undefined) return '';

  return String(valor)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function formatarDataPainelV054_(valor) {
  return Utilities.formatDate(
    valor,
    Session.getScriptTimeZone() || 'America/Sao_Paulo',
    'dd/MM/yyyy HH:mm:ss'
  );
}



/* ==========================================================
   PAINEL OPERACIONAL DA COORDENAÇÃO V0.5.6
   ========================================================== */

/**
 * NAVE — PAINEL OPERACIONAL DA COORDENAÇÃO — V0.5.6
 *
 * Adicione este arquivo ao projeto com o nome:
 * PainelCoordenacaoV056.gs
 *
 * Adicione também:
 * PainelCoordenacaoV05.html
 *
 * No menu da versão 0.5, acrescente:
 * .addItem('Abrir painel operacional da coordenação', 'abrirPainelCoordenacaoV05')
 *
 * Execute uma vez:
 * instalarPainelCoordenacaoV056()
 */

const PAINEL_COORD_V056 = Object.freeze({
  ABA_FILA: 'FILA_COORDENACAO_V05',
  ABA_VALIDACOES: 'VALIDACOES_DOCENTES',
  ABA_BASE: 'QUESTOES_GERAL',
  COR_PRINCIPAL: '#0F766E'
});


function instalarPainelCoordenacaoV056() {
  const ss = SpreadsheetApp.getActive();

  [
    PAINEL_COORD_V056.ABA_FILA,
    PAINEL_COORD_V056.ABA_VALIDACOES,
    PAINEL_COORD_V056.ABA_BASE
  ].forEach(nome => {
    if (!ss.getSheetByName(nome)) {
      throw new Error(`A aba ${nome} não foi encontrada.`);
    }
  });

  SpreadsheetApp.getUi().alert(
    'Painel operacional instalado',
    'O painel da coordenação está pronto para uso.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


function abrirPainelCoordenacaoV05() {
  const template = HtmlService.createTemplateFromFile('PainelCoordenacaoV100');

  SpreadsheetApp.getUi().showSidebar(
    template.evaluate()
      .setTitle('Coordenação — pendências')
      .setWidth(560)
  );
}


function listarCasosCoordenacaoV05(filtros) {
  filtros = filtros || {};

  const ss = SpreadsheetApp.getActive();
  const fila = ss.getSheetByName(PAINEL_COORD_V056.ABA_FILA);

  const dados = fila.getDataRange().getValues();
  const idx = indexarCabecalhosPainelCoordV056_(dados[0]);

  const obrigatorios = [
    'prioridade',
    'status_fila',
    'id_validacao',
    'id_ocorrencia',
    'data_entrada',
    'professor',
    'habilidade',
    'objeto_atual',
    'tipos_divergencia',
    'parecer_geral',
    'observacao_docente',
    'decisao_coordenacao',
    'resolvido'
  ];

  const faltantes = obrigatorios.filter(c => idx[c] === undefined);
  if (faltantes.length) {
    throw new Error(
      'Campos ausentes em FILA_COORDENACAO_V05: ' +
      faltantes.join(', ')
    );
  }

  let casos = [];

  for (let i = 1; i < dados.length; i++) {
    const r = dados[i];
    const idValidacao = textoPainelCoordV056_(r[idx.id_validacao]);

    if (!idValidacao) continue;

    const caso = {
      linha: i + 1,
      prioridade: textoPainelCoordV056_(r[idx.prioridade]),
      statusFila: textoPainelCoordV056_(r[idx.status_fila]),
      idValidacao,
      idQuestao: textoPainelCoordV056_(r[idx.id_ocorrencia]),
      dataEntrada: formatarDataPainelCoordV056_(r[idx.data_entrada]),
      professor: textoPainelCoordV056_(r[idx.professor]),
      habilidade: textoPainelCoordV056_(r[idx.habilidade]),
      objetoAtual: textoPainelCoordV056_(r[idx.objeto_atual]),
      divergencias: textoPainelCoordV056_(r[idx.tipos_divergencia]),
      parecer: textoPainelCoordV056_(r[idx.parecer_geral]),
      observacao: textoPainelCoordV056_(r[idx.observacao_docente]),
      decisao: textoPainelCoordV056_(r[idx.decisao_coordenacao]),
      resolvido: r[idx.resolvido] === true
    };

    if (filtros.prioridade && filtros.prioridade !== 'Todas') {
      if (caso.prioridade !== filtros.prioridade) continue;
    }

    if (filtros.status && filtros.status !== 'Todos') {
      if (caso.statusFila !== filtros.status) continue;
    }

    if (filtros.habilidade && filtros.habilidade !== 'Todas') {
      if (caso.habilidade !== filtros.habilidade) continue;
    }

    if (filtros.professor && filtros.professor !== 'Todos') {
      if (caso.professor !== filtros.professor) continue;
    }

    if (filtros.somentePendentes === true && caso.resolvido) {
      continue;
    }

    casos.push(caso);
  }

  const peso = {Crítica: 4, Alta: 3, Normal: 2, Baixa: 1};

  casos.sort((a, b) => {
    const p = (peso[b.prioridade] || 0) - (peso[a.prioridade] || 0);
    if (p !== 0) return p;

    return String(a.idQuestao).localeCompare(
      String(b.idQuestao),
      'pt-BR',
      {numeric: true}
    );
  });

  return {
    casos,
    filtros: obterOpcoesPainelCoordenacaoV05_(),
    resumo: {
      total: casos.length,
      pendentes: casos.filter(c => !c.resolvido).length,
      resolvidos: casos.filter(c => c.resolvido).length
    }
  };
}


function obterOpcoesPainelCoordenacaoV05_() {
  const ss = SpreadsheetApp.getActive();
  const fila = ss.getSheetByName(PAINEL_COORD_V056.ABA_FILA);

  const dados = fila.getDataRange().getValues();
  const idx = indexarCabecalhosPainelCoordV056_(dados[0]);

  const prioridades = new Set();
  const status = new Set();
  const habilidades = new Set();
  const professores = new Set();

  for (let i = 1; i < dados.length; i++) {
    if (!textoPainelCoordV056_(dados[i][idx.id_validacao])) continue;

    prioridades.add(textoPainelCoordV056_(dados[i][idx.prioridade]));
    status.add(textoPainelCoordV056_(dados[i][idx.status_fila]));
    habilidades.add(textoPainelCoordV056_(dados[i][idx.habilidade]));
    professores.add(textoPainelCoordV056_(dados[i][idx.professor]));
  }

  return {
    prioridades: ['Todas'].concat(
      [...prioridades].filter(Boolean).sort()
    ),
    status: ['Todos'].concat(
      [...status].filter(Boolean).sort()
    ),
    habilidades: ['Todas'].concat(
      [...habilidades].filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt-BR', {numeric: true}))
    ),
    professores: ['Todos'].concat(
      [...professores].filter(Boolean).sort()
    )
  };
}


function abrirDecisaoPorIdValidacaoV05(idValidacao) {
  if (!idValidacao) {
    throw new Error('id_validacao não informado.');
  }

  const template = HtmlService.createTemplateFromFile('DecidirValidacaoV100');
  template.idValidacao = String(idValidacao);

  SpreadsheetApp.getUi().showSidebar(
    template.evaluate()
      .setTitle('Decisão da coordenação — V0.5')
      .setWidth(520)
  );

  return true;
}


function localizarCasoNaFilaV05(idValidacao) {
  const ss = SpreadsheetApp.getActive();
  const fila = ss.getSheetByName(PAINEL_COORD_V056.ABA_FILA);

  const dados = fila.getDataRange().getValues();
  const idx = indexarCabecalhosPainelCoordV056_(dados[0]);

  const linha = dados.findIndex((r, i) =>
    i > 0 &&
    textoPainelCoordV056_(r[idx.id_validacao]) ===
      textoPainelCoordV056_(idValidacao)
  );

  if (linha < 0) {
    throw new Error('Caso não localizado na fila.');
  }

  ss.setActiveSheet(fila);
  fila.setActiveRange(fila.getRange(linha + 1, 1, 1, fila.getLastColumn()));

  return linha + 1;
}


function indexarCabecalhosPainelCoordV056_(headers) {
  const idx = {};
  headers.forEach((v, i) => {
    const chave = textoPainelCoordV056_(v);
    if (chave) idx[chave] = i;
  });
  return idx;
}


function textoPainelCoordV056_(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function formatarDataPainelCoordV056_(valor) {
  if (!valor) return '';

  const data = Object.prototype.toString.call(valor) === '[object Date]'
    ? valor
    : new Date(valor);

  if (isNaN(data.getTime())) return String(valor);

  return Utilities.formatDate(
    data,
    Session.getScriptTimeZone() || 'America/Sao_Paulo',
    'dd/MM/yyyy HH:mm'
  );
}

