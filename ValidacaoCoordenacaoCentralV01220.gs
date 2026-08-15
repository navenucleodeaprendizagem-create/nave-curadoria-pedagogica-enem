/**
 * NAVE | VALIDAÇÃO + COORDENAÇÃO CENTRAL — V0.12.20
 *
 * Adaptador servidor-servidor para o frontend Next.js. Mantém como fontes
 * institucionais QUESTOES_GERAL, VALIDACOES_DOCENTES, FILA_COORDENACAO_V05 e
 * HISTORICO_ALTERACOES. A identidade sempre vem do contexto autenticado.
 */

const NAVE_VALIDACAO_COORD_CENTRAL_V01220 = Object.freeze({
  BASE: 'QUESTOES_GERAL',
  VALIDACOES: 'VALIDACOES_DOCENTES',
  FILA: 'FILA_COORDENACAO_V05',
  HISTORICO: 'HISTORICO_ALTERACOES',
  DECISOES: Object.freeze([
    'Manter classificação atual',
    'Aceitar sugestão docente',
    'Solicitar nova avaliação',
    'Suspender questão',
    'Homologar questão'
  ])
});

function obterQuestaoValidacaoCentralV01220_(ss, contexto, idQuestao) {
  exigirPermissaoCentralV01220_(contexto, 'validar');
  return localizarQuestaoCentralV01220_(ss, idQuestao).questao;
}

function registrarValidacaoCentralV01220_(ss, contexto, payload) {
  exigirPermissaoCentralV01220_(contexto, 'validar');
  payload = payload || {};
  validarFormularioValidacaoCentralV01220_(payload);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const localizado = localizarQuestaoCentralV01220_(ss, payload.idQuestao);
    const validacoes = exigirAbaCentralV01220_(ss, NAVE_VALIDACAO_COORD_CENTRAL_V01220.VALIDACOES);
    const fila = exigirAbaCentralV01220_(ss, NAVE_VALIDACAO_COORD_CENTRAL_V01220.FILA);
    garantirCampoIdOperacaoCentralV01220_(validacoes);
    const idxVal = indexarCentralV01220_(cabecalhosCentralV01220_(validacoes));
    const idxFila = indexarCentralV01220_(cabecalhosCentralV01220_(fila));

    validarCabecalhosCentralV01220_(idxVal, [
      'id_validacao', 'id_operacao', 'data_validacao', 'professor', 'id_ocorrencia',
      'avaliacao_objeto', 'avaliacao_acao_cognitiva', 'avaliacao_dificuldade',
      'avaliacao_funcao_pedagogica', 'avaliacao_trecho', 'parecer_geral',
      'possui_divergencia', 'tipos_divergencia', 'status_validacao'
    ], NAVE_VALIDACAO_COORD_CENTRAL_V01220.VALIDACOES);
    validarCabecalhosCentralV01220_(idxFila, [
      'id_validacao', 'id_ocorrencia', 'prioridade', 'status_fila',
      'data_entrada', 'professor', 'tipos_divergencia', 'resolvido'
    ], NAVE_VALIDACAO_COORD_CENTRAL_V01220.FILA);

    const idOperacao = textoCentralV01220_(payload.idOperacao);
    const autor = obterAutorCentralV01220_(contexto);
    const versaoAvaliada = Number(payload.versaoRegistroAvaliada);

    if (!idOperacao) throw new Error('idOperacao é obrigatório.');
    if (!Number.isFinite(versaoAvaliada) || versaoAvaliada < 1) {
      throw new Error('versaoRegistroAvaliada inválida.');
    }

    const reutilizado =
      reutilizarValidacaoCentralV01220_(
        ss,
        validacoes,
        idxVal,
        fila,
        idxFila,
        localizado,
        autor,
        payload,
        idOperacao,
        versaoAvaliada
      );

    if (reutilizado) return reutilizado;

    const versaoAtual =
      Number(valorCentralV01220_(localizado.linha, localizado.idx, 'versao_registro')) || 1;

    if (versaoAvaliada !== versaoAtual) {
      throw new Error(
        'A questão foi alterada após o carregamento. Recarregue antes de validar.'
      );
    }

    const divergencias = detectarDivergenciasCentralV01220_(payload);
    const possuiDivergencia = divergencias.length > 0;
    const idValidacao = gerarIdCentralV01220_('VAL');
    const agora = new Date();
    const r = localizado.linha;
    const ib = localizado.idx;

    const linhaVal = Array(validacoes.getLastColumn()).fill('');
    preencherLinhaCentralV01220_(linhaVal, idxVal, {
      id_validacao: idValidacao,
      id_operacao: idOperacao,
      data_validacao: agora,
      professor: autor,
      id_ocorrencia: localizado.id,
      ano: valorCentralV01220_(r, ib, 'ano'),
      edicao: valorCentralV01220_(r, ib, 'edicao'),
      habilidade_atual: valorCentralV01220_(r, ib, 'habilidade'),
      objeto_atual: valorCentralV01220_(r, ib, 'objeto_principal'),
      acao_cognitiva_atual: valorCentralV01220_(r, ib, 'acao_cognitiva_especifica'),
      dificuldade_atual: valorCentralV01220_(r, ib, 'dificuldade_rotulo'),
      funcao_pedagogica_atual: valorCentralV01220_(r, ib, 'funcao_pedagogica_sugerida'),
      avaliacao_objeto: payload.avaliacaoObjeto,
      objeto_sugerido: payload.objetoSugerido || '',
      avaliacao_acao_cognitiva: payload.avaliacaoAcao,
      acao_cognitiva_sugerida: payload.acaoSugerida || '',
      avaliacao_dificuldade: payload.avaliacaoDificuldade,
      dificuldade_sugerida: payload.dificuldadeSugerida || '',
      avaliacao_funcao_pedagogica: payload.avaliacaoFuncao,
      funcao_pedagogica_sugerida_docente: payload.funcaoSugerida || '',
      avaliacao_trecho: payload.avaliacaoTrecho,
      parecer_geral: payload.parecerGeral,
      observacao_docente: payload.observacao || '',
      possui_divergencia: possuiDivergencia ? 'Sim' : 'Não',
      tipos_divergencia: divergencias.join('; '),
      status_validacao: possuiDivergencia ? 'Aguardando coordenação' : 'Registrada',
      versao_registro_avaliada: versaoAvaliada
    });

    let linhaFila = null;
    if (possuiDivergencia) {
      assegurarIdAusenteCentralV01220_(fila, idxFila, idValidacao);
      linhaFila = Array(fila.getLastColumn()).fill('');
      preencherLinhaCentralV01220_(linhaFila, idxFila, {
        prioridade: payload.parecerGeral === 'Inadequada para uso'
          ? 'Crítica' : divergencias.length >= 3 ? 'Alta' : 'Normal',
        status_fila: 'Aguardando coordenação',
        id_validacao: idValidacao,
        id_ocorrencia: localizado.id,
        data_entrada: agora,
        professor: autor,
        habilidade: valorCentralV01220_(r, ib, 'habilidade'),
        objeto_atual: valorCentralV01220_(r, ib, 'objeto_principal'),
        tipos_divergencia: divergencias.join('; '),
        parecer_geral: payload.parecerGeral,
        observacao_docente: payload.observacao || '',
        resolvido: false
      });
    }

    validacoes.appendRow(linhaVal);
    try {
      if (linhaFila) fila.appendRow(linhaFila);
      consolidarValidacoesCentralV01220_(ss, localizado.id);
      SpreadsheetApp.flush();
    } catch (erro) {
      throw new Error(
        'Falha parcial após registrar a validação ' + idValidacao +
        '. Verifique VALIDACOES_DOCENTES, FILA_COORDENACAO_V05 e QUESTOES_GERAL antes de tentar novamente. Causa: ' +
        mensagemErroCentralV01220_(erro)
      );
    }

    return {
      mensagem: possuiDivergencia
        ? 'Validação registrada e enviada para a coordenação.'
        : 'Validação registrada sem divergências.',
      idValidacao: idValidacao,
      possuiDivergencia: possuiDivergencia,
      divergencias: divergencias,
      reutilizado: false,
      questao: localizarQuestaoCentralV01220_(ss, localizado.id).questao
    };
  } finally {
    lock.releaseLock();
  }
}

function listarCasosCoordenacaoCentralV01220_(ss, contexto) {
  exigirPermissaoCentralV01220_(contexto, 'coordenacao');
  const fila = exigirAbaCentralV01220_(ss, NAVE_VALIDACAO_COORD_CENTRAL_V01220.FILA);
  const dados = fila.getDataRange().getValues();
  const idx = indexarCentralV01220_(dados[0] || []);
  validarCabecalhosCentralV01220_(idx, [
    'prioridade', 'status_fila', 'id_validacao', 'id_ocorrencia',
    'data_entrada', 'professor', 'tipos_divergencia', 'parecer_geral',
    'observacao_docente', 'resolvido'
  ], NAVE_VALIDACAO_COORD_CENTRAL_V01220.FILA);
  detectarIdsDuplicadosCentralV01220_(dados, idx, 'id_validacao', NAVE_VALIDACAO_COORD_CENTRAL_V01220.FILA);

  const casos = dados.slice(1).filter(function(r) {
    return textoCentralV01220_(r[idx.id_validacao]);
  }).map(function(r) {
    return mapearResumoCasoCentralV01220_(r, idx);
  });

  casos.sort(function(a, b) {
    if (a.resolvido !== b.resolvido) return a.resolvido ? 1 : -1;
    return String(a.idQuestao).localeCompare(String(b.idQuestao));
  });

  return {
    cases: casos,
    indicadores: {
      total: casos.length,
      pendentes: casos.filter(function(c) { return !c.resolvido; }).length,
      resolvidos: casos.filter(function(c) { return c.resolvido; }).length
    }
  };
}

function obterCasoCoordenacaoCentralV01220_(ss, contexto, idValidacao) {
  exigirPermissaoCentralV01220_(contexto, 'coordenacao');
  const localizado = localizarCasoCentralV01220_(ss, idValidacao);
  const resumo = mapearResumoCasoCentralV01220_(localizado.linhaFila, localizado.idxFila);
  const v = localizado.linhaValidacao;
  const iv = localizado.idxValidacao;
  const questao = localizarQuestaoCentralV01220_(ss, resumo.idQuestao).questao;

  return Object.assign({}, resumo, {
    dataValidacao: formatarDataCentralV01220_(valorCentralV01220_(v, iv, 'data_validacao')),
    objetoSugerido: textoCentralV01220_(valorCentralV01220_(v, iv, 'objeto_sugerido')),
    avaliacaoObjeto: textoCentralV01220_(valorCentralV01220_(v, iv, 'avaliacao_objeto')),
    acaoAtual: textoCentralV01220_(valorCentralV01220_(v, iv, 'acao_cognitiva_atual')) || questao.acaoCognitiva,
    acaoSugerida: textoCentralV01220_(valorCentralV01220_(v, iv, 'acao_cognitiva_sugerida')),
    avaliacaoAcao: textoCentralV01220_(valorCentralV01220_(v, iv, 'avaliacao_acao_cognitiva')),
    dificuldadeAtual: textoCentralV01220_(valorCentralV01220_(v, iv, 'dificuldade_atual')) || questao.dificuldade,
    dificuldadeSugerida: textoCentralV01220_(valorCentralV01220_(v, iv, 'dificuldade_sugerida')),
    avaliacaoDificuldade: textoCentralV01220_(valorCentralV01220_(v, iv, 'avaliacao_dificuldade')),
    funcaoAtual: textoCentralV01220_(valorCentralV01220_(v, iv, 'funcao_pedagogica_atual')) || questao.funcao,
    funcaoSugerida: textoCentralV01220_(valorCentralV01220_(v, iv, 'funcao_pedagogica_sugerida_docente')),
    avaliacaoFuncao: textoCentralV01220_(valorCentralV01220_(v, iv, 'avaliacao_funcao_pedagogica')),
    avaliacaoTrecho: textoCentralV01220_(valorCentralV01220_(v, iv, 'avaliacao_trecho')),
    decisaoAtual: textoCentralV01220_(valorCentralV01220_(localizado.linhaFila, localizado.idxFila, 'decisao_coordenacao')),
    historico: obterHistoricoQuestaoCentralV01220_(ss, resumo.idQuestao),
    questao: questao
  });
}

function decidirCasoCoordenacaoCentralV01220_(ss, contexto, payload) {
  exigirPermissaoCentralV01220_(contexto, 'coordenacao');
  payload = payload || {};
  const decisao = textoCentralV01220_(payload.decisao);
  const justificativa = textoCentralV01220_(payload.justificativa);
  if (!NAVE_VALIDACAO_COORD_CENTRAL_V01220.DECISOES.includes(decisao)) {
    throw new Error('Selecione uma decisão válida.');
  }
  if (justificativa.length < 10) {
    throw new Error('A justificativa precisa ter pelo menos 10 caracteres.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const caso = localizarCasoCentralV01220_(ss, payload.idValidacao);
    if (booleanoCentralV01220_(valorCentralV01220_(caso.linhaFila, caso.idxFila, 'resolvido'))) {
      throw new Error('Este caso já foi marcado como resolvido.');
    }

    const questaoLoc = localizarQuestaoCentralV01220_(ss, caso.idQuestao);
    const base = questaoLoc.aba;
    const fila = caso.abaFila;
    const validacoes = caso.abaValidacoes;
    const b = questaoLoc.linha.slice();
    const f = caso.linhaFila.slice();
    const v = caso.linhaValidacao.slice();
    const ib = questaoLoc.idx;
    const ifi = caso.idxFila;
    const iv = caso.idxValidacao;
    const agora = new Date();
    const coordenador = obterAutorCentralV01220_(contexto);
    const alteracoes = [];
    const versaoAnterior = Number(valorCentralV01220_(b, ib, 'versao_registro')) || 1;

    if (decisao === 'Aceitar sugestão docente') {
      aplicarSugestoesCentralV01220_(b, ib, v, iv, alteracoes);
    }
    if (decisao === 'Suspender questão') {
      alterarLinhaCentralV01220_(b, ib, 'status_curadoria', 'Suspensa para revisão', alteracoes);
      alterarLinhaCentralV01220_(b, ib, 'maturidade_curadoria', 'Suspensa', alteracoes);
      alterarLinhaCentralV01220_(b, ib, 'status_validacao', 'Suspensa pela coordenação', alteracoes);
    } else if (decisao === 'Homologar questão') {
      alterarLinhaCentralV01220_(b, ib, 'status_curadoria', 'Homologada', alteracoes);
      alterarLinhaCentralV01220_(b, ib, 'maturidade_curadoria', 'Homologada', alteracoes);
      alterarLinhaCentralV01220_(b, ib, 'status_validacao', 'Homologada', alteracoes);
      definirCentralV01220_(b, ib, 'homologada_em', agora);
      definirCentralV01220_(b, ib, 'homologada_por', coordenador);
    } else if (decisao === 'Solicitar nova avaliação') {
      alterarLinhaCentralV01220_(b, ib, 'status_validacao', 'Aguardando nova avaliação', alteracoes);
      alterarLinhaCentralV01220_(b, ib, 'maturidade_curadoria', 'Em validação', alteracoes);
    } else {
      alterarLinhaCentralV01220_(b, ib, 'status_validacao', 'Resolvida pela coordenação', alteracoes);
      alterarLinhaCentralV01220_(b, ib, 'maturidade_curadoria', 'Ajustada pela coordenação', alteracoes);
    }

    const versaoNova = alteracoes.length ? versaoAnterior + 1 : versaoAnterior;
    if (alteracoes.length) {
      definirCentralV01220_(b, ib, 'versao_registro', versaoNova);
      definirCentralV01220_(b, ib, 'ultima_revisao_em', agora);
      definirCentralV01220_(b, ib, 'ultima_revisao_por', coordenador);
    }

    const resolvido = decisao !== 'Solicitar nova avaliação';
    definirCentralV01220_(f, ifi, 'responsavel_coordenacao', coordenador);
    definirCentralV01220_(f, ifi, 'decisao_coordenacao', decisao);
    definirCentralV01220_(f, ifi, 'justificativa_coordenacao', justificativa);
    definirCentralV01220_(f, ifi, 'data_decisao', agora);
    definirCentralV01220_(f, ifi, 'resolvido', resolvido);
    definirCentralV01220_(f, ifi, 'status_fila', resolvido ? 'Resolvida' : 'Devolvida ao docente');
    definirCentralV01220_(v, iv, 'decisao_coordenacao', decisao);
    definirCentralV01220_(v, iv, 'justificativa_coordenacao', justificativa);
    definirCentralV01220_(v, iv, 'data_decisao_coordenacao', agora);
    definirCentralV01220_(v, iv, 'coordenador_responsavel', coordenador);
    definirCentralV01220_(v, iv, 'status_validacao', resolvido ? 'Resolvida pela coordenação' : 'Nova avaliação solicitada');

    // Todas as validações e transformações ocorreram antes da primeira escrita.
    try {
      base.getRange(questaoLoc.numeroLinha, 1, 1, b.length).setValues([b]);
      validacoes.getRange(caso.numeroLinhaValidacao, 1, 1, v.length).setValues([v]);
      fila.getRange(caso.numeroLinhaFila, 1, 1, f.length).setValues([f]);
      registrarHistoricoCentralV01220_(ss, caso.idQuestao, coordenador, justificativa, decisao, versaoAnterior, versaoNova, alteracoes);
      consolidarValidacoesCentralV01220_(ss, caso.idQuestao);
      SpreadsheetApp.flush();
    } catch (erro) {
      throw new Error(
        'Falha parcial ao aplicar a decisão do caso ' + caso.idValidacao +
        '. As estruturas institucionais devem ser auditadas antes de nova tentativa. Causa: ' +
        mensagemErroCentralV01220_(erro)
      );
    }

    return {
      mensagem: resolvido ? 'Decisão aplicada e caso resolvido.' : 'Caso devolvido para nova avaliação.',
      decisao: decisao,
      idQuestao: caso.idQuestao,
      camposAlterados: alteracoes.map(function(a) { return a.campo; }),
      questao: localizarQuestaoCentralV01220_(ss, caso.idQuestao).questao
    };
  } finally {
    lock.releaseLock();
  }
}

function localizarQuestaoCentralV01220_(ss, idQuestao) {
  const id = textoCentralV01220_(idQuestao);
  if (!id) throw new Error('Questão não informada.');
  const aba = exigirAbaCentralV01220_(ss, NAVE_VALIDACAO_COORD_CENTRAL_V01220.BASE);
  const dados = aba.getDataRange().getValues();
  const idx = indexarCentralV01220_(dados[0] || []);
  validarCabecalhosCentralV01220_(idx, ['id_ocorrencia'], NAVE_VALIDACAO_COORD_CENTRAL_V01220.BASE);
  const encontrados = [];
  for (let i = 1; i < dados.length; i++) {
    if (textoCentralV01220_(dados[i][idx.id_ocorrencia]) === id) encontrados.push(i);
  }
  if (!encontrados.length) throw new Error('Questão não localizada: ' + id);
  if (encontrados.length > 1) throw new Error('ID duplicado em QUESTOES_GERAL: ' + id);
  const pos = encontrados[0];
  return { id: id, aba: aba, dados: dados, idx: idx, linha: dados[pos], numeroLinha: pos + 1,
    questao: mapearQuestaoCentralV01220_(dados[pos], idx) };
}

function localizarCasoCentralV01220_(ss, idValidacao) {
  const id = textoCentralV01220_(idValidacao);
  if (!id) throw new Error('Validação não informada.');
  const fila = exigirAbaCentralV01220_(ss, NAVE_VALIDACAO_COORD_CENTRAL_V01220.FILA);
  const validacoes = exigirAbaCentralV01220_(ss, NAVE_VALIDACAO_COORD_CENTRAL_V01220.VALIDACOES);
  const df = fila.getDataRange().getValues();
  const dv = validacoes.getDataRange().getValues();
  const ifi = indexarCentralV01220_(df[0] || []);
  const iv = indexarCentralV01220_(dv[0] || []);
  validarCabecalhosCentralV01220_(ifi, ['id_validacao', 'id_ocorrencia', 'resolvido'], NAVE_VALIDACAO_COORD_CENTRAL_V01220.FILA);
  validarCabecalhosCentralV01220_(iv, ['id_validacao', 'id_ocorrencia'], NAVE_VALIDACAO_COORD_CENTRAL_V01220.VALIDACOES);
  const pf = indicesIdCentralV01220_(df, ifi.id_validacao, id);
  const pv = indicesIdCentralV01220_(dv, iv.id_validacao, id);
  if (!pf.length) throw new Error('Caso não localizado: ' + id);
  if (pf.length > 1) throw new Error('ID duplicado em FILA_COORDENACAO_V05: ' + id);
  if (!pv.length) throw new Error('Validação não localizada: ' + id);
  if (pv.length > 1) throw new Error('ID duplicado em VALIDACOES_DOCENTES: ' + id);
  const idQuestaoFila = textoCentralV01220_(df[pf[0]][ifi.id_ocorrencia]);
  const idQuestaoVal = textoCentralV01220_(dv[pv[0]][iv.id_ocorrencia]);
  if (!idQuestaoFila || idQuestaoFila !== idQuestaoVal) throw new Error('Caso inconsistente: id_ocorrencia diverge entre fila e validação.');
  return { idValidacao: id, idQuestao: idQuestaoFila, abaFila: fila, abaValidacoes: validacoes,
    idxFila: ifi, idxValidacao: iv, linhaFila: df[pf[0]], linhaValidacao: dv[pv[0]],
    numeroLinhaFila: pf[0] + 1, numeroLinhaValidacao: pv[0] + 1 };
}

function mapearQuestaoCentralV01220_(r, idx) {
  return {
    id: textoCentralV01220_(valorCentralV01220_(r, idx, 'id_ocorrencia')),
    ano: valorCentralV01220_(r, idx, 'ano'),
    edicao: textoCentralV01220_(valorCentralV01220_(r, idx, 'edicao')),
    competencia: textoCentralV01220_(valorCentralV01220_(r, idx, 'competencia')),
    habilidade: textoCentralV01220_(valorCentralV01220_(r, idx, 'habilidade')),
    objeto: textoCentralV01220_(valorCentralV01220_(r, idx, 'objeto_principal')),
    acaoCognitiva: textoCentralV01220_(valorCentralV01220_(r, idx, 'acao_cognitiva_especifica')),
    dificuldade: textoCentralV01220_(valorCentralV01220_(r, idx, 'dificuldade_rotulo')),
    funcao: textoCentralV01220_(valorCentralV01220_(r, idx, 'funcao_pedagogica_sugerida')),
    trecho: textoCentralV01220_(valorCentralV01220_(r, idx, 'trecho_inicial')),
    statusCuradoria: textoCentralV01220_(valorCentralV01220_(r, idx, 'status_curadoria')),
    statusValidacao: textoCentralV01220_(valorCentralV01220_(r, idx, 'status_validacao')) || 'Não avaliada',
    maturidadeCuradoria: textoCentralV01220_(valorCentralV01220_(r, idx, 'maturidade_curadoria')) || 'Importada',
    versaoRegistro: Number(valorCentralV01220_(r, idx, 'versao_registro')) || 1
  };
}

function mapearResumoCasoCentralV01220_(r, idx) {
  return {
    prioridade: textoCentralV01220_(valorCentralV01220_(r, idx, 'prioridade')) || '—',
    statusFila: textoCentralV01220_(valorCentralV01220_(r, idx, 'status_fila')),
    idValidacao: textoCentralV01220_(valorCentralV01220_(r, idx, 'id_validacao')),
    idQuestao: textoCentralV01220_(valorCentralV01220_(r, idx, 'id_ocorrencia')),
    dataEntrada: formatarDataCentralV01220_(valorCentralV01220_(r, idx, 'data_entrada')),
    professor: textoCentralV01220_(valorCentralV01220_(r, idx, 'professor')),
    habilidade: textoCentralV01220_(valorCentralV01220_(r, idx, 'habilidade')),
    objetoAtual: textoCentralV01220_(valorCentralV01220_(r, idx, 'objeto_atual')),
    tiposDivergencia: textoCentralV01220_(valorCentralV01220_(r, idx, 'tipos_divergencia')),
    parecerGeral: textoCentralV01220_(valorCentralV01220_(r, idx, 'parecer_geral')),
    observacaoDocente: textoCentralV01220_(valorCentralV01220_(r, idx, 'observacao_docente')),
    responsavelCoordenacao: textoCentralV01220_(valorCentralV01220_(r, idx, 'responsavel_coordenacao')),
    decisao: textoCentralV01220_(valorCentralV01220_(r, idx, 'decisao_coordenacao')),
    justificativa: textoCentralV01220_(valorCentralV01220_(r, idx, 'justificativa_coordenacao')),
    resolvido: booleanoCentralV01220_(valorCentralV01220_(r, idx, 'resolvido'))
  };
}

function aplicarSugestoesCentralV01220_(b, ib, v, iv, alteracoes) {
  const candidatos = [
    ['avaliacao_objeto', 'Incorreto', 'objeto_sugerido', 'objeto_principal'],
    ['avaliacao_acao_cognitiva', 'Incorreta', 'acao_cognitiva_sugerida', 'acao_cognitiva_especifica'],
    ['avaliacao_dificuldade', ['Superestimada', 'Subestimada'], 'dificuldade_sugerida', 'dificuldade_rotulo'],
    ['avaliacao_funcao_pedagogica', 'Inadequada', 'funcao_pedagogica_sugerida_docente', 'funcao_pedagogica_sugerida']
  ];
  let aplicavel = false;
  candidatos.forEach(function(c) {
    const avaliacao = textoCentralV01220_(valorCentralV01220_(v, iv, c[0]));
    const aceito = Array.isArray(c[1]) ? c[1].includes(avaliacao) : avaliacao === c[1];
    const sugestao = textoCentralV01220_(valorCentralV01220_(v, iv, c[2]));
    if (aceito && sugestao) {
      aplicavel = true;
      alterarLinhaCentralV01220_(b, ib, c[3], sugestao, alteracoes);
      if (c[3] === 'dificuldade_rotulo') definirCentralV01220_(b, ib, 'dificuldade_faixa', faixaDificuldadeCentralV01220_(sugestao));
    }
  });
  if (!aplicavel) throw new Error('A validação não possui sugestão preenchida para ser aplicada.');
}

function detectarDivergenciasCentralV01220_(p) {
  const d = [];
  if (p.avaliacaoObjeto === 'Incorreto') d.push('Objeto de conhecimento');
  if (p.avaliacaoAcao === 'Incorreta') d.push('Ação cognitiva');
  if (['Superestimada', 'Subestimada'].includes(p.avaliacaoDificuldade)) d.push('Dificuldade');
  if (p.avaliacaoFuncao === 'Inadequada') d.push('Função pedagógica');
  if (p.avaliacaoTrecho === 'Inadequado') d.push('Trecho inicial');
  if (['Solicitar ajuste', 'Inadequada para uso'].includes(p.parecerGeral)) d.push('Parecer geral');
  return Array.from(new Set(d));
}

function validarFormularioValidacaoCentralV01220_(p) {
  [['idOperacao', 'Identificador da operação'], ['idQuestao', 'Questão'], ['avaliacaoObjeto', 'Avaliação do objeto'],
    ['avaliacaoAcao', 'Avaliação da ação cognitiva'], ['avaliacaoDificuldade', 'Avaliação da dificuldade'],
    ['avaliacaoFuncao', 'Avaliação da função pedagógica'], ['avaliacaoTrecho', 'Avaliação do trecho'],
    ['parecerGeral', 'Parecer geral']].forEach(function(item) {
    if (!textoCentralV01220_(p[item[0]])) throw new Error('Preencha: ' + item[1] + '.');
  });
}

function garantirCampoIdOperacaoCentralV01220_(aba) {
  const headers = cabecalhosCentralV01220_(aba).map(textoCentralV01220_);
  const ocorrencias = headers.reduce(function(total, h) {
    return total + (h === 'id_operacao' ? 1 : 0);
  }, 0);

  if (ocorrencias > 1) {
    throw new Error('Campo id_operacao duplicado em VALIDACOES_DOCENTES.');
  }

  if (!ocorrencias) {
    aba.getRange(1, aba.getLastColumn() + 1).setValue('id_operacao');
  }
}

function reutilizarValidacaoCentralV01220_(
  ss,
  validacoes,
  idxVal,
  fila,
  idxFila,
  localizado,
  autor,
  payload,
  idOperacao,
  versaoAvaliada
) {
  const dadosVal = validacoes.getDataRange().getValues();
  const posicoes = indicesIdCentralV01220_(dadosVal, idxVal.id_operacao, idOperacao);

  if (!posicoes.length) return null;
  if (posicoes.length > 1) {
    throw new Error('id_operacao duplicado em VALIDACOES_DOCENTES: ' + idOperacao);
  }

  const v = dadosVal[posicoes[0]];
  const campos = [
    ['id_ocorrencia', localizado.id],
    ['professor', autor],
    ['versao_registro_avaliada', versaoAvaliada],
    ['parecer_geral', payload.parecerGeral],
    ['avaliacao_objeto', payload.avaliacaoObjeto],
    ['objeto_sugerido', payload.objetoSugerido || ''],
    ['avaliacao_acao_cognitiva', payload.avaliacaoAcao],
    ['acao_cognitiva_sugerida', payload.acaoSugerida || ''],
    ['avaliacao_dificuldade', payload.avaliacaoDificuldade],
    ['dificuldade_sugerida', payload.dificuldadeSugerida || ''],
    ['avaliacao_funcao_pedagogica', payload.avaliacaoFuncao],
    ['funcao_pedagogica_sugerida_docente', payload.funcaoSugerida || ''],
    ['avaliacao_trecho', payload.avaliacaoTrecho],
    ['observacao_docente', payload.observacao || '']
  ];

  campos.forEach(function(item) {
    if (idxVal[item[0]] === undefined) {
      throw new Error('Campo ausente em VALIDACOES_DOCENTES: ' + item[0]);
    }

    const persistido = item[0] === 'professor'
      ? textoCentralV01220_(v[idxVal[item[0]]]).toLowerCase()
      : textoCentralV01220_(v[idxVal[item[0]]]);
    const recebido = item[0] === 'professor'
      ? textoCentralV01220_(item[1]).toLowerCase()
      : textoCentralV01220_(item[1]);

    if (persistido !== recebido) {
      throw new Error(
        'idOperacao reutilizado com conteúdo diferente no campo ' + item[0] + ': ' + idOperacao
      );
    }
  });

  const idValidacao = textoCentralV01220_(v[idxVal.id_validacao]);
  const indicador = textoCentralV01220_(v[idxVal.possui_divergencia]);
  if (!idValidacao || !['Sim', 'Não'].includes(indicador)) {
    throw new Error('Validação idempotente estruturalmente incompleta: ' + idOperacao);
  }

  const dadosFila = fila.getDataRange().getValues();
  const posicoesFila = indicesIdCentralV01220_(dadosFila, idxFila.id_validacao, idValidacao);
  if (posicoesFila.length > 1) {
    throw new Error('Fila duplicada para id_validacao: ' + idValidacao);
  }

  const possuiDivergencia = indicador === 'Sim';
  if (possuiDivergencia && posicoesFila.length !== 1) {
    throw new Error(
      'Inconsistência parcial: validação divergente sem fila para ' + idValidacao
    );
  }
  if (!possuiDivergencia && posicoesFila.length) {
    throw new Error(
      'Inconsistência estrutural: validação concordante possui fila para ' + idValidacao
    );
  }

  const divergenciasPersistidas = textoCentralV01220_(v[idxVal.tipos_divergencia]);
  const divergenciasRecebidas = detectarDivergenciasCentralV01220_(payload).join('; ');
  if (divergenciasPersistidas !== divergenciasRecebidas) {
    throw new Error('idOperacao reutilizado com divergências incompatíveis: ' + idOperacao);
  }

  return {
    mensagem: possuiDivergencia
      ? 'Validação registrada e enviada para a coordenação.'
      : 'Validação registrada sem divergências.',
    idValidacao: idValidacao,
    possuiDivergencia: possuiDivergencia,
    divergencias: divergenciasPersistidas
      ? divergenciasPersistidas.split(';').map(function(x) { return x.trim(); }).filter(Boolean)
      : [],
    reutilizado: true,
    questao: localizarQuestaoCentralV01220_(ss, localizado.id).questao
  };
}

function consolidarValidacoesCentralV01220_(ss, idQuestao) {
  if (typeof consolidarValidacoesQuestaoV055_ !== 'function') {
    throw new Error('Regra institucional consolidarValidacoesQuestaoV055_ indisponível.');
  }

  const questao = localizarQuestaoCentralV01220_(ss, idQuestao);
  const validacoes = exigirAbaCentralV01220_(ss, NAVE_VALIDACAO_COORD_CENTRAL_V01220.VALIDACOES);
  const fila = exigirAbaCentralV01220_(ss, NAVE_VALIDACAO_COORD_CENTRAL_V01220.FILA);
  const dv = validacoes.getDataRange().getValues();
  const df = fila.getDataRange().getValues();
  const iv = indexarCentralV01220_(dv[0] || []);
  const ifi = indexarCentralV01220_(df[0] || []);
  validarCabecalhosCentralV01220_(iv, [
    'id_validacao', 'id_ocorrencia', 'data_validacao', 'professor',
    'possui_divergencia', 'tipos_divergencia'
  ], NAVE_VALIDACAO_COORD_CENTRAL_V01220.VALIDACOES);
  validarCabecalhosCentralV01220_(ifi, [
    'id_validacao', 'status_fila', 'decisao_coordenacao', 'resolvido'
  ], NAVE_VALIDACAO_COORD_CENTRAL_V01220.FILA);

  const vals = dv.slice(1).filter(function(r) {
    return textoCentralV01220_(r[iv.id_ocorrencia]) === questao.id;
  });
  if (!vals.length) throw new Error('Nenhuma validação encontrada para consolidar: ' + questao.id);

  const filaPorValidacao = new Map();
  df.slice(1).forEach(function(r) {
    const id = textoCentralV01220_(r[ifi.id_validacao]);
    if (!id) return;
    if (filaPorValidacao.has(id)) throw new Error('ID duplicado em FILA_COORDENACAO_V05: ' + id);
    filaPorValidacao.set(id, r);
  });

  const resumo = consolidarValidacoesQuestaoV055_(vals, iv, filaPorValidacao, ifi);
  const b = questao.linha.slice();
  definirCentralV01220_(b, questao.idx, 'status_validacao', resumo.statusValidacao);
  definirCentralV01220_(b, questao.idx, 'quantidade_validacoes', resumo.totalValidacoes);
  definirCentralV01220_(b, questao.idx, 'quantidade_concordancias', resumo.concordantes);
  definirCentralV01220_(b, questao.idx, 'quantidade_divergencias', resumo.divergenciasHistoricas);
  definirCentralV01220_(b, questao.idx, 'ultima_validacao_em', resumo.ultimaData);
  definirCentralV01220_(b, questao.idx, 'ultima_validacao_por', resumo.ultimoProfessor);
  definirCentralV01220_(b, questao.idx, 'maturidade_curadoria', resumo.maturidade);
  definirCentralV01220_(b, questao.idx, 'ultima_divergencia_validacao', resumo.divergenciasAtivas.join(' | '));
  questao.aba.getRange(questao.numeroLinha, 1, 1, b.length).setValues([b]);
}

function registrarHistoricoCentralV01220_(ss, idQuestao, autor, justificativa, decisao, versaoAnterior, versaoNova, alteracoes) {
  const historico = ss.getSheetByName(NAVE_VALIDACAO_COORD_CENTRAL_V01220.HISTORICO);
  if (!historico || !alteracoes.length) return;
  if (typeof registrarHistoricoDecisaoV053_ !== 'function') {
    throw new Error('Rotina institucional de histórico indisponível.');
  }
  registrarHistoricoDecisaoV053_(historico, idQuestao, autor, justificativa, decisao, versaoAnterior, versaoNova, alteracoes);
}

function obterHistoricoQuestaoCentralV01220_(ss, idQuestao) {
  const aba = ss.getSheetByName(NAVE_VALIDACAO_COORD_CENTRAL_V01220.HISTORICO);
  if (!aba || aba.getLastRow() < 2) return [];
  const dados = aba.getDataRange().getDisplayValues();
  const idx = indexarCentralV01220_(dados[0] || []);
  if (idx.id_ocorrencia === undefined) return [];
  return dados.slice(1).filter(function(r) {
    return textoCentralV01220_(r[idx.id_ocorrencia]) === idQuestao;
  }).slice(-20).map(function(r) {
    const item = {};
    dados[0].forEach(function(h, i) { item[String(h)] = r[i]; });
    return item;
  });
}

function exigirPermissaoCentralV01220_(contexto, permissao) {
  if (!contexto || contexto.authorized !== true || !contexto.user ||
      !contexto.permissions || contexto.permissions[permissao] !== true) {
    throw new Error('Usuário sem permissão para ' + permissao + '.');
  }
  obterAutorCentralV01220_(contexto);
}

function obterAutorCentralV01220_(contexto) {
  const user = contexto && contexto.user ? contexto.user : {};
  const autor = textoCentralV01220_(user.emailAutenticacao || user.email);
  if (!autor) throw new Error('Identidade autenticada sem e-mail.');
  return autor.toLowerCase();
}

function exigirAbaCentralV01220_(ss, nome) {
  if (!ss || typeof ss.getSheetByName !== 'function') throw new Error('Planilha operacional indisponível.');
  const aba = ss.getSheetByName(nome);
  if (!aba) throw new Error('A aba ' + nome + ' não foi encontrada.');
  return aba;
}

function cabecalhosCentralV01220_(aba) {
  return aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
}

function indexarCentralV01220_(headers) {
  return (headers || []).reduce(function(m, h, i) {
    const chave = textoCentralV01220_(h);
    if (chave) m[chave] = i;
    return m;
  }, {});
}

function validarCabecalhosCentralV01220_(idx, campos, aba) {
  const faltantes = campos.filter(function(c) { return idx[c] === undefined; });
  if (faltantes.length) throw new Error('Campos ausentes em ' + aba + ': ' + faltantes.join(', '));
}

function detectarIdsDuplicadosCentralV01220_(dados, idx, campo, aba) {
  const vistos = new Set();
  const duplicados = new Set();
  dados.slice(1).forEach(function(r) {
    const id = textoCentralV01220_(r[idx[campo]]);
    if (!id) return;
    if (vistos.has(id)) duplicados.add(id); else vistos.add(id);
  });
  if (duplicados.size) throw new Error('IDs duplicados em ' + aba + ': ' + Array.from(duplicados).slice(0, 20).join(', '));
}

function assegurarIdAusenteCentralV01220_(aba, idx, id) {
  const dados = aba.getDataRange().getValues();
  if (indicesIdCentralV01220_(dados, idx.id_validacao, id).length) {
    throw new Error('id_validacao já existente na fila: ' + id);
  }
}

function indicesIdCentralV01220_(dados, coluna, id) {
  const out = [];
  for (let i = 1; i < dados.length; i++) if (textoCentralV01220_(dados[i][coluna]) === id) out.push(i);
  return out;
}

function preencherLinhaCentralV01220_(linha, idx, valores) {
  Object.keys(valores).forEach(function(c) { if (idx[c] !== undefined) linha[idx[c]] = valores[c]; });
}

function definirCentralV01220_(linha, idx, campo, valor) {
  if (idx[campo] !== undefined) linha[idx[campo]] = valor;
}

function alterarLinhaCentralV01220_(linha, idx, campo, novo, alteracoes) {
  if (idx[campo] === undefined) return;
  const anterior = linha[idx[campo]];
  if (normalizarCentralV01220_(anterior) === normalizarCentralV01220_(novo)) return;
  linha[idx[campo]] = novo;
  alteracoes.push({ campo: campo, anterior: anterior, novo: novo });
}

function valorCentralV01220_(linha, idx, campo) {
  return idx[campo] === undefined ? '' : linha[idx[campo]];
}

function booleanoCentralV01220_(valor) {
  if (valor === true) return true;
  return ['true', 'sim', 's', '1', 'resolvido', 'resolvida'].includes(normalizarCentralV01220_(valor));
}

function textoCentralV01220_(valor) { return String(valor === null || valor === undefined ? '' : valor).trim(); }
function normalizarCentralV01220_(valor) { return textoCentralV01220_(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLowerCase(); }
function formatarDataCentralV01220_(valor) { return valor instanceof Date ? Utilities.formatDate(valor, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss') : textoCentralV01220_(valor); }
function gerarIdCentralV01220_(prefixo) { return prefixo + '_' + Utilities.getUuid().toUpperCase(); }
function mensagemErroCentralV01220_(e) { return e instanceof Error ? e.message : String(e); }
function faixaDificuldadeCentralV01220_(r) { const m = {'Muito fácil':1, 'Fácil':2, 'Média':3, 'Difícil':4, 'Muito difícil':5}; return Object.prototype.hasOwnProperty.call(m, r) ? m[r] : ''; }
