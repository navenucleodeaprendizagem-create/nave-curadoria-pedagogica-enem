/**
 * NAVE | EXPORTAÇÃO EDITORIAL CENTRAL — V0.12.00
 *
 * Projeta PACOTES_EDITORIAIS_CENTRAIS + ITENS_PACOTES_CENTRAIS
 * no contrato técnico do CSV editorial central, exclusivamente em memória.
 * Não cria arquivos, não escreve em abas e não gera PDFs.
 */

const NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01200 = Object.freeze({
  SCHEMA_VERSION: 'NAVE_EDITORIAL_CENTRAL_V1',
  ABA_PACOTES: 'PACOTES_EDITORIAIS_CENTRAIS',
  ABA_ITENS: 'ITENS_PACOTES_CENTRAIS',
  MODOS: Object.freeze({
    DIAGNOSTICO: 'DIAGNOSTICO',
    FINAL: 'FINAL'
  }),
  LIBERACOES_FINAIS: Object.freeze([
    'Liberada',
    'Liberada com revisão'
  ]),
  CABECALHOS: Object.freeze([
    'schema_version',
    'id_envio',
    'id_projeto',
    'id_sequencia',
    'titulo',
    'descricao',
    'quantidade_questoes',
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
    'tempo_estimado_min',
    'gabarito_oficial',
    'ano',
    'edicao',
    'colecao_origem',
    'nome_publico_fonte',
    'url_pdf',
    'id_arquivo_drive',
    'pagina_pdf',
    'disponibilidade_fonte',
    'pagina_localizada',
    'motivo_fonte',
    'status_validacao',
    'maturidade_curadoria',
    'liberacao_editorial',
    'crop_x',
    'crop_y',
    'crop_w',
    'crop_h',
    'status_recorte',
    'trecho_inicial',
    'fontes_incompletas',
    'gabaritos_incompletos',
    'itens_nao_liberados',
    'status_pacote',
    'exportado_em',
    'exportado_por'
  ])
});


/**
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string|{idEnvio?: string, idProjeto?: string}} referencia
 * @param {'DIAGNOSTICO'|'FINAL'} modo
 * @param {{exportadoEm?: Date, exportadoPor?: string}=} contexto
 * @return {{schemaVersion:string, modo:string, pacote:Object,
 *   headers:string[], rows:Object[], matrix:Array<Array<*>>,
 *   pendencias:Object, consistenciaResumo:Object}}
 */
function montarExportacaoEditorialCentralV01200_(
  ss,
  referencia,
  modo,
  contexto
) {
  modo = normalizarModoExportacaoCentralV01200_(modo);
  contexto = contexto || {};

  const abaPacotes = exigirAbaExportacaoCentralV01200_(
    ss,
    NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01200.ABA_PACOTES
  );
  const abaItens = exigirAbaExportacaoCentralV01200_(
    ss,
    NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01200.ABA_ITENS
  );

  const dadosPacotes = abaPacotes.getDataRange().getValues();
  const dadosItens = abaItens.getDataRange().getValues();

  const idxPacotes = indexarExportacaoCentralV01200_(dadosPacotes[0]);
  const idxItens = indexarExportacaoCentralV01200_(dadosItens[0]);

  validarCabecalhosExportacaoCentralV01200_(idxPacotes, [
    'id_envio', 'id_projeto', 'id_sequencia', 'titulo', 'descricao',
    'ids_questoes_json', 'quantidade_questoes', 'fontes_incompletas',
    'gabaritos_incompletos', 'itens_nao_liberados', 'status_pacote'
  ], NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01200.ABA_PACOTES);

  validarCabecalhosExportacaoCentralV01200_(idxItens, [
    'id_envio', 'id_projeto', 'id_sequencia', 'ordem', 'id_questao',
    'area', 'componente', 'competencia', 'habilidade', 'objeto_principal',
    'acao_cognitiva', 'dificuldade', 'dificuldade_faixa',
    'funcao_pedagogica', 'tempo_estimado_min', 'gabarito_oficial',
    'ano', 'edicao', 'colecao_origem', 'nome_publico_fonte', 'url_pdf',
    'pagina_pdf', 'disponibilidade_fonte', 'pagina_localizada',
    'motivo_fonte', 'status_validacao', 'maturidade_curadoria',
    'liberacao_editorial', 'trecho_inicial'
  ], NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01200.ABA_ITENS);

  const pacote = localizarPacoteExportacaoCentralV01200_(
    dadosPacotes.slice(1),
    idxPacotes,
    referencia
  );

  const itens = dadosItens.slice(1)
    .filter(function(linha) {
      return textoExportacaoCentralV01200_(linha[idxItens.id_envio]) === pacote.idEnvio;
    })
    .map(function(linha) {
      return lerItemExportacaoCentralV01200_(linha, idxItens);
    })
    .sort(function(a, b) {
      return a.ordem - b.ordem;
    });

  validarEstruturaExportacaoCentralV01200_(pacote, itens);

  const pendencias = avaliarPendenciasExportacaoCentralV01200_(itens);
  const consistenciaResumo = avaliarConsistenciaResumoExportacaoCentralV01200_(
    pacote,
    itens
  );

  if (modo === NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01200.MODOS.FINAL) {
    bloquearInconsistenciaResumoExportacaoCentralV01200_(consistenciaResumo);
    bloquearPendenciasFinaisExportacaoCentralV01200_(pendencias);
  }

  const exportadoEm = contexto.exportadoEm || new Date();
  const exportadoPor = textoExportacaoCentralV01200_(contexto.exportadoPor);

  const rows = itens.map(function(item) {
    return montarLinhaExportacaoCentralV01200_(
      pacote,
      item,
      exportadoEm,
      exportadoPor
    );
  });

  const headers = Array.from(
    NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01200.CABECALHOS
  );

  return {
    schemaVersion: NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01200.SCHEMA_VERSION,
    modo: modo,
    pacote: pacote,
    headers: headers,
    rows: rows,
    matrix: [headers].concat(rows.map(function(row) {
      return headers.map(function(header) {
        return row[header];
      });
    })),
    pendencias: pendencias,
    consistenciaResumo: consistenciaResumo
  };
}


function localizarPacoteExportacaoCentralV01200_(linhas, idx, referencia) {
  let campo = '';
  let valor = '';

  if (referencia && typeof referencia === 'object') {
    const idEnvio = textoExportacaoCentralV01200_(referencia.idEnvio);
    const idProjeto = textoExportacaoCentralV01200_(referencia.idProjeto);

    if ((idEnvio && idProjeto) || (!idEnvio && !idProjeto)) {
      throw new Error('Informe exatamente um identificador: idEnvio ou idProjeto.');
    }

    campo = idEnvio ? 'id_envio' : 'id_projeto';
    valor = idEnvio || idProjeto;
  } else {
    valor = textoExportacaoCentralV01200_(referencia);
  }

  if (!valor) {
    throw new Error('Identificador do pacote central ausente.');
  }

  const encontradas = linhas.filter(function(linha) {
    if (campo) {
      return textoExportacaoCentralV01200_(linha[idx[campo]]) === valor;
    }

    return textoExportacaoCentralV01200_(linha[idx.id_envio]) === valor ||
      textoExportacaoCentralV01200_(linha[idx.id_projeto]) === valor;
  });

  if (!encontradas.length) {
    throw new Error('Pacote editorial central não encontrado: ' + valor);
  }

  if (encontradas.length !== 1) {
    throw new Error('Mais de um pacote editorial central corresponde ao identificador: ' + valor);
  }

  const linha = encontradas[0];
  let questionIds;

  try {
    questionIds = JSON.parse(String(linha[idx.ids_questoes_json] || '[]'));
  } catch (error) {
    throw new Error('Snapshot do pacote editorial central é inválido.');
  }

  if (!Array.isArray(questionIds)) {
    throw new Error('Snapshot do pacote editorial central não é uma lista.');
  }

  return {
    idEnvio: textoExportacaoCentralV01200_(linha[idx.id_envio]),
    idProjeto: textoExportacaoCentralV01200_(linha[idx.id_projeto]),
    idSequencia: textoExportacaoCentralV01200_(linha[idx.id_sequencia]),
    titulo: textoExportacaoCentralV01200_(linha[idx.titulo]),
    descricao: textoExportacaoCentralV01200_(linha[idx.descricao]),
    questionIds: questionIds.map(textoExportacaoCentralV01200_),
    quantidadeQuestoes: Number(linha[idx.quantidade_questoes] || 0),
    fontesIncompletas: Number(linha[idx.fontes_incompletas] || 0),
    gabaritosIncompletos: Number(linha[idx.gabaritos_incompletos] || 0),
    itensNaoLiberados: Number(linha[idx.itens_nao_liberados] || 0),
    statusPacote: textoExportacaoCentralV01200_(linha[idx.status_pacote])
  };
}


function lerItemExportacaoCentralV01200_(linha, idx) {
  function valor(campo) {
    return idx[campo] === undefined ? '' : linha[idx[campo]];
  }

  return {
    idEnvio: textoExportacaoCentralV01200_(valor('id_envio')),
    idProjeto: textoExportacaoCentralV01200_(valor('id_projeto')),
    idSequencia: textoExportacaoCentralV01200_(valor('id_sequencia')),
    ordem: Number(valor('ordem') || 0),
    idQuestao: textoExportacaoCentralV01200_(valor('id_questao')),
    area: textoExportacaoCentralV01200_(valor('area')),
    componente: textoExportacaoCentralV01200_(valor('componente')),
    competencia: textoExportacaoCentralV01200_(valor('competencia')),
    habilidade: textoExportacaoCentralV01200_(valor('habilidade')),
    objetoPrincipal: textoExportacaoCentralV01200_(valor('objeto_principal')),
    acaoCognitiva: textoExportacaoCentralV01200_(valor('acao_cognitiva')),
    dificuldade: textoExportacaoCentralV01200_(valor('dificuldade')),
    dificuldadeFaixa: valor('dificuldade_faixa'),
    funcaoPedagogica: textoExportacaoCentralV01200_(valor('funcao_pedagogica')),
    tempoEstimadoMin: valor('tempo_estimado_min'),
    gabaritoOficial: textoExportacaoCentralV01200_(valor('gabarito_oficial')).toUpperCase(),
    ano: textoExportacaoCentralV01200_(valor('ano')),
    edicao: textoExportacaoCentralV01200_(valor('edicao')),
    colecaoOrigem: textoExportacaoCentralV01200_(valor('colecao_origem')),
    nomePublicoFonte: textoExportacaoCentralV01200_(valor('nome_publico_fonte')),
    urlPdf: textoExportacaoCentralV01200_(valor('url_pdf')),
    paginaPdf: valor('pagina_pdf'),
    disponibilidadeFonte: booleanoExportacaoCentralV01200_(valor('disponibilidade_fonte')),
    paginaLocalizada: booleanoExportacaoCentralV01200_(valor('pagina_localizada')),
    motivoFonte: textoExportacaoCentralV01200_(valor('motivo_fonte')),
    statusValidacao: textoExportacaoCentralV01200_(valor('status_validacao')),
    maturidadeCuradoria: textoExportacaoCentralV01200_(valor('maturidade_curadoria')),
    liberacaoEditorial: textoExportacaoCentralV01200_(valor('liberacao_editorial')),
    trechoInicial: textoExportacaoCentralV01200_(valor('trecho_inicial'))
  };
}


function validarEstruturaExportacaoCentralV01200_(pacote, itens) {
  if (!pacote.idEnvio || !pacote.idProjeto) {
    throw new Error('Pacote central sem id_envio ou id_projeto.');
  }

  if (pacote.quantidadeQuestoes !== itens.length ||
      pacote.questionIds.length !== itens.length) {
    throw new Error('Quantidade dos itens diverge do resumo ou do snapshot central.');
  }

  const ids = new Set();

  itens.forEach(function(item, indice) {
    if (item.idEnvio !== pacote.idEnvio || item.idProjeto !== pacote.idProjeto) {
      throw new Error('Item não pertence ao id_envio/id_projeto do pacote central: ' + item.idQuestao);
    }

    if (item.idSequencia !== pacote.idSequencia) {
      throw new Error('Item não pertence à sequência do pacote central: ' + item.idQuestao);
    }

    if (item.ordem !== indice + 1) {
      throw new Error('Ordem editorial deve ser contínua de 1 a N. Posição inválida: ' + item.ordem);
    }

    if (!item.idQuestao) {
      throw new Error('Item sem id_questao na ordem ' + item.ordem + '.');
    }

    if (ids.has(item.idQuestao)) {
      throw new Error('ID de questão duplicado no pacote central: ' + item.idQuestao);
    }
    ids.add(item.idQuestao);

    if (pacote.questionIds[indice] !== item.idQuestao) {
      throw new Error('Ordem ou ID dos itens diverge do snapshot central na posição ' + (indice + 1) + '.');
    }
  });
}


function avaliarPendenciasExportacaoCentralV01200_(itens) {
  const pendencias = {
    fontesIndisponiveis: [],
    paginasNaoLocalizadas: [],
    paginasAusentes: [],
    gabaritosInvalidos: [],
    itensNaoLiberados: []
  };

  itens.forEach(function(item) {
    if (item.disponibilidadeFonte !== true) {
      pendencias.fontesIndisponiveis.push(item.idQuestao);
    }
    if (item.paginaLocalizada !== true) {
      pendencias.paginasNaoLocalizadas.push(item.idQuestao);
    }
    if (textoExportacaoCentralV01200_(item.paginaPdf) === '') {
      pendencias.paginasAusentes.push(item.idQuestao);
    }
    if (!/^[A-E]$/.test(item.gabaritoOficial)) {
      pendencias.gabaritosInvalidos.push(item.idQuestao);
    }
    if (!NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01200.LIBERACOES_FINAIS
      .includes(item.liberacaoEditorial)) {
      pendencias.itensNaoLiberados.push(item.idQuestao);
    }
  });

  pendencias.total = Object.keys(pendencias).reduce(function(total, chave) {
    return total + (Array.isArray(pendencias[chave]) ? pendencias[chave].length : 0);
  }, 0);

  return pendencias;
}


function avaliarConsistenciaResumoExportacaoCentralV01200_(pacote, itens) {
  const recalculados = {
    fontes_incompletas: itens.filter(function(item) {
      return item.disponibilidadeFonte !== true || item.paginaLocalizada !== true;
    }).length,
    gabaritos_incompletos: itens.filter(function(item) {
      return !/^[A-E]$/.test(item.gabaritoOficial);
    }).length,
    itens_nao_liberados: itens.filter(function(item) {
      return !NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01200.LIBERACOES_FINAIS
        .includes(item.liberacaoEditorial);
    }).length
  };

  const persistidos = {
    fontes_incompletas: pacote.fontesIncompletas,
    gabaritos_incompletos: pacote.gabaritosIncompletos,
    itens_nao_liberados: pacote.itensNaoLiberados
  };

  const divergencias = Object.keys(recalculados)
    .filter(function(contador) {
      return persistidos[contador] !== recalculados[contador];
    })
    .map(function(contador) {
      return {
        contador: contador,
        persistido: persistidos[contador],
        recalculado: recalculados[contador]
      };
    });

  return {
    ok: divergencias.length === 0,
    persistidos: persistidos,
    recalculados: recalculados,
    divergencias: divergencias
  };
}


function bloquearInconsistenciaResumoExportacaoCentralV01200_(consistencia) {
  if (consistencia.ok) return;

  throw new Error(
    'Exportação FINAL bloqueada: contadores do resumo divergem dos itens. ' +
    consistencia.divergencias.map(function(divergencia) {
      return divergencia.contador +
        ' (persistido: ' + divergencia.persistido +
        ', recalculado: ' + divergencia.recalculado + ')';
    }).join('; ')
  );
}


function bloquearPendenciasFinaisExportacaoCentralV01200_(pendencias) {
  const mensagens = [];
  const rotulos = {
    fontesIndisponiveis: 'fontes indisponíveis',
    paginasNaoLocalizadas: 'páginas não localizadas',
    paginasAusentes: 'pagina_pdf ausente',
    gabaritosInvalidos: 'gabaritos ausentes ou inválidos',
    itensNaoLiberados: 'itens não liberados'
  };

  Object.keys(rotulos).forEach(function(chave) {
    if (pendencias[chave].length) {
      mensagens.push(
        rotulos[chave] + ': ' + pendencias[chave].slice(0, 20).join(', ') +
        (pendencias[chave].length > 20
          ? ' (e mais ' + (pendencias[chave].length - 20) + ')'
          : '')
      );
    }
  });

  if (mensagens.length) {
    throw new Error(
      'Exportação FINAL bloqueada por pendências editoriais. ' + mensagens.join('; ')
    );
  }
}


function montarLinhaExportacaoCentralV01200_(pacote, item, exportadoEm, exportadoPor) {
  return {
    schema_version: NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01200.SCHEMA_VERSION,
    id_envio: pacote.idEnvio,
    id_projeto: pacote.idProjeto,
    id_sequencia: pacote.idSequencia,
    titulo: pacote.titulo,
    descricao: pacote.descricao,
    quantidade_questoes: pacote.quantidadeQuestoes,
    ordem: item.ordem,
    id_questao: item.idQuestao,
    area: item.area,
    componente: item.componente,
    competencia: item.competencia,
    habilidade: item.habilidade,
    objeto_principal: item.objetoPrincipal,
    acao_cognitiva: item.acaoCognitiva,
    dificuldade: item.dificuldade,
    dificuldade_faixa: item.dificuldadeFaixa,
    funcao_pedagogica: item.funcaoPedagogica,
    tempo_estimado_min: item.tempoEstimadoMin,
    gabarito_oficial: item.gabaritoOficial,
    ano: item.ano,
    edicao: item.edicao,
    colecao_origem: item.colecaoOrigem,
    nome_publico_fonte: item.nomePublicoFonte,
    url_pdf: item.urlPdf,
    id_arquivo_drive: extrairIdArquivoDriveExportacaoCentralV01200_(item.urlPdf),
    pagina_pdf: item.paginaPdf,
    disponibilidade_fonte: item.disponibilidadeFonte,
    pagina_localizada: item.paginaLocalizada,
    motivo_fonte: item.motivoFonte,
    status_validacao: item.statusValidacao,
    maturidade_curadoria: item.maturidadeCuradoria,
    liberacao_editorial: item.liberacaoEditorial,
    crop_x: '',
    crop_y: '',
    crop_w: '',
    crop_h: '',
    status_recorte: '',
    trecho_inicial: item.trechoInicial,
    fontes_incompletas: pacote.fontesIncompletas,
    gabaritos_incompletos: pacote.gabaritosIncompletos,
    itens_nao_liberados: pacote.itensNaoLiberados,
    status_pacote: pacote.statusPacote,
    exportado_em: exportadoEm,
    exportado_por: exportadoPor
  };
}


function extrairIdArquivoDriveExportacaoCentralV01200_(url) {
  const texto = String(url || '').trim();
  if (!texto) return '';

  if (!/^https?:\/\/(?:drive|docs)\.google\.com\//i.test(texto)) {
    return '';
  }

  const correspondencias = [
    texto.match(/\/d\/([A-Za-z0-9_-]+)/),
    texto.match(/[?&]id=([A-Za-z0-9_-]+)/),
    texto.match(/\/folders\/([A-Za-z0-9_-]+)/)
  ];

  for (let i = 0; i < correspondencias.length; i += 1) {
    if (correspondencias[i] && correspondencias[i][1]) {
      return correspondencias[i][1];
    }
  }

  return '';
}


function normalizarModoExportacaoCentralV01200_(modo) {
  const normalizado = textoExportacaoCentralV01200_(modo).toUpperCase();
  if (normalizado !== 'DIAGNOSTICO' && normalizado !== 'FINAL') {
    throw new Error('Modo inválido. Use DIAGNOSTICO ou FINAL.');
  }
  return normalizado;
}


function exigirAbaExportacaoCentralV01200_(ss, nome) {
  const aba = ss && ss.getSheetByName(nome);
  if (!aba || aba.getLastRow() < 1) {
    throw new Error('Aba obrigatória ausente ou vazia: ' + nome);
  }
  return aba;
}


function validarCabecalhosExportacaoCentralV01200_(idx, obrigatorios, nomeAba) {
  const ausentes = obrigatorios.filter(function(campo) {
    return idx[campo] === undefined;
  });
  if (ausentes.length) {
    throw new Error('Campos ausentes em ' + nomeAba + ': ' + ausentes.join(', '));
  }
}


function indexarExportacaoCentralV01200_(headers) {
  return headers.reduce(function(idx, header, indice) {
    const chave = textoExportacaoCentralV01200_(header);
    if (chave) idx[chave] = indice;
    return idx;
  }, {});
}


function booleanoExportacaoCentralV01200_(valor) {
  if (valor === true) return true;
  if (valor === false || valor === null || valor === undefined) return false;
  return ['true', 'sim', '1'].includes(
    textoExportacaoCentralV01200_(valor).toLowerCase()
  );
}


function textoExportacaoCentralV01200_(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
