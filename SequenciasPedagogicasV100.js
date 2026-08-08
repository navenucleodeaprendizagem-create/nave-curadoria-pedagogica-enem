/**
 * NAVE — SEQUÊNCIAS PEDAGÓGICAS
 * Consolidação estrutural V1.0
 *
 * Origem:
 * - SequenciasEstruturadasV060.gs
 *
 * A lógica e os nomes públicos das funções foram preservados.
 */

/**
 * NAVE — SEQUÊNCIAS SALVAS ESTRUTURADAS — V0.6.0
 *
 * Objetivo:
 * - preservar a sequência atual;
 * - salvar metadados da sequência;
 * - salvar cada questão em uma aba própria de itens;
 * - permitir reabrir uma sequência salva;
 * - preparar a base para o módulo editorial.
 *
 * Arquivo sugerido:
 * SequenciasEstruturadasV060.gs
 *
 * Execute uma vez:
 * instalarSequenciasEstruturadasV060()
 */

const NAVE_SEQ_V060 = Object.freeze({
  ABA_CABECALHOS: 'SEQUENCIAS_SALVAS',
  ABA_ITENS: 'ITENS_SEQUENCIAS',
  ABA_ATUAL: 'SEQUENCIA_ATUAL',
  ABA_BASE: 'QUESTOES_GERAL',

  LINHA_CABECALHO_ATUAL: 11,
  LINHA_INICIO_ATUAL: 12,

  CABECALHOS_SEQUENCIAS: [
    'id_sequencia',
    'criada_em',
    'criada_por',
    'titulo',
    'descricao',
    'publico_alvo',
    'objetivo_pedagogico',
    'quantidade_questoes',
    'tempo_total_min',
    'status_sequencia',
    'versao',
    'origem',
    'atualizada_em',
    'atualizada_por'
  ],

  CABECALHOS_ITENS: [
    'id_item_sequencia',
    'id_sequencia',
    'ordem',
    'id_ocorrencia',
    'ano',
    'edicao',
    'competencia',
    'habilidade',
    'objeto_principal',
    'dificuldade_rotulo',
    'funcao_pedagogica_sugerida',
    'trecho_inicial',
    'tempo_estimado_min',
    'observacao_professor',
    'status_validacao',
    'maturidade_curadoria',
    'colecao_origem',
    'pagina_pdf',
    'status_item_sequencia',
    'incluido_em',
    'incluido_por'
  ]
});


/* =========================================================
   INSTALAÇÃO
   ========================================================= */

function instalarSequenciasEstruturadasV060() {
  const ss = SpreadsheetApp.getActive();

  const atual = ss.getSheetByName(NAVE_SEQ_V060.ABA_ATUAL);
  const base = ss.getSheetByName(NAVE_SEQ_V060.ABA_BASE);

  if (!atual || !base) {
    throw new Error(
      'As abas SEQUENCIA_ATUAL e QUESTOES_GERAL são obrigatórias.'
    );
  }

  let cabecalhos = ss.getSheetByName(
    NAVE_SEQ_V060.ABA_CABECALHOS
  );

  if (!cabecalhos) {
    cabecalhos = ss.insertSheet(
      NAVE_SEQ_V060.ABA_CABECALHOS
    );
  }

  let itens = ss.getSheetByName(NAVE_SEQ_V060.ABA_ITENS);

  if (!itens) {
    itens = ss.insertSheet(NAVE_SEQ_V060.ABA_ITENS);
  }

  garantirCabecalhosSequenciasV060_(
    cabecalhos,
    NAVE_SEQ_V060.CABECALHOS_SEQUENCIAS
  );

  garantirCabecalhosSequenciasV060_(
    itens,
    NAVE_SEQ_V060.CABECALHOS_ITENS
  );

  estilizarAbaSequenciasV060_(cabecalhos);
  estilizarAbaSequenciasV060_(itens);

  SpreadsheetApp.getUi().alert(
    'Estrutura de sequências instalada',
    [
      'A aba SEQUENCIAS_SALVAS foi preservada e complementada.',
      'A aba ITENS_SEQUENCIAS foi criada.',
      '',
      'Agora cada sequência poderá ser salva com seus itens e metadados.'
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


function garantirCabecalhosSequenciasV060_(aba, desejados) {
  const ultimaColuna = Math.max(aba.getLastColumn(), 1);
  const atuais = aba.getRange(
    1,
    1,
    1,
    ultimaColuna
  ).getDisplayValues()[0].map(v => String(v || '').trim());

  if (
    aba.getLastRow() === 0 ||
    atuais.every(v => !v)
  ) {
    aba.getRange(1, 1, 1, desejados.length)
      .setValues([desejados]);
    return;
  }

  const ausentes = desejados.filter(
    campo => !atuais.includes(campo)
  );

  if (!ausentes.length) return;

  const inicio = ultimaColuna + 1;

  aba.getRange(
    1,
    inicio,
    1,
    ausentes.length
  ).setValues([ausentes]);
}


function estilizarAbaSequenciasV060_(aba) {
  const ultimaColuna = aba.getLastColumn();

  aba.getRange(1, 1, 1, ultimaColuna)
    .setBackground('#0F766E')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  aba.setFrozenRows(1);

  for (let c = 1; c <= ultimaColuna; c++) {
    aba.setColumnWidth(c, 150);
  }
}


/* =========================================================
   SALVAR SEQUÊNCIA
   ========================================================= */

function salvarSequenciaAtualV06() {
  const ss = SpreadsheetApp.getActive();
  const atual = ss.getSheetByName(NAVE_SEQ_V060.ABA_ATUAL);
  const cabecalhos = ss.getSheetByName(
    NAVE_SEQ_V060.ABA_CABECALHOS
  );
  const itens = ss.getSheetByName(NAVE_SEQ_V060.ABA_ITENS);
  const base = ss.getSheetByName(NAVE_SEQ_V060.ABA_BASE);

  if (!cabecalhos || !itens) {
    throw new Error(
      'Execute instalarSequenciasEstruturadasV060() primeiro.'
    );
  }

  if (
    atual.getLastRow() <
    NAVE_SEQ_V060.LINHA_INICIO_ATUAL
  ) {
    throw new Error('A sequência atual está vazia.');
  }

  const titulo = String(
    atual.getRange('B3').getDisplayValue() || ''
  ).trim();

  if (!titulo) {
    throw new Error(
      'Informe o título da sequência em SEQUENCIA_ATUAL!B3.'
    );
  }

  const descricao = String(
    atual.getRange('B4').getDisplayValue() || ''
  ).trim();

  const publico = String(
    atual.getRange('B5').getDisplayValue() || ''
  ).trim();

  const objetivo = String(
    atual.getRange('B6').getDisplayValue() || ''
  ).trim();

  const ultimaLinha = atual.getLastRow();
  const ultimaColuna = atual.getLastColumn();

  const headersAtual = atual.getRange(
    NAVE_SEQ_V060.LINHA_CABECALHO_ATUAL,
    1,
    1,
    ultimaColuna
  ).getDisplayValues()[0];

  const idxAtual = indexarSequenciasV060_(headersAtual);

  if (idxAtual.id_ocorrencia === undefined) {
    throw new Error(
      'A coluna id_ocorrencia não existe em SEQUENCIA_ATUAL.'
    );
  }

  const dadosAtual = atual.getRange(
    NAVE_SEQ_V060.LINHA_INICIO_ATUAL,
    1,
    ultimaLinha -
      NAVE_SEQ_V060.LINHA_INICIO_ATUAL + 1,
    ultimaColuna
  ).getValues().filter(r =>
    String(r[idxAtual.id_ocorrencia] || '').trim()
  );

  if (!dadosAtual.length) {
    throw new Error('A sequência atual não possui questões.');
  }

  const dadosBase = base.getDataRange().getValues();
  const idxBase = indexarSequenciasV060_(dadosBase[0]);

  const mapaBase = new Map();

  for (let i = 1; i < dadosBase.length; i++) {
    const id = textoSequenciasV060_(
      dadosBase[i][idxBase.id_ocorrencia]
    );

    if (id) mapaBase.set(id, dadosBase[i]);
  }

  const idSequencia = gerarIdSequenciasV060_('SEQ');
  const agora = new Date();
  const usuario =
    Session.getActiveUser().getEmail() ||
    'Usuário não identificado';

  const versao = obterProximaVersaoSequenciaV060_(
    cabecalhos,
    titulo
  );

  const tempoTotal = dadosAtual.reduce((soma, r) => {
    const valor =
      idxAtual.tempo_estimado_min !== undefined
        ? r[idxAtual.tempo_estimado_min]
        : 0;

    return soma + (Number(valor) || 0);
  }, 0);

  anexarRegistroPorCabecalhoV060_(
    cabecalhos,
    {
      id_sequencia: idSequencia,
      criada_em: agora,
      criada_por: usuario,
      titulo,
      descricao,
      publico_alvo: publico,
      objetivo_pedagogico: objetivo,
      quantidade_questoes: dadosAtual.length,
      tempo_total_min: tempoTotal,
      status_sequencia: 'Rascunho',
      versao,
      origem: 'Sequência atual',
      atualizada_em: agora,
      atualizada_por: usuario
    }
  );

  const registrosItens = dadosAtual.map((r, posicao) => {
    const idQuestao = textoSequenciasV060_(
      r[idxAtual.id_ocorrencia]
    );

    const rb = mapaBase.get(idQuestao) || [];

    return {
      id_item_sequencia:
        gerarIdSequenciasV060_('ITEMSEQ'),
      id_sequencia: idSequencia,
      ordem:
        idxAtual.ORDEM !== undefined
          ? Number(r[idxAtual.ORDEM]) || posicao + 1
          : posicao + 1,
      id_ocorrencia: idQuestao,
      ano: obterCampoSequenciaV060_(
        r, idxAtual, rb, idxBase, 'ano'
      ),
      edicao: obterCampoSequenciaV060_(
        r, idxAtual, rb, idxBase, 'edicao'
      ),
      competencia: obterCampoSequenciaV060_(
        r, idxAtual, rb, idxBase, 'competencia'
      ),
      habilidade: obterCampoSequenciaV060_(
        r, idxAtual, rb, idxBase, 'habilidade'
      ),
      objeto_principal: obterCampoSequenciaV060_(
        r, idxAtual, rb, idxBase, 'objeto_principal'
      ),
      dificuldade_rotulo: obterCampoSequenciaV060_(
        r, idxAtual, rb, idxBase, 'dificuldade_rotulo'
      ),
      funcao_pedagogica_sugerida:
        obterCampoSequenciaV060_(
          r,
          idxAtual,
          rb,
          idxBase,
          'funcao_pedagogica_sugerida'
        ),
      trecho_inicial: obterCampoSequenciaV060_(
        r, idxAtual, rb, idxBase, 'trecho_inicial'
      ),
      tempo_estimado_min: obterCampoSequenciaV060_(
        r, idxAtual, rb, idxBase, 'tempo_estimado_min'
      ),
      observacao_professor: obterCampoSequenciaV060_(
        r, idxAtual, rb, idxBase, 'observacao_professor'
      ),
      status_validacao: obterCampoSequenciaV060_(
        r, idxAtual, rb, idxBase, 'status_validacao'
      ),
      maturidade_curadoria: obterCampoSequenciaV060_(
        r, idxAtual, rb, idxBase, 'maturidade_curadoria'
      ),
      colecao_origem: obterCampoSequenciaV060_(
        r, idxAtual, rb, idxBase, 'colecao_origem'
      ),
      pagina_pdf: obterCampoSequenciaV060_(
        r, idxAtual, rb, idxBase, 'pagina_pdf'
      ),
      status_item_sequencia: 'Ativo',
      incluido_em: agora,
      incluido_por: usuario
    };
  });

  registrosItens.forEach(registro =>
    anexarRegistroPorCabecalhoV060_(itens, registro)
  );

  SpreadsheetApp.getUi().alert(
    'Sequência salva',
    [
      `ID: ${idSequencia}`,
      `Título: ${titulo}`,
      `Versão: ${versao}`,
      `Questões: ${dadosAtual.length}`,
      `Tempo total: ${tempoTotal} min`
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  return {
    idSequencia,
    titulo,
    versao,
    quantidadeQuestoes: dadosAtual.length,
    tempoTotal
  };
}


/* =========================================================
   CARREGAR SEQUÊNCIA
   ========================================================= */

function solicitarCarregamentoSequenciaV06() {
  const ui = SpreadsheetApp.getUi();

  const resposta = ui.prompt(
    'Carregar sequência',
    'Informe o ID da sequência salva:',
    ui.ButtonSet.OK_CANCEL
  );

  if (resposta.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const id = String(
    resposta.getResponseText() || ''
  ).trim();

  if (!id) {
    throw new Error('Informe o ID da sequência.');
  }

  carregarSequenciaSalvaV06(id);
}


function carregarSequenciaSalvaV06(idSequencia) {
  const ss = SpreadsheetApp.getActive();
  const atual = ss.getSheetByName(NAVE_SEQ_V060.ABA_ATUAL);
  const cabecalhos = ss.getSheetByName(
    NAVE_SEQ_V060.ABA_CABECALHOS
  );
  const itens = ss.getSheetByName(NAVE_SEQ_V060.ABA_ITENS);

  const dadosCab = cabecalhos.getDataRange().getValues();
  const idxCab = indexarSequenciasV060_(dadosCab[0]);

  const linhaCab = dadosCab.findIndex((r, i) =>
    i > 0 &&
    textoSequenciasV060_(r[idxCab.id_sequencia]) ===
      textoSequenciasV060_(idSequencia)
  );

  if (linhaCab < 0) {
    throw new Error(
      'Sequência não localizada: ' + idSequencia
    );
  }

  const cab = dadosCab[linhaCab];

  const dadosItens = itens.getDataRange().getValues();
  const idxItens = indexarSequenciasV060_(dadosItens[0]);

  const selecionados = dadosItens.slice(1)
    .filter(r =>
      textoSequenciasV060_(r[idxItens.id_sequencia]) ===
        textoSequenciasV060_(idSequencia) &&
      textoSequenciasV060_(r[idxItens.status_item_sequencia]) !==
        'Removido'
    )
    .sort((a, b) =>
      Number(a[idxItens.ordem]) -
      Number(b[idxItens.ordem])
    );

  if (!selecionados.length) {
    throw new Error(
      'A sequência não possui itens ativos.'
    );
  }

  if (
    atual.getLastRow() >=
    NAVE_SEQ_V060.LINHA_INICIO_ATUAL
  ) {
    atual.getRange(
      NAVE_SEQ_V060.LINHA_INICIO_ATUAL,
      1,
      atual.getLastRow() -
        NAVE_SEQ_V060.LINHA_INICIO_ATUAL + 1,
      atual.getLastColumn()
    ).clearContent().clearDataValidations();
  }

  atual.getRange('B3').setValue(cab[idxCab.titulo] || '');
  atual.getRange('B4').setValue(cab[idxCab.descricao] || '');
  atual.getRange('B5').setValue(cab[idxCab.publico_alvo] || '');
  atual.getRange('B6').setValue(
    cab[idxCab.objetivo_pedagogico] || ''
  );

  const headersAtual = atual.getRange(
    NAVE_SEQ_V060.LINHA_CABECALHO_ATUAL,
    1,
    1,
    atual.getLastColumn()
  ).getDisplayValues()[0];

  const idxAtual = indexarSequenciasV060_(headersAtual);

  const linhas = selecionados.map(r => {
    const saida = new Array(headersAtual.length).fill('');

    preencherCampoV060_(
      saida, idxAtual, 'ORDEM',
      r[idxItens.ordem]
    );
    preencherCampoV060_(
      saida, idxAtual, 'id_ocorrencia',
      r[idxItens.id_ocorrencia]
    );
    preencherCampoV060_(
      saida, idxAtual, 'ano',
      r[idxItens.ano]
    );
    preencherCampoV060_(
      saida, idxAtual, 'edicao',
      r[idxItens.edicao]
    );
    preencherCampoV060_(
      saida, idxAtual, 'competencia',
      r[idxItens.competencia]
    );
    preencherCampoV060_(
      saida, idxAtual, 'habilidade',
      r[idxItens.habilidade]
    );
    preencherCampoV060_(
      saida, idxAtual, 'objeto_principal',
      r[idxItens.objeto_principal]
    );
    preencherCampoV060_(
      saida, idxAtual, 'dificuldade_rotulo',
      r[idxItens.dificuldade_rotulo]
    );
    preencherCampoV060_(
      saida,
      idxAtual,
      'funcao_pedagogica_sugerida',
      r[idxItens.funcao_pedagogica_sugerida]
    );
    preencherCampoV060_(
      saida, idxAtual, 'trecho_inicial',
      r[idxItens.trecho_inicial]
    );
    preencherCampoV060_(
      saida, idxAtual, 'tempo_estimado_min',
      r[idxItens.tempo_estimado_min]
    );
    preencherCampoV060_(
      saida, idxAtual, 'observacao_professor',
      r[idxItens.observacao_professor]
    );
    preencherCampoV060_(
      saida, idxAtual, 'status_validacao',
      r[idxItens.status_validacao]
    );
    preencherCampoV060_(
      saida, idxAtual, 'maturidade_curadoria',
      r[idxItens.maturidade_curadoria]
    );
    preencherCampoV060_(
      saida, idxAtual, 'REMOVER', false
    );
    preencherCampoV060_(
      saida, idxAtual, 'REPORTAR', false
    );

    return saida;
  });

  atual.getRange(
    NAVE_SEQ_V060.LINHA_INICIO_ATUAL,
    1,
    linhas.length,
    headersAtual.length
  ).setValues(linhas);

  if (idxAtual.REMOVER !== undefined) {
    atual.getRange(
      NAVE_SEQ_V060.LINHA_INICIO_ATUAL,
      idxAtual.REMOVER + 1,
      linhas.length,
      1
    ).insertCheckboxes();
  }

  if (idxAtual.REPORTAR !== undefined) {
    atual.getRange(
      NAVE_SEQ_V060.LINHA_INICIO_ATUAL,
      idxAtual.REPORTAR + 1,
      linhas.length,
      1
    ).insertCheckboxes();
  }

  if (
    typeof atualizarIndicadoresSequencia_ ===
    'function'
  ) {
    atualizarIndicadoresSequencia_();
  }

  if (
    typeof sincronizarIndicadoresValidacaoV05 ===
    'function'
  ) {
    sincronizarIndicadoresValidacaoV05();
  }

  ss.setActiveSheet(atual);

  SpreadsheetApp.getUi().alert(
    'Sequência carregada',
    [
      `ID: ${idSequencia}`,
      `Título: ${cab[idxCab.titulo]}`,
      `Questões: ${selecionados.length}`
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


/* =========================================================
   LISTAGEM
   ========================================================= */

function listarSequenciasSalvasV06() {
  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(
    NAVE_SEQ_V060.ABA_CABECALHOS
  );

  const dados = aba.getDataRange().getValues();

  if (dados.length < 2) {
    SpreadsheetApp.getUi().alert(
      'Nenhuma sequência estruturada foi salva.'
    );
    return [];
  }

  const idx = indexarSequenciasV060_(dados[0]);

  const registros = dados.slice(1)
    .filter(r => textoSequenciasV060_(r[idx.id_sequencia]))
    .map(r => ({
      id: r[idx.id_sequencia],
      titulo: r[idx.titulo],
      versao: r[idx.versao],
      quantidade: r[idx.quantidade_questoes],
      status: r[idx.status_sequencia]
    }));

  const texto = registros.slice(-20).reverse()
    .map(r =>
      `${r.id} | ${r.titulo} | v${r.versao} | ` +
      `${r.quantidade} questões | ${r.status}`
    )
    .join('\n');

  SpreadsheetApp.getUi().alert(
    'Sequências salvas',
    texto || 'Nenhuma sequência encontrada.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  return registros;
}


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function anexarRegistroPorCabecalhoV060_(aba, registro) {
  const headers = aba.getRange(
    1,
    1,
    1,
    aba.getLastColumn()
  ).getDisplayValues()[0];

  const linha = headers.map(h =>
    Object.prototype.hasOwnProperty.call(
      registro,
      textoSequenciasV060_(h)
    )
      ? registro[textoSequenciasV060_(h)]
      : ''
  );

  aba.appendRow(linha);
}


function obterProximaVersaoSequenciaV060_(aba, titulo) {
  const dados = aba.getDataRange().getValues();

  if (dados.length < 2) return 1;

  const idx = indexarSequenciasV060_(dados[0]);

  const versoes = dados.slice(1)
    .filter(r =>
      textoSequenciasV060_(r[idx.titulo]) ===
      textoSequenciasV060_(titulo)
    )
    .map(r => Number(r[idx.versao]) || 0);

  return versoes.length
    ? Math.max(...versoes) + 1
    : 1;
}


function obterCampoSequenciaV060_(
  linhaAtual,
  idxAtual,
  linhaBase,
  idxBase,
  campo
) {
  if (
    idxAtual[campo] !== undefined &&
    linhaAtual[idxAtual[campo]] !== ''
  ) {
    return linhaAtual[idxAtual[campo]];
  }

  if (
    idxBase[campo] !== undefined &&
    linhaBase &&
    linhaBase[idxBase[campo]] !== undefined
  ) {
    return linhaBase[idxBase[campo]];
  }

  return '';
}


function preencherCampoV060_(
  linha,
  idx,
  campo,
  valor
) {
  if (idx[campo] !== undefined) {
    linha[idx[campo]] = valor;
  }
}


function indexarSequenciasV060_(headers) {
  const idx = {};

  headers.forEach((valor, i) => {
    const chave = textoSequenciasV060_(valor);

    if (chave) idx[chave] = i;
  });

  return idx;
}


function textoSequenciasV060_(valor) {
  if (valor === null || valor === undefined) return '';

  return String(valor)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function gerarIdSequenciasV060_(prefixo) {
  const data = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() ||
      'America/Sao_Paulo',
    'yyyyMMddHHmmss'
  );

  return (
    prefixo +
    '_' +
    data +
    '_' +
    Utilities.getUuid()
      .slice(0, 8)
      .toUpperCase()
  );
}
