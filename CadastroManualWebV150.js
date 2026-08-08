/**
 * NAVE | CADASTRO MANUAL DE QUESTÕES — V1.4
 *
 * Cadastro unitário pela aplicação web.
 * Questões entram como classificação inicial e "Não avaliada".
 */

const NAVE_CADASTRO_V140 = Object.freeze({
  ABA_BASE: 'QUESTOES_GERAL',
  CABECALHOS_TECNICOS: [
    'origem_cadastro',
    'cadastrado_por',
    'cadastrado_em',
    'url_pdf_manual'
  ]
});


function instalarCadastroManualWebV140() {
  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(NAVE_CADASTRO_V140.ABA_BASE);

  if (!aba) {
    throw new Error('A aba QUESTOES_GERAL não foi encontrada.');
  }

  garantirCabecalhosCadastroV140_(
    aba,
    NAVE_CADASTRO_V140.CABECALHOS_TECNICOS
  );

  SpreadsheetApp.getUi().alert(
    'Cadastro manual preparado',
    'QUESTOES_GERAL recebeu os campos técnicos necessários.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


function cadastrarQuestaoManualWebV140(form) {
  form = form || {};

  exigirPermissaoWebV150_('cadastrar');
  const usuario = obterUsuarioAtualWebV130();
  const area = String(form.area || '').trim();
  const disciplina = String(form.disciplina || '').trim();

  const cfgArea = NAVE_WEB_V121.AREAS[area];

  if (!cfgArea) {
    throw new Error('Selecione uma área válida.');
  }

  if (!cfgArea.disciplinas.includes(disciplina)) {
    throw new Error(
      'A disciplina selecionada não pertence à área informada.'
    );
  }

  if (!podeAcessarDisciplinaWebV130_(usuario, disciplina)) {
    throw new Error(
      'Você não possui permissão para cadastrar questões em ' +
      disciplina + '.'
    );
  }

  const competencia = String(form.competencia || '').trim();
  const habilidade = String(form.habilidade || '').trim();
  const objeto = String(form.objeto || '').trim();
  const dificuldade = String(form.dificuldade || '').trim();
  const trecho = String(form.trecho || '').trim();

  if (!competencia) throw new Error('Informe a competência.');
  if (!habilidade) throw new Error('Informe a habilidade.');

  const habilidadesPermitidas =
    obterHabilidadesCompetenciaWebV142(area, competencia);

  if (!habilidadesPermitidas.includes(habilidade)) {
    throw new Error(
      habilidade + ' não está associada a ' + competencia +
      ' na Matriz de Referência da área ' + area + '.'
    );
  }

  if (!objeto) throw new Error('Informe o objeto de conhecimento.');
  if (!dificuldade) throw new Error('Informe a dificuldade.');
  if (!trecho) throw new Error('Informe o trecho da questão.');

  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(NAVE_CADASTRO_V140.ABA_BASE);

  if (!aba) {
    throw new Error('A aba QUESTOES_GERAL não foi encontrada.');
  }

  garantirCabecalhosCadastroV140_(
    aba,
    NAVE_CADASTRO_V140.CABECALHOS_TECNICOS
  );

  const id = gerarIdQuestaoManualV140_(area, disciplina);
  const agora = new Date();

  const registro = {
    id_ocorrencia: id,
    id_canonico: 'CAN_' + id,
    colecao_origem:
      String(form.colecaoOrigem || '').trim() || 'Cadastro manual',
    edicao:
      String(form.edicao || '').trim() || 'Manual',
    ano: String(form.ano || '').trim(),
    numero_questao: String(form.numeroQuestao || '').trim(),
    pagina_pdf: String(form.paginaPdf || '').trim(),
    competencia,
    habilidade,
    componente_principal: disciplina,
    macroobjeto: String(form.macroobjeto || '').trim(),
    objeto_principal: objeto,
    acao_cognitiva: String(form.acaoCognitiva || '').trim(),
    dificuldade_rotulo: dificuldade,
    funcao_pedagogica_sugerida:
      String(form.funcaoPedagogica || '').trim(),
    tempo_estimado_min: Number(form.tempoEstimado) || 0,
    trecho_inicial: trecho,
    status_curadoria: 'Classificação inicial',
    status_validacao: 'Não avaliada',
    liberacao_editorial: 'Aguardando validação',
    origem_cadastro: 'Manual — aplicação web',
    cadastrado_por: usuario.email,
    cadastrado_em: agora,
    url_pdf_manual: String(form.urlPdf || '').trim()
  };

  anexarRegistroCadastroV140_(aba, registro);

  return {
    mensagem: 'Questão cadastrada com sucesso.',
    id,
    status: 'Não avaliada',
    disciplina,
    area
  };
}


function obterTaxonomiaCadastroWebV140(area, disciplina) {
  const usuario = obterUsuarioAtualWebV130();
  const cfgArea = NAVE_WEB_V121.AREAS[String(area || '').trim()];

  if (!cfgArea || !cfgArea.disciplinas.includes(disciplina)) {
    throw new Error('Área ou disciplina inválida.');
  }

  if (!podeAcessarDisciplinaWebV130_(usuario, disciplina)) {
    throw new Error(
      'Você não possui permissão para a disciplina: ' + disciplina
    );
  }

  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName('QUESTOES_GERAL');
  const dados = aba.getDataRange().getDisplayValues();
  const idx = indexarCadastroV140_(dados[0]);

  const matriz = obterMatrizSeletoresWebV142(area);
  const objetos = new Set();
  const macroobjetos = new Set();
  const acoes = new Set();

  dados.slice(1).forEach(r => {
    if (
      String(r[idx.componente_principal] || '').trim() !== disciplina
    ) return;

    addSetCadastroV140_(objetos, r[idx.objeto_principal]);

    if (idx.macroobjeto !== undefined) {
      addSetCadastroV140_(macroobjetos, r[idx.macroobjeto]);
    }

    if (idx.acao_cognitiva !== undefined) {
      addSetCadastroV140_(acoes, r[idx.acao_cognitiva]);
    }
  });

  const ordenar = set =>
    Array.from(set).sort((a, b) =>
      String(a).localeCompare(String(b), 'pt-BR')
    );

  return {
    competencias: matriz.competencias,
    habilidades: matriz.habilidades,
    habilidadesPorCompetencia: matriz.habilidadesPorCompetencia,
    objetos: ordenar(objetos),
    macroobjetos: ordenar(macroobjetos),
    acoes: ordenar(acoes)
  };
}


function gerarIdQuestaoManualV140_(area, disciplina) {
  const siglaDisciplina = {
    'Biologia': 'BIO',
    'Física': 'FIS',
    'Química': 'QUI',
    'Matemática': 'MAT',
    'História': 'HIS',
    'Geografia': 'GEO',
    'Filosofia': 'FIL',
    'Sociologia': 'SOC',
    'Língua Portuguesa': 'POR',
    'Literatura': 'LIT',
    'Língua Estrangeira Moderna': 'LEM',
    'Educação Física': 'EDF',
    'Artes': 'ART',
    'Tecnologias da Comunicação e Informação': 'TCI'
  }[disciplina] || 'GER';

  const carimbo = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyyMMddHHmmss'
  );

  const sufixo = Utilities.getUuid()
    .replace(/-/g, '')
    .slice(0, 6)
    .toUpperCase();

  return [
    'MAN',
    area,
    siglaDisciplina,
    carimbo,
    sufixo
  ].join('_');
}


function garantirCabecalhosCadastroV140_(aba, cabecalhos) {
  const lastCol = Math.max(aba.getLastColumn(), 1);
  const atuais = aba
    .getRange(1, 1, 1, lastCol)
    .getDisplayValues()[0]
    .map(v => String(v || '').trim());

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


function anexarRegistroCadastroV140_(aba, registro) {
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


function indexarCadastroV140_(headers) {
  return headers.reduce((m, h, i) => {
    m[String(h || '').trim()] = i;
    return m;
  }, {});
}


function addSetCadastroV140_(set, valor) {
  const v = String(valor || '').trim();
  if (v) set.add(v);
}
