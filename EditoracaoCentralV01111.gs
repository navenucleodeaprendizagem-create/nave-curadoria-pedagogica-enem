/**
 * NAVE | EDITORAÇÃO CENTRAL — V0.11.11.0
 *
 * Fila editorial institucional compartilhada.
 *
 * A identidade do usuário NÃO é aceita como verdade
 * a partir do navegador. O Apps Script resolve novamente
 * o usuário pela integração NAVE já existente.
 */

const NAVE_EDITORACAO_CENTRAL_V01111 =
  Object.freeze({
    ABA:
      'EDITORACAO_CENTRAL',

    CABECALHOS:
      Object.freeze([
        'id_envio',
        'id_sequencia',
        'titulo',
        'descricao',
        'ids_questoes_json',
        'quantidade_itens',
        'status',

        'professor_email',
        'professor_nome',

        'responsavel_editoracao_email',
        'responsavel_editoracao_nome',

        'criado_em',
        'atualizado_em',
        'iniciado_em',
        'concluido_em',
        'cancelado_em'
      ]),

    STATUS:
      Object.freeze([
        'aguardando',
        'em_producao',
        'concluido',
        'cancelado'
      ])
  });


/* =========================================================
   LISTAGEM COMPLETA — EDITORAÇÃO
========================================================= */

function listarEditoracaoCentralV01111_(
  ss,
  contexto
) {
  validarPermissaoEditoracaoV01111_(
    contexto
  );

  const sheet =
    garantirAbaEditoracaoCentralV01111_(
      ss
    );

  const jobs =
    lerJobsEditoracaoCentralV01111_(
      sheet
    );

  return jobs
    .sort(
      function(a, b) {
        return String(
          b.createdAt || ''
        ).localeCompare(
          String(
            a.createdAt || ''
          )
        );
      }
    );
}


/* =========================================================
   CONSULTA MÍNIMA — SEQUÊNCIAS
========================================================= */

function listarSequenciasAtivasEditoracaoCentralV01111_(
  ss,
  contexto
) {
  validarPermissaoSequenciasV01111_(
    contexto
  );

  const sheet =
    garantirAbaEditoracaoCentralV01111_(
      ss
    );

  const jobs =
    lerJobsEditoracaoCentralV01111_(
      sheet
    );

  const ids =
    jobs
      .filter(
        function(job) {
          return (
            job.status ===
              'aguardando' ||
            job.status ===
              'em_producao'
          );
        }
      )
      .map(
        function(job) {
          return job.sequenceId;
        }
      )
      .filter(Boolean);

  return Array.from(
    new Set(ids)
  );
}


/* =========================================================
   CRIAÇÃO — PROFESSOR / SEQUÊNCIAS
========================================================= */

function criarEditoracaoCentralV01111_(
  ss,
  contexto,
  input
) {
  validarPermissaoSequenciasV01111_(
    contexto
  );

  const sequenceId =
    String(
      input &&
      input.sequenceId
        ? input.sequenceId
        : ''
    ).trim();

  const titulo =
    String(
      input &&
      input.titulo
        ? input.titulo
        : ''
    ).trim();

  const descricao =
    String(
      input &&
      input.descricao
        ? input.descricao
        : ''
    ).trim();

  const questionIds =
    Array.isArray(
      input &&
      input.questionIds
        ? input.questionIds
        : null
    )
      ? input.questionIds
          .map(
            function(id) {
              return String(
                id || ''
              ).trim();
            }
          )
          .filter(Boolean)
      : [];

  if (
    !sequenceId ||
    !titulo ||
    !questionIds.length
  ) {
    throw new Error(
      'Sequência editorial inválida.'
    );
  }

  if (
    new Set(questionIds).size !==
    questionIds.length
  ) {
    throw new Error(
      'A sequência editorial contém questões duplicadas.'
    );
  }

  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(15000);

  try {
    const sheet =
      garantirAbaEditoracaoCentralV01111_(
        ss
      );

    const jobs =
      lerJobsEditoracaoCentralV01111_(
        sheet
      );

    const ativo =
      jobs.find(
        function(job) {
          return (
            job.sequenceId ===
              sequenceId &&
            (
              job.status ===
                'aguardando' ||
              job.status ===
                'em_producao'
            )
          );
        }
      );

    if (ativo) {
      throw new Error(
        'Esta sequência já possui um envio ativo na editoração.'
      );
    }

    const agora =
      new Date();

    const id =
      Utilities.getUuid();

    const user =
      contexto.user || {};

    const job = {
      id: id,
      sequenceId: sequenceId,
      titulo: titulo,
      descricao: descricao,
      questionIds: questionIds,
      quantidadeItens:
        questionIds.length,
      status:
        'aguardando',

      professorEmail:
        String(
          user.emailAutenticacao ||
          user.email ||
          ''
        ),

      professorNome:
        String(
          user.nome || ''
        ),

      responsavelEditoracaoEmail:
        '',

      responsavelEditoracaoNome:
        '',

      createdAt:
        agora.toISOString(),

      updatedAt:
        agora.toISOString(),

      startedAt:
        '',

      completedAt:
        '',

      cancelledAt:
        ''
    };

    sheet.appendRow(
      jobParaLinhaEditoracaoV01111_(
        job
      )
    );

    return job;
  } finally {
    lock.releaseLock();
  }
}


/* =========================================================
   ATUALIZAÇÃO DE STATUS — EDITORAÇÃO
========================================================= */

function atualizarStatusEditoracaoCentralV01111_(
  ss,
  contexto,
  id,
  status
) {
  validarPermissaoEditoracaoV01111_(
    contexto
  );

  id =
    String(id || '')
      .trim();

  status =
    String(status || '')
      .trim();

  if (!id) {
    throw new Error(
      'ID editorial ausente.'
    );
  }

  if (
    NAVE_EDITORACAO_CENTRAL_V01111
      .STATUS
      .indexOf(status) === -1
  ) {
    throw new Error(
      'Status editorial inválido.'
    );
  }

  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(15000);

  try {
    const sheet =
      garantirAbaEditoracaoCentralV01111_(
        ss
      );

    const lastRow =
      sheet.getLastRow();

    if (lastRow < 2) {
      throw new Error(
        'Envio editorial não encontrado.'
      );
    }

    const ids =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          1
        )
        .getDisplayValues()
        .flat();

    const index =
      ids.findIndex(
        function(value) {
          return String(value)
            .trim() === id;
        }
      );

    if (index < 0) {
      throw new Error(
        'Envio editorial não encontrado.'
      );
    }

    const rowNumber =
      index + 2;

    const row =
      sheet
        .getRange(
          rowNumber,
          1,
          1,
          NAVE_EDITORACAO_CENTRAL_V01111
            .CABECALHOS.length
        )
        .getValues()[0];

    const job =
      linhaParaJobEditoracaoV01111_(
        row
      );

    validarTransicaoEditoracaoV01111_(
      job.status,
      status
    );

    const agora =
      new Date()
        .toISOString();

    const user =
      contexto.user || {};

    job.status =
      status;

    job.updatedAt =
      agora;

    if (
      status ===
      'em_producao'
    ) {
      job.responsavelEditoracaoEmail =
        String(
          user.emailAutenticacao ||
          user.email ||
          ''
        );

      job.responsavelEditoracaoNome =
        String(
          user.nome || ''
        );

      if (!job.startedAt) {
        job.startedAt =
          agora;
      }
    }

    if (
      status ===
      'concluido'
    ) {
      job.completedAt =
        agora;
    }

    if (
      status ===
      'cancelado'
    ) {
      job.cancelledAt =
        agora;
    }

    sheet
      .getRange(
        rowNumber,
        1,
        1,
        NAVE_EDITORACAO_CENTRAL_V01111
          .CABECALHOS.length
      )
      .setValues([
        jobParaLinhaEditoracaoV01111_(
          job
        )
      ]);

    return job;
  } finally {
    lock.releaseLock();
  }
}


/* =========================================================
   PERMISSÕES
========================================================= */

function validarPermissaoSequenciasV01111_(
  contexto
) {
  if (
    !contexto ||
    contexto.authorized !== true ||
    !contexto.user ||
    !contexto.permissions ||
    contexto.permissions.sequencias !==
      true
  ) {
    throw new Error(
      'Usuário sem permissão para enviar sequências à editoração.'
    );
  }
}


function validarPermissaoEditoracaoV01111_(
  contexto
) {
  if (
    !contexto ||
    contexto.authorized !== true ||
    !contexto.user ||
    !contexto.permissions ||
    contexto.permissions.editoracao !==
      true
  ) {
    throw new Error(
      'Usuário sem permissão de editoração.'
    );
  }
}


/* =========================================================
   TRANSIÇÕES
========================================================= */

function validarTransicaoEditoracaoV01111_(
  atual,
  proximo
) {
  atual =
    String(atual || '')
      .trim();

  proximo =
    String(proximo || '')
      .trim();

  if (atual === proximo) {
    return;
  }

  const permitidas = {
    aguardando: [
      'em_producao',
      'cancelado'
    ],

    em_producao: [
      'concluido',
      'cancelado'
    ],

    concluido: [],

    cancelado: []
  };

  const destinos =
    permitidas[atual];

  if (
    !destinos ||
    destinos.indexOf(
      proximo
    ) === -1
  ) {
    throw new Error(
      'Transição editorial não permitida: ' +
      atual +
      ' → ' +
      proximo
    );
  }
}


/* =========================================================
   ABA CENTRAL
========================================================= */

function garantirAbaEditoracaoCentralV01111_(
  ss
) {
  let sheet =
    ss.getSheetByName(
      NAVE_EDITORACAO_CENTRAL_V01111
        .ABA
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        NAVE_EDITORACAO_CENTRAL_V01111
          .ABA
      );
  }

  const headers =
    NAVE_EDITORACAO_CENTRAL_V01111
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
  } else {
    const atuais =
      sheet
        .getRange(
          1,
          1,
          1,
          headers.length
        )
        .getDisplayValues()[0];

    const divergente =
      headers.some(
        function(header, index) {
          return (
            String(
              atuais[index] || ''
            ).trim() !==
            header
          );
        }
      );

    if (divergente) {
      throw new Error(
        'Cabeçalho da aba EDITORACAO_CENTRAL é incompatível com V0.11.11.0.'
      );
    }
  }

  return sheet;
}


/* =========================================================
   SERIALIZAÇÃO
========================================================= */

function lerJobsEditoracaoCentralV01111_(
  sheet
) {
  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  return sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      NAVE_EDITORACAO_CENTRAL_V01111
        .CABECALHOS.length
    )
    .getValues()
    .filter(
      function(row) {
        return String(
          row[0] || ''
        ).trim();
      }
    )
    .map(
      linhaParaJobEditoracaoV01111_
    );
}


function linhaParaJobEditoracaoV01111_(
  row
) {
  let questionIds = [];

  try {
    const parsed =
      JSON.parse(
        String(
          row[4] || '[]'
        )
      );

    questionIds =
      Array.isArray(parsed)
        ? parsed.map(String)
        : [];
  } catch (error) {
    questionIds = [];
  }

  return {
    id:
      String(
        row[0] || ''
      ),

    sequenceId:
      String(
        row[1] || ''
      ),

    titulo:
      String(
        row[2] || ''
      ),

    descricao:
      String(
        row[3] || ''
      ),

    questionIds:
      questionIds,

    quantidadeItens:
      Number(
        row[5] || 0
      ),

    status:
      String(
        row[6] || ''
      ),

    professorEmail:
      String(
        row[7] || ''
      ),

    professorNome:
      String(
        row[8] || ''
      ),

    responsavelEditoracaoEmail:
      String(
        row[9] || ''
      ),

    responsavelEditoracaoNome:
      String(
        row[10] || ''
      ),

    createdAt:
      normalizarDataEditoracaoV01111_(
        row[11]
      ),

    updatedAt:
      normalizarDataEditoracaoV01111_(
        row[12]
      ),

    startedAt:
      normalizarDataEditoracaoV01111_(
        row[13]
      ),

    completedAt:
      normalizarDataEditoracaoV01111_(
        row[14]
      ),

    cancelledAt:
      normalizarDataEditoracaoV01111_(
        row[15]
      )
  };
}


function jobParaLinhaEditoracaoV01111_(
  job
) {
  return [
    job.id,
    job.sequenceId,
    job.titulo,
    job.descricao,
    JSON.stringify(
      job.questionIds || []
    ),
    Number(
      job.quantidadeItens || 0
    ),
    job.status,

    job.professorEmail,
    job.professorNome,

    job.responsavelEditoracaoEmail,
    job.responsavelEditoracaoNome,

    job.createdAt,
    job.updatedAt,
    job.startedAt,
    job.completedAt,
    job.cancelledAt
  ];
}


function normalizarDataEditoracaoV01111_(
  value
) {
  if (!value) {
    return '';
  }

  if (
    Object.prototype.toString
      .call(value) ===
    '[object Date]'
  ) {
    return value
      .toISOString();
  }

  return String(value);
}
