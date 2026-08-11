/**
 * NAVE | IDENTIDADE E AUTORIZAÇÃO — V0.9.1
 *
 * V0.11.7.2 — endurecimento de identidade:
 *
 * - email_autenticacao é a chave primária de autorização;
 * - id_google é somente vínculo de consistência;
 * - uma conta Google não cadastrada nunca pode ser localizada
 *   apenas por um id_google residual;
 * - conflito de e-mail ou Google ID falha fechado;
 * - vínculo automático do Google ID só ocorre quando o e-mail
 *   autenticado corresponde exatamente à linha autorizada.
 */

const NAVE_IDENTIDADE_V090 = Object.freeze({
  ABA_USUARIOS: 'USUARIOS',

  CAMPOS_IDENTIDADE: Object.freeze([
    'email_autenticacao',
    'id_google',
    'ultimo_login_em'
  ]),

  PERFIS_VALIDOS: Object.freeze([
    'Professor',
    'Coordenador',
    'Administrador'
  ]),

  CAMPOS_OBRIGATORIOS: Object.freeze([
    'email',
    'nome',
    'perfil',
    'area',
    'disciplinas',
    'ativo',
    'email_autenticacao',
    'id_google',
    'ultimo_login_em'
  ])
});


/* =========================================================
   INSTALAÇÃO SEGURA
========================================================= */

function instalarIdentidadeNaveV090() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error(
      'Planilha ativa não encontrada.'
    );
  }

  const aba =
    ss.getSheetByName(
      NAVE_IDENTIDADE_V090.ABA_USUARIOS
    );

  if (!aba) {
    throw new Error(
      'A aba USUARIOS não foi encontrada.'
    );
  }

  garantirCamposIdentidadeNaveV090_(
    aba
  );

  const headers =
    obterCabecalhosIdentidadeNaveV091_(
      aba
    );

  validarCabecalhosIdentidadeNaveV091_(
    headers
  );

  return {
    ok: true,
    aba: aba.getName(),
    camposAdicionados:
      NAVE_IDENTIDADE_V090
        .CAMPOS_IDENTIDADE
        .slice()
  };
}


/* =========================================================
   CONSULTA DE IDENTIDADE
========================================================= */

function obterContextoUsuarioAutenticadoV090_(
  emailAutenticacao,
  idGoogle,
  spreadsheet,
  persistirVinculo
) {
  const devePersistir =
    persistirVinculo !== false;

  const emailAuth =
    normalizarEmailIdentidadeNaveV091_(
      emailAutenticacao
    );

  const googleId =
    String(
      idGoogle || ''
    ).trim();

  if (
    !emailAuth ||
    !googleId
  ) {
    return {
      authorized: false,
      reason:
        'INVALID_AUTH_IDENTITY'
    };
  }

  const ss =
    spreadsheet ||
    SpreadsheetApp
      .getActiveSpreadsheet();

  if (!ss) {
    return {
      authorized: false,
      reason:
        'SPREADSHEET_NOT_AVAILABLE'
    };
  }

  const aba =
    ss.getSheetByName(
      NAVE_IDENTIDADE_V090
        .ABA_USUARIOS
    );

  if (
    !aba ||
    aba.getLastRow() < 2
  ) {
    return {
      authorized: false,
      reason:
        'USERS_NOT_CONFIGURED'
    };
  }

  garantirCamposIdentidadeNaveV090_(
    aba
  );

  const dados =
    aba
      .getDataRange()
      .getDisplayValues();

  const headers =
    dados[0] || [];

  const validacaoHeaders =
    validarCabecalhosIdentidadeNaveV091_(
      headers,
      false
    );

  if (
    validacaoHeaders.ok !== true
  ) {
    return {
      authorized: false,
      reason:
        'USERS_SCHEMA_INVALID'
    };
  }

  const idx =
    indexarIdentidadeNaveV090_(
      headers
    );

  /*
   * V0.11.7.2 — REGRA CENTRAL DE SEGURANÇA
   *
   * A linha autorizada é encontrada EXCLUSIVAMENTE
   * pelo email_autenticacao.
   *
   * id_google NÃO é usado para localizar um usuário.
   * Ele serve apenas para confirmar que a conta Google
   * continua sendo a mesma depois que o e-mail correto
   * localizou a linha.
   */
  const correspondenciasEmail =
    [];

  const correspondenciasGoogle =
    [];

  for (
    let i = 1;
    i < dados.length;
    i++
  ) {
    const row =
      dados[i];

    const emailCadastrado =
      normalizarEmailIdentidadeNaveV091_(
        row[
          idx.email_autenticacao
        ]
      );

    const idCadastrado =
      String(
        row[
          idx.id_google
        ] || ''
      ).trim();

    if (
      emailCadastrado &&
      emailCadastrado === emailAuth
    ) {
      correspondenciasEmail.push({
        indiceDados: i,
        numeroLinha: i + 1,
        linha: row
      });
    }

    if (
      idCadastrado &&
      idCadastrado === googleId
    ) {
      correspondenciasGoogle.push({
        indiceDados: i,
        numeroLinha: i + 1,
        linha: row
      });
    }
  }

  /*
   * Conta Google sem email_autenticacao cadastrado:
   * negação imediata.
   *
   * Mesmo que o Google ID apareça em uma linha antiga,
   * não autorizamos por esse vínculo isolado.
   */
  if (
    correspondenciasEmail.length === 0
  ) {
    return {
      authorized: false,
      reason:
        'USER_NOT_FOUND'
    };
  }

  /*
   * O mesmo e-mail de autenticação em mais de uma linha
   * é ambiguidade de identidade e deve falhar fechado.
   */
  if (
    correspondenciasEmail.length > 1
  ) {
    return {
      authorized: false,
      reason:
        'DUPLICATE_AUTH_EMAIL'
    };
  }

  const selecionado =
    correspondenciasEmail[0];

  const numeroLinha =
    selecionado.numeroLinha;

  const linha =
    selecionado.linha;

  const idCadastradoNaLinha =
    String(
      linha[
        idx.id_google
      ] || ''
    ).trim();

  /*
   * Se o Google ID atual já estiver vinculado a OUTRA
   * linha, há conflito de identidade.
   */
  const conflitoGoogle =
    correspondenciasGoogle
      .some(function(item) {
        return (
          item.numeroLinha !==
          numeroLinha
        );
      });

  if (conflitoGoogle) {
    return {
      authorized: false,
      reason:
        'GOOGLE_ID_CONFLICT'
    };
  }

  /*
   * Se a linha correta pelo e-mail já possui um Google ID,
   * ele precisa ser exatamente o Google ID da sessão atual.
   */
  if (
    idCadastradoNaLinha &&
    idCadastradoNaLinha !==
      googleId
  ) {
    return {
      authorized: false,
      reason:
        'GOOGLE_ID_MISMATCH'
    };
  }

  const ativo =
    String(
      linha[
        idx.ativo
      ] || ''
    )
      .trim()
      .toUpperCase();

  if (
    ![
      'SIM',
      'S',
      'ATIVO',
      'TRUE'
    ].includes(
      ativo
    )
  ) {
    return {
      authorized: false,
      reason:
        'USER_INACTIVE'
    };
  }

  const perfil =
    String(
      linha[
        idx.perfil
      ] || ''
    ).trim();

  if (
    !NAVE_IDENTIDADE_V090
      .PERFIS_VALIDOS
      .includes(
        perfil
      )
  ) {
    return {
      authorized: false,
      reason:
        'INVALID_PROFILE'
    };
  }

  const disciplinas =
    String(
      linha[
        idx.disciplinas
      ] || ''
    )
      .split(/[;,]/)
      .map(function(v) {
        return v.trim();
      })
      .filter(Boolean);

  /*
   * Só vinculamos o Google ID quando:
   *
   * 1. email_autenticacao encontrou exatamente uma linha;
   * 2. não há Google ID conflitante;
   * 3. a linha ainda não possui Google ID;
   * 4. o usuário está ativo e possui perfil válido.
   */
  if (
    devePersistir &&
    !idCadastradoNaLinha
  ) {
    aba
      .getRange(
        numeroLinha,
        idx.id_google + 1
      )
      .setValue(
        googleId
      );
  }

  if (devePersistir) {
    aba
      .getRange(
        numeroLinha,
        idx.ultimo_login_em + 1
      )
      .setValue(
        new Date()
      );
  }

  const permissoes =
    obterPermissoesPerfilNaveV090_(
      perfil
    );

  if (!permissoes) {
    return {
      authorized: false,
      reason:
        'INVALID_PROFILE'
    };
  }

  return {
    authorized: true,

    user: {
      email:
        normalizarEmailIdentidadeNaveV091_(
          linha[
            idx.email
          ]
        ),

      emailAutenticacao:
        emailAuth,

      idGoogle:
        googleId,

      nome:
        String(
          linha[
            idx.nome
          ] || ''
        ).trim(),

      perfil:
        perfil,

      area:
        String(
          linha[
            idx.area
          ] || ''
        ).trim(),

      disciplinas:
        disciplinas
    },

    permissions:
      permissoes
  };
}


/* =========================================================
   PERMISSÕES
========================================================= */

function obterPermissoesPerfilNaveV090_(
  perfil
) {
  const mapa = {
    Professor: {
      buscar: true,
      visualizar: true,
      validar: true,
      cadastrar: true,
      sequencias: true,
      usuarios: false,
      coordenacao: false,
      editoracao: false
    },

    Coordenador: {
      buscar: true,
      visualizar: true,
      validar: true,
      cadastrar: true,
      sequencias: true,
      usuarios: false,
      coordenacao: true,
      editoracao: false
    },

    Administrador: {
      buscar: true,
      visualizar: true,
      validar: true,
      cadastrar: true,
      sequencias: true,
      usuarios: true,
      coordenacao: true,
      editoracao: true
    }
  };

  if (
    !Object.prototype
      .hasOwnProperty
      .call(
        mapa,
        perfil
      )
  ) {
    return null;
  }

  return Object.assign(
    {},
    mapa[perfil]
  );
}


/* =========================================================
   ESTRUTURA DA ABA
========================================================= */

function garantirCamposIdentidadeNaveV090_(
  aba
) {
  const headers =
    aba.getLastColumn()
      ? aba
          .getRange(
            1,
            1,
            1,
            aba.getLastColumn()
          )
          .getDisplayValues()[0]
          .map(function(v) {
            return String(
              v || ''
            ).trim();
          })
      : [];

  const ausentes =
    NAVE_IDENTIDADE_V090
      .CAMPOS_IDENTIDADE
      .filter(function(campo) {
        return !headers.includes(
          campo
        );
      });

  if (
    ausentes.length
  ) {
    aba
      .getRange(
        1,
        aba.getLastColumn() + 1,
        1,
        ausentes.length
      )
      .setValues([
        ausentes
      ]);
  }
}

function obterCabecalhosIdentidadeNaveV091_(
  aba
) {
  if (
    !aba ||
    aba.getLastColumn() < 1
  ) {
    return [];
  }

  return aba
    .getRange(
      1,
      1,
      1,
      aba.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(function(v) {
      return String(
        v || ''
      ).trim();
    });
}

function validarCabecalhosIdentidadeNaveV091_(
  headers,
  lancarErro
) {
  const deveLancar =
    lancarErro !== false;

  const existentes =
    new Set(
      (headers || [])
        .map(function(v) {
          return String(
            v || ''
          ).trim();
        })
        .filter(Boolean)
    );

  const ausentes =
    NAVE_IDENTIDADE_V090
      .CAMPOS_OBRIGATORIOS
      .filter(function(campo) {
        return !existentes.has(
          campo
        );
      });

  if (
    ausentes.length > 0
  ) {
    if (deveLancar) {
      throw new Error(
        'A aba USUARIOS não possui os campos obrigatórios: ' +
          ausentes.join(', ')
      );
    }

    return {
      ok: false,
      ausentes: ausentes
    };
  }

  return {
    ok: true,
    ausentes: []
  };
}


/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarEmailIdentidadeNaveV091_(
  value
) {
  return String(
    value || ''
  )
    .trim()
    .toLowerCase();
}

function indexarIdentidadeNaveV090_(
  headers
) {
  return headers.reduce(
    function(
      mapa,
      header,
      indice
    ) {
      const chave =
        String(
          header || ''
        ).trim();

      if (chave) {
        mapa[chave] =
          indice;
      }

      return mapa;
    },
    {}
  );
}


/* =========================================================
   AUDITORIA DE IDENTIDADE — V0.11.7.2
========================================================= */

function auditarIdentidadesNaveV091() {
  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  if (!ss) {
    throw new Error(
      'Planilha ativa não encontrada.'
    );
  }

  const aba =
    ss.getSheetByName(
      NAVE_IDENTIDADE_V090
        .ABA_USUARIOS
    );

  if (
    !aba ||
    aba.getLastRow() < 2
  ) {
    throw new Error(
      'A aba USUARIOS não está configurada.'
    );
  }

  garantirCamposIdentidadeNaveV090_(
    aba
  );

  const dados =
    aba
      .getDataRange()
      .getDisplayValues();

  validarCabecalhosIdentidadeNaveV091_(
    dados[0]
  );

  const idx =
    indexarIdentidadeNaveV090_(
      dados[0]
    );

  const porEmail =
    {};

  const porGoogle =
    {};

  const linhas =
    [];

  for (
    let i = 1;
    i < dados.length;
    i++
  ) {
    const row =
      dados[i];

    const emailAuth =
      normalizarEmailIdentidadeNaveV091_(
        row[
          idx.email_autenticacao
        ]
      );

    const googleId =
      String(
        row[
          idx.id_google
        ] || ''
      ).trim();

    if (emailAuth) {
      porEmail[emailAuth] =
        porEmail[emailAuth] || [];

      porEmail[emailAuth]
        .push(
          i + 1
        );
    }

    if (googleId) {
      porGoogle[googleId] =
        porGoogle[googleId] || [];

      porGoogle[googleId]
        .push(
          i + 1
        );
    }

    linhas.push({
      linha:
        i + 1,

      email:
        normalizarEmailIdentidadeNaveV091_(
          row[
            idx.email
          ]
        ),

      emailAutenticacao:
        emailAuth,

      possuiIdGoogle:
        Boolean(
          googleId
        ),

      perfil:
        String(
          row[
            idx.perfil
          ] || ''
        ).trim(),

      ativo:
        String(
          row[
            idx.ativo
          ] || ''
        ).trim()
    });
  }

  const emailsDuplicados =
    Object.keys(
      porEmail
    )
      .filter(function(email) {
        return (
          porEmail[email].length >
          1
        );
      })
      .map(function(email) {
        return {
          emailAutenticacao:
            email,
          linhas:
            porEmail[email]
        };
      });

  const googleIdsDuplicados =
    Object.keys(
      porGoogle
    )
      .filter(function(id) {
        return (
          porGoogle[id].length >
          1
        );
      })
      .map(function(id) {
        return {
          idGoogle:
            id,
          linhas:
            porGoogle[id]
        };
      });

  const resultado = {
    ok:
      emailsDuplicados.length ===
        0 &&
      googleIdsDuplicados.length ===
        0,

    totalUsuarios:
      linhas.length,

    emailsDuplicados:
      emailsDuplicados,

    googleIdsDuplicados:
      googleIdsDuplicados,

    usuarios:
      linhas
  };

  Logger.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );

  return resultado;
}


/* =========================================================
   TESTES
========================================================= */

function testarEstruturaIdentidadeNaveV090() {
  const resultado =
    instalarIdentidadeNaveV090();

  return {
    ok:
      resultado.ok,
    aba:
      resultado.aba,
    esperado: [
      'email_autenticacao',
      'id_google',
      'ultimo_login_em'
    ]
  };
}

function testarResolucaoIdentidadeNaveV090() {
  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  if (!ss) {
    throw new Error(
      'Planilha ativa não encontrada.'
    );
  }

  const aba =
    ss.getSheetByName(
      NAVE_IDENTIDADE_V090
        .ABA_USUARIOS
    );

  if (
    !aba ||
    aba.getLastRow() < 2
  ) {
    throw new Error(
      'A aba USUARIOS não está configurada.'
    );
  }

  const dados =
    aba
      .getDataRange()
      .getDisplayValues();

  const idx =
    indexarIdentidadeNaveV090_(
      dados[0]
    );

  const linha =
    dados
      .slice(1)
      .find(function(r) {
        return String(
          r[
            idx.email_autenticacao
          ] || ''
        ).trim();
      });

  if (!linha) {
    throw new Error(
      'Nenhum usuário possui email_autenticacao cadastrado.'
    );
  }

  const emailAutenticacao =
    normalizarEmailIdentidadeNaveV091_(
      linha[
        idx.email_autenticacao
      ]
    );

  const resultado =
    obterContextoUsuarioAutenticadoV090_(
      emailAutenticacao,
      'TESTE_SOMENTE_LEITURA_V091',
      ss,
      false
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
