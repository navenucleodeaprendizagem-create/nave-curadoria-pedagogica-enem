/**
 * NAVE | PERFORMANCE WEB — V1.9.0
 *
 * Objetivos:
 * - reduzir a carga inicial;
 * - evitar leitura completa de QUESTOES_GERAL na Home;
 * - carregar filtros pesados apenas ao abrir Buscar questões;
 * - cachear filtros estáticos por área/disciplina;
 * - contar KPIs lendo apenas a coluna necessária.
 */

const NAVE_PERF_V190 = Object.freeze({
  TTL_FILTROS_SEG: 180,
  TTL_CONTAGENS_SEG: 120,
  PREFIXO_CACHE: 'NAVE_V190'
});


function obterBootstrapWebV190(areaSelecionada, disciplinaSelecionada) {
  const contextoPerm = obterPermissoesUsuarioWebV150();
  const usuario = contextoPerm.usuario;
  const ss = SpreadsheetApp.getActive();

  const areasDisponiveis = [];

  Object.keys(NAVE_WEB_V121.AREAS).forEach(sigla => {
    const cfg = NAVE_WEB_V121.AREAS[sigla];

    const disciplinas = cfg.disciplinas.filter(d =>
      podeAcessarDisciplinaWebV130_(usuario, d)
    );

    if (disciplinas.length) {
      areasDisponiveis.push({
        sigla,
        nome: cfg.label,
        disciplinas
      });
    }
  });

  if (!areasDisponiveis.length) {
    throw new Error(
      'Nenhuma área/disciplina disponível para este usuário.'
    );
  }

  let area = String(areaSelecionada || '').trim();

  if (!areasDisponiveis.some(a => a.sigla === area)) {
    area = areasDisponiveis.some(
      a => a.sigla === NAVE_WEB_V121.AREA_PADRAO
    )
      ? NAVE_WEB_V121.AREA_PADRAO
      : areasDisponiveis[0].sigla;
  }

  const areaAtual = areasDisponiveis.find(a => a.sigla === area);
  const listaDisciplinas = areaAtual.disciplinas.slice();

  let disciplina = String(disciplinaSelecionada || '').trim();

  if (!listaDisciplinas.includes(disciplina)) {
    disciplina = listaDisciplinas.includes(
      NAVE_WEB_V121.DISCIPLINA_PADRAO
    )
      ? NAVE_WEB_V121.DISCIPLINA_PADRAO
      : listaDisciplinas[0];
  }

  const sequencia = obterSequenciaAtualWebV130();

  return {
    titulo: NAVE_WEB_V121.TITULO,
    subtitulo: NAVE_WEB_V121.SUBTITULO,

    usuario: usuario.email,
    usuarioDetalhes: usuario,
    permissoes: contextoPerm.permissoes,

    contexto: {
      area,
      areaNome: areaAtual.nome,
      disciplina
    },

    indicadores: {
      questoes: contarQuestoesDisponiveisWebV191_(
        ss,
        usuario
      ),
      sequencia: sequencia.itens.length,
      tempoSequencia: sequencia.tempoTotal,
      filaCoordenacao: contarIdsWebV190_(
        ss,
        NAVE_WEB_V121.ABAS.FILA,
        'id_validacao'
      ),
      projetosEditoriais: contarIdsWebV190_(
        ss,
        NAVE_WEB_V121.ABAS.PROJETOS,
        'id_projeto_editorial'
      )
    },

    filtros: {
      areas: areasDisponiveis,
      disciplinas: listaDisciplinas,

      // Matriz é pequena e não depende de QUESTOES_GERAL.
      habilidades: obterMatrizSeletoresWebV142(area).habilidades,
      competencias: obterMatrizSeletoresWebV142(area).competencias,
      habilidadesPorCompetencia:
        obterMatrizSeletoresWebV142(area).habilidadesPorCompetencia,

      // Pesados: lazy loading.
      objetos: [],
      dificuldades: [],
      anos: [],
      edicoes: [],
      funcoes: [],
      statusValidacao: []
    },

    filtrosDetalhadosCarregados: false,
    sequencia
  };
}


function obterFiltrosBuscaWebV190(area, disciplina) {
  const usuario = obterUsuarioAtualWebV130();

  area = String(area || '').trim();
  disciplina = String(disciplina || '').trim();

  const cfg = NAVE_WEB_V121.AREAS[area];

  if (!cfg || !cfg.disciplinas.includes(disciplina)) {
    throw new Error('Área/disciplina inválida para os filtros.');
  }

  if (!podeAcessarDisciplinaWebV130_(usuario, disciplina)) {
    throw new Error(
      'Você não possui permissão para a disciplina: ' + disciplina
    );
  }

  const cache = CacheService.getUserCache();
  const chave = [
    NAVE_PERF_V190.PREFIXO_CACHE,
    'FILTROS',
    area,
    normalizarChaveCacheWebV190_(disciplina)
  ].join('_');

  const salvo = cache.get(chave);

  if (salvo) {
    try {
      return JSON.parse(salvo);
    } catch (e) {
      // cache inválido: recalcula abaixo
    }
  }

  const ss = SpreadsheetApp.getActive();
  const aba = exigirAbaWebV100_(
    ss,
    NAVE_WEB_V121.ABAS.BASE
  );

  const dados = aba.getDataRange().getDisplayValues();
  const idx = indexarWebV121_(dados[0]);

  const objetos = new Set();
  const dificuldades = new Set();
  const anos = new Set();
  const edicoes = new Set();
  const funcoes = new Set();
  const statusValidacao = new Set();

  for (let i = 1; i < dados.length; i++) {
    const r = dados[i];

    if (
      String(
        valorWebV121_(
          r,
          idx,
          'componente_principal'
        ) || ''
      ).trim() !== disciplina
    ) continue;

    adicionarSetWebV121_(
      objetos,
      valorWebV121_(r, idx, 'objeto_principal')
    );

    adicionarSetWebV121_(
      dificuldades,
      valorWebV121_(r, idx, 'dificuldade_rotulo')
    );

    adicionarSetWebV121_(
      anos,
      valorWebV121_(r, idx, 'ano')
    );

    adicionarSetWebV121_(
      edicoes,
      valorWebV121_(r, idx, 'edicao')
    );

    adicionarSetWebV121_(
      funcoes,
      valorWebV121_(
        r,
        idx,
        'funcao_pedagogica_sugerida'
      )
    );

    adicionarSetWebV121_(
      statusValidacao,
      valorWebV121_(
        r,
        idx,
        'status_validacao'
      ) || 'Não avaliada'
    );
  }

  const matriz = obterMatrizSeletoresWebV142(area);

  const resposta = {
    area,
    disciplina,
    habilidades: matriz.habilidades,
    competencias: matriz.competencias,
    habilidadesPorCompetencia:
      matriz.habilidadesPorCompetencia,
    objetos: ordenarWebV121_(objetos),
    dificuldades: ordenarWebV121_(dificuldades),
    anos: ordenarNumericoWebV121_(anos),
    edicoes: ordenarWebV121_(edicoes),
    funcoes: ordenarWebV121_(funcoes),
    statusValidacao: ordenarWebV121_(statusValidacao),
    cacheSegundos: NAVE_PERF_V190.TTL_FILTROS_SEG
  };

  const json = JSON.stringify(resposta);

  // CacheService limita o tamanho por item. Se ultrapassar,
  // simplesmente devolvemos sem cachear.
  if (json.length < 95000) {
    cache.put(
      chave,
      json,
      NAVE_PERF_V190.TTL_FILTROS_SEG
    );
  }

  return resposta;
}


function invalidarCacheFiltrosWebV190() {
  const cache = CacheService.getUserCache();

  // CacheService não oferece listagem de chaves.
  // Mudamos a versão lógica da chave ao evoluir o módulo.
  // Esta função existe como endpoint estável para futuras estratégias.
  return true;
}



/**
 * V1.9.1 — KPI \"Questões disponíveis\".
 * Administrador / Coordenação geral: toda a QUESTOES_GERAL.
 * Professor: apenas disciplinas autorizadas.
 */
function contarQuestoesDisponiveisWebV191_(ss, usuario) {
  const aba = ss.getSheetByName(NAVE_WEB_V121.ABAS.BASE);
  if (!aba || aba.getLastRow() < 2) return 0;

  const perfil = String(usuario && usuario.perfil || '').trim();
  const acessoAmplo = ['Administrador', 'Coordenação geral'].includes(perfil);
  const cache = CacheService.getScriptCache();

  if (acessoAmplo) {
    const chave = NAVE_PERF_V190.PREFIXO_CACHE + '_QUESTOES_TOTAL';
    const salvo = cache.get(chave);
    if (salvo !== null) return Number(salvo) || 0;

    const headers = aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0];
    const idxId = headers.findIndex(h => String(h || '').trim() === 'id_ocorrencia');
    let total = Math.max(aba.getLastRow() - 1, 0);

    if (idxId >= 0) {
      const valores = aba.getRange(2, idxId + 1, aba.getLastRow() - 1, 1).getDisplayValues();
      total = valores.reduce((n, r) => n + (String(r[0] || '').trim() ? 1 : 0), 0);
    }

    cache.put(chave, String(total), NAVE_PERF_V190.TTL_CONTAGENS_SEG);
    return total;
  }

  const disciplinas = (usuario && Array.isArray(usuario.disciplinas) ? usuario.disciplinas : [])
    .map(x => String(x || '').trim())
    .filter(Boolean);

  if (!disciplinas.length) return 0;

  const headers = aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0];
  const idxComp = headers.findIndex(h => String(h || '').trim() === 'componente_principal');
  if (idxComp < 0) return 0;

  const chave = [
    NAVE_PERF_V190.PREFIXO_CACHE,
    'QUESTOES_PERMITIDAS',
    disciplinas.slice().sort().join('_')
  ].join('_');

  const salvo = cache.get(chave);
  if (salvo !== null) return Number(salvo) || 0;

  const valores = aba.getRange(2, idxComp + 1, aba.getLastRow() - 1, 1).getDisplayValues();
  const permitidas = new Set(disciplinas);
  const total = valores.reduce(
    (n, r) => n + (permitidas.has(String(r[0] || '').trim()) ? 1 : 0),
    0
  );

  cache.put(chave, String(total), NAVE_PERF_V190.TTL_CONTAGENS_SEG);
  return total;
}

function contarValorColunaWebV190_(
  ss,
  nomeAba,
  nomeCampo,
  valorAlvo
) {
  const cache = CacheService.getScriptCache();
  const chave = [
    NAVE_PERF_V190.PREFIXO_CACHE,
    'COUNT',
    nomeAba,
    nomeCampo,
    normalizarChaveCacheWebV190_(valorAlvo)
  ].join('_');

  const salvo = cache.get(chave);

  if (salvo !== null) {
    return Number(salvo) || 0;
  }

  const aba = ss.getSheetByName(nomeAba);

  if (!aba || aba.getLastRow() < 2) {
    return 0;
  }

  const cabecalhos = aba
    .getRange(1, 1, 1, aba.getLastColumn())
    .getDisplayValues()[0];

  const idx = cabecalhos.findIndex(
    h => String(h || '').trim() === nomeCampo
  );

  if (idx < 0) return 0;

  const valores = aba
    .getRange(
      2,
      idx + 1,
      aba.getLastRow() - 1,
      1
    )
    .getDisplayValues();

  const alvo = String(valorAlvo || '').trim();

  const total = valores.reduce(
    (n, r) =>
      n + (
        String(r[0] || '').trim() === alvo
          ? 1
          : 0
      ),
    0
  );

  cache.put(
    chave,
    String(total),
    NAVE_PERF_V190.TTL_CONTAGENS_SEG
  );

  return total;
}


function contarIdsWebV190_(ss, nomeAba, campoId) {
  const cache = CacheService.getScriptCache();
  const chave = [
    NAVE_PERF_V190.PREFIXO_CACHE,
    'IDS',
    nomeAba,
    campoId
  ].join('_');

  const salvo = cache.get(chave);

  if (salvo !== null) {
    return Number(salvo) || 0;
  }

  const aba = ss.getSheetByName(nomeAba);

  if (!aba || aba.getLastRow() < 2) {
    return 0;
  }

  const cabecalhos = aba
    .getRange(1, 1, 1, aba.getLastColumn())
    .getDisplayValues()[0];

  const idx = cabecalhos.findIndex(
    h => String(h || '').trim() === campoId
  );

  if (idx < 0) {
    return Math.max(
      aba.getLastRow() - 1,
      0
    );
  }

  const valores = aba
    .getRange(
      2,
      idx + 1,
      aba.getLastRow() - 1,
      1
    )
    .getDisplayValues();

  const total = valores.reduce(
    (n, r) =>
      n + (
        String(r[0] || '').trim()
          ? 1
          : 0
      ),
    0
  );

  cache.put(
    chave,
    String(total),
    NAVE_PERF_V190.TTL_CONTAGENS_SEG
  );

  return total;
}


function normalizarChaveCacheWebV190_(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .slice(0, 50);
}
