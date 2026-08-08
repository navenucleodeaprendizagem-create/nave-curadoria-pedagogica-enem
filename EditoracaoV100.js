/**
 * NAVE — EDITORAÇÃO
 * Consolidação estrutural V1.0
 *
 * Reúne, sem alterar a lógica:
 * - SaidaEditorialV061.gs
 * - SincronizacaoEditorialV063.gs
 *
 * As funções mantêm os nomes originais para preservar compatibilidade.
 */



/* ==========================================================
   BLOCO 1 — SAÍDA EDITORIAL V0.6.1
   ========================================================== */

/**
 * NAVE — SAÍDA EDITORIAL DAS SEQUÊNCIAS — V0.6.1
 *
 * Arquivo sugerido:
 * SaidaEditorialV061.gs
 *
 * Pré-requisito:
 * - SequenciasEstruturadasV060.gs instalado
 *
 * Execute uma vez:
 * instalarSaidaEditorialV061()
 */

const NAVE_EDITORIAL_V061 = Object.freeze({
  ABA_PROJETOS: 'PROJETOS_EDITORIAIS',
  ABA_ITENS: 'ITENS_EDITORACAO',
  ABA_SEQUENCIAS: 'SEQUENCIAS_SALVAS',
  ABA_ITENS_SEQUENCIAS: 'ITENS_SEQUENCIAS',

  CABECALHOS_PROJETOS: [
    'id_projeto_editorial',
    'criado_em',
    'criado_por',
    'id_sequencia',
    'titulo_projeto',
    'titulo_sequencia',
    'versao_sequencia',
    'quantidade_questoes',
    'tempo_total_min',
    'status_editorial',
    'tipo_saida',
    'observacoes_editoriais',
    'atualizado_em',
    'atualizado_por'
  ],

  CABECALHOS_ITENS: [
    'id_item_editorial',
    'id_projeto_editorial',
    'id_sequencia',
    'ordem_editorial',
    'id_ocorrencia',
    'ano',
    'edicao',
    'competencia',
    'habilidade',
    'objeto_principal',
    'dificuldade_rotulo',
    'funcao_pedagogica_sugerida',
    'tempo_estimado_min',
    'status_validacao',
    'maturidade_curadoria',
    'colecao_origem',
    'pagina_pdf',
    'status_fonte_pdf',
    'liberacao_editorial',
    'observacao_professor',
    'observacao_editorial',
    'status_item_editorial',
    'incluido_em',
    'incluido_por'
  ]
});


/* =========================================================
   INSTALAÇÃO
   ========================================================= */

function instalarSaidaEditorialV061() {
  const ss = SpreadsheetApp.getActive();

  if (
    !ss.getSheetByName(NAVE_EDITORIAL_V061.ABA_SEQUENCIAS) ||
    !ss.getSheetByName(NAVE_EDITORIAL_V061.ABA_ITENS_SEQUENCIAS)
  ) {
    throw new Error(
      'Instale primeiro o módulo SequenciasEstruturadasV060.'
    );
  }

  let projetos = ss.getSheetByName(
    NAVE_EDITORIAL_V061.ABA_PROJETOS
  );

  if (!projetos) {
    projetos = ss.insertSheet(
      NAVE_EDITORIAL_V061.ABA_PROJETOS
    );
  }

  let itens = ss.getSheetByName(
    NAVE_EDITORIAL_V061.ABA_ITENS
  );

  if (!itens) {
    itens = ss.insertSheet(
      NAVE_EDITORIAL_V061.ABA_ITENS
    );
  }

  garantirCabecalhosEditorialV061_(
    projetos,
    NAVE_EDITORIAL_V061.CABECALHOS_PROJETOS
  );

  garantirCabecalhosEditorialV061_(
    itens,
    NAVE_EDITORIAL_V061.CABECALHOS_ITENS
  );

  estilizarAbaEditorialV061_(projetos);
  estilizarAbaEditorialV061_(itens);

  SpreadsheetApp.getUi().alert(
    'Saída editorial instalada',
    [
      'Foram preparadas as abas:',
      '• PROJETOS_EDITORIAIS',
      '• ITENS_EDITORACAO',
      '',
      'Agora uma sequência salva pode ser enviada para editoração.'
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


/* =========================================================
   ENVIAR SEQUÊNCIA ATUAL
   ========================================================= */

function enviarSequenciaAtualParaEditoracaoV061() {
  if (
    typeof salvarSequenciaAtualV06 !== 'function'
  ) {
    throw new Error(
      'A função salvarSequenciaAtualV06 não foi encontrada.'
    );
  }

  const salva = salvarSequenciaAtualV06();

  return criarProjetoEditorialDaSequenciaV061(
    salva.idSequencia
  );
}


/* =========================================================
   ENVIAR SEQUÊNCIA SALVA
   ========================================================= */

function solicitarEnvioSequenciaSalvaParaEditoracaoV061() {
  const ui = SpreadsheetApp.getUi();

  const resposta = ui.prompt(
    'Enviar sequência para editoração',
    'Informe o ID da sequência salva:',
    ui.ButtonSet.OK_CANCEL
  );

  if (resposta.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const idSequencia = String(
    resposta.getResponseText() || ''
  ).trim();

  if (!idSequencia) {
    throw new Error('Informe o ID da sequência.');
  }

  return criarProjetoEditorialDaSequenciaV061(
    idSequencia
  );
}


/* =========================================================
   CRIAR PROJETO EDITORIAL
   ========================================================= */

function criarProjetoEditorialDaSequenciaV061(
  idSequencia
) {
  const ss = SpreadsheetApp.getActive();

  const abaSeq = ss.getSheetByName(
    NAVE_EDITORIAL_V061.ABA_SEQUENCIAS
  );

  const abaItensSeq = ss.getSheetByName(
    NAVE_EDITORIAL_V061.ABA_ITENS_SEQUENCIAS
  );

  const abaProjetos = ss.getSheetByName(
    NAVE_EDITORIAL_V061.ABA_PROJETOS
  );

  const abaItens = ss.getSheetByName(
    NAVE_EDITORIAL_V061.ABA_ITENS
  );

  if (!abaProjetos || !abaItens) {
    throw new Error(
      'Execute instalarSaidaEditorialV061() primeiro.'
    );
  }

  const dadosSeq = abaSeq.getDataRange().getValues();
  const idxSeq = indexarEditorialV061_(dadosSeq[0]);

  const linhaSeq = dadosSeq.findIndex((r, i) =>
    i > 0 &&
    textoEditorialV061_(r[idxSeq.id_sequencia]) ===
      textoEditorialV061_(idSequencia)
  );

  if (linhaSeq < 0) {
    throw new Error(
      'Sequência não localizada: ' + idSequencia
    );
  }

  const seq = dadosSeq[linhaSeq];

  const dadosItensSeq =
    abaItensSeq.getDataRange().getValues();

  const idxItensSeq =
    indexarEditorialV061_(dadosItensSeq[0]);

  const itensSeq = dadosItensSeq.slice(1)
    .filter(r =>
      textoEditorialV061_(
        r[idxItensSeq.id_sequencia]
      ) === textoEditorialV061_(idSequencia) &&
      textoEditorialV061_(
        r[idxItensSeq.status_item_sequencia]
      ) !== 'Removido'
    )
    .sort((a, b) =>
      Number(a[idxItensSeq.ordem]) -
      Number(b[idxItensSeq.ordem])
    );

  if (!itensSeq.length) {
    throw new Error(
      'A sequência não possui itens ativos.'
    );
  }

  const agora = new Date();
  const usuario =
    Session.getActiveUser().getEmail() ||
    'Usuário não identificado';

  const idProjeto =
    gerarIdEditorialV061_('ED');

  const tituloSequencia =
    seq[idxSeq.titulo] || idSequencia;

  const tituloProjeto =
    'Editoração — ' + tituloSequencia;

  const tempoTotal = itensSeq.reduce(
    (soma, r) =>
      soma +
      (Number(
        r[idxItensSeq.tempo_estimado_min]
      ) || 0),
    0
  );

  anexarPorCabecalhoEditorialV061_(
    abaProjetos,
    {
      id_projeto_editorial: idProjeto,
      criado_em: agora,
      criado_por: usuario,
      id_sequencia: idSequencia,
      titulo_projeto: tituloProjeto,
      titulo_sequencia: tituloSequencia,
      versao_sequencia:
        seq[idxSeq.versao] || 1,
      quantidade_questoes: itensSeq.length,
      tempo_total_min: tempoTotal,
      status_editorial: 'Preparação',
      tipo_saida: 'PDF a partir das fontes originais',
      observacoes_editoriais: '',
      atualizado_em: agora,
      atualizado_por: usuario
    }
  );

  let semFonte = 0;
  let naoLiberadas = 0;

  itensSeq.forEach(r => {
    const colecao = valorEditorialV061_(
      r,
      idxItensSeq,
      'colecao_origem'
    );

    const pagina = valorEditorialV061_(
      r,
      idxItensSeq,
      'pagina_pdf'
    );

    const statusValidacao =
      valorEditorialV061_(
        r,
        idxItensSeq,
        'status_validacao'
      ) || 'Não avaliada';

    const maturidade =
      valorEditorialV061_(
        r,
        idxItensSeq,
        'maturidade_curadoria'
      ) || 'Importada';

    const statusFonte =
      colecao && pagina
        ? 'Fonte localizada'
        : 'Fonte incompleta';

    if (statusFonte === 'Fonte incompleta') {
      semFonte++;
    }

    const liberacao =
      determinarLiberacaoEditorialV061_(
        statusValidacao,
        maturidade
      );

    if (liberacao !== 'Liberada') {
      naoLiberadas++;
    }

    anexarPorCabecalhoEditorialV061_(
      abaItens,
      {
        id_item_editorial:
          gerarIdEditorialV061_('ITEMED'),
        id_projeto_editorial: idProjeto,
        id_sequencia: idSequencia,
        ordem_editorial:
          valorEditorialV061_(
            r,
            idxItensSeq,
            'ordem'
          ),
        id_ocorrencia:
          valorEditorialV061_(
            r,
            idxItensSeq,
            'id_ocorrencia'
          ),
        ano: valorEditorialV061_(
          r, idxItensSeq, 'ano'
        ),
        edicao: valorEditorialV061_(
          r, idxItensSeq, 'edicao'
        ),
        competencia: valorEditorialV061_(
          r, idxItensSeq, 'competencia'
        ),
        habilidade: valorEditorialV061_(
          r, idxItensSeq, 'habilidade'
        ),
        objeto_principal: valorEditorialV061_(
          r, idxItensSeq, 'objeto_principal'
        ),
        dificuldade_rotulo: valorEditorialV061_(
          r, idxItensSeq, 'dificuldade_rotulo'
        ),
        funcao_pedagogica_sugerida:
          valorEditorialV061_(
            r,
            idxItensSeq,
            'funcao_pedagogica_sugerida'
          ),
        tempo_estimado_min:
          valorEditorialV061_(
            r,
            idxItensSeq,
            'tempo_estimado_min'
          ),
        status_validacao: statusValidacao,
        maturidade_curadoria: maturidade,
        colecao_origem: colecao,
        pagina_pdf: pagina,
        status_fonte_pdf: statusFonte,
        liberacao_editorial: liberacao,
        observacao_professor:
          valorEditorialV061_(
            r,
            idxItensSeq,
            'observacao_professor'
          ),
        observacao_editorial: '',
        status_item_editorial: 'Pendente',
        incluido_em: agora,
        incluido_por: usuario
      }
    );
  });

  SpreadsheetApp.getUi().alert(
    'Projeto editorial criado',
    [
      `Projeto: ${idProjeto}`,
      `Sequência: ${idSequencia}`,
      `Questões: ${itensSeq.length}`,
      `Fontes incompletas: ${semFonte}`,
      `Itens não liberados: ${naoLiberadas}`
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  ss.setActiveSheet(abaItens);

  return {
    idProjeto,
    idSequencia,
    quantidadeQuestoes: itensSeq.length,
    fontesIncompletas: semFonte,
    itensNaoLiberados: naoLiberadas
  };
}


/* =========================================================
   REGRAS EDITORIAIS
   ========================================================= */

function determinarLiberacaoEditorialV061_(
  statusValidacao,
  maturidade
) {
  const status =
    textoEditorialV061_(statusValidacao);

  const mat =
    textoEditorialV061_(maturidade);

  if (
    status === 'Homologada' ||
    mat === 'Homologada'
  ) {
    return 'Liberada';
  }

  if (
    status === 'Divergência resolvida' ||
    mat === 'Ajustada pela coordenação'
  ) {
    return 'Liberada com revisão';
  }

  if (
    status === 'Com divergência aberta' ||
    status === 'Aguardando nova avaliação' ||
    mat === 'Com divergência'
  ) {
    return 'Bloqueada';
  }

  if (
    status === 'Suspensa pela coordenação' ||
    mat === 'Suspensa'
  ) {
    return 'Bloqueada';
  }

  return 'Aguardando validação';
}


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function garantirCabecalhosEditorialV061_(
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
    .map(v => textoEditorialV061_(v));

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


function estilizarAbaEditorialV061_(aba) {
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
    aba.setColumnWidth(c, 160);
  }
}


function anexarPorCabecalhoEditorialV061_(
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
    const chave = textoEditorialV061_(h);

    return Object.prototype.hasOwnProperty.call(
      registro,
      chave
    )
      ? registro[chave]
      : '';
  });

  aba.appendRow(linha);
}


function valorEditorialV061_(
  linha,
  idx,
  campo
) {
  return idx[campo] !== undefined
    ? linha[idx[campo]]
    : '';
}


function indexarEditorialV061_(headers) {
  const idx = {};

  headers.forEach((valor, i) => {
    const chave = textoEditorialV061_(valor);

    if (chave) idx[chave] = i;
  });

  return idx;
}


function textoEditorialV061_(valor) {
  if (valor === null || valor === undefined) {
    return '';
  }

  return String(valor)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function gerarIdEditorialV061_(prefixo) {
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
   BLOCO 2 — SINCRONIZAÇÃO EDITORIAL V0.6.3
   ========================================================== */

/**
 * NAVE — SINCRONIZAÇÃO EDITORIAL COM A BASE ATUAL — V0.6.3
 *
 * Problema corrigido:
 * ITENS_SEQUENCIAS guarda um retrato do momento em que a sequência foi salva.
 * Se uma questão for validada ou decidida depois, o projeto editorial pode
 * herdar o status antigo.
 *
 * Esta versão atualiza o projeto editorial diretamente a partir de
 * QUESTOES_GERAL antes da geração do pacote PDF.
 *
 * Arquivo sugerido:
 * SincronizacaoEditorialV063.gs
 */

const NAVE_EDITORIAL_V063 = Object.freeze({
  ABA_BASE: 'QUESTOES_GERAL',
  ABA_PROJETOS: 'PROJETOS_EDITORIAIS',
  ABA_ITENS: 'ITENS_EDITORACAO'
});


/* =========================================================
   ATUALIZAR PROJETO JÁ CRIADO
   ========================================================= */

function solicitarAtualizacaoProjetoEditorialV063() {
  const ui = SpreadsheetApp.getUi();

  const resposta = ui.prompt(
    'Atualizar projeto editorial',
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
    throw new Error('Informe o ID do projeto editorial.');
  }

  return atualizarProjetoEditorialComBaseAtualV063(idProjeto);
}


function atualizarProjetoEditorialComBaseAtualV063(idProjeto) {
  const ss = SpreadsheetApp.getActive();

  const base = ss.getSheetByName(
    NAVE_EDITORIAL_V063.ABA_BASE
  );

  const projetos = ss.getSheetByName(
    NAVE_EDITORIAL_V063.ABA_PROJETOS
  );

  const itens = ss.getSheetByName(
    NAVE_EDITORIAL_V063.ABA_ITENS
  );

  if (!base || !projetos || !itens) {
    throw new Error(
      'As abas QUESTOES_GERAL, PROJETOS_EDITORIAIS e ' +
      'ITENS_EDITORACAO são obrigatórias.'
    );
  }

  const dadosBase = base.getDataRange().getValues();
  const idxBase = indexarEditorialV063_(dadosBase[0]);

  const obrigatoriosBase = [
    'id_ocorrencia',
    'status_validacao',
    'maturidade_curadoria'
  ];

  const faltantesBase = obrigatoriosBase.filter(
    campo => idxBase[campo] === undefined
  );

  if (faltantesBase.length) {
    throw new Error(
      'Campos ausentes em QUESTOES_GERAL: ' +
      faltantesBase.join(', ')
    );
  }

  const mapaBase = new Map();

  for (let i = 1; i < dadosBase.length; i++) {
    const id = textoEditorialV063_(
      dadosBase[i][idxBase.id_ocorrencia]
    );

    if (id) {
      mapaBase.set(id, dadosBase[i]);
    }
  }

  const dadosItens = itens.getDataRange().getValues();
  const idxItens = indexarEditorialV063_(dadosItens[0]);

  const obrigatoriosItens = [
    'id_projeto_editorial',
    'id_ocorrencia',
    'status_validacao',
    'maturidade_curadoria',
    'colecao_origem',
    'pagina_pdf',
    'status_fonte_pdf',
    'liberacao_editorial'
  ];

  const faltantesItens = obrigatoriosItens.filter(
    campo => idxItens[campo] === undefined
  );

  if (faltantesItens.length) {
    throw new Error(
      'Campos ausentes em ITENS_EDITORACAO: ' +
      faltantesItens.join(', ')
    );
  }

  let atualizados = 0;
  let liberadas = 0;
  let liberadasComRevisao = 0;
  let aguardando = 0;
  let bloqueadas = 0;
  let fontesIncompletas = 0;

  for (let i = 1; i < dadosItens.length; i++) {
    const linha = dadosItens[i];

    if (
      textoEditorialV063_(
        linha[idxItens.id_projeto_editorial]
      ) !== textoEditorialV063_(idProjeto)
    ) {
      continue;
    }

    const idQuestao = textoEditorialV063_(
      linha[idxItens.id_ocorrencia]
    );

    const linhaBase = mapaBase.get(idQuestao);

    if (!linhaBase) {
      continue;
    }

    const statusValidacao =
      textoEditorialV063_(
        linhaBase[idxBase.status_validacao]
      ) || 'Não avaliada';

    const maturidade =
      textoEditorialV063_(
        linhaBase[idxBase.maturidade_curadoria]
      ) || 'Importada';

    const colecao = obterPrimeiroCampoV063_(
      linhaBase,
      idxBase,
      [
        'colecao_origem',
        'colecao_pdf',
        'colecao',
        'arquivo_origem'
      ],
      linha[idxItens.colecao_origem]
    );

    const pagina = obterPrimeiroCampoV063_(
      linhaBase,
      idxBase,
      [
        'pagina_pdf',
        'pagina_origem',
        'pagina'
      ],
      linha[idxItens.pagina_pdf]
    );

    const statusFonte =
      textoEditorialV063_(colecao) &&
      textoEditorialV063_(pagina)
        ? 'Fonte localizada'
        : 'Fonte incompleta';

    const liberacao =
      determinarLiberacaoEditorialV063_(
        statusValidacao,
        maturidade
      );

    itens.getRange(
      i + 1,
      idxItens.status_validacao + 1
    ).setValue(statusValidacao);

    itens.getRange(
      i + 1,
      idxItens.maturidade_curadoria + 1
    ).setValue(maturidade);

    itens.getRange(
      i + 1,
      idxItens.colecao_origem + 1
    ).setValue(colecao);

    itens.getRange(
      i + 1,
      idxItens.pagina_pdf + 1
    ).setValue(pagina);

    itens.getRange(
      i + 1,
      idxItens.status_fonte_pdf + 1
    ).setValue(statusFonte);

    itens.getRange(
      i + 1,
      idxItens.liberacao_editorial + 1
    ).setValue(liberacao);

    atualizados++;

    if (liberacao === 'Liberada') {
      liberadas++;
    } else if (liberacao === 'Liberada com revisão') {
      liberadasComRevisao++;
    } else if (liberacao === 'Bloqueada') {
      bloqueadas++;
    } else {
      aguardando++;
    }

    if (statusFonte === 'Fonte incompleta') {
      fontesIncompletas++;
    }
  }

  if (!atualizados) {
    throw new Error(
      'Nenhum item foi encontrado para o projeto: ' +
      idProjeto
    );
  }

  atualizarStatusProjetoV063_(
    projetos,
    idProjeto,
    liberadas,
    liberadasComRevisao,
    aguardando,
    bloqueadas,
    fontesIncompletas
  );

  SpreadsheetApp.flush();

  SpreadsheetApp.getUi().alert(
    'Projeto editorial atualizado',
    [
      `Projeto: ${idProjeto}`,
      `Itens atualizados: ${atualizados}`,
      `Liberadas: ${liberadas}`,
      `Liberadas com revisão: ${liberadasComRevisao}`,
      `Aguardando validação: ${aguardando}`,
      `Bloqueadas: ${bloqueadas}`,
      `Fontes incompletas: ${fontesIncompletas}`
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  ss.setActiveSheet(itens);

  return {
    idProjeto,
    atualizados,
    liberadas,
    liberadasComRevisao,
    aguardando,
    bloqueadas,
    fontesIncompletas
  };
}


/* =========================================================
   CRIAR PROJETO E SINCRONIZAR AUTOMATICAMENTE
   ========================================================= */

function solicitarEnvioSequenciaSalvaParaEditoracaoV063() {
  const ui = SpreadsheetApp.getUi();

  const resposta = ui.prompt(
    'Enviar sequência para editoração',
    'Informe o ID da sequência salva:',
    ui.ButtonSet.OK_CANCEL
  );

  if (resposta.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const idSequencia = String(
    resposta.getResponseText() || ''
  ).trim();

  if (!idSequencia) {
    throw new Error('Informe o ID da sequência.');
  }

  if (
    typeof criarProjetoEditorialDaSequenciaV061 !==
    'function'
  ) {
    throw new Error(
      'A função criarProjetoEditorialDaSequenciaV061 ' +
      'não foi encontrada.'
    );
  }

  const projeto =
    criarProjetoEditorialDaSequenciaV061(idSequencia);

  atualizarProjetoEditorialComBaseAtualV063(
    projeto.idProjeto
  );

  return projeto;
}


/* =========================================================
   REGRAS
   ========================================================= */

function determinarLiberacaoEditorialV063_(
  statusValidacao,
  maturidade
) {
  const status =
    textoEditorialV063_(statusValidacao);

  const mat =
    textoEditorialV063_(maturidade);

  if (
    status === 'Homologada' ||
    mat === 'Homologada'
  ) {
    return 'Liberada';
  }

  if (
    status === 'Divergência resolvida' ||
    mat === 'Ajustada pela coordenação'
  ) {
    return 'Liberada com revisão';
  }

  if (
    status === 'Com divergência aberta' ||
    status === 'Aguardando nova avaliação' ||
    mat === 'Com divergência' ||
    status === 'Suspensa pela coordenação' ||
    mat === 'Suspensa'
  ) {
    return 'Bloqueada';
  }

  return 'Aguardando validação';
}


function atualizarStatusProjetoV063_(
  abaProjetos,
  idProjeto,
  liberadas,
  liberadasComRevisao,
  aguardando,
  bloqueadas,
  fontesIncompletas
) {
  const dados = abaProjetos.getDataRange().getValues();
  const idx = indexarEditorialV063_(dados[0]);

  const linha = dados.findIndex((r, i) =>
    i > 0 &&
    textoEditorialV063_(
      r[idx.id_projeto_editorial]
    ) === textoEditorialV063_(idProjeto)
  );

  if (linha < 0) return;

  let status = 'Preparação';

  if (
    bloqueadas > 0 ||
    fontesIncompletas > 0
  ) {
    status = 'Com bloqueios';
  } else if (
    aguardando > 0
  ) {
    status = 'Aguardando validação';
  } else if (
    liberadas + liberadasComRevisao > 0
  ) {
    status = 'Pronto para pacote PDF';
  }

  if (idx.status_editorial !== undefined) {
    abaProjetos.getRange(
      linha + 1,
      idx.status_editorial + 1
    ).setValue(status);
  }

  if (idx.atualizado_em !== undefined) {
    abaProjetos.getRange(
      linha + 1,
      idx.atualizado_em + 1
    ).setValue(new Date());
  }

  if (idx.atualizado_por !== undefined) {
    abaProjetos.getRange(
      linha + 1,
      idx.atualizado_por + 1
    ).setValue(
      Session.getActiveUser().getEmail() ||
      'Usuário não identificado'
    );
  }
}


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function obterPrimeiroCampoV063_(
  linha,
  idx,
  candidatos,
  fallback
) {
  for (const campo of candidatos) {
    if (
      idx[campo] !== undefined &&
      textoEditorialV063_(linha[idx[campo]])
    ) {
      return linha[idx[campo]];
    }
  }

  return fallback || '';
}


function indexarEditorialV063_(headers) {
  const idx = {};

  headers.forEach((valor, i) => {
    const chave = textoEditorialV063_(valor);

    if (chave) idx[chave] = i;
  });

  return idx;
}


function textoEditorialV063_(valor) {
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
