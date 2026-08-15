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
       V0.11.15 — FONTES PDF ORIGINAIS
    ===================================================== */

    if (
      action ===
      'getQuestionPdfSources'
    ) {
      const ss =
        obterSpreadsheetOfflineSyncV070_();

      const questionIds =
        Array.isArray(body.questionIds)
          ? body.questionIds
          : Array.isArray(body.ids)
            ? body.ids
            : Array.isArray(body.idQuestoes)
              ? body.idQuestoes
              : [];

      const sources =
        obterFontesQuestoesOfflineV01115_(
          ss,
          questionIds
        );

      return respostaJsonOfflineSyncV070_({
        ok: true,
        action:
          'getQuestionPdfSources',
        sources: sources
      });
    }


    /* =====================================================
       V0.11.11 — EDITORAÇÃO CENTRAL
    ===================================================== */

    if (
      action ===
      'listActiveEditorialSequenceIds'
    ) {
      const ss =
        obterSpreadsheetOfflineSyncV070_();

      const contexto =
        obterContextoUsuarioAutenticadoV090_(
          body.emailAutenticacao,
          body.idGoogle,
          ss
        );

      const sequenceIds =
        listarSequenciasAtivasEditoracaoCentralV01111_(
          ss,
          contexto
        );

      return respostaJsonOfflineSyncV070_({
        ok: true,
        action:
          'listActiveEditorialSequenceIds',
        sequenceIds:
          sequenceIds
      });
    }


    if (
      action ===
      'listEditorialJobs'
    ) {
      const ss =
        obterSpreadsheetOfflineSyncV070_();

      const contexto =
        obterContextoUsuarioAutenticadoV090_(
          body.emailAutenticacao,
          body.idGoogle,
          ss
        );

      const jobs =
        listarEditoracaoCentralV01111_(
          ss,
          contexto
        );

      return respostaJsonOfflineSyncV070_({
        ok: true,
        action:
          'listEditorialJobs',
        jobs: jobs
      });
    }


    if (
      action ===
      'createEditorialJob'
    ) {
      const ss =
        obterSpreadsheetOfflineSyncV070_();

      const contexto =
        obterContextoUsuarioAutenticadoV090_(
          body.emailAutenticacao,
          body.idGoogle,
          ss
        );

      const job =
        criarEditoracaoCentralV01111_(
          ss,
          contexto,
          body.editorialJob
        );

      return respostaJsonOfflineSyncV070_({
        ok: true,
        action:
          'createEditorialJob',
        job: job
      });
    }


    if (
      action ===
      'updateEditorialJobStatus'
    ) {
      const ss =
        obterSpreadsheetOfflineSyncV070_();

      const contexto =
        obterContextoUsuarioAutenticadoV090_(
          body.emailAutenticacao,
          body.idGoogle,
          ss
        );

      const job =
        atualizarStatusEditoracaoCentralV01111_(
          ss,
          contexto,
          body.id,
          body.status
        );

      return respostaJsonOfflineSyncV070_({
        ok: true,
        action:
          'updateEditorialJobStatus',
        job: job
      });
    }


    if (
      action ===
      'prepareEditorialPackage'
    ) {
      const ss =
        obterSpreadsheetOfflineSyncV070_();

      const contexto =
        obterContextoUsuarioAutenticadoV090_(
          body.emailAutenticacao,
          body.idGoogle,
          ss
        );

      const packageInfo =
        prepararPacoteEditorialCentralV01120_(
          ss,
          contexto,
          body.id || body.idEnvio
        );

      return respostaJsonOfflineSyncV070_({
        ok: true,
        action:
          'prepareEditorialPackage',
        packageInfo:
          packageInfo
      });
    }


    /* =====================================================
       V0.12.20 — VALIDAÇÃO + COORDENAÇÃO CENTRAL
    ===================================================== */

    if (
      [
        'getValidationQuestion',
        'submitCentralValidation',
        'listCentralCoordinationCases',
        'getCentralCoordinationCase',
        'decideCentralCoordinationCase'
      ].includes(action)
    ) {
      const ss =
        obterSpreadsheetOfflineSyncV070_();

      const contexto =
        obterContextoUsuarioAutenticadoV090_(
          body.emailAutenticacao,
          body.idGoogle,
          ss
        );

      if (
        action ===
        'getValidationQuestion'
      ) {
        return respostaJsonOfflineSyncV070_({
          ok: true,
          action: action,
          question:
            obterQuestaoValidacaoCentralV01220_(
              ss,
              contexto,
              body.id
            )
        });
      }

      if (
        action ===
        'submitCentralValidation'
      ) {
        return respostaJsonOfflineSyncV070_({
          ok: true,
          action: action,
          result:
            registrarValidacaoCentralV01220_(
              ss,
              contexto,
              body.validation
            )
        });
      }

      if (
        action ===
        'listCentralCoordinationCases'
      ) {
        const listagem =
          listarCasosCoordenacaoCentralV01220_(
            ss,
            contexto
          );

        return respostaJsonOfflineSyncV070_({
          ok: true,
          action: action,
          cases: listagem.cases,
          indicadores: listagem.indicadores
        });
      }

      if (
        action ===
        'getCentralCoordinationCase'
      ) {
        return respostaJsonOfflineSyncV070_({
          ok: true,
          action: action,
          case:
            obterCasoCoordenacaoCentralV01220_(
              ss,
              contexto,
              body.id
            )
        });
      }

      return respostaJsonOfflineSyncV070_({
        ok: true,
        action: action,
        result:
          decidirCasoCoordenacaoCentralV01220_(
            ss,
            contexto,
            body.decision
          )
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
   V0.11.15 — FONTES PDF ORIGINAIS
========================================================= */

/**
 * Resolve, em lote, a fonte PDF original das questões
 * solicitadas pelo frontend.
 *
 * Estrutura esperada:
 * - QUESTOES_GERAL:
 *   id_ocorrencia, colecao_origem, area,
 *   componente_principal, pagina_pdf, url_pdf_manual
 *
 * - FONTES_PDF:
 *   colecao_origem, area, componente,
 *   url_pdf, status_fonte, nome_publico
 *
 * Mantém a mesma prioridade usada pela resolução multiarea:
 * 1. URL manual da própria questão;
 * 2. coleção + área + componente;
 * 3. coleção + área;
 * 4. coleção isolada.
 */
function obterFontesQuestoesOfflineV01115_(
  ss,
  questionIds
) {
  const ids =
    Array.from(
      new Set(
        (Array.isArray(questionIds)
          ? questionIds
          : [])
          .map(function(id) {
            return String(id || '').trim();
          })
          .filter(Boolean)
      )
    );

  if (!ids.length) {
    return [];
  }

  if (ids.length > 500) {
    throw new Error(
      'Quantidade máxima de questões por consulta de fontes: 500.'
    );
  }

  const abaQuestoes =
    ss.getSheetByName('QUESTOES_GERAL');

  if (
    !abaQuestoes ||
    abaQuestoes.getLastRow() < 2
  ) {
    throw new Error(
      'A aba QUESTOES_GERAL não foi encontrada ou está vazia.'
    );
  }

  const dadosQuestoes =
    abaQuestoes
      .getDataRange()
      .getValues();

  const idxQ =
    indexarFonteOfflineV01115_(
      dadosQuestoes[0]
    );

  if (
    idxQ.id_ocorrencia === undefined
  ) {
    throw new Error(
      'Campo id_ocorrencia ausente em QUESTOES_GERAL.'
    );
  }

  const idsAlvo =
    new Set(ids);

  const questoesPorId = {};

  dadosQuestoes
    .slice(1)
    .forEach(function(linha) {
      const id = String(
        linha[idxQ.id_ocorrencia] || ''
      ).trim();

      if (
        id &&
        idsAlvo.has(id)
      ) {
        questoesPorId[id] = linha;
      }
    });

  const catalogo =
    carregarCatalogoFontesOfflineV01115_(
      ss
    );

  return ids.map(function(idQuestao) {
    const linha =
      questoesPorId[idQuestao];

    if (!linha) {
      return {
        idQuestao: idQuestao,
        colecaoOrigem: '',
        nomePublico: '',
        paginaPdf: null,
        urlPdf: '',
        urlPagina: '',
        disponivel: false,
        motivo:
          'Questão não localizada em QUESTOES_GERAL.'
      };
    }

    const colecao =
      valorFonteOfflineV01115_(
        linha,
        idxQ,
        'colecao_origem'
      );

    const componente =
      valorFonteOfflineV01115_(
        linha,
        idxQ,
        'componente_principal'
      );

    const areaInformada =
      valorFonteOfflineV01115_(
        linha,
        idxQ,
        'area'
      );

    const area =
      areaInformada ||
      inferirAreaFonteOfflineV01115_(
        idQuestao,
        componente
      );

    const paginaPdf =
      obterPaginaFonteOfflineV01115_(
        linha,
        idxQ
      );

    const urlManual =
      valorFonteOfflineV01115_(
        linha,
        idxQ,
        'url_pdf_manual'
      );

    if (urlManual) {
      return {
        idQuestao: idQuestao,
        colecaoOrigem: colecao,
        nomePublico:
          colecao ||
          'Fonte cadastrada manualmente',
        paginaPdf: paginaPdf,
        urlPdf: urlManual,
        urlPagina:
          construirUrlPaginaFonteOfflineV01115_(
            urlManual,
            paginaPdf
          ),
        disponivel: true,
        motivo: ''
      };
    }

    const fonte =
      resolverFonteCatalogoOfflineV01115_(
        catalogo,
        colecao,
        area,
        componente
      );

    if (!fonte) {
      return {
        idQuestao: idQuestao,
        colecaoOrigem: colecao,
        nomePublico: '',
        paginaPdf: paginaPdf,
        urlPdf: '',
        urlPagina: '',
        disponivel: false,
        motivo:
          'Fonte não localizada para ' +
          [
            colecao || '?',
            area || '?',
            componente || '?'
          ].join(' · ')
      };
    }

    const disponivel =
      Boolean(fonte.url) &&
      normalizarFonteOfflineV01115_(
        fonte.status
      ) === 'disponivel';

    return {
      idQuestao: idQuestao,
      colecaoOrigem: colecao,
      nomePublico:
        fonte.nome ||
        colecao ||
        '',
      paginaPdf: paginaPdf,
      urlPdf:
        fonte.url || '',
      urlPagina:
        disponivel
          ? construirUrlPaginaFonteOfflineV01115_(
              fonte.url,
              paginaPdf
            )
          : '',
      disponivel: disponivel,
      motivo:
        disponivel
          ? ''
          : (
              fonte.status ||
              'Fonte sem URL disponível.'
            )
    };
  });
}


function carregarCatalogoFontesOfflineV01115_(
  ss
) {
  const aba =
    ss.getSheetByName('FONTES_PDF');

  if (
    !aba ||
    aba.getLastRow() < 2
  ) {
    return [];
  }

  const dados =
    aba
      .getDataRange()
      .getValues();

  const idx =
    indexarFonteOfflineV01115_(
      dados[0]
    );

  const obrigatorios = [
    'colecao_origem',
    'area',
    'componente',
    'url_pdf',
    'status_fonte'
  ];

  const ausentes =
    obrigatorios.filter(
      function(campo) {
        return idx[campo] === undefined;
      }
    );

  if (ausentes.length) {
    throw new Error(
      'Campos ausentes em FONTES_PDF: ' +
      ausentes.join(', ')
    );
  }

  return dados
    .slice(1)
    .map(function(linha) {
      return {
        colecao:
          normalizarFonteOfflineV01115_(
            linha[idx.colecao_origem]
          ),

        area:
          normalizarFonteOfflineV01115_(
            linha[idx.area]
          ),

        componente:
          normalizarComponenteFonteOfflineV01115_(
            linha[idx.componente]
          ),

        url:
          String(
            linha[idx.url_pdf] || ''
          ).trim(),

        status:
          String(
            linha[idx.status_fonte] || ''
          ).trim(),

        nome:
          idx.nome_publico === undefined
            ? ''
            : String(
                linha[idx.nome_publico] || ''
              ).trim()
      };
    })
    .filter(function(item) {
      return Boolean(item.colecao);
    });
}


function resolverFonteCatalogoOfflineV01115_(
  catalogo,
  colecao,
  area,
  componente
) {
  const alvoColecao =
    normalizarFonteOfflineV01115_(
      colecao
    );

  const alvoArea =
    normalizarFonteOfflineV01115_(
      area
    );

  const alvoComponente =
    normalizarComponenteFonteOfflineV01115_(
      componente
    );

  let fonte =
    catalogo.find(function(item) {
      return (
        item.colecao ===
          alvoColecao &&
        item.area ===
          alvoArea &&
        item.componente ===
          alvoComponente
      );
    });

  if (!fonte) {
    fonte =
      catalogo.find(function(item) {
        return (
          item.colecao ===
            alvoColecao &&
          item.area ===
            alvoArea
        );
      });
  }

  if (!fonte) {
    fonte =
      catalogo.find(function(item) {
        return (
          item.colecao ===
          alvoColecao
        );
      });
  }

  return fonte || null;
}


function obterPaginaFonteOfflineV01115_(
  linha,
  idx
) {
  const candidatos = [
    'pagina_pdf',
    'pagina',
    'pagina_origem',
    'page_pdf'
  ];

  for (
    let i = 0;
    i < candidatos.length;
    i += 1
  ) {
    const campo =
      candidatos[i];

    if (
      idx[campo] === undefined
    ) {
      continue;
    }

    const valor =
      linha[idx[campo]];

    if (
      valor === '' ||
      valor === null ||
      valor === undefined
    ) {
      continue;
    }

    const numero =
      Number(valor);

    return Number.isFinite(numero)
      ? numero
      : String(valor).trim();
  }

  return null;
}


function construirUrlPaginaFonteOfflineV01115_(
  urlPdf,
  paginaPdf
) {
  const url =
    String(urlPdf || '').trim();

  if (!url) {
    return '';
  }

  if (
    paginaPdf === null ||
    paginaPdf === undefined ||
    String(paginaPdf).trim() === ''
  ) {
    return url;
  }

  const pagina =
    String(paginaPdf).trim();

  return (
    url.replace(/#.*$/, '') +
    '#page=' +
    encodeURIComponent(pagina)
  );
}


function indexarFonteOfflineV01115_(
  headers
) {
  return headers.reduce(
    function(mapa, header, i) {
      const chave =
        String(header || '').trim();

      if (chave) {
        mapa[chave] = i;
      }

      return mapa;
    },
    {}
  );
}


function valorFonteOfflineV01115_(
  linha,
  idx,
  campo
) {
  if (
    idx[campo] === undefined
  ) {
    return '';
  }

  return String(
    linha[idx[campo]] || ''
  ).trim();
}


function normalizarFonteOfflineV01115_(
  valor
) {
  return String(valor || '')
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /\u00A0/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
    .toLowerCase();
}


function normalizarComponenteFonteOfflineV01115_(
  valor
) {
  const v =
    normalizarFonteOfflineV01115_(
      valor
    );

  const aliases = {
    'lingua portuguesa':
      'portugues',
    'portugues':
      'portugues',
    'historia':
      'historia',
    'geografia':
      'geografia',
    'filosofia':
      'filosofia',
    'sociologia':
      'sociologia',
    'matematica':
      'matematica',
    'quimica':
      'quimica',
    'fisica':
      'fisica',
    'biologia':
      'biologia'
  };

  return aliases[v] || v;
}


function inferirAreaFonteOfflineV01115_(
  id,
  componente
) {
  const codigo =
    String(id || '')
      .toUpperCase();

  if (/_CH_/.test(codigo)) {
    return 'CH';
  }

  if (/_MT_/.test(codigo)) {
    return 'MT';
  }

  if (/_LC_/.test(codigo)) {
    return 'LC';
  }

  if (/_CN_/.test(codigo)) {
    return 'CN';
  }

  const c =
    normalizarComponenteFonteOfflineV01115_(
      componente
    );

  if (
    [
      'quimica',
      'fisica',
      'biologia'
    ].includes(c)
  ) {
    return 'CN';
  }

  if (
    [
      'historia',
      'geografia',
      'filosofia',
      'sociologia'
    ].includes(c)
  ) {
    return 'CH';
  }

  if (c === 'matematica') {
    return 'MT';
  }

  if (
    [
      'portugues',
      'literatura',
      'lingua estrangeira moderna',
      'educacao fisica',
      'artes',
      'tecnologias da comunicacao e informacao'
    ].includes(c)
  ) {
    return 'LC';
  }

  return '';
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
