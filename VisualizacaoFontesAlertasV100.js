/**
 * NAVE — VISUALIZAÇÃO, FONTES E ALERTAS TÉCNICOS
 * Consolidação estrutural V1.0
 *
 * Reúne, sem alterar a lógica validada:
 * - ComplementoV04.gs
 * - CorrecaoAlertasV041.gs
 * - AplicarTrechosRecuperadosV041.gs
 *
 * Ajuste já incorporado:
 * - visualizador oficial: VisualizarQuestaoV101.html
 *
 * Os nomes públicos das funções foram preservados.
 */


/* ==========================================================
   BLOCO 1 — VISUALIZAÇÃO, FONTES E CORREÇÃO V0.4
   ========================================================== */

/**
 * NAVE — COMPLEMENTO DA VERSÃO 0.4
 * Curadoria Pedagógica de Química
 *
 * Mantenha o Código.gs da versão 0.3.
 * Adicione este arquivo ao mesmo projeto com o nome:
 * ComplementoV04.gs
 *
 * Também adicione:
 * - VisualizarQuestaoV04.html
 * - CorrigirTrecho.html
 */

const NAVE_V04 = Object.freeze({
  VERSAO: '0.4.0',
  ABAS: {
    BASE: 'QUESTOES_GERAL',
    PAINEL: 'PAINEL_QUIMICA',
    RESULTADO: 'RESULTADO_BUSCA',
    SEQUENCIA: 'SEQUENCIA_ATUAL',
    REPORTES: 'REPORTES',
    HISTORICO: 'HISTORICO_ALTERACOES',
    CONFIG: 'CONFIG_MVP',
    FONTES: 'FONTES_PDF',
    ALERTAS: 'ALERTAS_TECNICOS'
  },
  COR_PRINCIPAL: '#0F766E',
  COR_SECUNDARIA: '#D1FAE5',
  COR_ALERTA: '#FEF3C7',
  COR_ERRO: '#FECACA',
  COR_INFO: '#E0F2FE'
});

/**
 * Execute uma vez após instalar os três arquivos da versão 0.4.
 */
function atualizarMvpV04() {
  const ss = SpreadsheetApp.getActive();

  if (!ss.getSheetByName(NAVE_V04.ABAS.BASE)) {
    throw new Error('A aba QUESTOES_GERAL não foi encontrada.');
  }

  criarOuAtualizarFontesPdfV04_(ss);
  criarOuAtualizarAlertasV04_(ss);
  criarAcoesRapidasV04_(ss);
  garantirCamposV04_(ss);
  atualizarAlertasTecnicosV04();

  SpreadsheetApp.getUi().alert(
    'Versão 0.4 instalada',
    'Foram criados o catálogo de PDFs, o painel de alertas técnicos, a correção governada do trecho e as ações rápidas.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Use esta função no onOpen da versão 0.3 para acrescentar os itens da 0.4.
 *
 * Acrescente ao menu existente:
 * .addSeparator()
 * .addItem('Visualizar questão — versão 0.4', 'abrirVisualizacaoQuestaoV04')
 * .addItem('Corrigir trecho selecionado', 'abrirCorrecaoTrechoV04')
 * .addItem('Atualizar alertas técnicos', 'atualizarAlertasTecnicosV04')
 * .addItem('Abrir painel de alertas', 'abrirPainelAlertasV04')
 */
function instalarMenuV04() {
  SpreadsheetApp.getUi()
    .createMenu('NAVE — Versão 0.4')
    .addItem('Atualizar estrutura para versão 0.4', 'atualizarMvpV04')
    .addSeparator()
    .addItem('Visualizar questão — versão 0.4', 'abrirVisualizacaoQuestaoV04')
    .addItem('Corrigir trecho selecionado', 'abrirCorrecaoTrechoV04')
    .addItem('Atualizar alertas técnicos', 'atualizarAlertasTecnicosV04')
    .addItem('Abrir painel de alertas', 'abrirPainelAlertasV04')
    .addItem('Atualizar filtros dependentes', 'atualizarFiltrosDependentes')
    .addToUi();
}

/**
 * Chame instalarMenuV04() ao final do onOpen da versão 0.3.
 * Alternativamente, execute instalarMenuV04 manualmente após abrir a planilha.
 */

function criarOuAtualizarFontesPdfV04_(ss) {
  let aba = ss.getSheetByName(NAVE_V04.ABAS.FONTES);

  if (!aba) {
    aba = ss.insertSheet(NAVE_V04.ABAS.FONTES);
    const headers = [
      'colecao_origem',
      'area',
      'componente',
      'nome_publico',
      'url_pdf',
      'status_fonte',
      'observacao'
    ];

    aba.getRange(1,1,1,headers.length).setValues([headers]);
    estilizarCabecalhoV04_(aba.getRange(1,1,1,headers.length));

    aba.getRange(2,1,4,7).setValues([
      [
        'Natureza por Habilidades e Dificuldades',
        'CN',
        'Química',
        'Ciências da Natureza — questões regulares',
        '',
        'Aguardando URL',
        'Cole o link compartilhável do PDF armazenado no Google Drive.'
      ],
      [
        'Natureza PPL por Habilidades e Dificuldades',
        'CN',
        'Química',
        'Ciências da Natureza — PPL e especiais',
        '',
        'Aguardando URL',
        'Cole o link compartilhável do PDF armazenado no Google Drive.'
      ],
      [
        'Ciências da Natureza por Habilidades e Dificuldades',
        'CN',
        'Química',
        'Ciências da Natureza — coleção regular',
        '',
        'Aguardando URL',
        'Ajuste o nome da coleção para coincidir exatamente com QUESTOES_GERAL.'
      ],
      [
        'Ciências da Natureza PPL por Habilidades e Dificuldades',
        'CN',
        'Química',
        'Ciências da Natureza — coleção especial',
        '',
        'Aguardando URL',
        'Ajuste o nome da coleção para coincidir exatamente com QUESTOES_GERAL.'
      ]
    ]);

    aba.setFrozenRows(1);
    aba.setColumnWidth(1, 340);
    aba.setColumnWidth(4, 320);
    aba.setColumnWidth(5, 420);
    aba.setColumnWidth(7, 420);
  }

  const lastRow = Math.max(aba.getLastRow(), 2);
  aba.getRange(2,6,lastRow-1,1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(
        ['Aguardando URL','Disponível','Indisponível','Revisar vínculo'],
        true
      )
      .setAllowInvalid(false)
      .build()
  );
}

function criarOuAtualizarAlertasV04_(ss) {
  let aba = ss.getSheetByName(NAVE_V04.ABAS.ALERTAS);

  if (!aba) {
    aba = ss.insertSheet(NAVE_V04.ABAS.ALERTAS);
  } else {
    aba.clear();
  }

  const headers = [
    'prioridade',
    'tipo_alerta',
    'id_ocorrencia',
    'ano',
    'edicao',
    'habilidade',
    'objeto_principal',
    'pagina_pdf',
    'colecao_origem',
    'status_curadoria',
    'quantidade_reportes',
    'trecho_inicial',
    'acao_recomendada',
    'resolvido'
  ];

  aba.getRange(1,1,1,headers.length).setValues([headers]);
  estilizarCabecalhoV04_(aba.getRange(1,1,1,headers.length));
  aba.setFrozenRows(1);

  aba.setColumnWidth(1, 110);
  aba.setColumnWidth(2, 210);
  aba.setColumnWidth(3, 180);
  aba.setColumnWidth(7, 300);
  aba.setColumnWidth(9, 340);
  aba.setColumnWidth(12, 520);
  aba.setColumnWidth(13, 360);
  aba.setColumnWidth(14, 100);
}

function garantirCamposV04_(ss) {
  const base = ss.getSheetByName(NAVE_V04.ABAS.BASE);
  const headers = base.getRange(1,1,1,base.getLastColumn()).getValues()[0];

  const novos = [
    'alerta_tecnico',
    'nivel_alerta_tecnico',
    'fonte_pdf_status',
    'ultima_correcao_trecho_em',
    'ultima_correcao_trecho_por'
  ];

  const ausentes = novos.filter(h => !headers.includes(h));
  if (!ausentes.length) return;

  const inicio = base.getLastColumn() + 1;
  base.getRange(1,inicio,1,ausentes.length).setValues([ausentes]);
  estilizarCabecalhoV04_(base.getRange(1,inicio,1,ausentes.length));

  const n = base.getLastRow() - 1;
  if (n <= 0) return;

  ausentes.forEach((campo, i) => {
    let valor = '';

    if (campo === 'nivel_alerta_tecnico') valor = 'Sem alerta';
    if (campo === 'fonte_pdf_status') valor = 'Não configurada';

    if (valor !== '') {
      base.getRange(2,inicio+i,n,1).setValue(valor);
    }
  });
}

function criarAcoesRapidasV04_(ss) {
  const painel = ss.getSheetByName(NAVE_V04.ABAS.PAINEL);
  if (!painel) return;

  painel.getRange('J3:K3').merge().setValue('AÇÕES RÁPIDAS — V0.4');
  estilizarCabecalhoV04_(painel.getRange('J3:K3'));

  painel.getRange('J4:K9').setValues([
    ['AÇÃO','EXECUTAR'],
    ['Buscar questões',false],
    ['Visualizar questão selecionada',false],
    ['Adicionar selecionadas',false],
    ['Atualizar alertas técnicos',false],
    ['Abrir painel de alertas',false]
  ]);

  painel.getRange('J4:K4')
    .setBackground(NAVE_V04.COR_SECUNDARIA)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  painel.getRange('K5:K9').insertCheckboxes();
  painel.setColumnWidth(10, 260);
  painel.setColumnWidth(11, 110);
}

/**
 * Acrescente esta chamada no onEdit(e) da versão 0.3:
 *
 * processarAcoesRapidasV04_(e);
 *
 * Ela pode ser colocada no início ou no final do onEdit.
 */
function processarAcoesRapidasV04_(e) {
  if (!e || !e.range || e.value !== 'TRUE') return;

  const aba = e.range.getSheet();
  if (aba.getName() !== NAVE_V04.ABAS.PAINEL) return;
  if (e.range.getColumn() !== 11) return;
  if (e.range.getRow() < 5 || e.range.getRow() > 9) return;

  const linha = e.range.getRow();

  try {
    if (linha === 5) buscarQuestoesQuimica();
    if (linha === 6) abrirVisualizacaoQuestaoV04();
    if (linha === 7) adicionarSelecionadas();
    if (linha === 8) atualizarAlertasTecnicosV04();
    if (linha === 9) abrirPainelAlertasV04();
  } finally {
    aba.getRange(linha,11).setValue(false);
  }
}

/* =========================================================
   ALERTAS TÉCNICOS
   ========================================================= */

function atualizarAlertasTecnicosV04_ANTIGA() {
  const ss = SpreadsheetApp.getActive();
  const base = ss.getSheetByName(NAVE_V04.ABAS.BASE);
  const alertas = ss.getSheetByName(NAVE_V04.ABAS.ALERTAS);

  if (!base || !alertas) {
    throw new Error('As abas QUESTOES_GERAL e ALERTAS_TECNICOS são obrigatórias.');
  }

  garantirCamposV04_(ss);

  const dados = base.getDataRange().getValues();
  const idx = indexarCabecalhosV04_(dados[0]);

  const obrigatorios = [
    'id_ocorrencia',
    'ano',
    'edicao',
    'habilidade',
    'objeto_principal',
    'pagina_pdf',
    'colecao_origem',
    'status_curadoria',
    'quantidade_reportes',
    'trecho_inicial',
    'componente_principal',
    'alerta_tecnico',
    'nivel_alerta_tecnico'
  ];

  obrigatorios.forEach(campo => {
    if (idx[campo] === undefined) {
      throw new Error('Campo ausente em QUESTOES_GERAL: ' + campo);
    }
  });

  const saida = [];
  const atualizacoesAlerta = [];
  const atualizacoesNivel = [];

  for (let i=1; i<dados.length; i++) {
    const r = dados[i];

    if (String(r[idx.componente_principal]).trim() !== 'Química') {
      atualizacoesAlerta.push(['']);
      atualizacoesNivel.push(['Sem alerta']);
      continue;
    }

    const analise = analisarTrechoV04_(r[idx.trecho_inicial]);
    const fonte = verificarFontePdfV04_(
      ss,
      r[idx.colecao_origem]
    );

    const alertasItem = [];
    let nivel = 'Sem alerta';

    if (analise.tipo) {
      alertasItem.push(analise.tipo);
      nivel = analise.prioridade;
    }

    if (!fonte.disponivel) {
      alertasItem.push('PDF de origem não configurado');
      if (nivel === 'Sem alerta' || nivel === 'Baixa') nivel = 'Normal';
    }

    const alertaTexto = alertasItem.join('; ');
    atualizacoesAlerta.push([alertaTexto]);
    atualizacoesNivel.push([nivel]);

    if (!alertaTexto) continue;

    const acao = sugerirAcaoAlertaV04_(analise, fonte);

    saida.push([
      nivel,
      alertaTexto,
      r[idx.id_ocorrencia],
      r[idx.ano],
      r[idx.edicao],
      r[idx.habilidade],
      r[idx.objeto_principal],
      r[idx.pagina_pdf],
      r[idx.colecao_origem],
      r[idx.status_curadoria],
      r[idx.quantidade_reportes],
      r[idx.trecho_inicial],
      acao,
      false
    ]);
  }

  if (dados.length > 1) {
    base.getRange(
      2,
      idx.alerta_tecnico + 1,
      dados.length - 1,
      1
    ).setValues(atualizacoesAlerta);

    base.getRange(
      2,
      idx.nivel_alerta_tecnico + 1,
      dados.length - 1,
      1
    ).setValues(atualizacoesNivel);
  }

  alertas.getRange(
    2,
    1,
    Math.max(alertas.getMaxRows()-1,1),
    alertas.getLastColumn()
  ).clearContent().clearDataValidations().setBackground(null);

  if (saida.length) {
    saida.sort((a,b) => {
      const peso = {Crítica:4,Alta:3,Normal:2,Baixa:1,'Sem alerta':0};
      return (peso[b[0]]||0) - (peso[a[0]]||0);
    });

    alertas.getRange(2,1,saida.length,saida[0].length).setValues(saida);
    alertas.getRange(2,14,saida.length,1).insertCheckboxes();
    alertas.getRange(2,1,saida.length,saida[0].length)
      .setWrap(true)
      .setVerticalAlignment('top');

    saida.forEach((r,i) => {
      const cor = r[0] === 'Crítica'
        ? NAVE_V04.COR_ERRO
        : r[0] === 'Alta'
          ? '#FED7AA'
          : r[0] === 'Normal'
            ? NAVE_V04.COR_ALERTA
            : NAVE_V04.COR_INFO;

      alertas.getRange(i+2,1,1,14).setBackground(cor);
    });
  }

  SpreadsheetApp.flush();
  return saida.length;
}

function analisarTrechoV04_(valor) {
  const texto = String(valor || '').trim();

  if (!texto) {
    return {
      tipo: 'Trecho vazio',
      prioridade: 'Crítica'
    };
  }

  /*
   * Detecta apenas caracteres realmente problemáticos:
   * - U+FFFD: caractere de substituição  
   * - faixa de uso privado Unicode, comum em extrações defeituosas de PDF
   * - caracteres de controle indevidos
   *
   * Não considera espaço comum, acentos, símbolos científicos,
   * subscritos, sobrescritos ou caracteres circulados como corrupção.
   */
  const possuiCaractereCorrompido =
    /\uFFFD/.test(texto) ||
    /[\uE000-\uF8FF]/.test(texto) ||
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(texto);

  if (possuiCaractereCorrompido) {
    return {
      tipo: 'Caractere corrompido',
      prioridade: 'Alta'
    };
  }

  if (texto.length < 80) {
    return {
      tipo: 'Trecho muito curto',
      prioridade: 'Alta'
    };
  }

  const repeticoesCabecalho =
    (texto.match(/Compreender as ciências naturais/gi) || []).length;

  if (repeticoesCabecalho > 1) {
    return {
      tipo: 'Possível concatenação',
      prioridade: 'Alta'
    };
  }

  /*
   * Detecta cabeçalho de outra questão dentro do trecho.
   * O primeiro cabeçalho, no início, é permitido.
   */
  const ocorrenciasQuestao =
    texto.match(/Quest[aã]o\s+\d{1,3}\b/gi) || [];

  if (ocorrenciasQuestao.length > 1) {
    return {
      tipo: 'Possível concatenação',
      prioridade: 'Alta'
    };
  }

  if (
    texto.length >= 620 &&
    !/[.!?]["”']?$/.test(texto)
  ) {
    return {
      tipo: 'Possível truncamento',
      prioridade: 'Normal'
    };
  }

  return {
    tipo: '',
    prioridade: 'Sem alerta'
  };
}

function verificarFontePdfV04_(ss, colecao) {
  const aba = ss.getSheetByName(NAVE_V04.ABAS.FONTES);

  if (!aba || aba.getLastRow() < 2) {
    return {
      disponivel: false,
      url: '',
      status: 'Não configurada'
    };
  }

  const dados = aba.getRange(
    2,
    1,
    aba.getLastRow()-1,
    aba.getLastColumn()
  ).getValues();

  const linha = dados.find(r =>
    String(r[0]).trim() === String(colecao).trim()
  );

  if (!linha) {
    return {
      disponivel: false,
      url: '',
      status: 'Coleção não cadastrada'
    };
  }

  const url = String(linha[4] || '').trim();
  const status = String(linha[5] || '').trim();

  return {
    disponivel: Boolean(url) && status === 'Disponível',
    url,
    status
  };
}

function sugerirAcaoAlertaV04_(analise, fonte) {
  const acoes = [];

  if (analise.tipo === 'Trecho vazio') {
    acoes.push('Abrir o PDF na página registrada e transcrever o enunciado.');
  } else if (analise.tipo === 'Caractere corrompido') {
    acoes.push('Conferir símbolos, fórmulas e expoentes diretamente no PDF.');
  } else if (analise.tipo === 'Trecho muito curto') {
    acoes.push('Verificar se o enunciado foi extraído integralmente.');
  } else if (analise.tipo === 'Possível concatenação') {
    acoes.push('Separar os textos e manter somente a questão correspondente ao ID.');
  } else if (analise.tipo === 'Possível truncamento') {
    acoes.push('Completar o trecho ou registrar que a visualização depende do PDF.');
  }

  if (!fonte.disponivel) {
    acoes.push('Cadastrar o link do PDF em FONTES_PDF.');
  }

  return acoes.join(' ');
}

function abrirPainelAlertasV04() {
  const ss = SpreadsheetApp.getActive();
  atualizarAlertasTecnicosV04();
  ss.setActiveSheet(ss.getSheetByName(NAVE_V04.ABAS.ALERTAS));
}

/* =========================================================
   VISUALIZAÇÃO SINCRONIZADA
   ========================================================= */

function abrirVisualizacaoQuestaoV04() {
  const id = obterIdQuestaoSelecionadaV04_();

  if (!id) {
    SpreadsheetApp.getUi().alert(
      'Selecione uma questão em RESULTADO_BUSCA, SEQUENCIA_ATUAL ou ALERTAS_TECNICOS.'
    );
    return;
  }

  const template = HtmlService.createTemplateFromFile('VisualizarQuestaoV101');
  template.idQuestao = id;

  SpreadsheetApp.getUi().showSidebar(
    template.evaluate()
      .setTitle('Visualizar questão — versão 0.4')
      .setWidth(470)
  );
}

function obterIdQuestaoSelecionadaAtualV04() {
  return obterIdQuestaoSelecionadaV04_();
}

function obterIdQuestaoSelecionadaV04_() {
  const ss = SpreadsheetApp.getActive();
  const aba = ss.getActiveSheet();
  const row = aba.getActiveRange().getRow();

  if (
    aba.getName() === NAVE_V04.ABAS.RESULTADO &&
    row >= 2
  ) {
    return aba.getRange(row,2).getDisplayValue();
  }

  if (
    aba.getName() === NAVE_V04.ABAS.SEQUENCIA &&
    row >= 12
  ) {
    return aba.getRange(row,2).getDisplayValue();
  }

  if (
    aba.getName() === NAVE_V04.ABAS.ALERTAS &&
    row >= 2
  ) {
    return aba.getRange(row,3).getDisplayValue();
  }

  return '';
}

function obterDadosQuestaoCompletaV04(id) {
  const ss = SpreadsheetApp.getActive();
  const base = ss.getSheetByName(NAVE_V04.ABAS.BASE);
  const dados = base.getDataRange().getValues();
  const idx = indexarCabecalhosV04_(dados[0]);

  const linha = dados.findIndex((r,i) =>
    i > 0 &&
    String(r[idx.id_ocorrencia]) === String(id)
  );

  if (linha < 0) {
    throw new Error('Questão não localizada: ' + id);
  }

  const r = dados[linha];
  const fonte = verificarFontePdfV04_(
    ss,
    r[idx.colecao_origem]
  );

  return {
    id: r[idx.id_ocorrencia],
    ano: r[idx.ano],
    edicao: r[idx.edicao],
    competencia: r[idx.competencia],
    habilidade: r[idx.habilidade],
    objeto: r[idx.objeto_principal],
    objetoId: r[idx.objeto_id],
    dificuldade: r[idx.dificuldade_rotulo],
    funcao: r[idx.funcao_pedagogica_sugerida],
    tempo: r[idx.tempo_estimado_min],
    trecho: r[idx.trecho_inicial],
    status: r[idx.status_curadoria],
    reportes: r[idx.quantidade_reportes],
    alerta: r[idx.alerta_tecnico] || analisarTrechoV04_(r[idx.trecho_inicial]).tipo,
    nivelAlerta: r[idx.nivel_alerta_tecnico],
    pagina: r[idx.pagina_pdf],
    colecao: r[idx.colecao_origem],
    urlPdf: fonte.url,
    pdfDisponivel: fonte.disponivel,
    statusFonte: fonte.status
  };
}

/* =========================================================
   CORREÇÃO GOVERNADA DO TRECHO
   ========================================================= */

function abrirCorrecaoTrechoV04() {
  const id = obterIdQuestaoSelecionadaV04_();

  if (!id) {
    SpreadsheetApp.getUi().alert(
      'Selecione uma questão em RESULTADO_BUSCA, SEQUENCIA_ATUAL ou ALERTAS_TECNICOS.'
    );
    return;
  }

  const template = HtmlService.createTemplateFromFile('CorrigirTrechoV100');
  template.idQuestao = id;

  SpreadsheetApp.getUi().showSidebar(
    template.evaluate()
      .setTitle('Corrigir trecho')
      .setWidth(470)
  );
}

function salvarCorrecaoTrechoV04(form) {
  if (!form || !form.idQuestao) {
    throw new Error('Questão não informada.');
  }

  const novoTrecho = String(form.novoTrecho || '').trim();
  const justificativa = String(form.justificativa || '').trim();

  if (novoTrecho.length < 20) {
    throw new Error('O novo trecho precisa ter pelo menos 20 caracteres.');
  }

  if (!justificativa) {
    throw new Error('Informe a justificativa da correção.');
  }

  const ss = SpreadsheetApp.getActive();
  const base = ss.getSheetByName(NAVE_V04.ABAS.BASE);
  const historico = ss.getSheetByName(NAVE_V04.ABAS.HISTORICO);

  const dados = base.getDataRange().getValues();
  const idx = indexarCabecalhosV04_(dados[0]);

  const linha = dados.findIndex((r,i) =>
    i > 0 &&
    String(r[idx.id_ocorrencia]) === String(form.idQuestao)
  );

  if (linha < 0) {
    throw new Error('Questão não localizada.');
  }

  const anterior = dados[linha][idx.trecho_inicial];
  const coordenador =
    Session.getActiveUser().getEmail() ||
    'Coordenador não identificado';

  const versaoAnterior =
    Number(dados[linha][idx.versao_registro]) || 1;
  const versaoNova = versaoAnterior + 1;

  base.getRange(
    linha+1,
    idx.trecho_inicial+1
  ).setValue(novoTrecho);

  base.getRange(
    linha+1,
    idx.status_curadoria+1
  ).setValue('Corrigida');

  base.getRange(
    linha+1,
    idx.ultima_revisao_em+1
  ).setValue(new Date());

  base.getRange(
    linha+1,
    idx.ultima_revisao_por+1
  ).setValue(coordenador);

  base.getRange(
    linha+1,
    idx.versao_registro+1
  ).setValue(versaoNova);

  base.getRange(
    linha+1,
    idx.ultima_correcao_trecho_em+1
  ).setValue(new Date());

  base.getRange(
    linha+1,
    idx.ultima_correcao_trecho_por+1
  ).setValue(coordenador);

  const novaAnalise = analisarTrechoV04_(novoTrecho);

  base.getRange(
    linha+1,
    idx.alerta_tecnico+1
  ).setValue(novaAnalise.tipo);

  base.getRange(
    linha+1,
    idx.nivel_alerta_tecnico+1
  ).setValue(novaAnalise.prioridade);

  if (historico) {
    historico.appendRow([
      gerarIdV04_('ALT'),
      new Date(),
      coordenador,
      form.idQuestao,
      'trecho_inicial',
      anterior,
      novoTrecho,
      justificativa,
      'CORRECAO_DIRETA_V04',
      versaoAnterior,
      versaoNova
    ]);
  }

  atualizarRegistroEmAbasOperacionaisV04_(
    form.idQuestao,
    novoTrecho,
    novaAnalise.tipo
  );

  atualizarAlertasTecnicosV04();

  return {
    mensagem: 'Trecho corrigido e histórico registrado.',
    alertaRestante: novaAnalise.tipo
  };
}

function atualizarRegistroEmAbasOperacionaisV04_(
  id,
  novoTrecho,
  alerta
) {
  const ss = SpreadsheetApp.getActive();

  const resultado = ss.getSheetByName(NAVE_V04.ABAS.RESULTADO);
  if (resultado && resultado.getLastRow() >= 2) {
    const ids = resultado.getRange(
      2,
      2,
      resultado.getLastRow()-1,
      1
    ).getValues().flat();

    ids.forEach((valor,i) => {
      if (String(valor) === String(id)) {
        resultado.getRange(i+2,11).setValue(novoTrecho);

        if (resultado.getLastColumn() >= 17) {
          resultado.getRange(i+2,17).setValue(alerta);
        }

        resultado.getRange(i+2,11,1,7)
          .setBackground(
            alerta
              ? NAVE_V04.COR_ALERTA
              : null
          );
      }
    });
  }

  const sequencia = ss.getSheetByName(NAVE_V04.ABAS.SEQUENCIA);
  if (sequencia && sequencia.getLastRow() >= 12) {
    const ids = sequencia.getRange(
      12,
      2,
      sequencia.getLastRow()-11,
      1
    ).getValues().flat();

    ids.forEach((valor,i) => {
      if (String(valor) === String(id)) {
        sequencia.getRange(i+12,9).setValue(novoTrecho);
      }
    });
  }
}

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function estilizarCabecalhoV04_(range) {
  range
    .setBackground(NAVE_V04.COR_PRINCIPAL)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
}

function indexarCabecalhosV04_(headers) {
  const mapa = {};

  headers.forEach((h,i) => {
    const chave = String(h).trim();
    if (chave) mapa[chave] = i;
  });

  return mapa;
}

function gerarIdV04_(prefixo) {
  const agora = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'America/Sao_Paulo',
    'yyyyMMddHHmmss'
  );

  return `${prefixo}_${agora}_${Utilities.getUuid().slice(0,8).toUpperCase()}`;
}


/* ==========================================================
   BLOCO 2 — ATUALIZAÇÃO DE ALERTAS V0.4.1
   ========================================================== */

/**
 * NAVE — CORREÇÃO DE DESEMPENHO DOS ALERTAS TÉCNICOS — V0.4.1
 *
 * Adicione este arquivo ao projeto com o nome CorrecaoAlertasV041.gs.
 * Renomeie a função antiga atualizarAlertasTecnicosV04 para
 * atualizarAlertasTecnicosV04_ANTIGA.
 */

function atualizarAlertasTecnicosV04() {
  const inicioExecucao = Date.now();
  const ss = SpreadsheetApp.getActive();
  const base = ss.getSheetByName(NAVE_V04.ABAS.BASE);
  const alertas = ss.getSheetByName(NAVE_V04.ABAS.ALERTAS);
  const fontes = ss.getSheetByName(NAVE_V04.ABAS.FONTES);

  if (!base || !alertas) {
    throw new Error('As abas QUESTOES_GERAL e ALERTAS_TECNICOS são obrigatórias.');
  }

  garantirCamposV04_(ss);

  const dados = base.getDataRange().getValues();
  if (dados.length < 2) {
    limparAlertasV041_(alertas);
    return 0;
  }

  const idx = indexarCabecalhosV04_(dados[0]);
  const obrigatorios = [
    'id_ocorrencia','ano','edicao','habilidade','objeto_principal',
    'pagina_pdf','colecao_origem','status_curadoria',
    'quantidade_reportes','trecho_inicial','componente_principal',
    'alerta_tecnico','nivel_alerta_tecnico'
  ];

  const faltantes = obrigatorios.filter(campo => idx[campo] === undefined);
  if (faltantes.length) {
    throw new Error('Campos ausentes em QUESTOES_GERAL: ' + faltantes.join(', '));
  }

  const mapaFontes = criarMapaFontesV041_(fontes);
  const totalLinhas = dados.length - 1;
  const colunaAlerta = Array.from({length: totalLinhas}, () => ['']);
  const colunaNivel = Array.from({length: totalLinhas}, () => ['Sem alerta']);
  const colunaFonteStatus = idx.fonte_pdf_status !== undefined
    ? Array.from({length: totalLinhas}, () => ['Não configurada'])
    : null;

  const saida = [];
  let quantidadeQuimica = 0;

  for (let i = 1; i < dados.length; i++) {
    const r = dados[i];

    if (String(r[idx.componente_principal] || '').trim() !== 'Química') {
      continue;
    }

    quantidadeQuimica++;

    const analise = analisarTrechoV04_(r[idx.trecho_inicial]);
    const colecao = String(r[idx.colecao_origem] || '').trim();
    const fonte = mapaFontes.get(colecao) || {
      disponivel: false,
      url: '',
      status: 'Coleção não cadastrada'
    };

    const alertasItem = [];
    let nivel = 'Sem alerta';

    if (analise.tipo) {
      alertasItem.push(analise.tipo);
      nivel = analise.prioridade;
    }

    if (!fonte.disponivel) {
      alertasItem.push('PDF de origem não configurado');
      if (nivel === 'Sem alerta' || nivel === 'Baixa') {
        nivel = 'Normal';
      }
    }

    const alertaTexto = alertasItem.join('; ');
    colunaAlerta[i - 1][0] = alertaTexto;
    colunaNivel[i - 1][0] = nivel;

    if (colunaFonteStatus) {
      colunaFonteStatus[i - 1][0] = fonte.status;
    }

    if (!alertaTexto) continue;

    saida.push([
      nivel,
      alertaTexto,
      r[idx.id_ocorrencia],
      r[idx.ano],
      r[idx.edicao],
      r[idx.habilidade],
      r[idx.objeto_principal],
      r[idx.pagina_pdf],
      r[idx.colecao_origem],
      r[idx.status_curadoria],
      r[idx.quantidade_reportes],
      r[idx.trecho_inicial],
      sugerirAcaoAlertaV04_(analise, fonte),
      false
    ]);
  }

  base.getRange(2, idx.alerta_tecnico + 1, totalLinhas, 1).setValues(colunaAlerta);
  base.getRange(2, idx.nivel_alerta_tecnico + 1, totalLinhas, 1).setValues(colunaNivel);

  if (colunaFonteStatus) {
    base.getRange(2, idx.fonte_pdf_status + 1, totalLinhas, 1).setValues(colunaFonteStatus);
  }

  const peso = {'Crítica':4,'Alta':3,'Normal':2,'Baixa':1,'Sem alerta':0};

  saida.sort((a,b) => {
    const d = (peso[b[0]] || 0) - (peso[a[0]] || 0);
    return d !== 0
      ? d
      : String(a[2]).localeCompare(String(b[2]), 'pt-BR', {numeric:true});
  });

  limparAlertasV041_(alertas);

  if (saida.length) {
    garantirQuantidadeLinhasV041_(alertas, saida.length + 1);
    alertas.getRange(2,1,saida.length,saida[0].length).setValues(saida);
    alertas.getRange(2,14,saida.length,1).insertCheckboxes();
    alertas.getRange(2,1,saida.length,saida[0].length)
      .setWrap(true)
      .setVerticalAlignment('top');
    aplicarCoresAlertasV041_(alertas, saida);
  }

  SpreadsheetApp.flush();

  const segundos = ((Date.now() - inicioExecucao) / 1000).toFixed(1);
  ss.toast(
    `${saida.length} alertas em ${quantidadeQuimica} questões de Química. Tempo: ${segundos}s.`,
    'NAVE — Alertas técnicos',
    8
  );

  return saida.length;
}

function criarMapaFontesV041_(abaFontes) {
  const mapa = new Map();
  if (!abaFontes || abaFontes.getLastRow() < 2) return mapa;

  const dados = abaFontes.getRange(
    2,1,abaFontes.getLastRow()-1,Math.max(abaFontes.getLastColumn(),7)
  ).getValues();

  dados.forEach(r => {
    const colecao = String(r[0] || '').trim();
    if (!colecao) return;

    const url = String(r[4] || '').trim();
    const status = String(r[5] || '').trim() || 'Não configurada';

    mapa.set(colecao, {
      disponivel: Boolean(url) && status === 'Disponível',
      url,
      status
    });
  });

  return mapa;
}

function limparAlertasV041_(aba) {
  const linhas = Math.max(aba.getMaxRows() - 1, 1);
  const colunas = Math.max(aba.getLastColumn(), 14);

  aba.getRange(2,1,linhas,colunas)
    .clearContent()
    .clearDataValidations()
    .setBackground(null);
}

function garantirQuantidadeLinhasV041_(aba, quantidadeNecessaria) {
  const atuais = aba.getMaxRows();
  if (atuais < quantidadeNecessaria) {
    aba.insertRowsAfter(atuais, quantidadeNecessaria - atuais);
  }
}

function aplicarCoresAlertasV041_(aba, linhas) {
  const grupos = {'Crítica':[],'Alta':[],'Normal':[],'Baixa':[]};
  const cores = {
    'Crítica': NAVE_V04.COR_ERRO,
    'Alta': '#FED7AA',
    'Normal': NAVE_V04.COR_ALERTA,
    'Baixa': NAVE_V04.COR_INFO
  };

  linhas.forEach((r,i) => {
    const p = String(r[0]);
    if (grupos[p]) grupos[p].push(i + 2);
  });

  Object.keys(grupos).forEach(p => {
    if (!grupos[p].length) return;

    transformarEmIntervalosV041_(grupos[p]).forEach(([inicio,fim]) => {
      aba.getRange(inicio,1,fim-inicio+1,14).setBackground(cores[p]);
    });
  });
}

function transformarEmIntervalosV041_(numeros) {
  const intervalos = [];
  let inicio = numeros[0];
  let anterior = numeros[0];

  for (let i = 1; i < numeros.length; i++) {
    const atual = numeros[i];

    if (atual === anterior + 1) {
      anterior = atual;
    } else {
      intervalos.push([inicio, anterior]);
      inicio = atual;
      anterior = atual;
    }
  }

  intervalos.push([inicio, anterior]);
  return intervalos;
}


/* ==========================================================
   BLOCO 3 — APLICAÇÃO DE TRECHOS RECUPERADOS V0.4.1
   ========================================================== */

/**
 * NAVE — APLICAÇÃO DOS TRECHOS RECUPERADOS — V0.4.1
 *
 * Fluxo:
 * 1. Importe/copiem para o Google Planilhas a aba ATUALIZACAO_GOOGLE
 *    gerada pelo RStudio.
 * 2. Renomeie a aba importada para: ATUALIZACAO_TRECHOS_V041
 * 3. Execute primeiro: simularAplicacaoTrechosV041()
 * 4. Confira o resumo.
 * 5. Execute: aplicarTrechosRecuperadosV041()
 *
 * Esta rotina:
 * - localiza QUESTOES_GERAL por id_ocorrencia;
 * - atualiza trecho_inicial;
 * - registra data, responsável e origem, quando as colunas existirem;
 * - registra log próprio;
 * - marca o alerta correspondente como resolvido;
 * - recalcula ALERTAS_TECNICOS ao final.
 */

const RECUPERACAO_V041 = Object.freeze({
  ABA_ATUALIZACAO: 'ATUALIZACAO_TRECHOS_V041',
  ABA_BASE: 'QUESTOES_GERAL',
  ABA_ALERTAS: 'ALERTAS_TECNICOS',
  ABA_LOG: 'LOG_RECUPERACAO_TRECHOS',
  RESPONSAVEL_PADRAO: 'RStudio - Recuperacao automatica NAVE v0.4.1',

  CABECALHOS_ATUALIZACAO: [
    'id_ocorrencia',
    'trecho_inicial_novo',
    'trecho_inicial_anterior',
    'ultima_correcao_trecho_em',
    'ultima_correcao_trecho_por',
    'origem_correcao_trecho',
    'checksum_texto',
    'status_recuperacao',
    'metodo_extracao'
  ],

  CABECALHOS_BASE_OBRIGATORIOS: [
    'id_ocorrencia',
    'trecho_inicial'
  ]
});


/**
 * Executa somente a conferência.
 * Não altera QUESTOES_GERAL nem ALERTAS_TECNICOS.
 */
function simularAplicacaoTrechosV041() {
  const resultado = processarAplicacaoTrechosV041_(true);

  SpreadsheetApp.getActive().toast(
    [
      `Elegíveis: ${resultado.elegiveis}`,
      `Encontrados: ${resultado.encontrados}`,
      `Não encontrados: ${resultado.naoEncontrados}`,
      `Sem mudança: ${resultado.semMudanca}`,
      `Divergência anterior: ${resultado.divergencias}`
    ].join(' | '),
    'NAVE — Simulação de atualização',
    12
  );

  return resultado;
}


/**
 * Aplica efetivamente os trechos recuperados.
 */
function aplicarTrechosRecuperadosV041() {
  const ui = SpreadsheetApp.getUi();

  const resposta = ui.alert(
    'NAVE — Aplicar trechos recuperados',
    [
      'Esta rotina atualizará QUESTOES_GERAL pelo id_ocorrencia.',
      'Também registrará log, marcará os alertas correspondentes como resolvidos',
      'e recalculará ALERTAS_TECNICOS ao final.',
      '',
      'Deseja continuar?'
    ].join('\n'),
    ui.ButtonSet.YES_NO
  );

  if (resposta !== ui.Button.YES) return null;

  const resultado = processarAplicacaoTrechosV041_(false);

  ui.alert(
    'NAVE — Atualização concluída',
    [
      `Registros elegíveis: ${resultado.elegiveis}`,
      `Trechos atualizados: ${resultado.atualizados}`,
      `Sem alteração: ${resultado.semMudanca}`,
      `IDs não encontrados: ${resultado.naoEncontrados}`,
      `Divergências bloqueadas: ${resultado.divergencias}`,
      `Alertas marcados como resolvidos: ${resultado.alertasResolvidos}`,
      '',
      'Consulte a aba LOG_RECUPERACAO_TRECHOS para a auditoria.'
    ].join('\n'),
    ui.ButtonSet.OK
  );

  return resultado;
}


/**
 * Núcleo de simulação/aplicação.
 */
function processarAplicacaoTrechosV041_(somenteSimular) {
  const inicio = Date.now();
  const ss = SpreadsheetApp.getActive();

  const abaAtualizacao = ss.getSheetByName(RECUPERACAO_V041.ABA_ATUALIZACAO);
  const abaBase = ss.getSheetByName(RECUPERACAO_V041.ABA_BASE);
  const abaAlertas = ss.getSheetByName(RECUPERACAO_V041.ABA_ALERTAS);

  if (!abaAtualizacao) {
    throw new Error(
      `A aba ${RECUPERACAO_V041.ABA_ATUALIZACAO} não foi encontrada. ` +
      'Importe a aba ATUALIZACAO_GOOGLE gerada pelo RStudio e renomeie-a.'
    );
  }

  if (!abaBase) {
    throw new Error(`A aba ${RECUPERACAO_V041.ABA_BASE} não foi encontrada.`);
  }

  const dadosAtualizacao = abaAtualizacao.getDataRange().getValues();
  const dadosBase = abaBase.getDataRange().getValues();

  if (dadosAtualizacao.length < 2) {
    throw new Error('A aba de atualização não contém registros.');
  }

  if (dadosBase.length < 2) {
    throw new Error('QUESTOES_GERAL não contém registros.');
  }

  const idxAtualizacao = indexarCabecalhosRecuperacaoV041_(dadosAtualizacao[0]);
  const idxBase = indexarCabecalhosRecuperacaoV041_(dadosBase[0]);

  validarCabecalhosRecuperacaoV041_(
    idxAtualizacao,
    RECUPERACAO_V041.CABECALHOS_ATUALIZACAO,
    RECUPERACAO_V041.ABA_ATUALIZACAO
  );

  validarCabecalhosRecuperacaoV041_(
    idxBase,
    RECUPERACAO_V041.CABECALHOS_BASE_OBRIGATORIOS,
    RECUPERACAO_V041.ABA_BASE
  );

  const mapaBase = new Map();

  for (let i = 1; i < dadosBase.length; i++) {
    const id = textoRecuperacaoV041_(dadosBase[i][idxBase.id_ocorrencia]);
    if (!id) continue;

    if (mapaBase.has(id)) {
      throw new Error(
        `id_ocorrencia duplicado em QUESTOES_GERAL: ${id}. ` +
        'A atualização foi interrompida para evitar alteração ambígua.'
      );
    }

    mapaBase.set(id, i);
  }

  const atualizacoesPorLinha = new Map();
  const idsAtualizados = new Set();
  const logs = [];

  const resultado = {
    modo: somenteSimular ? 'SIMULAÇÃO' : 'APLICAÇÃO',
    elegiveis: 0,
    encontrados: 0,
    atualizados: 0,
    semMudanca: 0,
    naoEncontrados: 0,
    divergencias: 0,
    alertasResolvidos: 0,
    segundos: 0
  };

  for (let i = 1; i < dadosAtualizacao.length; i++) {
    const r = dadosAtualizacao[i];

    const id = textoRecuperacaoV041_(r[idxAtualizacao.id_ocorrencia]);
    const novoTrecho = textoRecuperacaoV041_(r[idxAtualizacao.trecho_inicial_novo]);
    const trechoAnteriorR = textoRecuperacaoV041_(
      r[idxAtualizacao.trecho_inicial_anterior]
    );
    const status = textoRecuperacaoV041_(r[idxAtualizacao.status_recuperacao]);

    if (!id && !novoTrecho && !status) continue;

    // A aba produzida pelo RStudio já traz apenas os registros automáticos.
    // Mantemos a checagem como barreira adicional.
    if (status !== 'Recuperado automaticamente') {
      logs.push(criarLinhaLogRecuperacaoV041_({
        modo: resultado.modo,
        id,
        resultado: 'IGNORADO',
        motivo: `Status não elegível: ${status}`,
        trechoAnteriorBase: '',
        trechoAnteriorR,
        novoTrecho,
        origem: textoRecuperacaoV041_(r[idxAtualizacao.origem_correcao_trecho]),
        checksum: textoRecuperacaoV041_(r[idxAtualizacao.checksum_texto]),
        metodo: textoRecuperacaoV041_(r[idxAtualizacao.metodo_extracao])
      }));
      continue;
    }

    resultado.elegiveis++;

    if (!id || !novoTrecho) {
      resultado.divergencias++;

      logs.push(criarLinhaLogRecuperacaoV041_({
        modo: resultado.modo,
        id,
        resultado: 'BLOQUEADO',
        motivo: !id ? 'id_ocorrencia vazio' : 'trecho_inicial_novo vazio',
        trechoAnteriorBase: '',
        trechoAnteriorR,
        novoTrecho,
        origem: textoRecuperacaoV041_(r[idxAtualizacao.origem_correcao_trecho]),
        checksum: textoRecuperacaoV041_(r[idxAtualizacao.checksum_texto]),
        metodo: textoRecuperacaoV041_(r[idxAtualizacao.metodo_extracao])
      }));
      continue;
    }

    if (!mapaBase.has(id)) {
      resultado.naoEncontrados++;

      logs.push(criarLinhaLogRecuperacaoV041_({
        modo: resultado.modo,
        id,
        resultado: 'NÃO ENCONTRADO',
        motivo: 'id_ocorrencia ausente em QUESTOES_GERAL',
        trechoAnteriorBase: '',
        trechoAnteriorR,
        novoTrecho,
        origem: textoRecuperacaoV041_(r[idxAtualizacao.origem_correcao_trecho]),
        checksum: textoRecuperacaoV041_(r[idxAtualizacao.checksum_texto]),
        metodo: textoRecuperacaoV041_(r[idxAtualizacao.metodo_extracao])
      }));
      continue;
    }

    resultado.encontrados++;

    const linhaBase = mapaBase.get(id);
    const trechoAnteriorBase = textoRecuperacaoV041_(
      dadosBase[linhaBase][idxBase.trecho_inicial]
    );

    // Se o RStudio registrou um conteúdo anterior e ele diverge da base atual,
    // bloqueia-se a substituição. Isso evita sobrescrever uma correção feita
    // depois da exportação.
    const existeAnteriorRegistrado = Boolean(trechoAnteriorR);

    if (
      existeAnteriorRegistrado &&
      normalizarComparacaoRecuperacaoV041_(trechoAnteriorBase) !==
        normalizarComparacaoRecuperacaoV041_(trechoAnteriorR)
    ) {
      resultado.divergencias++;

      logs.push(criarLinhaLogRecuperacaoV041_({
        modo: resultado.modo,
        id,
        resultado: 'BLOQUEADO',
        motivo: 'trecho atual diverge do trecho registrado na exportação',
        trechoAnteriorBase,
        trechoAnteriorR,
        novoTrecho,
        origem: textoRecuperacaoV041_(r[idxAtualizacao.origem_correcao_trecho]),
        checksum: textoRecuperacaoV041_(r[idxAtualizacao.checksum_texto]),
        metodo: textoRecuperacaoV041_(r[idxAtualizacao.metodo_extracao])
      }));
      continue;
    }

    if (
      normalizarComparacaoRecuperacaoV041_(trechoAnteriorBase) ===
      normalizarComparacaoRecuperacaoV041_(novoTrecho)
    ) {
      resultado.semMudanca++;

      logs.push(criarLinhaLogRecuperacaoV041_({
        modo: resultado.modo,
        id,
        resultado: 'SEM MUDANÇA',
        motivo: 'o trecho novo já está registrado na base',
        trechoAnteriorBase,
        trechoAnteriorR,
        novoTrecho,
        origem: textoRecuperacaoV041_(r[idxAtualizacao.origem_correcao_trecho]),
        checksum: textoRecuperacaoV041_(r[idxAtualizacao.checksum_texto]),
        metodo: textoRecuperacaoV041_(r[idxAtualizacao.metodo_extracao])
      }));
      continue;
    }

    const dataCorrecao = r[idxAtualizacao.ultima_correcao_trecho_em] || new Date();
    const responsavel =
      textoRecuperacaoV041_(r[idxAtualizacao.ultima_correcao_trecho_por]) ||
      RECUPERACAO_V041.RESPONSAVEL_PADRAO;
    const origem = textoRecuperacaoV041_(
      r[idxAtualizacao.origem_correcao_trecho]
    );

    atualizacoesPorLinha.set(linhaBase, {
      id,
      novoTrecho,
      dataCorrecao,
      responsavel,
      origem
    });

    idsAtualizados.add(id);

    logs.push(criarLinhaLogRecuperacaoV041_({
      modo: resultado.modo,
      id,
      resultado: somenteSimular ? 'PRONTO PARA ATUALIZAR' : 'ATUALIZADO',
      motivo: 'trecho recuperado automaticamente pelo RStudio',
      trechoAnteriorBase,
      trechoAnteriorR,
      novoTrecho,
      origem,
      checksum: textoRecuperacaoV041_(r[idxAtualizacao.checksum_texto]),
      metodo: textoRecuperacaoV041_(r[idxAtualizacao.metodo_extracao])
    }));
  }

  if (!somenteSimular && atualizacoesPorLinha.size > 0) {
    aplicarAlteracoesNaBaseRecuperacaoV041_(
      abaBase,
      dadosBase,
      idxBase,
      atualizacoesPorLinha
    );

    resultado.atualizados = atualizacoesPorLinha.size;

    if (abaAlertas) {
      resultado.alertasResolvidos = marcarAlertasResolvidosRecuperacaoV041_(
        abaAlertas,
        idsAtualizados
      );
    }
  }

  registrarLogRecuperacaoV041_(ss, logs);

  if (!somenteSimular && typeof atualizarAlertasTecnicosV04 === 'function') {
    atualizarAlertasTecnicosV04();
  }

  SpreadsheetApp.flush();

  resultado.segundos = Number(((Date.now() - inicio) / 1000).toFixed(1));

  return resultado;
}


/**
 * Aplica as alterações em colunas independentes, com escritas em lote.
 */
function aplicarAlteracoesNaBaseRecuperacaoV041_(
  abaBase,
  dadosBase,
  idxBase,
  atualizacoesPorLinha
) {
  const totalLinhas = dadosBase.length - 1;

  const colTrecho = dadosBase.slice(1).map(r => [r[idxBase.trecho_inicial]]);

  const colData = idxBase.ultima_correcao_trecho_em !== undefined
    ? dadosBase.slice(1).map(r => [r[idxBase.ultima_correcao_trecho_em]])
    : null;

  const colResponsavel = idxBase.ultima_correcao_trecho_por !== undefined
    ? dadosBase.slice(1).map(r => [r[idxBase.ultima_correcao_trecho_por]])
    : null;

  const colOrigem = idxBase.origem_correcao_trecho !== undefined
    ? dadosBase.slice(1).map(r => [r[idxBase.origem_correcao_trecho]])
    : null;

  atualizacoesPorLinha.forEach((alteracao, linhaBase) => {
    const pos = linhaBase - 1;

    colTrecho[pos][0] = alteracao.novoTrecho;

    if (colData) {
      colData[pos][0] = converterDataRecuperacaoV041_(alteracao.dataCorrecao);
    }

    if (colResponsavel) {
      colResponsavel[pos][0] = alteracao.responsavel;
    }

    if (colOrigem) {
      colOrigem[pos][0] = alteracao.origem;
    }
  });

  abaBase
    .getRange(2, idxBase.trecho_inicial + 1, totalLinhas, 1)
    .setValues(colTrecho);

  if (colData) {
    abaBase
      .getRange(2, idxBase.ultima_correcao_trecho_em + 1, totalLinhas, 1)
      .setValues(colData)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');
  }

  if (colResponsavel) {
    abaBase
      .getRange(2, idxBase.ultima_correcao_trecho_por + 1, totalLinhas, 1)
      .setValues(colResponsavel);
  }

  if (colOrigem) {
    abaBase
      .getRange(2, idxBase.origem_correcao_trecho + 1, totalLinhas, 1)
      .setValues(colOrigem);
  }
}


/**
 * Marca como resolvidos os alertas correspondentes.
 * Observação: a rotina atualizarAlertasTecnicosV04() recria a fila.
 */
function marcarAlertasResolvidosRecuperacaoV041_(abaAlertas, idsAtualizados) {
  if (abaAlertas.getLastRow() < 2 || idsAtualizados.size === 0) return 0;

  const dados = abaAlertas.getDataRange().getValues();
  const idx = indexarCabecalhosRecuperacaoV041_(dados[0]);

  if (idx.id_ocorrencia === undefined || idx.resolvido === undefined) return 0;

  let quantidade = 0;
  const valoresResolvido = dados.slice(1).map(r => [r[idx.resolvido]]);

  for (let i = 1; i < dados.length; i++) {
    const id = textoRecuperacaoV041_(dados[i][idx.id_ocorrencia]);

    if (idsAtualizados.has(id)) {
      valoresResolvido[i - 1][0] = true;
      quantidade++;
    }
  }

  abaAlertas
    .getRange(2, idx.resolvido + 1, valoresResolvido.length, 1)
    .setValues(valoresResolvido)
    .insertCheckboxes();

  return quantidade;
}


/**
 * Cria ou atualiza o log permanente.
 */
function registrarLogRecuperacaoV041_(ss, linhasLog) {
  if (!linhasLog.length) return;

  let aba = ss.getSheetByName(RECUPERACAO_V041.ABA_LOG);

  const cabecalho = [
    'registrado_em',
    'modo',
    'id_ocorrencia',
    'resultado',
    'motivo',
    'trecho_anterior_base',
    'trecho_anterior_exportacao',
    'trecho_novo',
    'origem_texto',
    'checksum_texto',
    'metodo_extracao'
  ];

  if (!aba) {
    aba = ss.insertSheet(RECUPERACAO_V041.ABA_LOG);
    aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);

    aba.getRange(1, 1, 1, cabecalho.length)
      .setFontWeight('bold')
      .setBackground('#0F766E')
      .setFontColor('#FFFFFF')
      .setHorizontalAlignment('center');

    aba.setFrozenRows(1);
  }

  const inicio = aba.getLastRow() + 1;
  garantirLinhasLogRecuperacaoV041_(aba, inicio + linhasLog.length - 1);

  aba.getRange(inicio, 1, linhasLog.length, cabecalho.length)
    .setValues(linhasLog)
    .setWrap(true)
    .setVerticalAlignment('top');

  aba.getRange(inicio, 1, linhasLog.length, 1)
    .setNumberFormat('dd/MM/yyyy HH:mm:ss');
}


function criarLinhaLogRecuperacaoV041_(dados) {
  return [
    new Date(),
    dados.modo || '',
    dados.id || '',
    dados.resultado || '',
    dados.motivo || '',
    dados.trechoAnteriorBase || '',
    dados.trechoAnteriorR || '',
    dados.novoTrecho || '',
    dados.origem || '',
    dados.checksum || '',
    dados.metodo || ''
  ];
}


function garantirLinhasLogRecuperacaoV041_(aba, ultimaLinhaNecessaria) {
  const max = aba.getMaxRows();

  if (max < ultimaLinhaNecessaria) {
    aba.insertRowsAfter(max, ultimaLinhaNecessaria - max);
  }
}


function indexarCabecalhosRecuperacaoV041_(cabecalhos) {
  const idx = {};

  cabecalhos.forEach((valor, i) => {
    const nome = textoRecuperacaoV041_(valor);
    if (nome) idx[nome] = i;
  });

  return idx;
}


function validarCabecalhosRecuperacaoV041_(idx, obrigatorios, nomeAba) {
  const faltantes = obrigatorios.filter(nome => idx[nome] === undefined);

  if (faltantes.length) {
    throw new Error(
      `Campos ausentes em ${nomeAba}: ${faltantes.join(', ')}`
    );
  }
}


function textoRecuperacaoV041_(valor) {
  if (valor === null || valor === undefined) return '';

  return String(valor)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function normalizarComparacaoRecuperacaoV041_(valor) {
  return textoRecuperacaoV041_(valor)
    .normalize('NFC')
    .toLocaleLowerCase('pt-BR');
}


function converterDataRecuperacaoV041_(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return valor;
  }

  if (typeof valor === 'number' && isFinite(valor)) {
    // Datas importadas do Excel podem chegar como número serial.
    const origemExcel = new Date(Date.UTC(1899, 11, 30));
    return new Date(origemExcel.getTime() + valor * 86400000);
  }

  const texto = textoRecuperacaoV041_(valor);
  const tentativa = new Date(texto);

  return isNaN(tentativa.getTime()) ? new Date() : tentativa;
}
