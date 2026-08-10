/**
 * NAVE | BANCO DE QUESTÕES OFFLINE API — V0.11.1
 *
 * Exportação segura e paginada da aba QUESTOES_GERAL
 * para o frontend Next.js / IndexedDB.
 *
 * PRINCÍPIOS:
 *
 * - somente leitura;
 * - não altera QUESTOES_GERAL;
 * - não executa a busca pedagógica no Apps Script;
 * - não está restrita à Química;
 * - entrega dados em blocos;
 * - preserva a planilha como fonte oficial;
 * - IndexedDB será a cópia operacional rápida.
 */

const NAVE_BANCO_OFFLINE_V0111 = Object.freeze({
  ABA_BASE: 'QUESTOES_GERAL',

  CHUNK_PADRAO: 500,
  CHUNK_MAXIMO: 1000,

  CAMPOS: Object.freeze([
    'id_ocorrencia',
    'componente_principal',
    'competencia',
    'habilidade',
    'objeto_principal',
    'dificuldade_rotulo',
    'dificuldade_faixa',
    'ano',
    'edicao',
    'funcao_pedagogica_sugerida',
    'tempo_estimado_min',
    'trecho_inicial',
    'status_item',
    'status_curadoria',
    'status_validacao',
    'maturidade_curadoria',
    'quantidade_reportes',
    'possui_reporte_aberto'
  ])
});


/* =========================================================
   INFORMAÇÕES DO BANCO
========================================================= */

function obterInfoBancoQuestoesOfflineV0111_(ss) {
  const aba =
    obterAbaBancoQuestoesOfflineV0111_(ss);

  const ultimaLinha =
    aba.getLastRow();

  if (ultimaLinha < 2) {
    return {
      version: 'V0.11.1',
      total: 0,
      chunkSize:
        NAVE_BANCO_OFFLINE_V0111.CHUNK_PADRAO,
      fields:
        NAVE_BANCO_OFFLINE_V0111.CAMPOS.slice(),
      generatedAt:
        new Date().toISOString()
    };
  }

  const headers =
    aba
      .getRange(
        1,
        1,
        1,
        aba.getLastColumn()
      )
      .getDisplayValues()[0];

  const idx =
    indexarBancoQuestoesOfflineV0111_(
      headers
    );

  validarCamposBancoQuestoesOfflineV0111_(
    idx
  );

  return {
    version: 'V0.11.1',

    total:
      ultimaLinha - 1,

    chunkSize:
      NAVE_BANCO_OFFLINE_V0111
        .CHUNK_PADRAO,

    fields:
      NAVE_BANCO_OFFLINE_V0111
        .CAMPOS
        .slice(),

    generatedAt:
      new Date()
        .toISOString()
  };
}


/* =========================================================
   LEITURA DE BLOCO
========================================================= */

function obterChunkBancoQuestoesOfflineV0111_(
  ss,
  offset,
  limit
) {
  const aba =
    obterAbaBancoQuestoesOfflineV0111_(ss);

  const ultimaLinha =
    aba.getLastRow();

  const ultimaColuna =
    aba.getLastColumn();

  if (ultimaLinha < 2) {
    return {
      offset: 0,
      limit: 0,
      count: 0,
      total: 0,
      hasMore: false,
      nextOffset: null,
      records: []
    };
  }

  const headers =
    aba
      .getRange(
        1,
        1,
        1,
        ultimaColuna
      )
      .getDisplayValues()[0];

  const idx =
    indexarBancoQuestoesOfflineV0111_(
      headers
    );

  validarCamposBancoQuestoesOfflineV0111_(
    idx
  );

  const total =
    ultimaLinha - 1;

  let inicio =
    Number(offset || 0);

  if (
    !Number.isFinite(inicio) ||
    inicio < 0
  ) {
    inicio = 0;
  }

  inicio =
    Math.floor(inicio);

  let tamanho =
    Number(
      limit ||
      NAVE_BANCO_OFFLINE_V0111
        .CHUNK_PADRAO
    );

  if (
    !Number.isFinite(tamanho) ||
    tamanho <= 0
  ) {
    tamanho =
      NAVE_BANCO_OFFLINE_V0111
        .CHUNK_PADRAO;
  }

  tamanho =
    Math.min(
      Math.floor(tamanho),
      NAVE_BANCO_OFFLINE_V0111
        .CHUNK_MAXIMO
    );

  if (inicio >= total) {
    return {
      offset: inicio,
      limit: tamanho,
      count: 0,
      total: total,
      hasMore: false,
      nextOffset: null,
      records: []
    };
  }

  const quantidade =
    Math.min(
      tamanho,
      total - inicio
    );

  /*
   * +2:
   * linha 1 = cabeçalho
   * offset 0 começa na linha 2
   */
  const linhaInicial =
    inicio + 2;

  const dados =
    aba
      .getRange(
        linhaInicial,
        1,
        quantidade,
        ultimaColuna
      )
      .getValues();

  const records =
    dados
      .map(function(linha) {
        return mapearQuestaoOfflineV0111_(
          linha,
          idx
        );
      })
      .filter(function(item) {
        return Boolean(item.id);
      });

  const proximoOffset =
    inicio + quantidade;

  return {
    offset: inicio,
    limit: tamanho,
    count:
      records.length,
    total: total,

    hasMore:
      proximoOffset < total,

    nextOffset:
      proximoOffset < total
        ? proximoOffset
        : null,

    records: records
  };
}


/* =========================================================
   MAPEAMENTO
========================================================= */

function mapearQuestaoOfflineV0111_(
  linha,
  idx
) {
  return {
    id:
      textoBancoOfflineV0111_(
        linha[
          idx.id_ocorrencia
        ]
      ),

    componentePrincipal:
      textoBancoOfflineV0111_(
        linha[
          idx.componente_principal
        ]
      ),

    competencia:
      textoBancoOfflineV0111_(
        linha[
          idx.competencia
        ]
      ),

    habilidade:
      textoBancoOfflineV0111_(
        linha[
          idx.habilidade
        ]
      ),

    objetoPrincipal:
      textoBancoOfflineV0111_(
        linha[
          idx.objeto_principal
        ]
      ),

    dificuldadeRotulo:
      textoBancoOfflineV0111_(
        linha[
          idx.dificuldade_rotulo
        ]
      ),

    dificuldadeFaixa:
      numeroBancoOfflineV0111_(
        linha[
          idx.dificuldade_faixa
        ],
        3
      ),

    ano:
      textoBancoOfflineV0111_(
        linha[
          idx.ano
        ]
      ),

    edicao:
      textoBancoOfflineV0111_(
        linha[
          idx.edicao
        ]
      ),

    funcaoPedagogica:
      textoBancoOfflineV0111_(
        linha[
          idx.funcao_pedagogica_sugerida
        ]
      ),

    tempoEstimadoMin:
      numeroBancoOfflineV0111_(
        linha[
          idx.tempo_estimado_min
        ],
        0
      ),

    trechoInicial:
      textoBancoOfflineV0111_(
        linha[
          idx.trecho_inicial
        ]
      ),

    statusItem:
      textoBancoOfflineV0111_(
        linha[
          idx.status_item
        ]
      ),

    statusCuradoria:
      textoBancoOfflineV0111_(
        linha[
          idx.status_curadoria
        ]
      ),

    statusValidacao:
      textoBancoOfflineV0111_(
        linha[
          idx.status_validacao
        ]
      ) || 'Não avaliada',

    maturidadeCuradoria:
      textoBancoOfflineV0111_(
        linha[
          idx.maturidade_curadoria
        ]
      ) || 'Importada',

    quantidadeReportes:
      numeroBancoOfflineV0111_(
        linha[
          idx.quantidade_reportes
        ],
        0
      ),

    possuiReporteAberto:
      booleanoBancoOfflineV0111_(
        linha[
          idx.possui_reporte_aberto
        ]
      )
  };
}


/* =========================================================
   PLANILHA
========================================================= */

function obterAbaBancoQuestoesOfflineV0111_(
  ss
) {
  if (!ss) {
    throw new Error(
      'Planilha não informada.'
    );
  }

  const aba =
    ss.getSheetByName(
      NAVE_BANCO_OFFLINE_V0111
        .ABA_BASE
    );

  if (!aba) {
    throw new Error(
      'A aba QUESTOES_GERAL não foi encontrada.'
    );
  }

  return aba;
}


/* =========================================================
   VALIDAÇÃO DE CAMPOS
========================================================= */

function validarCamposBancoQuestoesOfflineV0111_(
  idx
) {
  const faltantes =
    NAVE_BANCO_OFFLINE_V0111
      .CAMPOS
      .filter(function(campo) {
        return idx[campo] === undefined;
      });

  if (faltantes.length) {
    throw new Error(
      'Campos ausentes em QUESTOES_GERAL: ' +
      faltantes.join(', ')
    );
  }
}


/* =========================================================
   UTILITÁRIOS
========================================================= */

function indexarBancoQuestoesOfflineV0111_(
  headers
) {
  const idx = {};

  headers.forEach(
    function(header, i) {
      const chave =
        textoBancoOfflineV0111_(
          header
        );

      if (chave) {
        idx[chave] = i;
      }
    }
  );

  return idx;
}


function textoBancoOfflineV0111_(
  valor
) {
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


function numeroBancoOfflineV0111_(
  valor,
  padrao
) {
  const numero =
    Number(valor);

  return Number.isFinite(numero)
    ? numero
    : padrao;
}


function booleanoBancoOfflineV0111_(
  valor
) {
  if (
    valor === true ||
    valor === 1
  ) {
    return true;
  }

  const texto =
    textoBancoOfflineV0111_(
      valor
    )
      .toLowerCase();

  return [
    'sim',
    's',
    'true',
    '1',
    'aberto',
    'aberta'
  ].includes(texto);
}


/* =========================================================
   TESTES MANUAIS
========================================================= */

function testarInfoBancoQuestoesOfflineV0111() {
  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  const resultado =
    obterInfoBancoQuestoesOfflineV0111_(
      ss
    );

  Logger.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );

  return resultado;
}


function testarChunkBancoQuestoesOfflineV0111() {
  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  const resultado =
    obterChunkBancoQuestoesOfflineV0111_(
      ss,
      0,
      5
    );

  Logger.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );

  return resultado;
}