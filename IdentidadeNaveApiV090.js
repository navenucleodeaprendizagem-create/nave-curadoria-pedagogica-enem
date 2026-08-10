/**
 * NAVE | IDENTIDADE E AUTORIZAÇÃO — V0.9.0
 *
 * Liga a identidade autenticada pelo Google/Auth.js
 * ao cadastro oficial da aba USUARIOS.
 *
 * IMPORTANTE:
 * - NÃO substitui o campo email existente.
 * - NÃO cria um segundo cadastro de usuários.
 * - NÃO altera sequências ou dados pedagógicos.
 * - Adiciona somente campos de vinculação de identidade.
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
  ])
});


/* =========================================================
   INSTALAÇÃO SEGURA
========================================================= */

function instalarIdentidadeNaveV090() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error(
      'Planilha ativa não encontrada.'
    );
  }

  const aba = ss.getSheetByName(
    NAVE_IDENTIDADE_V090.ABA_USUARIOS
  );

  if (!aba) {
    throw new Error(
      'A aba USUARIOS não foi encontrada.'
    );
  }

  garantirCamposIdentidadeNaveV090_(aba);

  return {
    ok: true,
    aba: aba.getName(),
    camposAdicionados:
      NAVE_IDENTIDADE_V090.CAMPOS_IDENTIDADE.slice()
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
  const emailAuth = String(
    emailAutenticacao || ''
  )
    .trim()
    .toLowerCase();

  const googleId = String(
    idGoogle || ''
  ).trim();

  if (!emailAuth || !googleId) {
    return {
      authorized: false,
      reason: 'INVALID_AUTH_IDENTITY'
    };
  }

  const ss =
  spreadsheet ||
  SpreadsheetApp.getActiveSpreadsheet();

if (!ss) {
  return {
    authorized: false,
    reason: 'SPREADSHEET_NOT_AVAILABLE'
  };
}

  const aba = ss.getSheetByName(
    NAVE_IDENTIDADE_V090.ABA_USUARIOS
  );

  if (!aba || aba.getLastRow() < 2) {
    return {
      authorized: false,
      reason: 'USERS_NOT_CONFIGURED'
    };
  }

  garantirCamposIdentidadeNaveV090_(aba);

  const dados =
    aba.getDataRange().getDisplayValues();

  const idx =
    indexarIdentidadeNaveV090_(
      dados[0]
    );

  /*
   * Prioridade 1:
   * ID Google já vinculado.
   */
  let numeroLinha = 0;
  let linha = null;

  for (
    let i = 1;
    i < dados.length;
    i++
  ) {
    const idCadastrado = String(
      dados[i][idx.id_google] || ''
    ).trim();

    if (
      idCadastrado &&
      idCadastrado === googleId
    ) {
      numeroLinha = i + 1;
      linha = dados[i];
      break;
    }
  }

  /*
   * Prioridade 2:
   * e-mail de autenticação cadastrado.
   */
  if (!linha) {
    for (
      let i = 1;
      i < dados.length;
      i++
    ) {
      const emailCadastrado =
        String(
          dados[i][
            idx.email_autenticacao
          ] || ''
        )
          .trim()
          .toLowerCase();

      if (
        emailCadastrado &&
        emailCadastrado === emailAuth
      ) {
        numeroLinha = i + 1;
        linha = dados[i];
        break;
      }
    }
  }

  if (!linha) {
    return {
      authorized: false,
      reason: 'USER_NOT_FOUND'
    };
  }

  const ativo = String(
    linha[idx.ativo] || ''
  )
    .trim()
    .toUpperCase();

  if (
    ![
      'SIM',
      'S',
      'ATIVO',
      'TRUE'
    ].includes(ativo)
  ) {
    return {
      authorized: false,
      reason: 'USER_INACTIVE'
    };
  }

  const perfil = String(
    linha[idx.perfil] || ''
  ).trim();

  /*
   * V0.9:
   * perfil desconhecido NÃO vira Professor.
   * Autorização falha fechada.
   */
  if (
    !NAVE_IDENTIDADE_V090
      .PERFIS_VALIDOS
      .includes(perfil)
  ) {
    return {
      authorized: false,
      reason: 'INVALID_PROFILE'
    };
  }

  const disciplinas = String(
    linha[idx.disciplinas] || ''
  )
    .split(/[;,]/)
    .map(function(v) {
      return v.trim();
    })
    .filter(Boolean);

  /*
   * Se encontramos pelo e-mail autenticado
   * e ainda não havia Google ID cadastrado,
   * fazemos o vínculo estável.
   */
  if (
  devePersistir &&
  !String(
    linha[idx.id_google] || ''
  ).trim()
) {
  aba
    .getRange(
      numeroLinha,
      idx.id_google + 1
    )
    .setValue(googleId);
}

if (devePersistir) {
  aba
    .getRange(
      numeroLinha,
      idx.ultimo_login_em + 1
    )
    .setValue(new Date());
}

  const permissoes =
    obterPermissoesPerfilNaveV090_(
      perfil
    );

  return {
    authorized: true,

    user: {
      email: String(
        linha[idx.email] || ''
      )
        .trim()
        .toLowerCase(),

      emailAutenticacao:
        emailAuth,

      idGoogle:
        googleId,

      nome: String(
        linha[idx.nome] || ''
      ).trim(),

      perfil: perfil,

      area: String(
        linha[idx.area] || ''
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
        return !headers.includes(campo);
      });

  if (ausentes.length) {
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


/* =========================================================
   UTILITÁRIO
========================================================= */

function indexarIdentidadeNaveV090_(
  headers
) {
  return headers.reduce(
    function(mapa, header, indice) {
      const chave = String(
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
   TESTE DE ESTRUTURA
========================================================= */

function testarEstruturaIdentidadeNaveV090() {
  const resultado =
    instalarIdentidadeNaveV090();

  return {
    ok:
      resultado.ok,
    aba:
      resultado.aba,
    esperado:
      [
        'email_autenticacao',
        'id_google',
        'ultimo_login_em'
      ]
  };
}
function testarResolucaoIdentidadeNaveV090() {
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
    String(
      linha[
        idx.email_autenticacao
      ] || ''
    )
      .trim()
      .toLowerCase();

  /*
   * ID fictício.
   *
   * Como persistirVinculo = false,
   * nada será gravado em id_google
   * nem em ultimo_login_em.
   */
  const resultado =
    obterContextoUsuarioAutenticadoV090_(
      emailAutenticacao,
      'TESTE_SOMENTE_LEITURA_V090',
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