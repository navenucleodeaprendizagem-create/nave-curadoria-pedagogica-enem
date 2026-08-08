/**
 * NAVE | Sistema de Curadoria Pedagógica ENEM
 * Aplicação web paralela — Ciências da Natureza V1.2.1
 *
 * Este módulo NÃO substitui o MVP da planilha.
 * Ele cria uma interface web paralela usando a mesma base.
 */

const NAVE_WEB_V121 = Object.freeze({
  TITULO: 'NAVE | Sistema de Curadoria Pedagógica ENEM',
  SUBTITULO: 'Ambiente de curadoria pedagógica',
  AREA_PADRAO: 'CN',
  DISCIPLINA_PADRAO: 'Química',
  AREAS: Object.freeze({
    CN: Object.freeze({
      label: 'Ciências da Natureza',
      disciplinas: Object.freeze(['Biologia', 'Física', 'Química'])
    }),
    MT: Object.freeze({
      label: 'Matemática',
      disciplinas: Object.freeze(['Matemática'])
    }),
    CH: Object.freeze({
      label: 'Ciências Humanas',
      disciplinas: Object.freeze([
        'História',
        'Geografia',
        'Filosofia',
        'Sociologia'
      ])
    }),
    LC: Object.freeze({
      label: 'Linguagens',
      disciplinas: Object.freeze([
        'Língua Portuguesa',
        'Literatura',
        'Língua Estrangeira Moderna',
        'Educação Física',
        'Artes',
        'Tecnologias da Comunicação e Informação'
      ])
    })
  }),
  LIMITE_BUSCA: 80,
  ABAS: {
    BASE: 'QUESTOES_GERAL',
    SEQUENCIA: 'SEQUENCIA_ATUAL',
    VALIDACOES: 'VALIDACOES_DOCENTES',
    FILA: 'FILA_COORDENACAO_V05',
    PROJETOS: 'PROJETOS_EDITORIAIS'
  }
});


function doGet() {
  return HtmlService
    .createTemplateFromFile('IndexV100')
    .evaluate()
    .setTitle(NAVE_WEB_V121.TITULO)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}


function incluirWebV100_(nomeArquivo) {
  return HtmlService
    .createHtmlOutputFromFile(nomeArquivo)
    .getContent();
}


/**
 * Estado inicial da aplicação.
 */
function obterEstadoInicialWebV140(areaSelecionada, disciplinaSelecionada) {
  const usuarioAtual = obterUsuarioAtualWebV130();
  const ss = SpreadsheetApp.getActive();
  const base = exigirAbaWebV100_(ss, NAVE_WEB_V121.ABAS.BASE);

  const dados = base.getDataRange().getDisplayValues();
  const idx = indexarWebV121_(dados[0]);

  const componentesExistentes = new Set(
    dados.slice(1)
      .map(r => String(
        valorWebV121_(r, idx, 'componente_principal') || ''
      ).trim())
      .filter(Boolean)
  );

  const areasDisponiveis = [];

  Object.keys(NAVE_WEB_V121.AREAS).forEach(sigla => {
    const cfg = NAVE_WEB_V121.AREAS[sigla];

    const disciplinas = cfg.disciplinas.filter(d =>
      componentesExistentes.has(d) &&
      podeAcessarDisciplinaWebV130_(usuarioAtual, d)
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
    area = areasDisponiveis.some(a => a.sigla === NAVE_WEB_V121.AREA_PADRAO)
      ? NAVE_WEB_V121.AREA_PADRAO
      : areasDisponiveis[0].sigla;
  }

  const areaAtual = areasDisponiveis.find(a => a.sigla === area);
  const listaDisciplinas = areaAtual.disciplinas.slice();

  let disciplina = String(disciplinaSelecionada || '').trim();

  if (!listaDisciplinas.includes(disciplina)) {
    disciplina =
      listaDisciplinas.includes(NAVE_WEB_V121.DISCIPLINA_PADRAO)
        ? NAVE_WEB_V121.DISCIPLINA_PADRAO
        : listaDisciplinas[0];
  }

  let totalDisciplina = 0;
  const habilidades = new Set();
  const competencias = new Set();
  const objetos = new Set();
  const dificuldades = new Set();
  const anos = new Set();
  const edicoes = new Set();
  const funcoes = new Set();
  const statusValidacao = new Set();

  for (let i = 1; i < dados.length; i++) {
    const r = dados[i];

    if (
      String(valorWebV121_(r, idx, 'componente_principal')).trim() !==
      disciplina
    ) continue;

    totalDisciplina++;

    adicionarSetWebV121_(habilidades, valorWebV121_(r, idx, 'habilidade'));
    adicionarSetWebV121_(competencias, valorWebV121_(r, idx, 'competencia'));
    adicionarSetWebV121_(objetos, valorWebV121_(r, idx, 'objeto_principal'));
    adicionarSetWebV121_(
      dificuldades,
      valorWebV121_(r, idx, 'dificuldade_rotulo')
    );
    adicionarSetWebV121_(anos, valorWebV121_(r, idx, 'ano'));
    adicionarSetWebV121_(edicoes, valorWebV121_(r, idx, 'edicao'));
    adicionarSetWebV121_(
      funcoes,
      valorWebV121_(r, idx, 'funcao_pedagogica_sugerida')
    );
    adicionarSetWebV121_(
      statusValidacao,
      valorWebV121_(r, idx, 'status_validacao') || 'Não avaliada'
    );
  }

  const sequencia = obterSequenciaAtualWebV130();

  return {
    titulo: NAVE_WEB_V121.TITULO,
    subtitulo: NAVE_WEB_V121.SUBTITULO,
    usuario: usuarioAtual.email,
    usuarioDetalhes: usuarioAtual,
    contexto: {
      area,
      areaNome: areaAtual.nome,
      disciplina
    },
    indicadores: {
      questoes: totalDisciplina,
      sequencia: sequencia.itens.length,
      tempoSequencia: sequencia.tempoTotal,
      filaCoordenacao: contarRegistrosWebV121_(
        ss,
        NAVE_WEB_V121.ABAS.FILA,
        'id_validacao'
      ),
      projetosEditoriais: contarRegistrosWebV121_(
        ss,
        NAVE_WEB_V121.ABAS.PROJETOS,
        'id_projeto_editorial'
      )
    },
    filtros: {
      areas: areasDisponiveis,
      disciplinas: listaDisciplinas,
      habilidades: obterMatrizSeletoresWebV142(area).habilidades,
      competencias: obterMatrizSeletoresWebV142(area).competencias,
      habilidadesPorCompetencia:
        obterMatrizSeletoresWebV142(area).habilidadesPorCompetencia,
      objetos: ordenarWebV121_(objetos),
      dificuldades: ordenarWebV121_(dificuldades),
      anos: ordenarNumericoWebV121_(anos),
      edicoes: ordenarWebV121_(edicoes),
      funcoes: ordenarWebV121_(funcoes),
      statusValidacao: ordenarWebV121_(statusValidacao)
    },
    sequencia
  };
}


function obterEstadoInicialWebV121(disciplinaSelecionada) {
  return obterEstadoInicialWebV140('', disciplinaSelecionada);
}


/**
 * Busca sem escrever na aba RESULTADO_BUSCA.
 * O MVP da planilha permanece intacto.
 */
function buscarQuestoesWebV140(filtros) {
  filtros = filtros || {};
  const usuarioAtual = obterUsuarioAtualWebV130();

  const area = String(filtros.area || '').trim();
  const disciplinaFiltro = String(filtros.disciplina || '').trim();
  const cfgArea = NAVE_WEB_V121.AREAS[area];

  if (!cfgArea) {
    throw new Error('Área inválida: ' + area);
  }

  if (
    !disciplinaFiltro ||
    !cfgArea.disciplinas.includes(disciplinaFiltro)
  ) {
    throw new Error(
      'Disciplina incompatível com ' + cfgArea.label + ': ' +
      disciplinaFiltro
    );
  }

  if (!podeAcessarDisciplinaWebV130_(usuarioAtual, disciplinaFiltro)) {
    throw new Error(
      'Você não possui permissão para a disciplina: ' +
      disciplinaFiltro
    );
  }

  const competenciaFiltro =
    String(filtros.competencia || '').trim().toUpperCase();
  const habilidadeFiltro =
    String(filtros.habilidade || '').trim().toUpperCase();

  if (
    competenciaFiltro &&
    competenciaFiltro !== 'TODOS' &&
    habilidadeFiltro &&
    habilidadeFiltro !== 'TODOS'
  ) {
    const permitidas = obterHabilidadesCompetenciaWebV142(
      area,
      competenciaFiltro
    );

    if (!permitidas.includes(habilidadeFiltro)) {
      throw new Error(
        habilidadeFiltro + ' não pertence a ' +
        competenciaFiltro + ' na Matriz da área ' + area + '.'
      );
    }
  }

  const ss = SpreadsheetApp.getActive();
  const base = exigirAbaWebV100_(ss, NAVE_WEB_V121.ABAS.BASE);
  const dados = base.getDataRange().getValues();
  const idx = indexarWebV121_(dados[0]);

  const quantidade = Math.min(
    Math.max(Number(filtros.quantidade) || 30, 1),
    NAVE_WEB_V121.LIMITE_BUSCA
  );

  const resultados = [];

  for (let i = 1; i < dados.length; i++) {
    const r = dados[i];

    const disciplinaLinha = String(
      valorWebV121_(r, idx, 'componente_principal') || ''
    ).trim();

    if (disciplinaLinha !== disciplinaFiltro) continue;

    if (
      ['Arquivada', 'Devolvida'].includes(
        String(valorWebV121_(r, idx, 'status_item')).trim()
      )
    ) continue;

    if (
      String(valorWebV121_(r, idx, 'status_curadoria')).trim() ===
      'Suspensa para revisão'
    ) continue;

    if (!correspondeWebV121_(
      valorWebV121_(r, idx, 'habilidade'),
      filtros.habilidade
    )) continue;

    if (!correspondeWebV121_(
      valorWebV121_(r, idx, 'competencia'),
      filtros.competencia
    )) continue;

    if (!correspondeWebV121_(
      valorWebV121_(r, idx, 'objeto_principal'),
      filtros.objeto
    )) continue;

    if (!correspondeWebV121_(
      valorWebV121_(r, idx, 'dificuldade_rotulo'),
      filtros.dificuldade
    )) continue;

    if (!correspondeWebV121_(
      valorWebV121_(r, idx, 'ano'),
      filtros.ano
    )) continue;

    if (!correspondeWebV121_(
      valorWebV121_(r, idx, 'edicao'),
      filtros.edicao
    )) continue;

    if (!correspondeWebV121_(
      valorWebV121_(r, idx, 'funcao_pedagogica_sugerida'),
      filtros.funcao
    )) continue;

    if (!correspondeWebV121_(
      valorWebV121_(r, idx, 'status_validacao') || 'Não avaliada',
      filtros.statusValidacao
    )) continue;

    resultados.push({
      id: String(valorWebV121_(r, idx, 'id_ocorrencia')),
      area,
      disciplina: disciplinaLinha,
      ano: valorWebV121_(r, idx, 'ano'),
      edicao: valorWebV121_(r, idx, 'edicao'),
      competencia: valorWebV121_(r, idx, 'competencia'),
      habilidade: valorWebV121_(r, idx, 'habilidade'),
      objeto: valorWebV121_(r, idx, 'objeto_principal'),
      dificuldade: valorWebV121_(r, idx, 'dificuldade_rotulo'),
      funcao: valorWebV121_(r, idx, 'funcao_pedagogica_sugerida'),
      tempo: Number(valorWebV121_(r, idx, 'tempo_estimado_min')) || 0,
      trecho: String(valorWebV121_(r, idx, 'trecho_inicial') || ''),
      statusCuradoria:
        String(valorWebV121_(r, idx, 'status_curadoria') || ''),
      statusValidacao:
        String(valorWebV121_(r, idx, 'status_validacao') || 'Não avaliada'),
      liberacaoEditorial:
        String(valorWebV121_(r, idx, 'liberacao_editorial') || ''),
      pagina: valorWebV121_(r, idx, 'pagina_pdf'),
      colecao: valorWebV121_(r, idx, 'colecao_origem')
    });

    if (resultados.length >= quantidade) break;
  }

  return {
    total: resultados.length,
    limite: quantidade,
    itens: resultados
  };
}


function buscarQuestoesWebV121(filtros) {
  if (!filtros.area) filtros.area = NAVE_WEB_V121.AREA_PADRAO;
  return buscarQuestoesWebV140(filtros);
}


/**
 * Dados completos para o modal web.
 */
function obterQuestaoWebV121(idQuestao) {
  return obterDadosQuestaoCompletaV04(idQuestao);
}


/**
 * Adiciona IDs selecionados à sequência atual sem usar RESULTADO_BUSCA.
 */
function adicionarQuestoesSequenciaWebV121(ids) {
  return adicionarQuestoesSequenciaWebV130(ids);
}


/**
 * Leitura da sequência atual.
 */
function obterSequenciaAtualWebV121() {
  return obterSequenciaAtualWebV130();
}


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function exigirAbaWebV100_(ss, nome) {
  const aba = ss.getSheetByName(nome);
  if (!aba) throw new Error('A aba ' + nome + ' não foi encontrada.');
  return aba;
}


function indexarWebV121_(cabecalhos) {
  return cabecalhos.reduce((mapa, cabecalho, indice) => {
    mapa[String(cabecalho || '').trim()] = indice;
    return mapa;
  }, {});
}


function valorWebV121_(linha, idx, campo) {
  return idx[campo] === undefined ? '' : linha[idx[campo]];
}


function correspondeWebV121_(valor, filtro) {
  const f = String(filtro || '').trim();
  if (!f || f === 'Todos') return true;
  return String(valor || '').trim() === f;
}


function adicionarSetWebV121_(set, valor) {
  const texto = String(valor || '').trim();
  if (texto) set.add(texto);
}


function ordenarWebV121_(set) {
  return Array.from(set).sort((a, b) =>
    String(a).localeCompare(String(b), 'pt-BR')
  );
}


function ordenarNumericoWebV121_(set) {
  return Array.from(set).sort((a, b) =>
    Number(a) - Number(b)
  );
}


function contarRegistrosWebV121_(ss, nomeAba, campoId) {
  const aba = ss.getSheetByName(nomeAba);
  if (!aba || aba.getLastRow() < 2) return 0;

  const dados = aba.getDataRange().getDisplayValues();
  const idx = indexarWebV121_(dados[0]);

  if (idx[campoId] === undefined) return Math.max(dados.length - 1, 0);

  return dados
    .slice(1)
    .filter(r => String(r[idx[campoId]] || '').trim())
    .length;
}




/* =========================================================
   COMPATIBILIDADE V1.4
   ========================================================= */

function obterEstadoInicialWebV120(disciplinaSelecionada) {
  return obterEstadoInicialWebV140('', disciplinaSelecionada);
}

function buscarQuestoesWebV120(filtros) {
  if (!filtros.area) filtros.area = NAVE_WEB_V121.AREA_PADRAO;
  return buscarQuestoesWebV140(filtros);
}

function obterQuestaoWebV120(idQuestao) {
  return obterQuestaoWebV140(idQuestao);
}
