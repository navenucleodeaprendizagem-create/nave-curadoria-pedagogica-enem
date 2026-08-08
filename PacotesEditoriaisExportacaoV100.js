/**
 * NAVE — PACOTES EDITORIAIS E EXPORTAÇÃO
 * Consolidação estrutural V1.0
 *
 * Reúne, sem alterar a lógica validada:
 * - PacoteEditorialPdfV062.gs
 * - PacoteTecnicoRStudioV064.gs
 *
 * Os nomes públicos das funções foram preservados.
 */


/* ==========================================================
   PACOTE EDITORIAL PDF V0.6.2
   ========================================================== */

/**
 * NAVE — PACOTE EDITORIAL PARA PDF — V0.6.2
 *
 * Regra aprovada:
 * - incluir itens "Liberada";
 * - incluir itens "Liberada com revisão";
 * - excluir itens "Aguardando validação";
 * - excluir itens "Bloqueada".
 *
 * Arquivo sugerido:
 * PacoteEditorialPdfV062.gs
 *
 * Pré-requisito:
 * - SaidaEditorialV061.gs instalado
 *
 * Execute uma vez:
 * instalarPacoteEditorialPdfV062()
 */

const NAVE_PACOTE_PDF_V062 = Object.freeze({
  ABA_PROJETOS: 'PROJETOS_EDITORIAIS',
  ABA_ITENS_EDITORACAO: 'ITENS_EDITORACAO',
  ABA_PACOTE: 'PACOTE_PDF',
  ABA_PENDENCIAS: 'PENDENCIAS_PDF',

  LIBERACOES_ACEITAS: [
    'Liberada',
    'Liberada com revisão'
  ],

  CABECALHOS_PACOTE: [
    'id_pacote_pdf',
    'id_projeto_editorial',
    'id_sequencia',
    'ordem_pdf',
    'id_ocorrencia',
    'ano',
    'edicao',
    'competencia',
    'habilidade',
    'objeto_principal',
    'dificuldade_rotulo',
    'funcao_pedagogica_sugerida',
    'status_validacao',
    'maturidade_curadoria',
    'liberacao_editorial',
    'colecao_origem',
    'pagina_pdf',
    'status_fonte_pdf',
    'incluir_no_pdf',
    'observacao_editorial',
    'gerado_em',
    'gerado_por'
  ],

  CABECALHOS_PENDENCIAS: [
    'id_pacote_pdf',
    'id_projeto_editorial',
    'id_sequencia',
    'ordem_editorial',
    'id_ocorrencia',
    'liberacao_editorial',
    'status_validacao',
    'maturidade_curadoria',
    'status_fonte_pdf',
    'motivo_pendencia',
    'registrado_em'
  ]
});


function instalarPacoteEditorialPdfV062() {
  const ss = SpreadsheetApp.getActive();

  if (
    !ss.getSheetByName(NAVE_PACOTE_PDF_V062.ABA_PROJETOS) ||
    !ss.getSheetByName(NAVE_PACOTE_PDF_V062.ABA_ITENS_EDITORACAO)
  ) {
    throw new Error(
      'Instale primeiro o módulo SaidaEditorialV061.'
    );
  }

  let pacote = ss.getSheetByName(
    NAVE_PACOTE_PDF_V062.ABA_PACOTE
  );

  if (!pacote) {
    pacote = ss.insertSheet(
      NAVE_PACOTE_PDF_V062.ABA_PACOTE
    );
  }

  let pendencias = ss.getSheetByName(
    NAVE_PACOTE_PDF_V062.ABA_PENDENCIAS
  );

  if (!pendencias) {
    pendencias = ss.insertSheet(
      NAVE_PACOTE_PDF_V062.ABA_PENDENCIAS
    );
  }

  garantirCabecalhosPacoteV062_(
    pacote,
    NAVE_PACOTE_PDF_V062.CABECALHOS_PACOTE
  );

  garantirCabecalhosPacoteV062_(
    pendencias,
    NAVE_PACOTE_PDF_V062.CABECALHOS_PENDENCIAS
  );

  estilizarAbaPacoteV062_(pacote);
  estilizarAbaPacoteV062_(pendencias);

  SpreadsheetApp.getUi().alert(
    'Pacote editorial instalado',
    [
      'Foram preparadas as abas:',
      '• PACOTE_PDF',
      '• PENDENCIAS_PDF',
      '',
      'Regra ativa:',
      '• incluir Liberada;',
      '• incluir Liberada com revisão.'
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


function solicitarGeracaoPacotePdfV062() {
  const ui = SpreadsheetApp.getUi();

  const resposta = ui.prompt(
    'Gerar pacote para PDF',
    'Informe o ID do projeto editorial:',
    ui.ButtonSet.OK_CANCEL
  );

  if (resposta.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const idProjeto = String(
    resposta.getResponseText() || ''
  ).trim();

  if (!idProjeto) {
    throw new Error(
      'Informe o ID do projeto editorial.'
    );
  }

  return gerarPacotePdfV062(idProjeto);
}


function gerarPacotePdfV062(idProjeto) {
  const ss = SpreadsheetApp.getActive();

  const abaProjetos = ss.getSheetByName(
    NAVE_PACOTE_PDF_V062.ABA_PROJETOS
  );

  const abaItens = ss.getSheetByName(
    NAVE_PACOTE_PDF_V062.ABA_ITENS_EDITORACAO
  );

  const abaPacote = ss.getSheetByName(
    NAVE_PACOTE_PDF_V062.ABA_PACOTE
  );

  const abaPendencias = ss.getSheetByName(
    NAVE_PACOTE_PDF_V062.ABA_PENDENCIAS
  );

  if (!abaPacote || !abaPendencias) {
    throw new Error(
      'Execute instalarPacoteEditorialPdfV062() primeiro.'
    );
  }

  const dadosProjetos =
    abaProjetos.getDataRange().getValues();

  const idxProjetos =
    indexarPacoteV062_(dadosProjetos[0]);

  const linhaProjeto =
    dadosProjetos.findIndex((r, i) =>
      i > 0 &&
      textoPacoteV062_(
        r[idxProjetos.id_projeto_editorial]
      ) === textoPacoteV062_(idProjeto)
    );

  if (linhaProjeto < 0) {
    throw new Error(
      'Projeto editorial não localizado: ' +
      idProjeto
    );
  }

  const projeto = dadosProjetos[linhaProjeto];

  const dadosItens =
    abaItens.getDataRange().getValues();

  const idxItens =
    indexarPacoteV062_(dadosItens[0]);

  const itensProjeto = dadosItens.slice(1)
    .filter(r =>
      textoPacoteV062_(
        r[idxItens.id_projeto_editorial]
      ) === textoPacoteV062_(idProjeto)
    )
    .sort((a, b) =>
      Number(a[idxItens.ordem_editorial]) -
      Number(b[idxItens.ordem_editorial])
    );

  if (!itensProjeto.length) {
    throw new Error(
      'O projeto editorial não possui itens.'
    );
  }

  const idPacote =
    gerarIdPacoteV062_('PDF');

  const agora = new Date();

  const usuario =
    Session.getActiveUser().getEmail() ||
    'Usuário não identificado';

  const incluidos = [];
  const pendencias = [];

  itensProjeto.forEach(r => {
    const liberacao = textoPacoteV062_(
      r[idxItens.liberacao_editorial]
    );

    const statusFonte = textoPacoteV062_(
      r[idxItens.status_fonte_pdf]
    );

    const possuiFonte =
      statusFonte === 'Fonte localizada' &&
      textoPacoteV062_(
        r[idxItens.colecao_origem]
      ) &&
      textoPacoteV062_(
        r[idxItens.pagina_pdf]
      );

    const liberada =
      NAVE_PACOTE_PDF_V062
        .LIBERACOES_ACEITAS
        .includes(liberacao);

    if (liberada && possuiFonte) {
      incluidos.push({
        id_pacote_pdf: idPacote,
        id_projeto_editorial: idProjeto,
        id_sequencia:
          r[idxItens.id_sequencia],
        ordem_pdf:
          r[idxItens.ordem_editorial],
        id_ocorrencia:
          r[idxItens.id_ocorrencia],
        ano:
          r[idxItens.ano],
        edicao:
          r[idxItens.edicao],
        competencia:
          r[idxItens.competencia],
        habilidade:
          r[idxItens.habilidade],
        objeto_principal:
          r[idxItens.objeto_principal],
        dificuldade_rotulo:
          r[idxItens.dificuldade_rotulo],
        funcao_pedagogica_sugerida:
          r[idxItens.funcao_pedagogica_sugerida],
        status_validacao:
          r[idxItens.status_validacao],
        maturidade_curadoria:
          r[idxItens.maturidade_curadoria],
        liberacao_editorial: liberacao,
        colecao_origem:
          r[idxItens.colecao_origem],
        pagina_pdf:
          r[idxItens.pagina_pdf],
        status_fonte_pdf: statusFonte,
        incluir_no_pdf: 'Sim',
        observacao_editorial:
          r[idxItens.observacao_editorial],
        gerado_em: agora,
        gerado_por: usuario
      });

      return;
    }

    let motivo = '';

    if (!liberada && !possuiFonte) {
      motivo =
        'Item não liberado e fonte incompleta';
    } else if (!liberada) {
      motivo =
        'Liberação editorial não autorizada';
    } else {
      motivo =
        'Fonte original ou página não localizada';
    }

    pendencias.push({
      id_pacote_pdf: idPacote,
      id_projeto_editorial: idProjeto,
      id_sequencia:
        r[idxItens.id_sequencia],
      ordem_editorial:
        r[idxItens.ordem_editorial],
      id_ocorrencia:
        r[idxItens.id_ocorrencia],
      liberacao_editorial: liberacao,
      status_validacao:
        r[idxItens.status_validacao],
      maturidade_curadoria:
        r[idxItens.maturidade_curadoria],
      status_fonte_pdf: statusFonte,
      motivo_pendencia: motivo,
      registrado_em: agora
    });
  });

  incluidos.forEach(registro =>
    anexarPorCabecalhoPacoteV062_(
      abaPacote,
      registro
    )
  );

  pendencias.forEach(registro =>
    anexarPorCabecalhoPacoteV062_(
      abaPendencias,
      registro
    )
  );

  const idxStatusProjeto =
    idxProjetos.status_editorial;

  const idxAtualizadoEm =
    idxProjetos.atualizado_em;

  const idxAtualizadoPor =
    idxProjetos.atualizado_por;

  const statusProjeto =
    pendencias.length === 0
      ? 'Pacote PDF pronto'
      : incluidos.length > 0
        ? 'Pacote PDF parcial'
        : 'Pacote PDF bloqueado';

  if (idxStatusProjeto !== undefined) {
    abaProjetos.getRange(
      linhaProjeto + 1,
      idxStatusProjeto + 1
    ).setValue(statusProjeto);
  }

  if (idxAtualizadoEm !== undefined) {
    abaProjetos.getRange(
      linhaProjeto + 1,
      idxAtualizadoEm + 1
    ).setValue(agora);
  }

  if (idxAtualizadoPor !== undefined) {
    abaProjetos.getRange(
      linhaProjeto + 1,
      idxAtualizadoPor + 1
    ).setValue(usuario);
  }

  SpreadsheetApp.getUi().alert(
    'Pacote para PDF gerado',
    [
      `Pacote: ${idPacote}`,
      `Projeto: ${idProjeto}`,
      `Itens incluídos: ${incluidos.length}`,
      `Pendências: ${pendencias.length}`,
      `Status: ${statusProjeto}`,
      '',
      'Foram aceitos:',
      '• Liberada;',
      '• Liberada com revisão.'
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  ss.setActiveSheet(
    incluidos.length
      ? abaPacote
      : abaPendencias
  );

  return {
    idPacote,
    idProjeto,
    itensIncluidos: incluidos.length,
    pendencias: pendencias.length,
    statusProjeto,
    idSequencia:
      projeto[idxProjetos.id_sequencia]
  };
}


function garantirCabecalhosPacoteV062_(
  aba,
  desejados
) {
  const ultimaColuna =
    Math.max(aba.getLastColumn(), 1);

  const atuais = aba.getRange(
    1,
    1,
    1,
    ultimaColuna
  ).getDisplayValues()[0]
    .map(v => textoPacoteV062_(v));

  if (
    aba.getLastRow() === 0 ||
    atuais.every(v => !v)
  ) {
    aba.getRange(
      1,
      1,
      1,
      desejados.length
    ).setValues([desejados]);
    return;
  }

  const ausentes = desejados.filter(
    campo => !atuais.includes(campo)
  );

  if (!ausentes.length) return;

  aba.getRange(
    1,
    ultimaColuna + 1,
    1,
    ausentes.length
  ).setValues([ausentes]);
}


function estilizarAbaPacoteV062_(aba) {
  const ultimaColuna = aba.getLastColumn();

  aba.getRange(
    1,
    1,
    1,
    ultimaColuna
  )
    .setBackground('#0F766E')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  aba.setFrozenRows(1);

  for (let c = 1; c <= ultimaColuna; c++) {
    aba.setColumnWidth(c, 165);
  }
}


function anexarPorCabecalhoPacoteV062_(
  aba,
  registro
) {
  const headers = aba.getRange(
    1,
    1,
    1,
    aba.getLastColumn()
  ).getDisplayValues()[0];

  const linha = headers.map(h => {
    const chave = textoPacoteV062_(h);

    return Object.prototype.hasOwnProperty.call(
      registro,
      chave
    )
      ? registro[chave]
      : '';
  });

  aba.appendRow(linha);
}


function indexarPacoteV062_(headers) {
  const idx = {};

  headers.forEach((valor, i) => {
    const chave = textoPacoteV062_(valor);

    if (chave) idx[chave] = i;
  });

  return idx;
}


function textoPacoteV062_(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return '';
  }

  return String(valor)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function gerarIdPacoteV062_(prefixo) {
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


/* ==========================================================
   PACOTE TÉCNICO PARA RSTUDIO V0.6.4
   ========================================================== */

/**
 * NAVE — PACOTE TÉCNICO PARA RSTUDIO — V0.6.4
 *
 * Objetivo:
 * - ler um pacote já liberado em PACOTE_PDF;
 * - cruzar as coleções com FONTES_PDF;
 * - gerar uma aba técnica para o RStudio;
 * - gerar um arquivo CSV no Google Drive;
 * - preservar a ordem editorial e a página original.
 *
 * Arquivo sugerido:
 * PacoteTecnicoRStudioV064.gs
 *
 * Pré-requisitos:
 * - PacoteEditorialPdfV062.gs instalado;
 * - FONTES_PDF com url_pdf e status_fonte;
 * - pelo menos um item em PACOTE_PDF.
 */

const NAVE_RSTUDIO_V064 = Object.freeze({
  ABA_PACOTE: 'PACOTE_PDF',
  ABA_FONTES: 'FONTES_PDF',
  ABA_TECNICA: 'PACOTE_RSTUDIO',
  ABA_LOG: 'LOG_PACOTES_RSTUDIO',
  PASTA_DRIVE: 'NAVE_PACOTES_EDITORIAIS',

  CABECALHOS_TECNICOS: [
    'id_pacote_pdf',
    'id_projeto_editorial',
    'id_sequencia',
    'ordem_pdf',
    'id_ocorrencia',
    'ano',
    'edicao',
    'competencia',
    'habilidade',
    'objeto_principal',
    'dificuldade_rotulo',
    'funcao_pedagogica_sugerida',
    'status_validacao',
    'maturidade_curadoria',
    'liberacao_editorial',
    'colecao_origem',
    'nome_publico_pdf',
    'url_pdf',
    'id_arquivo_drive',
    'pagina_pdf',
    'status_fonte',
    'incluir_no_pdf',
    'observacao_editorial'
  ],

  CABECALHOS_LOG: [
    'id_exportacao',
    'gerado_em',
    'gerado_por',
    'id_pacote_pdf',
    'id_projeto_editorial',
    'quantidade_itens',
    'quantidade_fontes',
    'nome_arquivo_csv',
    'id_arquivo_csv',
    'url_arquivo_csv',
    'status_exportacao'
  ]
});


/* =========================================================
   INSTALAÇÃO
   ========================================================= */

function instalarPacoteTecnicoRStudioV064() {
  const ss = SpreadsheetApp.getActive();

  if (
    !ss.getSheetByName(NAVE_RSTUDIO_V064.ABA_PACOTE) ||
    !ss.getSheetByName(NAVE_RSTUDIO_V064.ABA_FONTES)
  ) {
    throw new Error(
      'As abas PACOTE_PDF e FONTES_PDF são obrigatórias.'
    );
  }

  let tecnica = ss.getSheetByName(
    NAVE_RSTUDIO_V064.ABA_TECNICA
  );

  if (!tecnica) {
    tecnica = ss.insertSheet(
      NAVE_RSTUDIO_V064.ABA_TECNICA
    );
  }

  let log = ss.getSheetByName(
    NAVE_RSTUDIO_V064.ABA_LOG
  );

  if (!log) {
    log = ss.insertSheet(
      NAVE_RSTUDIO_V064.ABA_LOG
    );
  }

  garantirCabecalhosRStudioV064_(
    tecnica,
    NAVE_RSTUDIO_V064.CABECALHOS_TECNICOS
  );

  garantirCabecalhosRStudioV064_(
    log,
    NAVE_RSTUDIO_V064.CABECALHOS_LOG
  );

  estilizarAbaRStudioV064_(tecnica);
  estilizarAbaRStudioV064_(log);

  obterOuCriarPastaRStudioV064_();

  SpreadsheetApp.getUi().alert(
    'Pacote técnico instalado',
    [
      'Foram preparadas as abas:',
      '• PACOTE_RSTUDIO',
      '• LOG_PACOTES_RSTUDIO',
      '',
      'Também foi criada ou localizada a pasta:',
      '• NAVE_PACOTES_EDITORIAIS'
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


/* =========================================================
   SOLICITAÇÃO
   ========================================================= */

function solicitarGeracaoPacoteRStudioV064() {
  const ui = SpreadsheetApp.getUi();

  const resposta = ui.prompt(
    'Gerar pacote técnico para o RStudio',
    'Informe o ID do pacote PDF:',
    ui.ButtonSet.OK_CANCEL
  );

  if (resposta.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const idPacote = String(
    resposta.getResponseText() || ''
  ).trim();

  if (!idPacote) {
    throw new Error('Informe o ID do pacote PDF.');
  }

  return gerarPacoteRStudioV064(idPacote);
}


/* =========================================================
   GERAÇÃO
   ========================================================= */

function gerarPacoteRStudioV064(idPacote) {
  const ss = SpreadsheetApp.getActive();

  const abaPacote = ss.getSheetByName(
    NAVE_RSTUDIO_V064.ABA_PACOTE
  );

  const abaFontes = ss.getSheetByName(
    NAVE_RSTUDIO_V064.ABA_FONTES
  );

  const abaTecnica = ss.getSheetByName(
    NAVE_RSTUDIO_V064.ABA_TECNICA
  );

  const abaLog = ss.getSheetByName(
    NAVE_RSTUDIO_V064.ABA_LOG
  );

  if (!abaTecnica || !abaLog) {
    throw new Error(
      'Execute instalarPacoteTecnicoRStudioV064() primeiro.'
    );
  }

  const dadosPacote = abaPacote.getDataRange().getValues();
  const idxPacote = indexarRStudioV064_(dadosPacote[0]);

  const obrigatoriosPacote = [
    'id_pacote_pdf',
    'id_projeto_editorial',
    'id_sequencia',
    'ordem_pdf',
    'id_ocorrencia',
    'colecao_origem',
    'pagina_pdf',
    'incluir_no_pdf'
  ];

  const faltantesPacote = obrigatoriosPacote.filter(
    campo => idxPacote[campo] === undefined
  );

  if (faltantesPacote.length) {
    throw new Error(
      'Campos ausentes em PACOTE_PDF: ' +
      faltantesPacote.join(', ')
    );
  }

  const itens = dadosPacote.slice(1)
    .filter(r =>
      textoRStudioV064_(r[idxPacote.id_pacote_pdf]) ===
        textoRStudioV064_(idPacote) &&
      textoRStudioV064_(r[idxPacote.incluir_no_pdf]) === 'Sim'
    )
    .sort((a, b) =>
      Number(a[idxPacote.ordem_pdf]) -
      Number(b[idxPacote.ordem_pdf])
    );

  if (!itens.length) {
    throw new Error(
      'Nenhum item liberado foi encontrado para o pacote: ' +
      idPacote
    );
  }

  const mapaFontes = criarMapaFontesRStudioV064_(abaFontes);

  const linhasTecnicas = [];
  const erros = [];

  itens.forEach(r => {
    const colecao = textoRStudioV064_(
      r[idxPacote.colecao_origem]
    );

    const fonte = mapaFontes.get(colecao);

    if (!fonte) {
      erros.push(
        `${r[idxPacote.id_ocorrencia]}: coleção não cadastrada`
      );
      return;
    }

    if (
      fonte.status !== 'Disponível' ||
      !fonte.url
    ) {
      erros.push(
        `${r[idxPacote.id_ocorrencia]}: fonte indisponível`
      );
      return;
    }

    linhasTecnicas.push({
      id_pacote_pdf: idPacote,
      id_projeto_editorial:
        valorRStudioV064_(r, idxPacote, 'id_projeto_editorial'),
      id_sequencia:
        valorRStudioV064_(r, idxPacote, 'id_sequencia'),
      ordem_pdf:
        valorRStudioV064_(r, idxPacote, 'ordem_pdf'),
      id_ocorrencia:
        valorRStudioV064_(r, idxPacote, 'id_ocorrencia'),
      ano:
        valorRStudioV064_(r, idxPacote, 'ano'),
      edicao:
        valorRStudioV064_(r, idxPacote, 'edicao'),
      competencia:
        valorRStudioV064_(r, idxPacote, 'competencia'),
      habilidade:
        valorRStudioV064_(r, idxPacote, 'habilidade'),
      objeto_principal:
        valorRStudioV064_(r, idxPacote, 'objeto_principal'),
      dificuldade_rotulo:
        valorRStudioV064_(r, idxPacote, 'dificuldade_rotulo'),
      funcao_pedagogica_sugerida:
        valorRStudioV064_(
          r,
          idxPacote,
          'funcao_pedagogica_sugerida'
        ),
      status_validacao:
        valorRStudioV064_(r, idxPacote, 'status_validacao'),
      maturidade_curadoria:
        valorRStudioV064_(r, idxPacote, 'maturidade_curadoria'),
      liberacao_editorial:
        valorRStudioV064_(r, idxPacote, 'liberacao_editorial'),
      colecao_origem: colecao,
      nome_publico_pdf: fonte.nomePublico,
      url_pdf: fonte.url,
      id_arquivo_drive: extrairIdDriveRStudioV064_(fonte.url),
      pagina_pdf:
        valorRStudioV064_(r, idxPacote, 'pagina_pdf'),
      status_fonte: fonte.status,
      incluir_no_pdf: 'Sim',
      observacao_editorial:
        valorRStudioV064_(r, idxPacote, 'observacao_editorial')
    });
  });

  if (erros.length) {
    throw new Error(
      [
        'O pacote possui problemas de fonte:',
        ...erros.slice(0, 20)
      ].join('\n')
    );
  }

  limparLinhasDoPacoteRStudioV064_(
    abaTecnica,
    idPacote
  );

  linhasTecnicas.forEach(registro =>
    anexarPorCabecalhoRStudioV064_(
      abaTecnica,
      registro
    )
  );

  const csv = gerarCsvRStudioV064_(
    NAVE_RSTUDIO_V064.CABECALHOS_TECNICOS,
    linhasTecnicas
  );

  const agora = new Date();
  const usuario =
    Session.getActiveUser().getEmail() ||
    'Usuário não identificado';

  const timestamp = Utilities.formatDate(
    agora,
    Session.getScriptTimeZone() || 'America/Sao_Paulo',
    'yyyyMMdd_HHmmss'
  );

  const nomeArquivo =
    `pacote_rstudio_${idPacote}_${timestamp}.csv`;

  const pasta = obterOuCriarPastaRStudioV064_();

  const arquivo = pasta.createFile(
    nomeArquivo,
    csv,
    MimeType.CSV
  );

  const idProjeto = linhasTecnicas[0].id_projeto_editorial;

  anexarPorCabecalhoRStudioV064_(
    abaLog,
    {
      id_exportacao:
        gerarIdRStudioV064_('EXP'),
      gerado_em: agora,
      gerado_por: usuario,
      id_pacote_pdf: idPacote,
      id_projeto_editorial: idProjeto,
      quantidade_itens: linhasTecnicas.length,
      quantidade_fontes:
        new Set(
          linhasTecnicas.map(r => r.colecao_origem)
        ).size,
      nome_arquivo_csv: nomeArquivo,
      id_arquivo_csv: arquivo.getId(),
      url_arquivo_csv: arquivo.getUrl(),
      status_exportacao: 'Gerado'
    }
  );

  SpreadsheetApp.flush();

  SpreadsheetApp.getUi().alert(
    'Pacote técnico gerado',
    [
      `Pacote: ${idPacote}`,
      `Itens: ${linhasTecnicas.length}`,
      `Fontes: ${
        new Set(
          linhasTecnicas.map(r => r.colecao_origem)
        ).size
      }`,
      `Arquivo: ${nomeArquivo}`,
      '',
      'O CSV foi salvo na pasta:',
      NAVE_RSTUDIO_V064.PASTA_DRIVE
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  ss.setActiveSheet(abaTecnica);

  return {
    idPacote,
    quantidadeItens: linhasTecnicas.length,
    nomeArquivo,
    idArquivo: arquivo.getId(),
    urlArquivo: arquivo.getUrl()
  };
}


/* =========================================================
   FONTES
   ========================================================= */

function criarMapaFontesRStudioV064_(abaFontes) {
  const dados = abaFontes.getDataRange().getValues();
  const idx = indexarRStudioV064_(dados[0]);

  const obrigatorios = [
    'colecao_origem',
    'nome_publico',
    'url_pdf',
    'status_fonte'
  ];

  const faltantes = obrigatorios.filter(
    campo => idx[campo] === undefined
  );

  if (faltantes.length) {
    throw new Error(
      'Campos ausentes em FONTES_PDF: ' +
      faltantes.join(', ')
    );
  }

  const mapa = new Map();

  dados.slice(1).forEach(r => {
    const colecao = textoRStudioV064_(
      r[idx.colecao_origem]
    );

    if (!colecao) return;

    mapa.set(colecao, {
      nomePublico:
        textoRStudioV064_(r[idx.nome_publico]),
      url:
        textoRStudioV064_(r[idx.url_pdf]),
      status:
        textoRStudioV064_(r[idx.status_fonte])
    });
  });

  return mapa;
}


/* =========================================================
   DRIVE
   ========================================================= */

function obterOuCriarPastaRStudioV064_() {
  const pastas = DriveApp.getFoldersByName(
    NAVE_RSTUDIO_V064.PASTA_DRIVE
  );

  if (pastas.hasNext()) {
    return pastas.next();
  }

  return DriveApp.createFolder(
    NAVE_RSTUDIO_V064.PASTA_DRIVE
  );
}


function extrairIdDriveRStudioV064_(url) {
  const texto = textoRStudioV064_(url);

  if (!texto) return '';

  const padroes = [
    /\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{20,})$/
  ];

  for (const padrao of padroes) {
    const m = texto.match(padrao);

    if (m && m[1]) {
      return m[1];
    }
  }

  return '';
}


/* =========================================================
   CSV
   ========================================================= */

function gerarCsvRStudioV064_(
  headers,
  registros
) {
  const linhas = [];

  linhas.push(
    headers.map(escaparCsvRStudioV064_).join(',')
  );

  registros.forEach(registro => {
    linhas.push(
      headers.map(header =>
        escaparCsvRStudioV064_(
          registro[header]
        )
      ).join(',')
    );
  });

  return '\uFEFF' + linhas.join('\r\n');
}


function escaparCsvRStudioV064_(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return '';
  }

  const texto = String(valor)
    .replace(/\r?\n/g, ' ')
    .replace(/"/g, '""');

  return `"${texto}"`;
}


/* =========================================================
   ABA TÉCNICA
   ========================================================= */

function limparLinhasDoPacoteRStudioV064_(
  aba,
  idPacote
) {
  if (aba.getLastRow() < 2) return;

  const dados = aba.getDataRange().getValues();
  const idx = indexarRStudioV064_(dados[0]);

  if (idx.id_pacote_pdf === undefined) return;

  for (let i = dados.length - 1; i >= 1; i--) {
    if (
      textoRStudioV064_(
        dados[i][idx.id_pacote_pdf]
      ) === textoRStudioV064_(idPacote)
    ) {
      aba.deleteRow(i + 1);
    }
  }
}


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function garantirCabecalhosRStudioV064_(
  aba,
  desejados
) {
  const ultimaColuna =
    Math.max(aba.getLastColumn(), 1);

  const atuais = aba.getRange(
    1,
    1,
    1,
    ultimaColuna
  ).getDisplayValues()[0]
    .map(v => textoRStudioV064_(v));

  if (
    aba.getLastRow() === 0 ||
    atuais.every(v => !v)
  ) {
    aba.getRange(
      1,
      1,
      1,
      desejados.length
    ).setValues([desejados]);
    return;
  }

  const ausentes = desejados.filter(
    campo => !atuais.includes(campo)
  );

  if (!ausentes.length) return;

  aba.getRange(
    1,
    ultimaColuna + 1,
    1,
    ausentes.length
  ).setValues([ausentes]);
}


function estilizarAbaRStudioV064_(aba) {
  const ultimaColuna = aba.getLastColumn();

  aba.getRange(
    1,
    1,
    1,
    ultimaColuna
  )
    .setBackground('#0F766E')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  aba.setFrozenRows(1);

  for (let c = 1; c <= ultimaColuna; c++) {
    aba.setColumnWidth(c, 170);
  }
}


function anexarPorCabecalhoRStudioV064_(
  aba,
  registro
) {
  const headers = aba.getRange(
    1,
    1,
    1,
    aba.getLastColumn()
  ).getDisplayValues()[0];

  const linha = headers.map(h => {
    const chave = textoRStudioV064_(h);

    return Object.prototype.hasOwnProperty.call(
      registro,
      chave
    )
      ? registro[chave]
      : '';
  });

  aba.appendRow(linha);
}


function valorRStudioV064_(
  linha,
  idx,
  campo
) {
  return idx[campo] !== undefined
    ? linha[idx[campo]]
    : '';
}


function indexarRStudioV064_(headers) {
  const idx = {};

  headers.forEach((valor, i) => {
    const chave = textoRStudioV064_(valor);

    if (chave) idx[chave] = i;
  });

  return idx;
}


function textoRStudioV064_(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return '';
  }

  return String(valor)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function gerarIdRStudioV064_(prefixo) {
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

