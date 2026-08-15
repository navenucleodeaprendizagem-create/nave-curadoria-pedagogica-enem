/**
 * NAVE | PACOTE EDITORIAL CENTRAL — V0.11.20
 *
 * Converte um envio concluído de EDITORACAO_CENTRAL em um
 * pacote técnico institucional, persistido e idempotente.
 *
 * Não gera CSV, arquivos no Drive ou PDFs. O pacote preserva
 * o snapshot central e reúne os dados necessários para as
 * futuras saídas de estudante, professor, anexo pedagógico
 * e gabaritos.
 */

const NAVE_PACOTE_EDITORIAL_CENTRAL_V01120 =
  Object.freeze({
    ABA_PACOTES:
      'PACOTES_EDITORIAIS_CENTRAIS',

    ABA_ITENS:
      'ITENS_PACOTES_CENTRAIS',

    CABECALHOS_PACOTES:
      Object.freeze([
        'id_envio',
        'id_projeto',
        'id_sequencia',
        'titulo',
        'descricao',
        'ids_questoes_json',
        'quantidade_questoes',
        'fontes_incompletas',
        'gabaritos_incompletos',
        'itens_nao_liberados',
        'status_pacote',
        'criado_em',
        'criado_por'
      ]),

    CABECALHOS_ITENS:
      Object.freeze([
        'id_item_pacote',
        'id_envio',
        'id_projeto',
        'id_sequencia',
        'ordem',
        'id_questao',
        'area',
        'componente',
        'competencia',
        'habilidade',
        'objeto_principal',
        'acao_cognitiva',
        'dificuldade',
        'dificuldade_faixa',
        'funcao_pedagogica',
        'gabarito_oficial',
        'ano',
        'edicao',
        'colecao_origem',
        'pagina_pdf',
        'nome_publico_fonte',
        'url_pdf',
        'url_pagina',
        'disponibilidade_fonte',
        'pagina_localizada',
        'motivo_fonte',
        'status_validacao',
        'maturidade_curadoria',
        'status_curadoria',
        'liberacao_editorial',
        'tempo_estimado_min',
        'trecho_inicial',
        'criado_em'
      ])
  });


/* =========================================================
   PREPARAÇÃO CENTRAL
========================================================= */

function prepararPacoteEditorialCentralV01120_(
  ss,
  contexto,
  idEnvio
) {
  validarPermissaoEditoracaoV01111_(
    contexto
  );

  idEnvio =
    textoPacoteCentralV01120_(
      idEnvio
    );

  if (!idEnvio) {
    throw new Error(
      'ID do envio editorial ausente.'
    );
  }

  const lock =
    LockService.getScriptLock();

  lock.waitLock(20000);

  try {
    const abaCentral =
      garantirAbaEditoracaoCentralV01111_(
        ss
      );

    const job =
      lerJobsEditoracaoCentralV01111_(
        abaCentral
      ).find(function(item) {
        return item.id === idEnvio;
      });

    if (!job) {
      throw new Error(
        'Envio editorial não encontrado: ' +
        idEnvio
      );
    }

    if (job.status !== 'concluido') {
      throw new Error(
        'Somente envios concluídos podem preparar pacote editorial.'
      );
    }

    const questionIds =
      normalizarSnapshotPacoteCentralV01120_(
        job.questionIds,
        job.quantidadeItens
      );

    const abaPacotes =
      garantirAbaPacotesCentraisV01120_(
        ss
      );

    const abaItens =
      garantirAbaItensPacotesCentraisV01120_(
        ss
      );

    const pacoteExistente =
      obterPacoteCentralPorEnvioV01120_(
        abaPacotes,
        idEnvio
      );

    if (pacoteExistente) {
      validarItensPacoteExistenteV01120_(
        abaItens,
        pacoteExistente,
        questionIds
      );

      return respostaPacoteCentralV01120_(
        pacoteExistente,
        true
      );
    }

    const preparado =
      montarPacoteCentralV01120_(
        ss,
        contexto,
        job,
        questionIds
      );

    persistirItensPacoteCentralV01120_(
      abaItens,
      preparado.pacote,
      preparado.itens
    );

    persistirPacoteCentralV01120_(
      abaPacotes,
      preparado.pacote
    );

    return respostaPacoteCentralV01120_(
      preparado.pacote,
      false
    );
  } finally {
    lock.releaseLock();
  }
}


/* =========================================================
   SNAPSHOT
========================================================= */

function normalizarSnapshotPacoteCentralV01120_(
  ids,
  quantidadeEsperada
) {
  if (!Array.isArray(ids)) {
    throw new Error(
      'Snapshot editorial inválido.'
    );
  }

  const normalizados =
    ids.map(function(id) {
      return textoPacoteCentralV01120_(id);
    });

  if (
    !normalizados.length ||
    normalizados.some(function(id) {
      return !id;
    })
  ) {
    throw new Error(
      'O snapshot editorial está vazio ou contém IDs inválidos.'
    );
  }

  if (
    new Set(normalizados).size !==
    normalizados.length
  ) {
    throw new Error(
      'O snapshot editorial contém questões duplicadas.'
    );
  }

  if (
    Number(quantidadeEsperada || 0) !==
    normalizados.length
  ) {
    throw new Error(
      'A quantidade do envio diverge do snapshot editorial.'
    );
  }

  return normalizados;
}


/* =========================================================
   ENRIQUECIMENTO
========================================================= */

function montarPacoteCentralV01120_(
  ss,
  contexto,
  job,
  questionIds
) {
  const abaQuestoes =
    ss.getSheetByName(
      'QUESTOES_GERAL'
    );

  if (
    !abaQuestoes ||
    abaQuestoes.getLastRow() < 2
  ) {
    throw new Error(
      'A aba QUESTOES_GERAL não foi encontrada ou está vazia.'
    );
  }

  const dados =
    abaQuestoes
      .getDataRange()
      .getValues();

  const idx =
    indexarPacoteCentralV01120_(
      dados[0]
    );

  validarCamposQuestoesPacoteCentralV01120_(
    idx
  );

  const mapaQuestoes =
    new Map();

  const idsDuplicados =
    new Set();

  dados
    .slice(1)
    .forEach(function(linha) {
      const id =
        valorPacoteCentralV01120_(
          linha,
          idx,
          'id_ocorrencia'
        );

      if (id) {
        if (mapaQuestoes.has(id)) {
          idsDuplicados.add(id);
          return;
        }

        mapaQuestoes.set(id, linha);
      }
    });

  if (idsDuplicados.size) {
    const lista =
      Array.from(idsDuplicados);

    const exibidos =
      lista.slice(0, 20);

    const complemento =
      lista.length > exibidos.length
        ? ' (e mais ' +
          (lista.length - exibidos.length) +
          ')'
        : '';

    throw new Error(
      'IDs duplicados encontrados em QUESTOES_GERAL: ' +
      exibidos.join(', ') +
      complemento
    );
  }

  const ausentes =
    questionIds.filter(function(id) {
      return !mapaQuestoes.has(id);
    });

  if (ausentes.length) {
    throw new Error(
      'Questões do snapshot não encontradas em QUESTOES_GERAL: ' +
      ausentes.slice(0, 20).join(', ')
    );
  }

  const fontes =
    obterFontesEmLotesPacoteCentralV01120_(
      ss,
      questionIds
    );

  const fontesPorId =
    new Map(
      fontes.map(function(fonte) {
        return [
          textoPacoteCentralV01120_(
            fonte.idQuestao
          ),
          fonte
        ];
      })
    );

  const agora =
    new Date();

  const idProjeto =
    derivarIdProjetoPacoteCentralV01120_(
      job.id
    );

  let fontesIncompletas = 0;
  let gabaritosIncompletos = 0;
  let itensNaoLiberados = 0;

  const itens =
    questionIds.map(function(
      idQuestao,
      indice
    ) {
      const linha =
        mapaQuestoes.get(idQuestao);

      const componente =
        valorPacoteCentralV01120_(
          linha,
          idx,
          'componente_principal'
        );

      const area =
        valorPacoteCentralV01120_(
          linha,
          idx,
          'area'
        ) ||
        inferirAreaFonteOfflineV01115_(
          idQuestao,
          componente
        );

      const fonte =
        fontesPorId.get(idQuestao) ||
        {
          colecaoOrigem: '',
          paginaPdf: null,
          nomePublico: '',
          urlPdf: '',
          urlPagina: '',
          disponivel: false,
          motivo:
            'Fonte não retornada pelo resolvedor.'
        };

      const paginaAusente =
        fonte.paginaPdf === null ||
        fonte.paginaPdf === undefined ||
        textoPacoteCentralV01120_(
          fonte.paginaPdf
        ) === '';

      const fonteCompleta =
        fonte.disponivel === true &&
        !paginaAusente;

      if (!fonteCompleta) {
        fontesIncompletas += 1;
      }

      const gabaritoOficial =
        valorPacoteCentralV01120_(
          linha,
          idx,
          'gabarito_oficial'
        ).toUpperCase();

      if (
        !/^[A-E]$/.test(
          gabaritoOficial
        )
      ) {
        gabaritosIncompletos += 1;
      }

      const statusValidacao =
        valorPacoteCentralV01120_(
          linha,
          idx,
          'status_validacao'
        );

      const maturidade =
        valorPacoteCentralV01120_(
          linha,
          idx,
          'maturidade_curadoria'
        );

      const liberacao =
        determinarLiberacaoPacoteCentralV01120_(
          statusValidacao,
          maturidade
        );

      if (
        liberacao !== 'Liberada' &&
        liberacao !==
          'Liberada com revisão'
      ) {
        itensNaoLiberados += 1;
      }

      return {
        idItemPacote:
          Utilities.getUuid(),
        idEnvio:
          job.id,
        idProjeto:
          idProjeto,
        idSequencia:
          job.sequenceId,
        ordem:
          indice + 1,
        idQuestao:
          idQuestao,
        area:
          area,
        componente:
          componente,
        competencia:
          valorPacoteCentralV01120_(
            linha,
            idx,
            'competencia'
          ),
        habilidade:
          valorPacoteCentralV01120_(
            linha,
            idx,
            'habilidade'
          ),
        objetoPrincipal:
          valorPacoteCentralV01120_(
            linha,
            idx,
            'objeto_principal'
          ),
        acaoCognitiva:
          valorPacoteCentralV01120_(
            linha,
            idx,
            'acao_cognitiva_especifica'
          ),
        dificuldade:
          valorPacoteCentralV01120_(
            linha,
            idx,
            'dificuldade_rotulo'
          ),
        dificuldadeFaixa:
          valorOriginalPacoteCentralV01120_(
            linha,
            idx,
            'dificuldade_faixa'
          ),
        funcaoPedagogica:
          valorPacoteCentralV01120_(
            linha,
            idx,
            'funcao_pedagogica_sugerida'
          ),
        gabaritoOficial:
          gabaritoOficial,
        ano:
          valorPacoteCentralV01120_(
            linha,
            idx,
            'ano'
          ),
        edicao:
          valorPacoteCentralV01120_(
            linha,
            idx,
            'edicao'
          ),
        colecaoOrigem:
          fonte.colecaoOrigem ||
          valorPacoteCentralV01120_(
            linha,
            idx,
            'colecao_origem'
          ),
        paginaPdf:
          fonte.paginaPdf,
        nomePublicoFonte:
          fonte.nomePublico || '',
        urlPdf:
          fonte.urlPdf || '',
        urlPagina:
          fonte.urlPagina || '',
        disponibilidadeFonte:
          fonte.disponivel === true,
        paginaLocalizada:
          !paginaAusente,
        motivoFonte:
          fonteCompleta
            ? ''
            : (
                fonte.motivo ||
                (paginaAusente
                  ? 'Página da questão não localizada.'
                  : 'Fonte indisponível.')
              ),
        statusValidacao:
          statusValidacao,
        maturidadeCuradoria:
          maturidade,
        statusCuradoria:
          valorPacoteCentralV01120_(
            linha,
            idx,
            'status_curadoria'
          ),
        liberacaoEditorial:
          liberacao,
        tempoEstimadoMin:
          valorOriginalPacoteCentralV01120_(
            linha,
            idx,
            'tempo_estimado_min'
          ),
        trechoInicial:
          valorPacoteCentralV01120_(
            linha,
            idx,
            'trecho_inicial'
          ),
        criadoEm:
          agora
      };
    });

  const possuiPendencias =
    fontesIncompletas > 0 ||
    gabaritosIncompletos > 0 ||
    itensNaoLiberados > 0;

  const usuario =
    contexto.user || {};

  return {
    pacote: {
      idEnvio:
        job.id,
      idProjeto:
        idProjeto,
      idSequencia:
        job.sequenceId,
      titulo:
        job.titulo,
      descricao:
        job.descricao,
      questionIds:
        questionIds.slice(),
      quantidadeQuestoes:
        questionIds.length,
      fontesIncompletas:
        fontesIncompletas,
      gabaritosIncompletos:
        gabaritosIncompletos,
      itensNaoLiberados:
        itensNaoLiberados,
      statusPacote:
        possuiPendencias
          ? 'Preparado com pendências'
          : 'Preparado',
      criadoEm:
        agora,
      criadoPor:
        textoPacoteCentralV01120_(
          usuario.emailAutenticacao ||
          usuario.email
        )
    },
    itens:
      itens
  };
}


function obterFontesEmLotesPacoteCentralV01120_(
  ss,
  questionIds
) {
  const fontes = [];

  for (
    let inicio = 0;
    inicio < questionIds.length;
    inicio += 500
  ) {
    const lote =
      questionIds.slice(
        inicio,
        inicio + 500
      );

    const resolvidas =
      obterFontesQuestoesOfflineV01115_(
        ss,
        lote
      );

    resolvidas.forEach(function(fonte) {
      fontes.push(fonte);
    });
  }

  return fontes;
}


/* =========================================================
   LIBERAÇÃO EDITORIAL
========================================================= */

function determinarLiberacaoPacoteCentralV01120_(
  statusValidacao,
  maturidade
) {
  const status =
    textoPacoteCentralV01120_(
      statusValidacao
    );

  const mat =
    textoPacoteCentralV01120_(
      maturidade
    );

  if (
    status === 'Homologada' ||
    mat === 'Homologada' ||
    status === 'Validada por docente' ||
    status === 'Validada por docentes' ||
    mat === 'Validada por docente'
  ) {
    return 'Liberada';
  }

  if (
    status === 'Divergência resolvida' ||
    status === 'Resolvida pela coordenação' ||
    mat === 'Ajustada pela coordenação'
  ) {
    return 'Liberada com revisão';
  }

  if (
    status === 'Com divergência aberta' ||
    status === 'Aguardando nova avaliação' ||
    status === 'Suspensa pela coordenação' ||
    mat === 'Com divergência' ||
    mat === 'Suspensa'
  ) {
    return 'Bloqueada';
  }

  return 'Aguardando validação';
}


/* =========================================================
   IDEMPOTÊNCIA E PERSISTÊNCIA
========================================================= */

function obterPacoteCentralPorEnvioV01120_(
  aba,
  idEnvio
) {
  if (aba.getLastRow() < 2) {
    return null;
  }

  const dados =
    aba.getDataRange().getValues();

  const idx =
    indexarPacoteCentralV01120_(
      dados[0]
    );

  const linhas =
    dados.slice(1).filter(function(row) {
      return (
        textoPacoteCentralV01120_(
          row[idx.id_envio]
        ) === idEnvio
      );
    });

  if (!linhas.length) {
    return null;
  }

  if (linhas.length > 1) {
    throw new Error(
      'Mais de um resumo de pacote central foi encontrado para o id_envio: ' +
      idEnvio
    );
  }

  const linha =
    linhas[0];

  const idProjetoEsperado =
    derivarIdProjetoPacoteCentralV01120_(
      idEnvio
    );

  const idProjetoPersistido =
    textoPacoteCentralV01120_(
      linha[idx.id_projeto]
    );

  if (
    idProjetoPersistido !==
    idProjetoEsperado
  ) {
    throw new Error(
      'O idProjeto do resumo central diverge do id_envio: ' +
      idEnvio
    );
  }

  let questionIds = [];

  try {
    const parsed =
      JSON.parse(
        String(
          linha[
            idx.ids_questoes_json
          ] || '[]'
        )
      );

    questionIds =
      Array.isArray(parsed)
        ? parsed.map(String)
        : [];
  } catch (error) {
    throw new Error(
      'Snapshot persistido do pacote central é inválido.'
    );
  }

  return {
    idEnvio:
      textoPacoteCentralV01120_(
        linha[idx.id_envio]
      ),
    idProjeto:
      idProjetoPersistido,
    idSequencia:
      textoPacoteCentralV01120_(
        linha[idx.id_sequencia]
      ),
    titulo:
      textoPacoteCentralV01120_(
        linha[idx.titulo]
      ),
    descricao:
      textoPacoteCentralV01120_(
        linha[idx.descricao]
      ),
    questionIds:
      questionIds,
    quantidadeQuestoes:
      Number(
        linha[idx.quantidade_questoes] ||
        0
      ),
    fontesIncompletas:
      Number(
        linha[idx.fontes_incompletas] ||
        0
      ),
    gabaritosIncompletos:
      Number(
        linha[idx.gabaritos_incompletos] ||
        0
      ),
    itensNaoLiberados:
      Number(
        linha[idx.itens_nao_liberados] ||
        0
      ),
    statusPacote:
      textoPacoteCentralV01120_(
        linha[idx.status_pacote]
      ),
    criadoEm:
      linha[idx.criado_em],
    criadoPor:
      textoPacoteCentralV01120_(
        linha[idx.criado_por]
      )
  };
}


function validarItensPacoteExistenteV01120_(
  abaItens,
  pacote,
  questionIds
) {
  const idProjetoEsperado =
    derivarIdProjetoPacoteCentralV01120_(
      pacote.idEnvio
    );

  if (
    pacote.idProjeto !==
    idProjetoEsperado
  ) {
    throw new Error(
      'O idProjeto do pacote central diverge do id_envio: ' +
      pacote.idEnvio
    );
  }

  const itens =
    lerItensPorEnvioPacoteCentralV01120_(
      abaItens,
      pacote.idEnvio
    );

  if (
    pacote.quantidadeQuestoes !==
      questionIds.length ||
    pacote.questionIds.length !==
      questionIds.length ||
    itens.length !==
      questionIds.length
  ) {
    throw new Error(
      'Pacote central existente possui quantidade inconsistente.'
    );
  }

  for (
    let i = 0;
    i < questionIds.length;
    i += 1
  ) {
    if (
      pacote.questionIds[i] !==
        questionIds[i] ||
      itens[i].idQuestao !==
        questionIds[i] ||
      itens[i].ordem !==
        i + 1 ||
      itens[i].idProjeto !==
        idProjetoEsperado
    ) {
      throw new Error(
        'Pacote central existente diverge da ordem do snapshot.'
      );
    }
  }
}


function persistirItensPacoteCentralV01120_(
  aba,
  pacote,
  itens
) {
  const idProjetoEsperado =
    derivarIdProjetoPacoteCentralV01120_(
      pacote.idEnvio
    );

  if (
    pacote.idProjeto !==
    idProjetoEsperado ||
    itens.some(function(item) {
      return (
        item.idProjeto !==
        idProjetoEsperado
      );
    })
  ) {
    throw new Error(
      'O idProjeto dos itens diverge do id_envio: ' +
      pacote.idEnvio
    );
  }

  const existentes =
    lerItensPorEnvioPacoteCentralV01120_(
      aba,
      pacote.idEnvio
    );

  if (existentes.length) {
    if (
      existentes.length !==
      itens.length
    ) {
      throw new Error(
        'Itens parciais já existem para este envio editorial.'
      );
    }

    for (
      let i = 0;
      i < itens.length;
      i += 1
    ) {
      if (
        existentes[i].idQuestao !==
          itens[i].idQuestao ||
        existentes[i].ordem !==
          itens[i].ordem ||
        existentes[i].idProjeto !==
          idProjetoEsperado
      ) {
        throw new Error(
          'Itens existentes divergem do snapshot editorial.'
        );
      }
    }

    return;
  }

  const linhas =
    itens.map(function(item) {
      return [
        item.idItemPacote,
        item.idEnvio,
        item.idProjeto,
        item.idSequencia,
        item.ordem,
        item.idQuestao,
        item.area,
        item.componente,
        item.competencia,
        item.habilidade,
        item.objetoPrincipal,
        item.acaoCognitiva,
        item.dificuldade,
        item.dificuldadeFaixa,
        item.funcaoPedagogica,
        item.gabaritoOficial,
        item.ano,
        item.edicao,
        item.colecaoOrigem,
        item.paginaPdf,
        item.nomePublicoFonte,
        item.urlPdf,
        item.urlPagina,
        item.disponibilidadeFonte,
        item.paginaLocalizada,
        item.motivoFonte,
        item.statusValidacao,
        item.maturidadeCuradoria,
        item.statusCuradoria,
        item.liberacaoEditorial,
        item.tempoEstimadoMin,
        item.trechoInicial,
        item.criadoEm
      ];
    });

  aba.getRange(
    aba.getLastRow() + 1,
    1,
    linhas.length,
    NAVE_PACOTE_EDITORIAL_CENTRAL_V01120
      .CABECALHOS_ITENS.length
  ).setValues(linhas);
}


function persistirPacoteCentralV01120_(
  aba,
  pacote
) {
  const idProjetoEsperado =
    derivarIdProjetoPacoteCentralV01120_(
      pacote.idEnvio
    );

  if (
    pacote.idProjeto !==
    idProjetoEsperado
  ) {
    throw new Error(
      'O idProjeto do resumo diverge do id_envio: ' +
      pacote.idEnvio
    );
  }

  aba.appendRow([
    pacote.idEnvio,
    pacote.idProjeto,
    pacote.idSequencia,
    pacote.titulo,
    pacote.descricao,
    JSON.stringify(
      pacote.questionIds
    ),
    pacote.quantidadeQuestoes,
    pacote.fontesIncompletas,
    pacote.gabaritosIncompletos,
    pacote.itensNaoLiberados,
    pacote.statusPacote,
    pacote.criadoEm,
    pacote.criadoPor
  ]);
}


function lerItensPorEnvioPacoteCentralV01120_(
  aba,
  idEnvio
) {
  if (aba.getLastRow() < 2) {
    return [];
  }

  const dados =
    aba.getDataRange().getValues();

  const idx =
    indexarPacoteCentralV01120_(
      dados[0]
    );

  return dados
    .slice(1)
    .filter(function(row) {
      return (
        textoPacoteCentralV01120_(
          row[idx.id_envio]
        ) === idEnvio
      );
    })
    .map(function(row) {
      return {
        ordem:
          Number(row[idx.ordem] || 0),
        idProjeto:
          textoPacoteCentralV01120_(
            row[idx.id_projeto]
          ),
        idQuestao:
          textoPacoteCentralV01120_(
            row[idx.id_questao]
          )
      };
    })
    .sort(function(a, b) {
      return a.ordem - b.ordem;
    });
}


/* =========================================================
   ABAS
========================================================= */

function garantirAbaPacotesCentraisV01120_(
  ss
) {
  return garantirAbaPacoteCentralV01120_(
    ss,
    NAVE_PACOTE_EDITORIAL_CENTRAL_V01120
      .ABA_PACOTES,
    NAVE_PACOTE_EDITORIAL_CENTRAL_V01120
      .CABECALHOS_PACOTES
  );
}


function garantirAbaItensPacotesCentraisV01120_(
  ss
) {
  return garantirAbaPacoteCentralV01120_(
    ss,
    NAVE_PACOTE_EDITORIAL_CENTRAL_V01120
      .ABA_ITENS,
    NAVE_PACOTE_EDITORIAL_CENTRAL_V01120
      .CABECALHOS_ITENS
  );
}


function garantirAbaPacoteCentralV01120_(
  ss,
  nome,
  headers
) {
  let aba =
    ss.getSheetByName(nome);

  if (!aba) {
    aba = ss.insertSheet(nome);
  }

  if (aba.getLastRow() === 0) {
    aba.getRange(
      1,
      1,
      1,
      headers.length
    ).setValues([
      headers.slice()
    ]);

    aba.setFrozenRows(1);
    return aba;
  }

  const atuais =
    aba.getRange(
      1,
      1,
      1,
      headers.length
    ).getDisplayValues()[0];

  const divergente =
    headers.some(function(
      header,
      indice
    ) {
      return (
        textoPacoteCentralV01120_(
          atuais[indice]
        ) !== header
      );
    });

  if (divergente) {
    throw new Error(
      'Cabeçalho incompatível na aba ' +
      nome + '.'
    );
  }

  return aba;
}


/* =========================================================
   CONTRATO DE RETORNO
========================================================= */

function respostaPacoteCentralV01120_(
  pacote,
  reutilizado
) {
  return {
    idEnvio:
      pacote.idEnvio,
    idProjeto:
      pacote.idProjeto,
    quantidadeQuestoes:
      pacote.quantidadeQuestoes,
    fontesIncompletas:
      pacote.fontesIncompletas,
    gabaritosIncompletos:
      pacote.gabaritosIncompletos,
    itensNaoLiberados:
      pacote.itensNaoLiberados,
    statusPacote:
      pacote.statusPacote,
    reutilizado:
      reutilizado === true
  };
}


/* =========================================================
   VALIDAÇÃO E UTILITÁRIOS
========================================================= */

function derivarIdProjetoPacoteCentralV01120_(
  idEnvio
) {
  const idNormalizado =
    textoPacoteCentralV01120_(idEnvio)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toUpperCase();

  if (!idNormalizado) {
    throw new Error(
      'Não foi possível derivar idProjeto sem id_envio válido.'
    );
  }

  return 'PEC_' + idNormalizado;
}

function validarCamposQuestoesPacoteCentralV01120_(
  idx
) {
  const obrigatorios = [
    'id_ocorrencia',
    'componente_principal',
    'competencia',
    'habilidade',
    'objeto_principal',
    'dificuldade_rotulo',
    'funcao_pedagogica_sugerida',
    'gabarito_oficial',
    'ano',
    'edicao',
    'colecao_origem',
    'pagina_pdf',
    'status_validacao',
    'maturidade_curadoria'
  ];

  const ausentes =
    obrigatorios.filter(function(campo) {
      return idx[campo] === undefined;
    });

  if (ausentes.length) {
    throw new Error(
      'Campos obrigatórios ausentes em QUESTOES_GERAL: ' +
      ausentes.join(', ')
    );
  }
}


function indexarPacoteCentralV01120_(
  headers
) {
  return headers.reduce(
    function(mapa, header, indice) {
      const chave =
        textoPacoteCentralV01120_(
          header
        );

      if (chave) {
        mapa[chave] = indice;
      }

      return mapa;
    },
    {}
  );
}


function valorPacoteCentralV01120_(
  linha,
  idx,
  campo
) {
  return textoPacoteCentralV01120_(
    valorOriginalPacoteCentralV01120_(
      linha,
      idx,
      campo
    )
  );
}


function valorOriginalPacoteCentralV01120_(
  linha,
  idx,
  campo
) {
  if (idx[campo] === undefined) {
    return '';
  }

  return linha[idx[campo]];
}


function textoPacoteCentralV01120_(
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
