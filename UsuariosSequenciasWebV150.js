/**
 * NAVE | USUÁRIOS E SEQUÊNCIAS PESSOAIS — V1.3
 *
 * Objetivos:
 * - identificar o usuário pelo e-mail Google autenticado;
 * - controlar perfil, área e disciplinas permitidas;
 * - manter uma sequência de trabalho separada por professor;
 * - salvar sequências com nome e metadados;
 * - listar "Minhas sequências";
 * - carregar uma sequência salva;
 * - limpar somente a sequência do usuário atual.
 */

const NAVE_USR_SEQ_V130 = Object.freeze({
  ABA_USUARIOS: 'USUARIOS',
  ABA_ATUAL: 'SEQUENCIAS_WEB_ATUAIS',
  ABA_BASE: 'QUESTOES_GERAL',
  ABA_SALVAS: 'SEQUENCIAS_SALVAS',
  ABA_ITENS: 'ITENS_SEQUENCIAS',

  CAB_USUARIOS: [
    'email',
    'nome',
    'perfil',
    'area',
    'disciplinas',
    'ativo'
  ],

  CAB_ATUAL: [
    'email_usuario',
    'ordem',
    'id_ocorrencia',
    'disciplina',
    'ano',
    'edicao',
    'competencia',
    'habilidade',
    'objeto_principal',
    'dificuldade_rotulo',
    'funcao_pedagogica_sugerida',
    'trecho_inicial',
    'tempo_estimado_min',
    'status_validacao',
    'maturidade_curadoria',
    'colecao_origem',
    'pagina_pdf',
    'incluido_em'
  ]
});


/* =========================================================
   INSTALAÇÃO — EXECUTAR UMA VEZ NO EDITOR
   ========================================================= */

function instalarUsuariosSequenciasWebV130() {
  const ss = SpreadsheetApp.getActive();

  const usuarios = obterOuCriarAbaV130_(
    ss,
    NAVE_USR_SEQ_V130.ABA_USUARIOS,
    NAVE_USR_SEQ_V130.CAB_USUARIOS
  );

  obterOuCriarAbaV130_(
    ss,
    NAVE_USR_SEQ_V130.ABA_ATUAL,
    NAVE_USR_SEQ_V130.CAB_ATUAL
  );

  garantirCabecalhosV130_(
    ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_SALVAS),
    ['area', 'disciplinas', 'criada_por_nome']
  );

  const email = String(
    Session.getActiveUser().getEmail() || ''
  ).trim().toLowerCase();

  if (!email) {
    throw new Error(
      'Não foi possível identificar o e-mail da conta atual.'
    );
  }

  const dados = usuarios.getDataRange().getDisplayValues();
  const idx = indexarV130_(dados[0]);

  const existe = dados.slice(1).some(r =>
    String(r[idx.email] || '').trim().toLowerCase() === email
  );

  if (!existe) {
    usuarios.appendRow([
      email,
      'Administrador inicial',
      'Administrador',
      'CN',
      'Química',
      'SIM'
    ]);
  }

  estilizarCabecalhoV130_(usuarios);
  estilizarCabecalhoV130_(
    ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_ATUAL)
  );

  SpreadsheetApp.getUi().alert(
    'Estrutura instalada',
    [
      'Abas preparadas:',
      '- USUARIOS',
      '- SEQUENCIAS_WEB_ATUAIS',
      '',
      'Seu e-mail foi cadastrado como Administrador inicial.',
      'Edite a aba USUARIOS para informar nome e disciplinas corretas.'
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


/* =========================================================
   USUÁRIO / PERMISSÕES
   ========================================================= */

function obterUsuarioAtualWebV130() {
  const email = String(
    Session.getActiveUser().getEmail() || ''
  ).trim().toLowerCase();

  if (!email) {
    throw new Error(
      'Não foi possível identificar sua conta Google. ' +
      'Acesse o aplicativo com uma conta autorizada.'
    );
  }

  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_USUARIOS);

  if (!aba || aba.getLastRow() < 2) {
    throw new Error(
      'Cadastro de usuários ainda não foi configurado.'
    );
  }

  const dados = aba.getDataRange().getDisplayValues();
  const idx = indexarV130_(dados[0]);

  const linha = dados.slice(1).find(r =>
    String(r[idx.email] || '').trim().toLowerCase() === email
  );

  if (!linha) {
    throw new Error(
      'Usuário não autorizado: ' + email
    );
  }

  const ativo = String(linha[idx.ativo] || '')
    .trim().toUpperCase();

  if (!['SIM', 'S', 'ATIVO', 'TRUE'].includes(ativo)) {
    throw new Error(
      'Seu acesso ao Sistema NAVE está inativo.'
    );
  }

  const disciplinas = String(
    linha[idx.disciplinas] || ''
  )
    .split(/[;,]/)
    .map(v => v.trim())
    .filter(Boolean);

  return {
    email,
    nome: String(linha[idx.nome] || email).trim(),
    perfil: String(linha[idx.perfil] || 'Professor').trim(),
    area: String(linha[idx.area] || 'CN').trim(),
    disciplinas
  };
}


function podeAcessarDisciplinaWebV130_(usuario, disciplina) {
  if (ehPerfilGestaoWebV150_(usuario.perfil)) {
    return true;
  }

  return usuario.disciplinas.includes(
    String(disciplina || '').trim()
  );
}


/* =========================================================
   SEQUÊNCIA ATUAL POR USUÁRIO
   ========================================================= */

function obterSequenciaAtualWebV130() {
  const usuario = obterUsuarioAtualWebV130();
  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_ATUAL);

  if (!aba || aba.getLastRow() < 2) {
    return { itens: [], tempoTotal: 0 };
  }

  const dados = aba.getDataRange().getDisplayValues();
  const idx = indexarV130_(dados[0]);

  const itens = dados.slice(1)
    .filter(r =>
      String(r[idx.email_usuario] || '').trim().toLowerCase() ===
      usuario.email
    )
    .sort((a, b) =>
      Number(a[idx.ordem] || 0) - Number(b[idx.ordem] || 0)
    )
    .map(r => ({
      ordem: Number(r[idx.ordem]) || 0,
      id: r[idx.id_ocorrencia] || '',
      disciplina: r[idx.disciplina] || '',
      ano: r[idx.ano] || '',
      edicao: r[idx.edicao] || '',
      competencia: r[idx.competencia] || '',
      habilidade: r[idx.habilidade] || '',
      objeto: r[idx.objeto_principal] || '',
      dificuldade: r[idx.dificuldade_rotulo] || '',
      funcao: r[idx.funcao_pedagogica_sugerida] || '',
      trecho: r[idx.trecho_inicial] || '',
      tempo: Number(r[idx.tempo_estimado_min]) || 0,
      statusValidacao: r[idx.status_validacao] || ''
    }));

  return {
    itens,
    tempoTotal: itens.reduce(
      (s, item) => s + (Number(item.tempo) || 0),
      0
    )
  };
}


function adicionarQuestoesSequenciaWebV130(ids) {
  const usuario = obterUsuarioAtualWebV130();
  ids = Array.isArray(ids) ? ids.map(String) : [];

  if (!ids.length) {
    throw new Error('Selecione pelo menos uma questão.');
  }

  const ss = SpreadsheetApp.getActive();
  const base = ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_BASE);
  const atual = ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_ATUAL);

  const dadosBase = base.getDataRange().getValues();
  const idxB = indexarV130_(dadosBase[0]);

  const mapa = new Map();

  dadosBase.slice(1).forEach(r => {
    const id = String(r[idxB.id_ocorrencia] || '').trim();
    if (!ids.includes(id)) return;

    const disciplina = String(
      r[idxB.componente_principal] || ''
    ).trim();

    if (!podeAcessarDisciplinaWebV130_(usuario, disciplina)) {
      throw new Error(
        'Você não possui permissão para a disciplina: ' +
        disciplina
      );
    }

    mapa.set(id, r);
  });

  const dadosAtual = atual.getDataRange().getDisplayValues();
  const idxA = indexarV130_(dadosAtual[0]);

  const existentesUsuario = dadosAtual.slice(1)
    .filter(r =>
      String(r[idxA.email_usuario] || '').trim().toLowerCase() ===
      usuario.email
    );

  const idsAtuais = new Set(
    existentesUsuario.map(r =>
      String(r[idxA.id_ocorrencia] || '').trim()
    )
  );

  let proximaOrdem = existentesUsuario.reduce(
    (m, r) => Math.max(m, Number(r[idxA.ordem]) || 0),
    0
  ) + 1;

  const agora = new Date();
  const registros = [];

  ids.forEach(id => {
    if (idsAtuais.has(id) || !mapa.has(id)) return;

    const r = mapa.get(id);

    registros.push({
      email_usuario: usuario.email,
      ordem: proximaOrdem++,
      id_ocorrencia: id,
      disciplina: campoV130_(r, idxB, 'componente_principal'),
      ano: campoV130_(r, idxB, 'ano'),
      edicao: campoV130_(r, idxB, 'edicao'),
      competencia: campoV130_(r, idxB, 'competencia'),
      habilidade: campoV130_(r, idxB, 'habilidade'),
      objeto_principal: campoV130_(r, idxB, 'objeto_principal'),
      dificuldade_rotulo: campoV130_(
        r, idxB, 'dificuldade_rotulo'
      ),
      funcao_pedagogica_sugerida: campoV130_(
        r, idxB, 'funcao_pedagogica_sugerida'
      ),
      trecho_inicial: campoV130_(r, idxB, 'trecho_inicial'),
      tempo_estimado_min: campoV130_(
        r, idxB, 'tempo_estimado_min'
      ),
      status_validacao: campoV130_(r, idxB, 'status_validacao'),
      maturidade_curadoria: campoV130_(
        r, idxB, 'maturidade_curadoria'
      ),
      colecao_origem: campoV130_(r, idxB, 'colecao_origem'),
      pagina_pdf: campoV130_(r, idxB, 'pagina_pdf'),
      incluido_em: agora
    });
  });

  registros.forEach(reg =>
    anexarPorCabecalhoV130_(atual, reg)
  );

  return {
    adicionadas: registros.length,
    mensagem: registros.length
      ? registros.length + ' questão(ões) adicionada(s) à sequência.'
      : 'As questões selecionadas já estão na sua sequência.',
    sequencia: obterSequenciaAtualWebV130()
  };
}


function limparSequenciaWebV130() {
  const usuario = obterUsuarioAtualWebV130();
  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_ATUAL);

  if (!aba || aba.getLastRow() < 2) {
    return {
      mensagem: 'Sua sequência já está vazia.',
      sequencia: { itens: [], tempoTotal: 0 }
    };
  }

  const dados = aba.getDataRange().getDisplayValues();
  const idx = indexarV130_(dados[0]);

  for (let i = dados.length - 1; i >= 1; i--) {
    if (
      String(dados[i][idx.email_usuario] || '')
        .trim().toLowerCase() === usuario.email
    ) {
      aba.deleteRow(i + 1);
    }
  }

  return {
    mensagem: 'Sequência atual limpa.',
    sequencia: { itens: [], tempoTotal: 0 }
  };
}


/* =========================================================
   SALVAR / MINHAS SEQUÊNCIAS
   ========================================================= */

function salvarSequenciaWebV130(meta) {
  const usuario = obterUsuarioAtualWebV130();
  meta = meta || {};

  const titulo = String(meta.titulo || '').trim();

  if (!titulo) {
    throw new Error('Informe um nome para a sequência.');
  }

  const seq = obterSequenciaAtualWebV130();

  if (!seq.itens.length) {
    throw new Error('Sua sequência atual está vazia.');
  }

  const ss = SpreadsheetApp.getActive();
  const salvas = ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_SALVAS);
  const itens = ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_ITENS);
  const base = ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_BASE);

  if (!salvas || !itens) {
    throw new Error(
      'As abas SEQUENCIAS_SALVAS e ITENS_SEQUENCIAS são obrigatórias.'
    );
  }

  garantirCabecalhosV130_(
    salvas,
    ['area', 'disciplinas', 'criada_por_nome']
  );

  const dadosBase = base.getDataRange().getValues();
  const idxBase = indexarV130_(dadosBase[0]);
  const mapaBase = new Map();

  dadosBase.slice(1).forEach(r => {
    mapaBase.set(
      String(r[idxBase.id_ocorrencia] || '').trim(),
      r
    );
  });

  const idSequencia = gerarIdSequenciasV060_('SEQ');
  const agora = new Date();
  const versao = obterProximaVersaoSequenciaV060_(
    salvas,
    titulo
  );

  const disciplinas = Array.from(
    new Set(seq.itens.map(i => i.disciplina).filter(Boolean))
  );

  anexarRegistroPorCabecalhoV060_(salvas, {
    id_sequencia: idSequencia,
    criada_em: agora,
    criada_por: usuario.email,
    criada_por_nome: usuario.nome,
    titulo,
    descricao: String(meta.descricao || '').trim(),
    publico_alvo: String(meta.publico || '').trim(),
    objetivo_pedagogico: String(meta.objetivo || '').trim(),
    quantidade_questoes: seq.itens.length,
    tempo_total_min: seq.tempoTotal,
    status_sequencia: 'Rascunho',
    versao,
    origem: 'Aplicação web',
    atualizada_em: agora,
    atualizada_por: usuario.email,
    area: Array.from(
      new Set(
        disciplinas
          .map(inferirAreaDisciplinaWebV150_)
          .filter(Boolean)
      )
    ).join('; '),
    disciplinas: disciplinas.join('; ')
  });

  seq.itens.forEach((item, posicao) => {
    const rb = mapaBase.get(String(item.id)) || [];

    anexarRegistroPorCabecalhoV060_(itens, {
      id_item_sequencia: gerarIdSequenciasV060_('ITEMSEQ'),
      id_sequencia: idSequencia,
      ordem: posicao + 1,
      id_ocorrencia: item.id,
      ano: campoV130_(rb, idxBase, 'ano') || item.ano,
      edicao: campoV130_(rb, idxBase, 'edicao') || item.edicao,
      competencia:
        campoV130_(rb, idxBase, 'competencia') || item.competencia,
      habilidade:
        campoV130_(rb, idxBase, 'habilidade') || item.habilidade,
      objeto_principal:
        campoV130_(rb, idxBase, 'objeto_principal') || item.objeto,
      dificuldade_rotulo:
        campoV130_(rb, idxBase, 'dificuldade_rotulo') ||
        item.dificuldade,
      funcao_pedagogica_sugerida:
        campoV130_(
          rb,
          idxBase,
          'funcao_pedagogica_sugerida'
        ) || item.funcao,
      trecho_inicial:
        campoV130_(rb, idxBase, 'trecho_inicial') || item.trecho,
      tempo_estimado_min:
        campoV130_(rb, idxBase, 'tempo_estimado_min') || item.tempo,
      observacao_professor: '',
      status_validacao:
        campoV130_(rb, idxBase, 'status_validacao') ||
        item.statusValidacao,
      maturidade_curadoria:
        campoV130_(rb, idxBase, 'maturidade_curadoria'),
      colecao_origem:
        campoV130_(rb, idxBase, 'colecao_origem'),
      pagina_pdf:
        campoV130_(rb, idxBase, 'pagina_pdf'),
      status_item_sequencia: 'Ativo',
      incluido_em: agora,
      incluido_por: usuario.email
    });
  });

  return {
    mensagem: 'Sequência salva com sucesso.',
    idSequencia,
    titulo,
    versao,
    quantidade: seq.itens.length,
    tempoTotal: seq.tempoTotal
  };
}


function listarMinhasSequenciasWebV130() {
  const usuario = obterUsuarioAtualWebV130();
  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_SALVAS);

  if (!aba || aba.getLastRow() < 2) return [];

  const dados = aba.getDataRange().getDisplayValues();
  const idx = indexarV130_(dados[0]);

  return dados.slice(1)
    .filter(r =>
      String(r[idx.id_sequencia] || '').trim() &&
      String(r[idx.criada_por] || '').trim().toLowerCase() ===
        usuario.email
    )
    .map(r => ({
      id: r[idx.id_sequencia] || '',
      titulo: r[idx.titulo] || '',
      criadaEm: r[idx.criada_em] || '',
      quantidade: Number(r[idx.quantidade_questoes]) || 0,
      tempo: Number(r[idx.tempo_total_min]) || 0,
      status: r[idx.status_sequencia] || '',
      versao: r[idx.versao] || '',
      area: idx.area === undefined ? '' : r[idx.area],
      disciplinas:
        idx.disciplinas === undefined ? '' : r[idx.disciplinas]
    }))
    .reverse()
    .slice(0, 50);
}


function carregarMinhaSequenciaWebV130(idSequencia) {
  const usuario = obterUsuarioAtualWebV130();
  const ss = SpreadsheetApp.getActive();
  const salvas = ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_SALVAS);
  const itens = ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_ITENS);
  const atual = ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_ATUAL);
  const base = ss.getSheetByName(NAVE_USR_SEQ_V130.ABA_BASE);

  const dadosSalvas = salvas.getDataRange().getDisplayValues();
  const idxS = indexarV130_(dadosSalvas[0]);

  const registro = dadosSalvas.slice(1).find(r =>
    String(r[idxS.id_sequencia] || '').trim() ===
      String(idSequencia || '').trim() &&
    String(r[idxS.criada_por] || '').trim().toLowerCase() ===
      usuario.email
  );

  if (!registro) {
    throw new Error(
      'Sequência não localizada entre suas sequências.'
    );
  }

  limparSequenciaWebV130();

  const dadosItens = itens.getDataRange().getDisplayValues();
  const idxI = indexarV130_(dadosItens[0]);

  const selecionados = dadosItens.slice(1)
    .filter(r =>
      String(r[idxI.id_sequencia] || '').trim() ===
        String(idSequencia).trim() &&
      String(r[idxI.status_item_sequencia] || '').trim() !==
        'Removido'
    )
    .sort((a, b) =>
      Number(a[idxI.ordem]) - Number(b[idxI.ordem])
    );

  const dadosBase = base.getDataRange().getDisplayValues();
  const idxB = indexarV130_(dadosBase[0]);
  const mapaBase = new Map();

  dadosBase.slice(1).forEach(r => {
    mapaBase.set(
      String(r[idxB.id_ocorrencia] || '').trim(),
      r
    );
  });

  const agora = new Date();

  selecionados.forEach((r, posicao) => {
    const id = String(r[idxI.id_ocorrencia] || '').trim();
    const rb = mapaBase.get(id) || [];
    const disciplina = campoV130_(
      rb, idxB, 'componente_principal'
    );

    anexarPorCabecalhoV130_(atual, {
      email_usuario: usuario.email,
      ordem: posicao + 1,
      id_ocorrencia: id,
      disciplina,
      ano: r[idxI.ano] || '',
      edicao: r[idxI.edicao] || '',
      competencia: r[idxI.competencia] || '',
      habilidade: r[idxI.habilidade] || '',
      objeto_principal: r[idxI.objeto_principal] || '',
      dificuldade_rotulo: r[idxI.dificuldade_rotulo] || '',
      funcao_pedagogica_sugerida:
        r[idxI.funcao_pedagogica_sugerida] || '',
      trecho_inicial: r[idxI.trecho_inicial] || '',
      tempo_estimado_min: r[idxI.tempo_estimado_min] || 0,
      status_validacao: r[idxI.status_validacao] || '',
      maturidade_curadoria: r[idxI.maturidade_curadoria] || '',
      colecao_origem: r[idxI.colecao_origem] || '',
      pagina_pdf: r[idxI.pagina_pdf] || '',
      incluido_em: agora
    });
  });

  return {
    mensagem:
      'Sequência "' + (registro[idxS.titulo] || '') +
      '" carregada.',
    sequencia: obterSequenciaAtualWebV130()
  };
}


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function obterOuCriarAbaV130_(ss, nome, cabecalhos) {
  let aba = ss.getSheetByName(nome);
  if (!aba) aba = ss.insertSheet(nome);

  garantirCabecalhosV130_(aba, cabecalhos);
  return aba;
}


function garantirCabecalhosV130_(aba, cabecalhos) {
  if (!aba) return;

  const atuais = aba.getLastColumn()
    ? aba.getRange(1, 1, 1, aba.getLastColumn())
        .getDisplayValues()[0]
        .map(v => String(v || '').trim())
    : [];

  if (!atuais.length || atuais.every(v => !v)) {
    aba.getRange(1, 1, 1, cabecalhos.length)
      .setValues([cabecalhos]);
    return;
  }

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


function estilizarCabecalhoV130_(aba) {
  if (!aba || !aba.getLastColumn()) return;

  aba.getRange(1, 1, 1, aba.getLastColumn())
    .setBackground('#0F766E')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  aba.setFrozenRows(1);
}


function indexarV130_(headers) {
  return headers.reduce((m, h, i) => {
    m[String(h || '').trim()] = i;
    return m;
  }, {});
}


function campoV130_(linha, idx, campo) {
  if (!linha || idx[campo] === undefined) return '';
  return linha[idx[campo]];
}


function anexarPorCabecalhoV130_(aba, registro) {
  const headers = aba.getRange(
    1, 1, 1, aba.getLastColumn()
  ).getDisplayValues()[0];

  aba.appendRow(
    headers.map(h =>
      Object.prototype.hasOwnProperty.call(registro, h)
        ? registro[h]
        : ''
    )
  );
}
