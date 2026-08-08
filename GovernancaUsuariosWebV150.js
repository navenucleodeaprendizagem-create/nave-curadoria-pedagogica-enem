/**
 * NAVE | GOVERNANÇA DE USUÁRIOS E PERFIS — V1.5.0
 *
 * Perfis canônicos:
 * - Professor
 * - Coordenador
 * - Administrador
 *
 * Compatibilidade:
 * "Coordenação", "Coordenação geral" e variações são tratadas
 * como Coordenador.
 */

const NAVE_GOV_V150 = Object.freeze({
  ABA_USUARIOS: 'USUARIOS',

  PERFIS: Object.freeze([
    'Professor',
    'Coordenador',
    'Administrador'
  ]),

  PERMISSOES: Object.freeze({
    Professor: Object.freeze({
      buscar: true,
      visualizar: true,
      validar: true,
      cadastrar: true,
      sequencias: true,
      usuarios: false,
      coordenacao: false,
      editoracao: false
    }),

    Coordenador: Object.freeze({
      buscar: true,
      visualizar: true,
      validar: true,
      cadastrar: true,
      sequencias: true,
      usuarios: false,
      coordenacao: true,
      editoracao: false
    }),

    Administrador: Object.freeze({
      buscar: true,
      visualizar: true,
      validar: true,
      cadastrar: true,
      sequencias: true,
      usuarios: true,
      coordenacao: true,
      editoracao: true
    })
  }),

  CAB_EXTRAS: Object.freeze([
    'criado_em',
    'atualizado_em',
    'atualizado_por'
  ])
});


/* =========================================================
   INSTALAÇÃO — EXECUTAR UMA VEZ
   ========================================================= */

function instalarGovernancaUsuariosWebV150() {
  const usuario = obterUsuarioAtualWebV130();

  if (normalizarPerfilWebV150_(usuario.perfil) !== 'Administrador') {
    throw new Error(
      'Somente Administrador pode instalar a governança de usuários.'
    );
  }

  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(NAVE_GOV_V150.ABA_USUARIOS);

  if (!aba) {
    throw new Error('A aba USUARIOS não foi encontrada.');
  }

  garantirCabecalhosGovernancaWebV150_(
    aba,
    NAVE_GOV_V150.CAB_EXTRAS
  );

  aplicarValidacoesGovernancaWebV150_(aba);

  SpreadsheetApp.getUi().alert(
    'Governança V1.5 instalada',
    [
      'Perfis disponíveis:',
      '- Professor',
      '- Coordenador',
      '- Administrador',
      '',
      'Nenhum usuário existente foi removido.'
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


/* =========================================================
   PERFIL / PERMISSÕES
   ========================================================= */

function obterPermissoesUsuarioWebV150() {
  const usuario = obterUsuarioAtualWebV130();
  const perfil = normalizarPerfilWebV150_(usuario.perfil);

  return {
    usuario: {
      email: usuario.email,
      nome: usuario.nome,
      perfil,
      area: usuario.area,
      disciplinas: usuario.disciplinas
    },
    permissoes: Object.assign(
      {},
      NAVE_GOV_V150.PERMISSOES[perfil] ||
      NAVE_GOV_V150.PERMISSOES.Professor
    )
  };
}


function exigirPermissaoWebV150_(chave) {
  const contexto = obterPermissoesUsuarioWebV150();

  if (!contexto.permissoes[chave]) {
    throw new Error(
      'Seu perfil (' + contexto.usuario.perfil +
      ') não possui permissão para esta operação.'
    );
  }

  return contexto.usuario;
}


function normalizarPerfilWebV150_(perfil) {
  const p = normalizarTextoGovernancaV150_(perfil);

  if (p === 'administrador' || p === 'admin') {
    return 'Administrador';
  }

  if (
    p === 'coordenador' ||
    p === 'coordenacao' ||
    p === 'coordenacao geral' ||
    p === 'coordenadora' ||
    p === 'coordenadora geral'
  ) {
    return 'Coordenador';
  }

  return 'Professor';
}


function ehPerfilGestaoWebV150_(perfil) {
  const p = normalizarPerfilWebV150_(perfil);
  return p === 'Coordenador' || p === 'Administrador';
}


/* =========================================================
   ADMINISTRAÇÃO DE USUÁRIOS
   ========================================================= */

function listarUsuariosWebV150() {
  exigirPermissaoWebV150_('usuarios');

  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(NAVE_GOV_V150.ABA_USUARIOS);

  if (!aba || aba.getLastRow() < 2) return [];

  garantirCabecalhosGovernancaWebV150_(
    aba,
    NAVE_GOV_V150.CAB_EXTRAS
  );

  const dados = aba.getDataRange().getDisplayValues();
  const idx = indexarGovernancaWebV150_(dados[0]);

  return dados.slice(1)
    .filter(r => String(r[idx.email] || '').trim())
    .map(r => ({
      email: String(r[idx.email] || '').trim(),
      nome: String(r[idx.nome] || '').trim(),
      perfil: normalizarPerfilWebV150_(r[idx.perfil]),
      area: String(r[idx.area] || '').trim(),
      disciplinas: String(r[idx.disciplinas] || '').trim(),
      ativo: String(r[idx.ativo] || '').trim(),
      atualizadoEm:
        idx.atualizado_em === undefined
          ? ''
          : String(r[idx.atualizado_em] || '').trim()
    }))
    .sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
    );
}


function salvarUsuarioWebV150(form) {
  const admin = exigirPermissaoWebV150_('usuarios');
  form = form || {};

  const email = String(form.email || '')
    .trim()
    .toLowerCase();

  const nome = String(form.nome || '').trim();
  const perfil = normalizarPerfilWebV150_(form.perfil);
  const area = String(form.area || '').trim().toUpperCase();
  const disciplinas = normalizarListaDisciplinasWebV150_(
    form.disciplinas
  );
  const ativo = normalizarAtivoWebV150_(form.ativo);

  if (!email || !/@/.test(email)) {
    throw new Error('Informe um e-mail válido.');
  }

  if (!nome) {
    throw new Error('Informe o nome do usuário.');
  }

  if (!NAVE_GOV_V150.PERFIS.includes(perfil)) {
    throw new Error('Perfil inválido.');
  }

  if (!disciplinas.length && perfil === 'Professor') {
    throw new Error(
      'Professor precisa ter ao menos uma disciplina autorizada.'
    );
  }

  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(NAVE_GOV_V150.ABA_USUARIOS);

  if (!aba) {
    throw new Error('A aba USUARIOS não foi encontrada.');
  }

  garantirCabecalhosGovernancaWebV150_(
    aba,
    NAVE_GOV_V150.CAB_EXTRAS
  );

  const dados = aba.getDataRange().getValues();
  const idx = indexarGovernancaWebV150_(dados[0]);
  const agora = new Date();

  let numeroLinha = 0;

  for (let i = 1; i < dados.length; i++) {
    if (
      String(dados[i][idx.email] || '').trim().toLowerCase() === email
    ) {
      numeroLinha = i + 1;
      break;
    }
  }

  const registro = {
    email,
    nome,
    perfil,
    area,
    disciplinas: disciplinas.join('; '),
    ativo,
    atualizado_em: agora,
    atualizado_por: admin.email
  };

  if (numeroLinha) {
    atualizarLinhaPorCabecalhoGovernancaV150_(
      aba,
      numeroLinha,
      registro
    );
  } else {
    registro.criado_em = agora;
    anexarPorCabecalhoGovernancaV150_(aba, registro);
  }

  aplicarValidacoesGovernancaWebV150_(aba);

  return {
    mensagem: numeroLinha
      ? 'Usuário atualizado com sucesso.'
      : 'Usuário cadastrado com sucesso.',
    email
  };
}


function alterarStatusUsuarioWebV150(emailAlvo, ativo) {
  const admin = exigirPermissaoWebV150_('usuarios');
  const email = String(emailAlvo || '').trim().toLowerCase();

  if (!email) throw new Error('E-mail não informado.');

  if (email === admin.email && !normalizarAtivoWebV150_(ativo).includes('SIM')) {
    throw new Error(
      'O administrador atual não pode desativar a própria conta.'
    );
  }

  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(NAVE_GOV_V150.ABA_USUARIOS);
  const dados = aba.getDataRange().getValues();
  const idx = indexarGovernancaWebV150_(dados[0]);

  let linha = 0;

  for (let i = 1; i < dados.length; i++) {
    if (
      String(dados[i][idx.email] || '').trim().toLowerCase() === email
    ) {
      linha = i + 1;
      break;
    }
  }

  if (!linha) throw new Error('Usuário não localizado: ' + email);

  atualizarLinhaPorCabecalhoGovernancaV150_(
    aba,
    linha,
    {
      ativo: normalizarAtivoWebV150_(ativo),
      atualizado_em: new Date(),
      atualizado_por: admin.email
    }
  );

  return {
    mensagem: 'Status do usuário atualizado.',
    email
  };
}


/* =========================================================
   APOIO
   ========================================================= */

function inferirAreaDisciplinaWebV150_(disciplina) {
  const d = normalizarTextoGovernancaV150_(disciplina);

  if (['biologia', 'fisica', 'quimica'].includes(d)) return 'CN';
  if (d === 'matematica') return 'MT';

  if (
    ['historia', 'geografia', 'filosofia', 'sociologia'].includes(d)
  ) return 'CH';

  if (
    [
      'lingua portuguesa',
      'portugues',
      'literatura',
      'lingua estrangeira moderna',
      'educacao fisica',
      'artes',
      'tecnologias da comunicacao e informacao'
    ].includes(d)
  ) return 'LC';

  return '';
}


function normalizarListaDisciplinasWebV150_(valor) {
  return Array.from(
    new Set(
      String(valor || '')
        .split(/[;,]/)
        .map(v => v.trim())
        .filter(Boolean)
    )
  );
}


function normalizarAtivoWebV150_(valor) {
  const v = normalizarTextoGovernancaV150_(valor);
  return ['nao', 'n', 'inativo', 'false', '0'].includes(v)
    ? 'NÃO'
    : 'SIM';
}


function normalizarTextoGovernancaV150_(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}


function indexarGovernancaWebV150_(cabecalhos) {
  return cabecalhos.reduce((m, h, i) => {
    const chave = String(h || '').trim();
    if (chave) m[chave] = i;
    return m;
  }, {});
}


function garantirCabecalhosGovernancaWebV150_(aba, cabecalhos) {
  if (!aba) return;

  const atuais = aba.getLastColumn()
    ? aba.getRange(1, 1, 1, aba.getLastColumn())
        .getDisplayValues()[0]
        .map(v => String(v || '').trim())
    : [];

  const ausentes = cabecalhos.filter(h => !atuais.includes(h));

  if (ausentes.length) {
    aba.getRange(
      1,
      aba.getLastColumn() + 1,
      1,
      ausentes.length
    ).setValues([ausentes]);
  }
}


function anexarPorCabecalhoGovernancaV150_(aba, registro) {
  const headers = aba
    .getRange(1, 1, 1, aba.getLastColumn())
    .getDisplayValues()[0]
    .map(v => String(v || '').trim());

  aba.appendRow(
    headers.map(h =>
      Object.prototype.hasOwnProperty.call(registro, h)
        ? registro[h]
        : ''
    )
  );
}


function atualizarLinhaPorCabecalhoGovernancaV150_(
  aba,
  numeroLinha,
  registro
) {
  const headers = aba
    .getRange(1, 1, 1, aba.getLastColumn())
    .getDisplayValues()[0]
    .map(v => String(v || '').trim());

  const valores = aba
    .getRange(numeroLinha, 1, 1, headers.length)
    .getValues()[0];

  headers.forEach((h, i) => {
    if (Object.prototype.hasOwnProperty.call(registro, h)) {
      valores[i] = registro[h];
    }
  });

  aba.getRange(numeroLinha, 1, 1, headers.length)
    .setValues([valores]);
}


function aplicarValidacoesGovernancaWebV150_(aba) {
  if (!aba || aba.getLastRow() < 2) return;

  const headers = aba
    .getRange(1, 1, 1, aba.getLastColumn())
    .getDisplayValues()[0]
    .map(v => String(v || '').trim());

  const idx = indexarGovernancaWebV150_(headers);
  const linhas = Math.max(aba.getMaxRows() - 1, 1);

  if (idx.perfil !== undefined) {
    const regraPerfil = SpreadsheetApp.newDataValidation()
      .requireValueInList(NAVE_GOV_V150.PERFIS, true)
      .setAllowInvalid(false)
      .build();

    aba.getRange(2, idx.perfil + 1, linhas, 1)
      .setDataValidation(regraPerfil);
  }

  if (idx.ativo !== undefined) {
    const regraAtivo = SpreadsheetApp.newDataValidation()
      .requireValueInList(['SIM', 'NÃO'], true)
      .setAllowInvalid(false)
      .build();

    aba.getRange(2, idx.ativo + 1, linhas, 1)
      .setDataValidation(regraAtivo);
  }
}
