/**
 * NAVE | OFFLINE VALIDATION BRIDGE — V0.8.3
 *
 * Zona segura de entrada das validações docentes
 * recebidas pela arquitetura offline-first.
 *
 * IMPORTANTE:
 *
 * - NÃO possui doPost().
 * - NÃO altera QUESTOES_GERAL.
 * - NÃO altera a estrutura produtiva de validações.
 * - Apenas registra entradas em VALIDACOES_OFFLINE_ENTRADA.
 *
 * V0.8.3:
 * - passa a exigir identidade autenticada pelo servidor Next.js/Auth.js;
 * - não confia em usuário/e-mail informado pelo navegador;
 * - preserva compatibilidade com as linhas históricas da V0.8.0.
 */

const NAVE_OFFLINE_VALIDATION_V083 = Object.freeze({
  ABA_ENTRADA: 'VALIDACOES_OFFLINE_ENTRADA',

  CABECALHOS: Object.freeze([
    'id_operacao',
    'id_questao',
    'usuario',
    'acao',
    'status_validacao',
    'observacao',
    'criado_em_cliente',
    'recebido_em_servidor',
    'tentativas_cliente',
    'status_processamento',
    'processado_em',
    'erro_processamento',
    'payload_json',

    // V0.8.3 — adicionados ao final para não deslocar dados antigos
    'email_autenticado',
    'id_usuario_google',
    'nome_autenticado'
  ])
});


/* =========================================================
   ENTRADA DA VALIDAÇÃO
========================================================= */

function registrarValidacaoOfflineV080_(
  ss,
  operation
) {
  const sheet =
    garantirAbaValidacoesOfflineV080_(ss);

  const idOperacao = String(
    operation && operation.id
      ? operation.id
      : ''
  ).trim();

  if (!idOperacao) {
    throw new Error(
      'Validação offline sem id de operação.'
    );
  }

  /*
   * Idempotência:
   * se o mesmo id já tiver sido recebido,
   * não cria uma segunda linha.
   */
  if (
    existeValidacaoOfflineV080_(
      sheet,
      idOperacao
    )
  ) {
    return {
      ok: true,
      id: idOperacao,
      duplicated: true
    };
  }

  const payload =
    operation &&
    operation.payload &&
    typeof operation.payload === 'object'
      ? operation.payload
      : {};

  const idQuestao = String(
    operation.entityId ||
    payload.idQuestao ||
    ''
  ).trim();

  if (!idQuestao) {
    throw new Error(
      'Validação offline sem id da questão.'
    );
  }

  /* =======================================================
     IDENTIDADE AUTENTICADA
     =======================================================

     Esta identidade foi acrescentada pela rota /api/sync
     no servidor Next.js após validação da sessão Auth.js.

     Não usamos mais:
     - payload.usuario
     - payload.emailUsuario
     - qualquer identidade arbitrária enviada pelo navegador.
  ======================================================= */

  const authenticatedUser =
    payload.authenticatedUser &&
    typeof payload.authenticatedUser === 'object'
      ? payload.authenticatedUser
      : null;

  if (!authenticatedUser) {
    throw new Error(
      'Validação offline sem identidade autenticada.'
    );
  }

  const idUsuarioGoogle = String(
    authenticatedUser.id || ''
  ).trim();

  const emailAutenticado = String(
    authenticatedUser.email || ''
  )
    .trim()
    .toLowerCase();

  const nomeAutenticado = String(
    authenticatedUser.name || ''
  ).trim();

  if (!idUsuarioGoogle) {
    throw new Error(
      'Validação offline sem id do usuário autenticado.'
    );
  }

  if (!emailAutenticado) {
    throw new Error(
      'Validação offline sem e-mail autenticado.'
    );
  }

  /*
   * Mantemos a coluna histórica "usuario".
   * A partir da V0.8.3 ela recebe o e-mail autenticado,
   * preservando compatibilidade com consultas existentes.
   */
  const usuario =
    emailAutenticado;

  const statusValidacao = String(
    payload.statusValidacao ||
    ''
  ).trim();

  if (!statusValidacao) {
    throw new Error(
      'Validação offline sem status de validação.'
    );
  }

  const observacao = String(
    payload.observacao ||
    ''
  ).trim();

  const criadoEmCliente =
    normalizarDataOfflineV080_(
      operation.createdAt
    );

  const recebidoEmServidor =
    new Date();

  const tentativasCliente =
    Number(
      operation.attempts || 0
    );

  const linha = [[
    idOperacao,
    idQuestao,
    usuario,
    String(
      operation.action || 'update'
    ),
    statusValidacao,
    observacao,
    criadoEmCliente,
    recebidoEmServidor,
    tentativasCliente,
    'Recebida',
    '',
    '',
    JSON.stringify(payload),

    // V0.8.3
    emailAutenticado,
    idUsuarioGoogle,
    nomeAutenticado
  ]];

  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      1,
      NAVE_OFFLINE_VALIDATION_V083
        .CABECALHOS.length
    )
    .setValues(linha);

  return {
    ok: true,
    id: idOperacao,
    duplicated: false
  };
}


/* =========================================================
   ABA DE ENTRADA
========================================================= */

function garantirAbaValidacoesOfflineV080_(
  ss
) {
  let sheet =
    ss.getSheetByName(
      NAVE_OFFLINE_VALIDATION_V083
        .ABA_ENTRADA
    );

  if (!sheet) {
    sheet = ss.insertSheet(
      NAVE_OFFLINE_VALIDATION_V083
        .ABA_ENTRADA
    );
  }

  const headers =
    NAVE_OFFLINE_VALIDATION_V083
      .CABECALHOS;

  /*
   * Compatibilidade V0.8.0 → V0.8.3
   *
   * A planilha antiga possuía 13 colunas.
   * As 3 novas colunas são acrescentadas ao final.
   * Nenhuma coluna histórica é deslocada.
   */

  const colunasNecessarias =
    headers.length;

  const colunasAtuais =
    sheet.getMaxColumns();

  if (
    colunasAtuais <
    colunasNecessarias
  ) {
    sheet.insertColumnsAfter(
      colunasAtuais,
      colunasNecessarias -
        colunasAtuais
    );
  }

  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([headers]);

  sheet.setFrozenRows(1);

  return sheet;
}


/* =========================================================
   IDEMPOTÊNCIA
========================================================= */

function existeValidacaoOfflineV080_(
  sheet,
  idOperacao
) {
  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return false;
  }

  const ids = sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      1
    )
    .getDisplayValues();

  return ids.some(function(row) {
    return String(
      row[0] || ''
    ).trim() === idOperacao;
  });
}


/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarDataOfflineV080_(
  valor
) {
  if (!valor) {
    return '';
  }

  const data =
    new Date(valor);

  if (
    isNaN(
      data.getTime()
    )
  ) {
    return String(valor);
  }

  return data;
}


/* =========================================================
   TESTE MANUAL SEGURO
========================================================= */

function testarEstruturaValidacoesOfflineV080() {
  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  if (!ss) {
    throw new Error(
      'Planilha ativa não encontrada.'
    );
  }

  const sheet =
    garantirAbaValidacoesOfflineV080_(ss);

  return {
    ok: true,
    aba: sheet.getName(),
    colunas:
      NAVE_OFFLINE_VALIDATION_V083
        .CABECALHOS.length
  };
}