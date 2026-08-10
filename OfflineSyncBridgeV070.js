/**
 * NAVE | OFFLINE SYNC BRIDGE — V0.9.0
 *
 * Ponte entre o frontend Next.js/Vercel
 * e o backend Google Apps Script.
 *
 * SEGURANÇA:
 *
 * - recebe apenas POST autenticado por segredo servidor-servidor;
 * - mantém a sincronização offline existente;
 * - mantém idempotência pelo id da operação;
 * - encaminha validações para VALIDACOES_OFFLINE_ENTRADA;
 * - resolve identidade NAVE usando a aba USUARIOS;
 * - não altera QUESTOES_GERAL diretamente;
 * - não aplica automaticamente decisões pedagógicas produtivas.
 */

const NAVE_OFFLINE_SYNC_V070 = Object.freeze({
  ABA_TESTE: 'SYNC_OFFLINE_TESTE',

  PROP_SPREADSHEET_ID:
    'NAVE_OFFLINE_SPREADSHEET_ID',

  PROP_SECRET:
    'NAVE_OFFLINE_SYNC_SECRET',

  CABECALHOS: Object.freeze([
    'id_operacao',
    'entidade',
    'id_entidade',
    'acao',
    'payload_json',
    'status_recebimento',
    'recebido_em',
    'origem',
    'tentativas_cliente'
  ])
});


/* =========================================================
   CONFIGURAÇÃO INICIAL
========================================================= */

/**
 * Execute UMA VEZ manualmente no Apps Script.
 *
 * - registra o ID da planilha;
 * - cria um segredo de integração, se ainda não existir;
 * - cria/prepara SYNC_OFFLINE_TESTE.
 *
 * Retorna os dados necessários para configurar a Vercel.
 */
function configurarOfflineSyncBridgeV070() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error(
      'Não foi possível identificar a planilha vinculada ao projeto.'
    );
  }

  const props =
    PropertiesService.getScriptProperties();

  props.setProperty(
    NAVE_OFFLINE_SYNC_V070
      .PROP_SPREADSHEET_ID,
    ss.getId()
  );

  let secret =
    props.getProperty(
      NAVE_OFFLINE_SYNC_V070
        .PROP_SECRET
    );

  if (!secret) {
    secret =
      Utilities.getUuid() +
      Utilities
        .getUuid()
        .replace(/-/g, '');

    props.setProperty(
      NAVE_OFFLINE_SYNC_V070
        .PROP_SECRET,
      secret
    );
  }

  garantirAbaOfflineSyncV070_(ss);

  return {
    ok: true,
    spreadsheetId: ss.getId(),
    secret: secret,
    abaTeste:
      NAVE_OFFLINE_SYNC_V070
        .ABA_TESTE
  };
}


/* =========================================================
   ENTRADA HTTP POST
========================================================= */

function doPost(e) {
  try {
    const body =
      lerBodyOfflineSyncV070_(e);

    /*
     * Toda chamada desta API exige
     * autenticação servidor-servidor.
     */
    validarAutenticacaoOfflineSyncV070_(
      body
    );

    const action = String(
      body && body.action
        ? body.action
        : ''
    ).trim();


    /* =====================================================
       V0.9 — RESOLUÇÃO DE IDENTIDADE NAVE
    ===================================================== */

    if (
      action ===
      'resolveNaveUser'
    ) {
      const ss =
        obterSpreadsheetOfflineSyncV070_();

      const contexto =
        obterContextoUsuarioAutenticadoV090_(
          body.emailAutenticacao,
          body.idGoogle,
          ss
        );

      return respostaJsonOfflineSyncV070_({
        ok: true,

        action:
          'resolveNaveUser',

        authorized:
          contexto &&
          contexto.authorized === true,

        reason:
          contexto &&
          contexto.reason
            ? contexto.reason
            : '',

        user:
          contexto &&
          contexto.user
            ? contexto.user
            : null,

        permissions:
          contexto &&
          contexto.permissions
            ? contexto.permissions
            : null,

        resolvedAt:
          new Date()
            .toISOString()
      });
    }

        /* =====================================================
       V0.11.1 — INFORMAÇÕES DO BANCO DE QUESTÕES
    ===================================================== */

    if (
      action ===
      'getQuestionBankInfo'
    ) {
      const ss =
        obterSpreadsheetOfflineSyncV070_();

      const info =
        obterInfoBancoQuestoesOfflineV0111_(
          ss
        );

      return respostaJsonOfflineSyncV070_({
        ok: true,
        action:
          'getQuestionBankInfo',
        bank: info
      });
    }


    /* =====================================================
       V0.11.1 — BLOCO DO BANCO DE QUESTÕES
    ===================================================== */

    if (
      action ===
      'getQuestionBankChunk'
    ) {
      const ss =
        obterSpreadsheetOfflineSyncV070_();

      const chunk =
        obterChunkBancoQuestoesOfflineV0111_(
          ss,
          body.offset,
          body.limit
        );

      return respostaJsonOfflineSyncV070_({
        ok: true,
        action:
          'getQuestionBankChunk',
        chunk: chunk
      });
    }

    /* =====================================================
       AÇÃO DESCONHECIDA
    ===================================================== */

    if (
      action &&
      action !== 'sync'
    ) {
      throw new Error(
        'Ação de API não reconhecida: ' +
        action
      );
    }


    /* =====================================================
       SINCRONIZAÇÃO OFFLINE EXISTENTE
       action ausente continua aceito por compatibilidade.
    ===================================================== */

    const operations =
      Array.isArray(
        body.operations
      )
        ? body.operations
        : [];

    if (!operations.length) {
      return respostaJsonOfflineSyncV070_({
        ok: true,
        received: 0,
        processedIds: [],
        message:
          'Nenhuma operação recebida.'
      });
    }

    const ss =
      obterSpreadsheetOfflineSyncV070_();

    const sheet =
      garantirAbaOfflineSyncV070_(
        ss
      );

    const processedIds =
      registrarOperacoesOfflineSyncV070_(
        sheet,
        operations
      );

    return respostaJsonOfflineSyncV070_({
      ok: true,

      received:
        operations.length,

      processedIds:
        processedIds,

      processedAt:
        new Date()
          .toISOString()
    });

  } catch (error) {
    return respostaJsonOfflineSyncV070_({
      ok: false,

      error:
        error instanceof Error
          ? error.message
          : String(error)
    });
  }
}


/* =========================================================
   AUTENTICAÇÃO SERVIDOR-SERVIDOR
========================================================= */

function validarAutenticacaoOfflineSyncV070_(
  body
) {
  const esperado =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        NAVE_OFFLINE_SYNC_V070
          .PROP_SECRET
      );

  if (!esperado) {
    throw new Error(
      'Ponte offline não configurada.'
    );
  }

  const recebido = String(
    body &&
    body.secret
      ? body.secret
      : ''
  );

  if (
    !recebido ||
    recebido !== esperado
  ) {
    throw new Error(
      'Autenticação da sincronização inválida.'
    );
  }
}


/* =========================================================
   REGISTRO DAS OPERAÇÕES
========================================================= */

function registrarOperacoesOfflineSyncV070_(
  sheet,
  operations
) {
  const lastRow =
    sheet.getLastRow();

  const idsExistentes =
    new Set();

  if (lastRow >= 2) {
    const valores =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          1
        )
        .getDisplayValues();

    valores.forEach(
      function(row) {
        const id = String(
          row[0] || ''
        ).trim();

        if (id) {
          idsExistentes.add(id);
        }
      }
    );
  }

  const agora =
    new Date();

  const ss =
    sheet.getParent();

  const linhas = [];
  const processedIds = [];

  operations.forEach(
    function(operation) {
      const id = String(
        operation &&
        operation.id
          ? operation.id
          : ''
      ).trim();

      if (!id) {
        return;
      }

      /*
       * Idempotência:
       * se já chegou anteriormente,
       * confirma sem duplicar.
       */
      if (
        idsExistentes.has(id)
      ) {
        processedIds.push(id);
        return;
      }

      /*
       * V0.8+:
       * operações de validação
       * também seguem para a zona
       * segura de entrada.
       */
      const entidade =
        String(
          operation.entity || ''
        )
          .trim()
          .toLowerCase();

      if (
        entidade ===
        'validation'
      ) {
        registrarValidacaoOfflineV080_(
          ss,
          operation
        );
      }

      linhas.push([
        id,

        String(
          operation.entity || ''
        ),

        String(
          operation.entityId || ''
        ),

        String(
          operation.action || ''
        ),

        JSON.stringify(
          operation.payload === undefined
            ? null
            : operation.payload
        ),

        'Recebida',

        agora,

        'Next.js / Vercel',

        Number(
          operation.attempts || 0
        )
      ]);

      idsExistentes.add(id);
      processedIds.push(id);
    }
  );

  if (linhas.length) {
    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        linhas.length,
        NAVE_OFFLINE_SYNC_V070
          .CABECALHOS.length
      )
      .setValues(
        linhas
      );
  }

  return processedIds;
}


/* =========================================================
   PLANILHA / ABA
========================================================= */

function obterSpreadsheetOfflineSyncV070_() {
  const id =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        NAVE_OFFLINE_SYNC_V070
          .PROP_SPREADSHEET_ID
      );

  if (!id) {
    throw new Error(
      'ID da planilha da sincronização não configurado.'
    );
  }

  return SpreadsheetApp
    .openById(id);
}


function garantirAbaOfflineSyncV070_(
  ss
) {
  let sheet =
    ss.getSheetByName(
      NAVE_OFFLINE_SYNC_V070
        .ABA_TESTE
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        NAVE_OFFLINE_SYNC_V070
          .ABA_TESTE
      );
  }

  const headers =
    NAVE_OFFLINE_SYNC_V070
      .CABECALHOS;

  if (
    sheet.getLastRow() === 0
  ) {
    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .setValues([
        headers
      ]);

    sheet.setFrozenRows(1);
  }

  return sheet;
}


/* =========================================================
   UTILITÁRIOS HTTP
========================================================= */

function lerBodyOfflineSyncV070_(
  e
) {
  if (
    !e ||
    !e.postData ||
    !e.postData.contents
  ) {
    throw new Error(
      'Corpo da requisição POST ausente.'
    );
  }

  try {
    return JSON.parse(
      e.postData.contents
    );
  } catch (error) {
    throw new Error(
      'JSON recebido é inválido.'
    );
  }
}


function respostaJsonOfflineSyncV070_(
  obj
) {
  return ContentService
    .createTextOutput(
      JSON.stringify(obj)
    )
    .setMimeType(
      ContentService
        .MimeType
        .JSON
    );
}