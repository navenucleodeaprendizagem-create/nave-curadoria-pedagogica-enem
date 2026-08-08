/**
 * NAVE — VALIDAÇÃO DOCENTE
 * Consolidação estrutural V1.0
 *
 * Reúne, sem alterar a lógica validada:
 * - ComplementoV05.gs
 * - CorrecaoFilaValidacoesV051.gs
 * - UtilitariosFilaValidacoesV100.gs
 *
 * Os nomes públicos das funções foram preservados.
 */



/* ==========================================================
   BLOCO 1 — VALIDAÇÃO DOCENTE E ESTRUTURA V0.5
   ========================================================== */

/**
 * NAVE — COMPLEMENTO DA VERSÃO 0.5
 * Validação Docente e Governança da Curadoria
 *
 * Adicione este arquivo ao projeto com o nome:
 * ComplementoV05.gs
 *
 * Adicione também o arquivo HTML:
 * ValidarQuestaoV05.html
 *
 * No onOpen() do Código.gs, após instalarMenuV04(), acrescente:
 * instalarMenuV05();
 */

const NAVE_V05 = Object.freeze({
  VERSAO: '0.5.0',
  ABAS: {
    BASE: 'QUESTOES_GERAL',
    VALIDACOES: 'VALIDACOES_DOCENTES',
    FILA: 'FILA_COORDENACAO_V05',
    HISTORICO: 'HISTORICO_ALTERACOES',
    CONFIG: 'CONFIG_MVP'
  },
  COR_PRINCIPAL: '#0F766E',
  COR_SECUNDARIA: '#D1FAE5',
  COR_ALERTA: '#FEF3C7',
  COR_ERRO: '#FECACA',
  COR_INFO: '#E0F2FE'
});


/* =========================================================
   INSTALAÇÃO E MENU
   ========================================================= */

function instalarMenuV05() {
  SpreadsheetApp.getUi()
    .createMenu('NAVE — Versão 0.5')
    .addItem('Instalar estrutura da versão 0.5', 'atualizarMvpV05')
    .addSeparator()
    .addItem('Validar questão selecionada', 'abrirValidacaoQuestaoV05')
    .addItem('Abrir validações docentes', 'abrirValidacoesDocentesV05')
    .addItem('Abrir fila da coordenação — V0.5', 'abrirFilaCoordenacaoV05')
    .addItem('Recalcular consolidação das validações', 'recalcularValidacoesV05')
    .addItem('Decidir caso selecionado','abrirDecisaoCoordenacaoV05')
    .addSeparator()
    .addItem('Atualizar painel de qualidade','atualizarPainelQualidadeV05')
    .addItem('Abrir painel de qualidade','abrirPainelQualidadeV05')
    .addItem('Abrir painel operacional da coordenação','abrirPainelCoordenacaoV05')
    .addItem('Atualizar indicadores de validação','atualizarIndicadoresVisuaisValidacaoV05')
    .addToUi();
}


function atualizarMvpV05() {
  const ss = SpreadsheetApp.getActive();
  const base = ss.getSheetByName(NAVE_V05.ABAS.BASE);

  if (!base) {
    throw new Error('A aba QUESTOES_GERAL não foi encontrada.');
  }

  garantirCamposV05_(ss);
  criarOuAtualizarValidacoesDocentesV05_(ss);
  criarOuAtualizarFilaCoordenacaoV05_(ss);
  registrarVersaoV05_(ss);
  recalcularValidacoesV05();

  SpreadsheetApp.getUi().alert(
    'Versão 0.5 instalada',
    [
      'Foram criados:',
      '• VALIDACOES_DOCENTES;',
      '• FILA_COORDENACAO_V05;',
      '• campos consolidados em QUESTOES_GERAL;',
      '• formulário de validação docente.',
      '',
      'A FILA_COORDENACAO original foi preservada para não interferir no fluxo de reportes da versão 0.3.'
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


/* =========================================================
   ESTRUTURA DAS ABAS
   ========================================================= */

function criarOuAtualizarValidacoesDocentesV05_(ss) {
  let aba = ss.getSheetByName(NAVE_V05.ABAS.VALIDACOES);

  const headers = [
    'id_validacao',
    'data_validacao',
    'professor',
    'id_ocorrencia',
    'ano',
    'edicao',
    'habilidade_atual',
    'objeto_atual',
    'acao_cognitiva_atual',
    'dificuldade_atual',
    'funcao_pedagogica_atual',
    'avaliacao_objeto',
    'objeto_sugerido',
    'avaliacao_acao_cognitiva',
    'acao_cognitiva_sugerida',
    'avaliacao_dificuldade',
    'dificuldade_sugerida',
    'avaliacao_funcao_pedagogica',
    'funcao_pedagogica_sugerida_docente',
    'avaliacao_trecho',
    'parecer_geral',
    'observacao_docente',
    'possui_divergencia',
    'tipos_divergencia',
    'status_validacao',
    'versao_registro_avaliada'
  ];

  if (!aba) {
    aba = ss.insertSheet(NAVE_V05.ABAS.VALIDACOES);
    aba.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const atuais = aba.getRange(1, 1, 1, Math.max(aba.getLastColumn(), 1))
      .getValues()[0]
      .map(String);

    const ausentes = headers.filter(h => !atuais.includes(h));
    if (ausentes.length) {
      aba.getRange(1, aba.getLastColumn() + 1, 1, ausentes.length)
        .setValues([ausentes]);
    }
  }

  const ultimaColuna = aba.getLastColumn();
  estilizarCabecalhoV05_(aba.getRange(1, 1, 1, ultimaColuna));
  aba.setFrozenRows(1);
  aba.setColumnWidth(1, 190);
  aba.setColumnWidth(2, 150);
  aba.setColumnWidth(3, 240);
  aba.setColumnWidth(4, 180);
  aba.setColumnWidth(8, 300);
  aba.setColumnWidth(12, 190);
  aba.setColumnWidth(13, 300);
  aba.setColumnWidth(20, 180);
  aba.setColumnWidth(21, 200);
  aba.setColumnWidth(22, 420);
  aba.setColumnWidth(24, 330);
}


function criarOuAtualizarFilaCoordenacaoV05_(ss) {
  let aba = ss.getSheetByName(NAVE_V05.ABAS.FILA);

  const headers = [
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
    'responsavel_coordenacao',
    'decisao_coordenacao',
    'justificativa_coordenacao',
    'data_decisao',
    'resolvido'
  ];

  if (!aba) {
    aba = ss.insertSheet(NAVE_V05.ABAS.FILA);
    aba.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const atuais = aba.getRange(1, 1, 1, Math.max(aba.getLastColumn(), 1))
      .getValues()[0]
      .map(String);

    const ausentes = headers.filter(h => !atuais.includes(h));
    if (ausentes.length) {
      aba.getRange(1, aba.getLastColumn() + 1, 1, ausentes.length)
        .setValues([ausentes]);
    }
  }

  estilizarCabecalhoV05_(aba.getRange(1, 1, 1, aba.getLastColumn()));
  aba.setFrozenRows(1);
  aba.setColumnWidth(1, 110);
  aba.setColumnWidth(2, 170);
  aba.setColumnWidth(3, 190);
  aba.setColumnWidth(4, 180);
  aba.setColumnWidth(6, 230);
  aba.setColumnWidth(8, 300);
  aba.setColumnWidth(9, 340);
  aba.setColumnWidth(11, 420);
  aba.setColumnWidth(13, 240);
  aba.setColumnWidth(14, 420);

  const n = Math.max(aba.getMaxRows() - 1, 1);

  aba.getRange(2, 1, n, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Crítica', 'Alta', 'Normal', 'Baixa'], true)
      .setAllowInvalid(false)
      .build()
  );

  aba.getRange(2, 2, n, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(
        ['Aguardando coordenação', 'Em análise', 'Devolvida ao docente', 'Resolvida'],
        true
      )
      .setAllowInvalid(false)
      .build()
  );

  aba.getRange(2, 13, n, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Manter classificação atual',
        'Aceitar sugestão docente',
        'Solicitar nova avaliação',
        'Suspender questão',
        'Homologar questão'
      ], true)
      .setAllowInvalid(true)
      .build()
  );

  aba.getRange(2, 16, n, 1).insertCheckboxes();
}


function garantirCamposV05_(ss) {
  const base = ss.getSheetByName(NAVE_V05.ABAS.BASE);
  const headers = base.getRange(1, 1, 1, base.getLastColumn())
    .getValues()[0]
    .map(String);

  const novos = [
    'status_validacao',
    'quantidade_validacoes',
    'quantidade_concordancias',
    'quantidade_divergencias',
    'ultima_validacao_em',
    'ultima_validacao_por',
    'maturidade_curadoria',
    'ultima_divergencia_validacao',
    'homologada_em',
    'homologada_por'
  ];

  const ausentes = novos.filter(h => !headers.includes(h));
  if (!ausentes.length) return;

  const inicio = base.getLastColumn() + 1;
  base.getRange(1, inicio, 1, ausentes.length).setValues([ausentes]);
  estilizarCabecalhoV05_(base.getRange(1, inicio, 1, ausentes.length));

  const n = base.getLastRow() - 1;
  if (n <= 0) return;

  ausentes.forEach((campo, i) => {
    let valor = '';

    if (campo === 'status_validacao') valor = 'Não avaliada';
    if (campo === 'maturidade_curadoria') valor = 'Importada';
    if ([
      'quantidade_validacoes',
      'quantidade_concordancias',
      'quantidade_divergencias'
    ].includes(campo)) valor = 0;

    if (valor !== '') {
      base.getRange(2, inicio + i, n, 1).setValue(valor);
    }
  });
}


function registrarVersaoV05_(ss) {
  const aba = ss.getSheetByName(NAVE_V05.ABAS.CONFIG);
  if (!aba) return;

  const valores = aba.getDataRange().getDisplayValues().flat();
  if (valores.includes('VERSAO_05')) return;

  const linha = aba.getLastRow() + 2;

  aba.getRange(linha, 1, 7, 2).setValues([
    ['VERSAO_05', '0.5.0'],
    ['validacao_docente', 'Ativo'],
    ['fila_validacao_coordenacao', 'Ativo'],
    ['deteccao_divergencia', 'Ativo'],
    ['consolidacao_validacoes', 'Ativo'],
    ['maturidade_curadoria', 'Ativo'],
    ['instalado_em', new Date()]
  ]);

  aba.getRange(linha, 1, 1, 2)
    .setBackground(NAVE_V05.COR_SECUNDARIA)
    .setFontWeight('bold');
}


/* =========================================================
   ABERTURA E DADOS DO FORMULÁRIO
   ========================================================= */

function abrirValidacaoQuestaoV05() {
  const id = obterIdQuestaoSelecionadaV05_();

  if (!id) {
    SpreadsheetApp.getUi().alert(
      'Selecione uma questão em RESULTADO_BUSCA, SEQUENCIA_ATUAL ou ALERTAS_TECNICOS.'
    );
    return;
  }

  abrirValidacaoQuestaoPorIdV05(id);
}


function abrirValidacaoQuestaoPorIdV05(id) {
  if (!id) throw new Error('Questão não informada.');

  const template = HtmlService.createTemplateFromFile('ValidarQuestaoV100');
  template.idQuestao = String(id);

  SpreadsheetApp.getUi().showSidebar(
    template.evaluate()
      .setTitle('Validar questão — versão 0.5')
      .setWidth(500)
  );
}


function obterIdQuestaoSelecionadaV05_() {
  if (typeof obterIdQuestaoSelecionadaV04_ === 'function') {
    const idV04 = obterIdQuestaoSelecionadaV04_();
    if (idV04) return idV04;
  }

  const ss = SpreadsheetApp.getActive();
  const aba = ss.getActiveSheet();
  const linha = aba.getActiveRange().getRow();
  const nome = aba.getName();

  if (nome === 'RESULTADO_BUSCA' && linha >= 2) {
    return aba.getRange(linha, 2).getDisplayValue();
  }

  if (nome === 'SEQUENCIA_ATUAL' && linha >= 12) {
    return aba.getRange(linha, 2).getDisplayValue();
  }

  if (nome === 'ALERTAS_TECNICOS' && linha >= 2) {
    return aba.getRange(linha, 3).getDisplayValue();
  }

  return '';
}


function obterDadosValidacaoV05(id) {
  const ss = SpreadsheetApp.getActive();
  const base = ss.getSheetByName(NAVE_V05.ABAS.BASE);
  const dados = base.getDataRange().getValues();
  const idx = indexarCabecalhosV05_(dados[0]);

  const linha = dados.findIndex((r, i) =>
    i > 0 &&
    String(r[idx.id_ocorrencia] || '').trim() === String(id || '').trim()
  );

  if (linha < 0) throw new Error('Questão não localizada: ' + id);

  const r = dados[linha];

  return {
    id: r[idx.id_ocorrencia],
    ano: r[idx.ano],
    edicao: r[idx.edicao],
    competencia: r[idx.competencia],
    habilidade: r[idx.habilidade],
    objeto: r[idx.objeto_principal],
    acaoCognitiva: idx.acao_cognitiva_especifica !== undefined
      ? r[idx.acao_cognitiva_especifica]
      : '',
    dificuldade: r[idx.dificuldade_rotulo],
    funcao: r[idx.funcao_pedagogica_sugerida],
    trecho: r[idx.trecho_inicial],
    statusCuradoria: r[idx.status_curadoria],
    statusValidacao: idx.status_validacao !== undefined
      ? r[idx.status_validacao]
      : 'Não avaliada',
    versaoRegistro: Number(r[idx.versao_registro]) || 1
  };
}


/* =========================================================
   GRAVAÇÃO DA VALIDAÇÃO
   ========================================================= */

function salvarValidacaoDocenteV05(form) {
  if (!form || !form.idQuestao) {
    throw new Error('Questão não informada.');
  }

  const obrigatorios = [
    ['avaliacaoObjeto', 'Avaliação do objeto'],
    ['avaliacaoAcao', 'Avaliação da ação cognitiva'],
    ['avaliacaoDificuldade', 'Avaliação da dificuldade'],
    ['avaliacaoFuncao', 'Avaliação da função pedagógica'],
    ['avaliacaoTrecho', 'Avaliação do trecho'],
    ['parecerGeral', 'Parecer geral']
  ];

  obrigatorios.forEach(([campo, rotulo]) => {
    if (!String(form[campo] || '').trim()) {
      throw new Error(`Preencha: ${rotulo}.`);
    }
  });

  const ss = SpreadsheetApp.getActive();
  const base = ss.getSheetByName(NAVE_V05.ABAS.BASE);
  const validacoes = ss.getSheetByName(NAVE_V05.ABAS.VALIDACOES);

  if (!validacoes) {
    throw new Error(
      'A aba VALIDACOES_DOCENTES não existe. Execute atualizarMvpV05().'
    );
  }

  const dadosBase = base.getDataRange().getValues();
  const idxBase = indexarCabecalhosV05_(dadosBase[0]);
  const idQuestao = String(form.idQuestao).trim();

  const linhaBase = dadosBase.findIndex((r, i) =>
    i > 0 &&
    String(r[idxBase.id_ocorrencia] || '').trim() === idQuestao
  );

  if (linhaBase < 0) throw new Error('Questão não localizada.');

  const r = dadosBase[linhaBase];
  const professor =
    Session.getActiveUser().getEmail() ||
    String(form.professor || '').trim() ||
    'Professor não identificado';

  const divergencias = detectarDivergenciasV05_(form);
  const possuiDivergencia = divergencias.length > 0;
  const idValidacao = gerarIdV05_('VAL');
  const versao = Number(r[idxBase.versao_registro]) || 1;

  const idxVal = indexarCabecalhosV05_(
    validacoes.getRange(1, 1, 1, validacoes.getLastColumn()).getValues()[0]
  );

  const linhaSaida = Array(validacoes.getLastColumn()).fill('');

  preencherLinhaV05_(linhaSaida, idxVal, {
    id_validacao: idValidacao,
    data_validacao: new Date(),
    professor,
    id_ocorrencia: idQuestao,
    ano: r[idxBase.ano],
    edicao: r[idxBase.edicao],
    habilidade_atual: r[idxBase.habilidade],
    objeto_atual: r[idxBase.objeto_principal],
    acao_cognitiva_atual:
      idxBase.acao_cognitiva_especifica !== undefined
        ? r[idxBase.acao_cognitiva_especifica]
        : '',
    dificuldade_atual: r[idxBase.dificuldade_rotulo],
    funcao_pedagogica_atual: r[idxBase.funcao_pedagogica_sugerida],
    avaliacao_objeto: form.avaliacaoObjeto,
    objeto_sugerido: form.objetoSugerido || '',
    avaliacao_acao_cognitiva: form.avaliacaoAcao,
    acao_cognitiva_sugerida: form.acaoSugerida || '',
    avaliacao_dificuldade: form.avaliacaoDificuldade,
    dificuldade_sugerida: form.dificuldadeSugerida || '',
    avaliacao_funcao_pedagogica: form.avaliacaoFuncao,
    funcao_pedagogica_sugerida_docente: form.funcaoSugerida || '',
    avaliacao_trecho: form.avaliacaoTrecho,
    parecer_geral: form.parecerGeral,
    observacao_docente: form.observacao || '',
    possui_divergencia: possuiDivergencia ? 'Sim' : 'Não',
    tipos_divergencia: divergencias.join('; '),
    status_validacao: possuiDivergencia
      ? 'Aguardando coordenação'
      : 'Registrada',
    versao_registro_avaliada: versao
  });

  validacoes.appendRow(linhaSaida);

  if (possuiDivergencia) {
    inserirNaFilaCoordenacaoV05_({
      idValidacao,
      idQuestao,
      professor,
      habilidade: r[idxBase.habilidade],
      objeto: r[idxBase.objeto_principal],
      divergencias,
      parecer: form.parecerGeral,
      observacao: form.observacao || ''
    });
  }

  recalcularValidacoesV05();

  sincronizarIndicadoresValidacaoV05();

  return {
    mensagem: possuiDivergencia
      ? 'Validação registrada e enviada para a coordenação.'
      : 'Validação registrada sem divergências.',
    idValidacao,
    possuiDivergencia,
    divergencias
  };
}


function detectarDivergenciasV05_(form) {
  const divergencias = [];

  if (form.avaliacaoObjeto === 'Incorreto') {
    divergencias.push('Objeto de conhecimento');
  }

  if (form.avaliacaoAcao === 'Incorreta') {
    divergencias.push('Ação cognitiva');
  }

  if (['Superestimada', 'Subestimada'].includes(form.avaliacaoDificuldade)) {
    divergencias.push('Dificuldade');
  }

  if (form.avaliacaoFuncao === 'Inadequada') {
    divergencias.push('Função pedagógica');
  }

  if (form.avaliacaoTrecho === 'Inadequado') {
    divergencias.push('Trecho inicial');
  }

  if (['Solicitar ajuste', 'Inadequada para uso'].includes(form.parecerGeral)) {
    divergencias.push('Parecer geral');
  }

  return [...new Set(divergencias)];
}


function inserirNaFilaCoordenacaoV05_(dados) {
  const ss = SpreadsheetApp.getActive();
  const fila = ss.getSheetByName(NAVE_V05.ABAS.FILA);

  if (!fila) {
    throw new Error(
      'A aba FILA_COORDENACAO_V05 não existe. Execute atualizarMvpV05().'
    );
  }

  const idx = indexarCabecalhosV05_(
    fila.getRange(1, 1, 1, fila.getLastColumn()).getValues()[0]
  );

  const prioridade = dados.parecer === 'Inadequada para uso'
    ? 'Crítica'
    : dados.divergencias.length >= 3
      ? 'Alta'
      : 'Normal';

  const linha = Array(fila.getLastColumn()).fill('');

  preencherLinhaV05_(linha, idx, {
    prioridade,
    status_fila: 'Aguardando coordenação',
    id_validacao: dados.idValidacao,
    id_ocorrencia: dados.idQuestao,
    data_entrada: new Date(),
    professor: dados.professor,
    habilidade: dados.habilidade,
    objeto_atual: dados.objeto,
    tipos_divergencia: dados.divergencias.join('; '),
    parecer_geral: dados.parecer,
    observacao_docente: dados.observacao,
    resolvido: false
  });

  const linhaDestino = encontrarPrimeiraLinhaLivreFilaV052_(
    fila,
    idx.id_validacao + 1
  );

  garantirLinhasFilaV052_(fila, linhaDestino);

  fila.getRange(
    linhaDestino,
    1,
    1,
    fila.getLastColumn()
  ).setValues([linha]);

  fila.getRange(
    linhaDestino,
    idx.resolvido + 1
  ).insertCheckboxes();

  fila.getRange(
    linhaDestino,
    1,
    1,
    fila.getLastColumn()
  )
    .setWrap(true)
    .setVerticalAlignment('top');
}


/* =========================================================
   CONSOLIDAÇÃO
   ========================================================= */

function recalcularValidacoesV05() {
  const ss = SpreadsheetApp.getActive();
  const base = ss.getSheetByName('QUESTOES_GERAL');
  const validacoes = ss.getSheetByName('VALIDACOES_DOCENTES');
  const fila = ss.getSheetByName('FILA_COORDENACAO_V05');

  if (!base || !validacoes) {
    throw new Error(
      'As abas QUESTOES_GERAL e VALIDACOES_DOCENTES são obrigatórias.'
    );
  }

  const dadosBase = base.getDataRange().getValues();
  const idxBase = indexarCabecalhosConsolidacaoV055_(dadosBase[0]);

  const dadosVal = validacoes.getDataRange().getValues();
  const idxVal = indexarCabecalhosConsolidacaoV055_(dadosVal[0]);

  const dadosFila = fila && fila.getLastRow() >= 1
    ? fila.getDataRange().getValues()
    : [];

  const idxFila = dadosFila.length
    ? indexarCabecalhosConsolidacaoV055_(dadosFila[0])
    : {};

  validarCamposConsolidacaoV055_(
    idxBase,
    [
      'id_ocorrencia',
      'status_validacao',
      'quantidade_validacoes',
      'quantidade_concordancias',
      'quantidade_divergencias',
      'ultima_validacao_em',
      'ultima_validacao_por',
      'maturidade_curadoria',
      'ultima_divergencia_validacao'
    ],
    'QUESTOES_GERAL'
  );

  validarCamposConsolidacaoV055_(
    idxVal,
    [
      'id_validacao',
      'data_validacao',
      'professor',
      'id_ocorrencia',
      'possui_divergencia',
      'tipos_divergencia',
      'status_validacao'
    ],
    'VALIDACOES_DOCENTES'
  );

  const validacoesPorQuestao = new Map();

  for (let i = 1; i < dadosVal.length; i++) {
    const idQuestao = textoConsolidacaoV055_(
      dadosVal[i][idxVal.id_ocorrencia]
    );

    if (!idQuestao) continue;

    if (!validacoesPorQuestao.has(idQuestao)) {
      validacoesPorQuestao.set(idQuestao, []);
    }

    validacoesPorQuestao.get(idQuestao).push(dadosVal[i]);
  }

  const filaPorValidacao = new Map();

  if (dadosFila.length > 1 && idxFila.id_validacao !== undefined) {
    for (let i = 1; i < dadosFila.length; i++) {
      const idValidacao = textoConsolidacaoV055_(
        dadosFila[i][idxFila.id_validacao]
      );

      if (!idValidacao) continue;
      filaPorValidacao.set(idValidacao, dadosFila[i]);
    }
  }

  const total = dadosBase.length - 1;

  const saidas = {
    status_validacao: dadosBase.slice(1).map(r => [
      r[idxBase.status_validacao] || 'Não avaliada'
    ]),
    quantidade_validacoes: dadosBase.slice(1).map(r => [
      Number(r[idxBase.quantidade_validacoes] || 0)
    ]),
    quantidade_concordancias: dadosBase.slice(1).map(r => [
      Number(r[idxBase.quantidade_concordancias] || 0)
    ]),
    quantidade_divergencias: dadosBase.slice(1).map(r => [
      Number(r[idxBase.quantidade_divergencias] || 0)
    ]),
    ultima_validacao_em: dadosBase.slice(1).map(r => [
      r[idxBase.ultima_validacao_em] || ''
    ]),
    ultima_validacao_por: dadosBase.slice(1).map(r => [
      r[idxBase.ultima_validacao_por] || ''
    ]),
    maturidade_curadoria: dadosBase.slice(1).map(r => [
      r[idxBase.maturidade_curadoria] || 'Importada'
    ]),
    ultima_divergencia_validacao: dadosBase.slice(1).map(r => [
      r[idxBase.ultima_divergencia_validacao] || ''
    ])
  };

  let questoesConsolidadas = 0;

  for (let i = 1; i < dadosBase.length; i++) {
    const pos = i - 1;
    const idQuestao = textoConsolidacaoV055_(
      dadosBase[i][idxBase.id_ocorrencia]
    );

    const vals = validacoesPorQuestao.get(idQuestao) || [];

    if (!vals.length) {
      saidas.status_validacao[pos][0] = 'Não avaliada';
      saidas.quantidade_validacoes[pos][0] = 0;
      saidas.quantidade_concordancias[pos][0] = 0;
      saidas.quantidade_divergencias[pos][0] = 0;
      saidas.ultima_validacao_em[pos][0] = '';
      saidas.ultima_validacao_por[pos][0] = '';
      saidas.maturidade_curadoria[pos][0] = 'Importada';
      saidas.ultima_divergencia_validacao[pos][0] = '';
      continue;
    }

    questoesConsolidadas++;

    const resumo = consolidarValidacoesQuestaoV055_(
      vals,
      idxVal,
      filaPorValidacao,
      idxFila
    );

    saidas.quantidade_validacoes[pos][0] = resumo.totalValidacoes;
    saidas.quantidade_concordancias[pos][0] = resumo.concordantes;
    saidas.quantidade_divergencias[pos][0] = resumo.divergenciasHistoricas;
    saidas.ultima_validacao_em[pos][0] = resumo.ultimaData;
    saidas.ultima_validacao_por[pos][0] = resumo.ultimoProfessor;
    saidas.status_validacao[pos][0] = resumo.statusValidacao;
    saidas.maturidade_curadoria[pos][0] = resumo.maturidade;
    saidas.ultima_divergencia_validacao[pos][0] =
      resumo.divergenciasAtivas.join(' | ');
  }

  escreverColunaConsolidacaoV055_(
    base, idxBase, 'status_validacao',
    saidas.status_validacao, total
  );

  escreverColunaConsolidacaoV055_(
    base, idxBase, 'quantidade_validacoes',
    saidas.quantidade_validacoes, total
  );

  escreverColunaConsolidacaoV055_(
    base, idxBase, 'quantidade_concordancias',
    saidas.quantidade_concordancias, total
  );

  escreverColunaConsolidacaoV055_(
    base, idxBase, 'quantidade_divergencias',
    saidas.quantidade_divergencias, total
  );

  escreverColunaConsolidacaoV055_(
    base, idxBase, 'ultima_validacao_em',
    saidas.ultima_validacao_em, total
  );

  escreverColunaConsolidacaoV055_(
    base, idxBase, 'ultima_validacao_por',
    saidas.ultima_validacao_por, total
  );

  escreverColunaConsolidacaoV055_(
    base, idxBase, 'maturidade_curadoria',
    saidas.maturidade_curadoria, total
  );

  escreverColunaConsolidacaoV055_(
    base, idxBase, 'ultima_divergencia_validacao',
    saidas.ultima_divergencia_validacao, total
  );

  base.getRange(
    2,
    idxBase.ultima_validacao_em + 1,
    total,
    1
  ).setNumberFormat('dd/MM/yyyy HH:mm:ss');

  SpreadsheetApp.flush();

  return questoesConsolidadas;
}


function consolidarValidacoesQuestaoV055_(
  validacoes,
  idxVal,
  filaPorValidacao,
  idxFila
) {
  const ordenadas = validacoes.slice().sort((a, b) =>
    dataMillisConsolidacaoV055_(b[idxVal.data_validacao]) -
    dataMillisConsolidacaoV055_(a[idxVal.data_validacao])
  );

  const ultima = ordenadas[0];

  let concordantes = 0;
  let divergenciasHistoricas = 0;
  let divergenciasAbertas = 0;
  let divergenciasResolvidas = 0;
  let aguardandoNovaAvaliacao = false;
  let homologada = false;
  let suspensa = false;
  let ajustadaCoordenacao = false;

  const divergenciasAtivas = [];

  validacoes.forEach(v => {
    const possuiDivergencia =
      textoConsolidacaoV055_(v[idxVal.possui_divergencia]) === 'Sim';

    if (!possuiDivergencia) {
      concordantes++;
      return;
    }

    divergenciasHistoricas++;

    const idValidacao = textoConsolidacaoV055_(
      v[idxVal.id_validacao]
    );

    const registroFila = filaPorValidacao.get(idValidacao);

    if (!registroFila) {
      divergenciasAbertas++;
      adicionarTiposDivergenciaV055_(
        divergenciasAtivas,
        v[idxVal.tipos_divergencia]
      );
      return;
    }

    const statusFila = idxFila.status_fila !== undefined
      ? textoConsolidacaoV055_(registroFila[idxFila.status_fila])
      : '';

    const decisao = idxFila.decisao_coordenacao !== undefined
      ? textoConsolidacaoV055_(
          registroFila[idxFila.decisao_coordenacao]
        )
      : '';

    const resolvido = idxFila.resolvido !== undefined
      ? registroFila[idxFila.resolvido] === true
      : false;

    if (
      decisao === 'Solicitar nova avaliação' ||
      statusFila === 'Devolvida ao docente'
    ) {
      aguardandoNovaAvaliacao = true;
      divergenciasAbertas++;

      adicionarTiposDivergenciaV055_(
        divergenciasAtivas,
        v[idxVal.tipos_divergencia]
      );

      return;
    }

    if (
      resolvido ||
      statusFila === 'Resolvida'
    ) {
      divergenciasResolvidas++;

      if (decisao === 'Homologar questão') homologada = true;
      if (decisao === 'Suspender questão') suspensa = true;

      if (
        [
          'Aceitar sugestão docente',
          'Manter classificação atual'
        ].includes(decisao)
      ) {
        ajustadaCoordenacao = true;
      }

      return;
    }

    divergenciasAbertas++;

    adicionarTiposDivergenciaV055_(
      divergenciasAtivas,
      v[idxVal.tipos_divergencia]
    );
  });

  let statusValidacao = '';
  let maturidade = '';

  if (suspensa) {
    statusValidacao = 'Suspensa pela coordenação';
    maturidade = 'Suspensa';
  } else if (homologada) {
    statusValidacao = 'Homologada';
    maturidade = 'Homologada';
  } else if (aguardandoNovaAvaliacao) {
    statusValidacao = 'Aguardando nova avaliação';
    maturidade = 'Em validação';
  } else if (divergenciasAbertas > 0) {
    statusValidacao = 'Com divergência aberta';
    maturidade = 'Com divergência';
  } else if (
    divergenciasHistoricas > 0 &&
    divergenciasResolvidas === divergenciasHistoricas
  ) {
    statusValidacao = 'Divergência resolvida';
    maturidade = ajustadaCoordenacao
      ? 'Ajustada pela coordenação'
      : 'Validada por docente';
  } else {
    statusValidacao = validacoes.length >= 2
      ? 'Validada por docentes'
      : 'Validada por docente';

    maturidade = 'Validada por docente';
  }

  return {
    totalValidacoes: validacoes.length,
    concordantes,
    divergenciasHistoricas,
    divergenciasAbertas,
    divergenciasResolvidas,
    divergenciasAtivas: [...new Set(divergenciasAtivas)],
    ultimaData: ultima[idxVal.data_validacao] || '',
    ultimoProfessor: ultima[idxVal.professor] || '',
    statusValidacao,
    maturidade
  };
}


function adicionarTiposDivergenciaV055_(destino, valor) {
  textoConsolidacaoV055_(valor)
    .split(';')
    .map(x => x.trim())
    .filter(Boolean)
    .forEach(x => destino.push(x));
}


function escreverColunaConsolidacaoV055_(
  aba,
  idx,
  campo,
  valores,
  total
) {
  if (idx[campo] === undefined || total <= 0) return;

  aba.getRange(
    2,
    idx[campo] + 1,
    total,
    1
  ).setValues(valores);
}


function indexarCabecalhosConsolidacaoV055_(headers) {
  const idx = {};

  headers.forEach((valor, i) => {
    const chave = textoConsolidacaoV055_(valor);
    if (chave) idx[chave] = i;
  });

  return idx;
}


function validarCamposConsolidacaoV055_(
  idx,
  obrigatorios,
  nomeAba
) {
  const faltantes = obrigatorios.filter(campo =>
    idx[campo] === undefined
  );

  if (faltantes.length) {
    throw new Error(
      `Campos ausentes em ${nomeAba}: ${faltantes.join(', ')}`
    );
  }
}


function textoConsolidacaoV055_(valor) {
  if (valor === null || valor === undefined) return '';

  return String(valor)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function dataMillisConsolidacaoV055_(valor) {
  if (!valor) return 0;

  const data = Object.prototype.toString.call(valor) === '[object Date]'
    ? valor
    : new Date(valor);

  return isNaN(data.getTime()) ? 0 : data.getTime();
}

/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function abrirValidacoesDocentesV05() {
  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(NAVE_V05.ABAS.VALIDACOES);

  if (!aba) {
    throw new Error('Execute atualizarMvpV05() primeiro.');
  }

  ss.setActiveSheet(aba);
}


function abrirFilaCoordenacaoV05() {
  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(NAVE_V05.ABAS.FILA);

  if (!aba) {
    throw new Error('Execute atualizarMvpV05() primeiro.');
  }

  ss.setActiveSheet(aba);
}


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function estilizarCabecalhoV05_(range) {
  range
    .setBackground(NAVE_V05.COR_PRINCIPAL)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
}


function indexarCabecalhosV05_(headers) {
  const idx = {};

  headers.forEach((valor, i) => {
    const nome = String(valor || '').trim();
    if (nome) idx[nome] = i;
  });

  return idx;
}


function preencherLinhaV05_(linha, idx, valores) {
  Object.keys(valores).forEach(campo => {
    if (idx[campo] !== undefined) {
      linha[idx[campo]] = valores[campo];
    }
  });
}


function gerarIdV05_(prefixo) {
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
   BLOCO 2 — RECONSTRUÇÃO DA FILA V0.5.1
   ========================================================== */

/**
 * NAVE — CORREÇÃO DA FILA DE VALIDAÇÕES — V0.5.1
 *
 * Adicione este arquivo ao projeto com o nome:
 * CorrecaoFilaValidacoesV051.gs
 *
 * Execute uma vez:
 * reconstruirFilaCoordenacaoV051()
 *
 * A rotina:
 * - lê VALIDACOES_DOCENTES;
 * - identifica divergências registradas;
 * - insere na FILA_COORDENACAO_V05 somente validações ainda ausentes;
 * - evita duplicidade pelo id_validacao;
 * - recalcula a consolidação ao final.
 */

function reconstruirFilaCoordenacaoV051() {
  const ss = SpreadsheetApp.getActive();
  const validacoes = ss.getSheetByName('VALIDACOES_DOCENTES');
  const fila = ss.getSheetByName('FILA_COORDENACAO_V05');

  if (!validacoes || !fila) {
    throw new Error(
      'As abas VALIDACOES_DOCENTES e FILA_COORDENACAO_V05 são obrigatórias.'
    );
  }

  if (validacoes.getLastRow() < 2) {
    ss.toast(
      'Não há validações docentes para processar.',
      'NAVE — Fila V0.5.1',
      7
    );
    return {
      analisadas: 0,
      divergentes: 0,
      inseridas: 0,
      jaExistentes: 0
    };
  }

  const dadosVal = validacoes.getDataRange().getValues();
  const dadosFila = fila.getDataRange().getValues();

  const idxVal = indexarCabecalhosFilaV051_(dadosVal[0]);
  const idxFila = indexarCabecalhosFilaV051_(dadosFila[0]);

  const obrigatoriosVal = [
    'id_validacao',
    'data_validacao',
    'professor',
    'id_ocorrencia',
    'habilidade_atual',
    'objeto_atual',
    'avaliacao_objeto',
    'avaliacao_acao_cognitiva',
    'avaliacao_dificuldade',
    'avaliacao_funcao_pedagogica',
    'avaliacao_trecho',
    'parecer_geral',
    'observacao_docente'
  ];

  const obrigatoriosFila = [
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
    'resolvido'
  ];

  validarCabecalhosFilaV051_(idxVal, obrigatoriosVal, 'VALIDACOES_DOCENTES');
  validarCabecalhosFilaV051_(idxFila, obrigatoriosFila, 'FILA_COORDENACAO_V05');

  const idsExistentes = new Set(
    dadosFila
      .slice(1)
      .map(r => textoFilaV051_(r[idxFila.id_validacao]))
      .filter(Boolean)
  );

  const novasLinhas = [];
  let divergentes = 0;
  let jaExistentes = 0;

  for (let i = 1; i < dadosVal.length; i++) {
    const r = dadosVal[i];
    const idValidacao = textoFilaV051_(r[idxVal.id_validacao]);

    if (!idValidacao) continue;

    const tipos = detectarDivergenciasDaLinhaV051_(r, idxVal);

    if (!tipos.length) continue;

    divergentes++;

    if (idsExistentes.has(idValidacao)) {
      jaExistentes++;
      continue;
    }

    const parecer = textoFilaV051_(r[idxVal.parecer_geral]);

    const prioridade = parecer === 'Inadequada para uso'
      ? 'Crítica'
      : tipos.length >= 3
        ? 'Alta'
        : 'Normal';

    const linha = Array(fila.getLastColumn()).fill('');

    preencherLinhaFilaV051_(linha, idxFila, {
      prioridade,
      status_fila: 'Aguardando coordenação',
      id_validacao: idValidacao,
      id_ocorrencia: textoFilaV051_(r[idxVal.id_ocorrencia]),
      data_entrada: r[idxVal.data_validacao] || new Date(),
      professor: textoFilaV051_(r[idxVal.professor]),
      habilidade: textoFilaV051_(r[idxVal.habilidade_atual]),
      objeto_atual: textoFilaV051_(r[idxVal.objeto_atual]),
      tipos_divergencia: tipos.join('; '),
      parecer_geral: parecer,
      observacao_docente: textoFilaV051_(r[idxVal.observacao_docente]),
      resolvido: false
    });

    novasLinhas.push(linha);
    idsExistentes.add(idValidacao);
  }

  if (novasLinhas.length) {
    const inicio = fila.getLastRow() + 1;
    garantirLinhasFilaV051_(fila, inicio + novasLinhas.length - 1);

    fila.getRange(
      inicio,
      1,
      novasLinhas.length,
      fila.getLastColumn()
    ).setValues(novasLinhas);

    fila.getRange(
      inicio,
      idxFila.resolvido + 1,
      novasLinhas.length,
      1
    ).insertCheckboxes();

    fila.getRange(
      inicio,
      1,
      novasLinhas.length,
      fila.getLastColumn()
    )
      .setWrap(true)
      .setVerticalAlignment('top');
  }

  if (typeof recalcularValidacoesV05 === 'function') {
    recalcularValidacoesV05();
  }

  SpreadsheetApp.flush();

  const resultado = {
    analisadas: dadosVal.length - 1,
    divergentes,
    inseridas: novasLinhas.length,
    jaExistentes
  };

  SpreadsheetApp.getUi().alert(
    'NAVE — Reconstrução da fila concluída',
    [
      `Validações analisadas: ${resultado.analisadas}`,
      `Validações divergentes: ${resultado.divergentes}`,
      `Inseridas na fila: ${resultado.inseridas}`,
      `Já existentes: ${resultado.jaExistentes}`
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  return resultado;
}


function detectarDivergenciasDaLinhaV051_(r, idx) {
  const divergencias = [];

  if (textoFilaV051_(r[idx.avaliacao_objeto]) === 'Incorreto') {
    divergencias.push('Objeto de conhecimento');
  }

  if (textoFilaV051_(r[idx.avaliacao_acao_cognitiva]) === 'Incorreta') {
    divergencias.push('Ação cognitiva');
  }

  const dificuldade = textoFilaV051_(r[idx.avaliacao_dificuldade]);
  if (['Superestimada', 'Subestimada'].includes(dificuldade)) {
    divergencias.push('Dificuldade');
  }

  if (
    textoFilaV051_(r[idx.avaliacao_funcao_pedagogica]) === 'Inadequada'
  ) {
    divergencias.push('Função pedagógica');
  }

  if (textoFilaV051_(r[idx.avaliacao_trecho]) === 'Inadequado') {
    divergencias.push('Trecho inicial');
  }

  const parecer = textoFilaV051_(r[idx.parecer_geral]);
  if (['Solicitar ajuste', 'Inadequada para uso'].includes(parecer)) {
    divergencias.push('Parecer geral');
  }

  return [...new Set(divergencias)];
}


function indexarCabecalhosFilaV051_(headers) {
  const idx = {};

  headers.forEach((valor, i) => {
    const nome = textoFilaV051_(valor);
    if (nome) idx[nome] = i;
  });

  return idx;
}


function validarCabecalhosFilaV051_(idx, obrigatorios, nomeAba) {
  const faltantes = obrigatorios.filter(campo => idx[campo] === undefined);

  if (faltantes.length) {
    throw new Error(
      `Campos ausentes em ${nomeAba}: ${faltantes.join(', ')}`
    );
  }
}


function preencherLinhaFilaV051_(linha, idx, valores) {
  Object.keys(valores).forEach(campo => {
    if (idx[campo] !== undefined) {
      linha[idx[campo]] = valores[campo];
    }
  });
}


function textoFilaV051_(valor) {
  if (valor === null || valor === undefined) return '';

  return String(valor)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function garantirLinhasFilaV051_(aba, ultimaLinhaNecessaria) {
  const atuais = aba.getMaxRows();

  if (atuais < ultimaLinhaNecessaria) {
    aba.insertRowsAfter(
      atuais,
      ultimaLinhaNecessaria - atuais
    );
  }
}


/* ==========================================================
   BLOCO 3 — UTILITÁRIOS DA FILA V1.0
   ========================================================== */

/**
 * NAVE — UTILITÁRIOS DA FILA DE VALIDAÇÕES
 * Consolidação V1.0
 *
 * Este arquivo substitui o conteúdo de:
 * CorrecaoInsercaoFilaV052.gs
 *
 * A função inserirNaFilaCoordenacaoV05_ permanece somente em
 * ComplementoV05.gs, evitando duplicidade global.
 */


/**
 * Procura a primeira linha realmente vazia pela coluna id_validacao.
 * Ignora validações de dados, formatação e caixas de seleção vazias.
 */
function encontrarPrimeiraLinhaLivreFilaV052_(aba, colunaIdValidacao) {
  const ultimaLinhaFisica = Math.max(aba.getMaxRows(), 2);

  const valores = aba.getRange(
    2,
    colunaIdValidacao,
    ultimaLinhaFisica - 1,
    1
  ).getDisplayValues();

  for (let i = 0; i < valores.length; i++) {
    if (!String(valores[i][0] || '').trim()) {
      return i + 2;
    }
  }

  return ultimaLinhaFisica + 1;
}


/**
 * Garante que a aba possua linhas suficientes para a gravação.
 */
function garantirLinhasFilaV052_(aba, linhaNecessaria) {
  const atuais = aba.getMaxRows();

  if (atuais < linhaNecessaria) {
    aba.insertRowsAfter(
      atuais,
      linhaNecessaria - atuais
    );
  }
}


/**
 * Move registros atualmente gravados depois de linhas vazias
 * para o topo da fila.
 *
 * Preserva o cabeçalho e reordena somente as linhas com id_validacao.
 *
 * Uso: executar manualmente apenas quando necessário.
 */
function compactarFilaCoordenacaoV052() {
  const ss = SpreadsheetApp.getActive();
  const fila = ss.getSheetByName(NAVE_V05.ABAS.FILA);

  if (!fila) {
    throw new Error('A aba FILA_COORDENACAO_V05 não foi encontrada.');
  }

  const dados = fila.getDataRange().getValues();
  const idx = indexarCabecalhosV05_(dados[0]);

  if (idx.id_validacao === undefined) {
    throw new Error(
      'Campo id_validacao ausente em FILA_COORDENACAO_V05.'
    );
  }

  const registros = dados
    .slice(1)
    .filter(
      linha => String(
        linha[idx.id_validacao] || ''
      ).trim()
    );

  const linhasLimpar = Math.max(
    fila.getMaxRows() - 1,
    1
  );

  fila.getRange(
    2,
    1,
    linhasLimpar,
    fila.getLastColumn()
  ).clearContent();

  if (registros.length) {
    fila.getRange(
      2,
      1,
      registros.length,
      fila.getLastColumn()
    ).setValues(registros);

    if (idx.resolvido !== undefined) {
      fila.getRange(
        2,
        idx.resolvido + 1,
        registros.length,
        1
      ).insertCheckboxes();
    }

    fila.getRange(
      2,
      1,
      registros.length,
      fila.getLastColumn()
    )
      .setWrap(true)
      .setVerticalAlignment('top');
  }

  SpreadsheetApp.flush();

  SpreadsheetApp.getUi().alert(
    'Fila compactada',
    registros.length +
      ' registro(s) mantido(s) em FILA_COORDENACAO_V05.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
