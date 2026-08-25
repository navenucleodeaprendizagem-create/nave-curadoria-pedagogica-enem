/**
 * ORIENTAÇÃO PEDAGÓGICA CENTRAL — MVP V0.14.00
 *
 * Persiste e projeta atividades pedagogicamente consolidadas. Não depende
 * de EDITORACAO_CENTRAL, pacote editorial ou id_envio.
 */

const ATIVIDADES_PEDAGOGICAS_HEADERS_V01400_ = [
  'id_atividade', 'titulo', 'descricao', 'professor_nome', 'professor_email',
  'criado_em', 'atualizado_em', 'quantidade_questoes', 'ids_questoes_json',
  'versao_snapshot'
];
const ITENS_ATIVIDADES_PEDAGOGICAS_HEADERS_V01400_ = [
  'id_atividade', 'ordem', 'id_questao', 'versao_snapshot'
];
const FREQUENCIA_HABILIDADES_HEADERS_V01400_ = [
  'area', 'habilidade', 'quantidade_itens_validos_2016_2025',
  'periodo_inicio', 'periodo_fim', 'fonte', 'gerado_em'
];
const CAMPOS_QUESTOES_ORIENTACAO_V01400_ = Object.freeze({
  id_ocorrencia: Object.freeze({ nomes: ['id_ocorrencia'], obrigatorio: true }),
  id_canonico: Object.freeze({ nomes: ['id_canonico'], obrigatorio: true }),
  componente: Object.freeze({ nomes: ['componente_principal'], obrigatorio: true }),
  competencia: Object.freeze({ nomes: ['competencia'], obrigatorio: true }),
  habilidade: Object.freeze({ nomes: ['habilidade'], obrigatorio: true }),
  objeto_principal: Object.freeze({ nomes: ['objeto_principal'], obrigatorio: true }),
  acao_cognitiva: Object.freeze({ nomes: ['acao_cognitiva_especifica'], obrigatorio: true }),
  dificuldade: Object.freeze({ nomes: ['dificuldade_rotulo'], obrigatorio: true }),
  funcao_pedagogica: Object.freeze({ nomes: ['funcao_pedagogica_sugerida'], obrigatorio: true }),
  tempo_estimado_min: Object.freeze({ nomes: ['tempo_estimado_min'], obrigatorio: true }),
  gabarito_oficial: Object.freeze({ nomes: ['gabarito_oficial'], obrigatorio: true }),
  ano: Object.freeze({ nomes: ['ano'], obrigatorio: true }),
  edicao: Object.freeze({ nomes: ['edicao'], obrigatorio: true }),
  status_validacao: Object.freeze({ nomes: ['status_validacao'], obrigatorio: true }),
  maturidade_curadoria: Object.freeze({ nomes: ['maturidade_curadoria'], obrigatorio: true })
});

function salvarAtividadePedagogicaCentralV01400_(ss, contexto, entrada) {
  validarPermissaoSequenciasV01111_(contexto);
  entrada = entrada || {};
  const id = textoOrientacaoV01400_(entrada.idAtividade || entrada.id_atividade);
  const titulo = textoOrientacaoV01400_(entrada.titulo);
  const descricao = textoOrientacaoV01400_(entrada.descricao);
  const ids = (entrada.questionIds || []).map(textoOrientacaoV01400_).filter(Boolean);
  if (!id || !titulo) throw new Error('ID e título da atividade são obrigatórios.');
  if (!ids.length) throw new Error('A atividade deve possuir ao menos uma questão.');
  if (new Set(ids).size !== ids.length) throw new Error('A atividade possui questões duplicadas.');

  const usuario = (contexto && contexto.user) || {};
  const professorEmail = textoOrientacaoV01400_(
    usuario.emailAutenticacao || usuario.email || contexto.emailAutenticacao
  ).toLowerCase();
  const professorNome = textoOrientacaoV01400_(usuario.nome || usuario.name);
  if (!professorEmail || !professorNome) throw new Error('Identidade autenticada do professor incompleta.');

  const base = lerBaseOrientacaoV01400_(ss);
  ids.forEach(function(idQuestao, indice) {
    const linha = base.porId.get(idQuestao);
    if (!linha) throw new Error('Questão não localizada em QUESTOES_GERAL: ' + idQuestao);
    const item = montarItemOrientacaoV01400_(linha, base.idx, indice + 1);
    if (!item.consolidada) {
      throw new Error('Questão não liberada para orientação na ordem ' + (indice + 1) + ': ' + idQuestao);
    }
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const abaAtividades = obterOuCriarAbaOrientacaoV01400_(
      ss, 'ATIVIDADES_PEDAGOGICAS', ATIVIDADES_PEDAGOGICAS_HEADERS_V01400_
    );
    const abaItens = obterOuCriarAbaOrientacaoV01400_(
      ss, 'ITENS_ATIVIDADES_PEDAGOGICAS', ITENS_ATIVIDADES_PEDAGOGICAS_HEADERS_V01400_
    );
    const registros = lerRegistrosOrientacaoV01400_(abaAtividades);
    const encontrados = registros.filter(function(registro) {
      return textoOrientacaoV01400_(registro.obj.id_atividade) === id;
    });
    if (encontrados.length > 1) throw new Error('Atividade pedagógica duplicada: ' + id);
    const existente = encontrados.length ? encontrados[0] : null;
    if (existente) {
      const dono = textoOrientacaoV01400_(existente.obj.professor_email).toLowerCase();
      if (!dono || dono !== professorEmail) throw new Error('A atividade pertence a outro professor.');
      const idsAtuais = interpretarIdsOrientacaoV01400_(existente.obj.ids_questoes_json);
      const inalterada = textoOrientacaoV01400_(existente.obj.titulo) === titulo &&
        textoOrientacaoV01400_(existente.obj.descricao) === descricao &&
        JSON.stringify(idsAtuais) === JSON.stringify(ids);
      if (inalterada) return montarResultadoSnapshotOrientacaoV01400_(existente.obj, true);
    }

    const atualizadoAnterior = existente ? new Date(existente.obj.atualizado_em).getTime() : 0;
    const agora = new Date(Math.max(Date.now(), Number.isFinite(atualizadoAnterior) ? atualizadoAnterior + 1 : 0));
    // Uma versão temporal torna tentativas posteriores seguras: itens órfãos de
    // uma falha anterior jamais passam a integrar o resumo vigente.
    const versao = agora.getTime();
    const criadoEm = existente ? existente.obj.criado_em : agora;
    const professorPersistido = existente
      ? textoOrientacaoV01400_(existente.obj.professor_nome)
      : professorNome;
    const linhaResumo = [id, titulo, descricao, professorPersistido, professorEmail,
      criadoEm, agora, ids.length, JSON.stringify(ids), versao];

    abaItens.getRange(abaItens.getLastRow() + 1, 1, ids.length, 4).setValues(
      ids.map(function(idQuestao, indice) { return [id, indice + 1, idQuestao, versao]; })
    );
    if (existente) {
      abaAtividades.getRange(existente.linha, 1, 1, linhaResumo.length).setValues([linhaResumo]);
    } else {
      abaAtividades.appendRow(linhaResumo);
    }
    return {
      idAtividade: id, quantidadeQuestoes: ids.length, versaoSnapshot: versao,
      reutilizado: false
    };
  } finally {
    lock.releaseLock();
  }
}

function obterOrientacaoPedagogicaCentralV01400_(ss, contexto, idAtividade) {
  validarPermissaoSequenciasV01111_(contexto);
  idAtividade = textoOrientacaoV01400_(idAtividade);
  if (!idAtividade) throw new Error('ID da atividade ausente.');
  const snapshot = lerSnapshotAtividadeOrientacaoV01400_(ss, idAtividade);
  const ids = snapshot.ids;
  if (!ids.length || new Set(ids).size !== ids.length) {
    throw new Error('Snapshot da atividade vazio ou com questões duplicadas.');
  }

  const base = lerBaseOrientacaoV01400_(ss);
  const itens = ids.map(function(id, indice) {
    const linha = base.porId.get(id);
    if (!linha) throw new Error('Questão não localizada em QUESTOES_GERAL: ' + id);
    const item = montarItemOrientacaoV01400_(linha, base.idx, indice + 1);
    if (!item.consolidada) {
      throw new Error('A atividade ainda possui questão não consolidada na ordem ' + (indice + 1) + '.');
    }
    return item;
  });

  const matriz = lerMatrizAprovadaOrientacaoV01400_(ss);
  const frequencias = lerFrequenciasOrientacaoV01400_(ss);
  const habilidades = agruparHabilidadesOrientacaoV01400_(itens).map(function(grupo) {
    const chave = chaveOrientacaoV01400_(grupo.area, grupo.competencia, grupo.habilidade);
    const pedagogia = matriz.get(chave) || null;
    const recorrencia = frequencias ? calcularRecorrenciaOrientacaoV01400_(frequencias, grupo.area, grupo.habilidade) : recorrenciaIndisponivelOrientacaoV01400_();
    return {
      area: grupo.area,
      componente: grupo.componentes.join(', '),
      competencia: grupo.competencia,
      habilidade: grupo.habilidade,
      questoes: grupo.itens.map(function(item) { return item.ordem; }),
      quantidadeQuestoes: grupo.itens.length,
      descricaoCompetencia: pedagogia ? pedagogia.descricaoCompetencia : '',
      descricaoHabilidade: pedagogia ? pedagogia.descricaoHabilidade : '',
      recorrencia: recorrencia,
      pedagogia: pedagogia,
      itens: grupo.itens.map(removerIdTecnicoOrientacaoV01400_)
    };
  });

  return {
    id: snapshot.id,
    sequenceId: snapshot.id,
    titulo: snapshot.titulo,
    descricao: snapshot.descricao,
    professorNome: snapshot.professorNome,
    quantidadeQuestoes: itens.length,
    status: 'consolidada',
    panorama: montarPanoramaOrientacaoV01400_(itens, habilidades),
    habilidades: habilidades,
    sintese: montarSinteseOrientacaoV01400_(itens, habilidades),
    historicoEnemDisponivel: Boolean(frequencias),
    matrizPedagogicaCompleta: habilidades.every(function(item) {
      return Boolean(item.pedagogia);
    })
  };
}

function obterOuCriarAbaOrientacaoV01400_(ss, nome, headers) {
  let aba = ss.getSheetByName(nome);
  if (!aba) {
    aba = ss.insertSheet(nome);
    aba.getRange(1, 1, 1, headers.length).setValues([headers]);
    return aba;
  }
  const existentes = aba.getLastColumn()
    ? aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0].map(textoOrientacaoV01400_)
    : [];
  if (JSON.stringify(existentes) !== JSON.stringify(headers)) {
    throw new Error('Schema incompatível na aba ' + nome + '. Nenhum dado foi alterado.');
  }
  return aba;
}

function lerRegistrosOrientacaoV01400_(aba) {
  if (!aba || aba.getLastRow() < 2) return [];
  const dados = aba.getDataRange().getValues();
  const headers = dados[0].map(textoOrientacaoV01400_);
  return dados.slice(1).map(function(linha, indice) {
    const obj = {};
    headers.forEach(function(header, coluna) { obj[header] = linha[coluna]; });
    return { linha: indice + 2, obj: obj };
  });
}

function interpretarIdsOrientacaoV01400_(valor) {
  try {
    const ids = JSON.parse(String(valor || '[]'));
    return Array.isArray(ids) ? ids.map(textoOrientacaoV01400_).filter(Boolean) : [];
  } catch (erro) {
    throw new Error('Lista de questões inválida no snapshot pedagógico.');
  }
}

function montarResultadoSnapshotOrientacaoV01400_(obj, reutilizado) {
  return {
    idAtividade: textoOrientacaoV01400_(obj.id_atividade),
    quantidadeQuestoes: Number(obj.quantidade_questoes) || 0,
    versaoSnapshot: Number(obj.versao_snapshot) || 0,
    reutilizado: reutilizado
  };
}

function lerSnapshotAtividadeOrientacaoV01400_(ss, id) {
  const abaAtividades = ss.getSheetByName('ATIVIDADES_PEDAGOGICAS');
  const abaItens = ss.getSheetByName('ITENS_ATIVIDADES_PEDAGOGICAS');
  if (!abaAtividades || !abaItens) throw new Error('Snapshot pedagógico central não disponível.');
  const encontrados = lerRegistrosOrientacaoV01400_(abaAtividades).filter(function(registro) {
    return textoOrientacaoV01400_(registro.obj.id_atividade) === id;
  });
  if (encontrados.length !== 1) throw new Error('A atividade deve possuir exatamente um snapshot pedagógico central.');
  const resumo = encontrados[0].obj;
  const versao = Number(resumo.versao_snapshot);
  const itens = lerRegistrosOrientacaoV01400_(abaItens).filter(function(registro) {
    return textoOrientacaoV01400_(registro.obj.id_atividade) === id &&
      Number(registro.obj.versao_snapshot) === versao;
  }).sort(function(a, b) { return Number(a.obj.ordem) - Number(b.obj.ordem); });
  const ids = itens.map(function(registro, indice) {
    if (Number(registro.obj.ordem) !== indice + 1) throw new Error('Ordem inválida no snapshot pedagógico.');
    return textoOrientacaoV01400_(registro.obj.id_questao);
  });
  const idsResumo = interpretarIdsOrientacaoV01400_(resumo.ids_questoes_json);
  if (!ids.length || Number(resumo.quantidade_questoes) !== ids.length ||
      JSON.stringify(ids) !== JSON.stringify(idsResumo) || new Set(ids).size !== ids.length) {
    throw new Error('Snapshot pedagógico central estruturalmente incompleto.');
  }
  return {
    id: id, titulo: textoOrientacaoV01400_(resumo.titulo),
    descricao: textoOrientacaoV01400_(resumo.descricao),
    professorNome: textoOrientacaoV01400_(resumo.professor_nome), ids: ids
  };
}

function lerFrequenciasOrientacaoV01400_(ss) {
  const aba = ss.getSheetByName('FREQUENCIA_HABILIDADES_ENEM');
  if (!aba || aba.getLastRow() < 2) return null;
  const dados = aba.getDataRange().getValues();
  const headers = dados[0].map(textoOrientacaoV01400_);
  if (JSON.stringify(headers) !== JSON.stringify(FREQUENCIA_HABILIDADES_HEADERS_V01400_)) {
    throw new Error('Schema incompatível em FREQUENCIA_HABILIDADES_ENEM.');
  }
  const registros = dados.slice(1).map(function(linha) {
    return {
      area: textoOrientacaoV01400_(linha[0]).toUpperCase(),
      habilidade: normalizarHabilidadeOrientacaoV01400_(linha[1]),
      quantidade: Number(linha[2]), periodoInicio: Number(linha[3]), periodoFim: Number(linha[4])
    };
  });
  const chaves = new Set();
  registros.forEach(function(registro) {
    const chave = registro.area + '|' + registro.habilidade;
    if (!['CN', 'CH', 'LC', 'MT'].includes(registro.area) || !/^H([1-9]|[12][0-9]|30)$/.test(registro.habilidade) ||
        !Number.isInteger(registro.quantidade) || registro.quantidade < 0 ||
        registro.periodoInicio !== 2016 || registro.periodoFim !== 2025 || chaves.has(chave)) {
      throw new Error('Base FREQUENCIA_HABILIDADES_ENEM inválida: ' + chave);
    }
    chaves.add(chave);
  });
  if (registros.length !== 120 || chaves.size !== 120) {
    throw new Error('FREQUENCIA_HABILIDADES_ENEM deve conter exatamente 120 habilidades.');
  }
  return registros;
}

function normalizarHabilidadeOrientacaoV01400_(valor) {
  const numero = textoOrientacaoV01400_(valor).toUpperCase().replace(/^H/, '');
  return /^\d+$/.test(numero) ? 'H' + Number(numero) : '';
}

function calcularRecorrenciaOrientacaoV01400_(registros, area, habilidade) {
  const codigoArea = textoOrientacaoV01400_(area).toUpperCase();
  const codigoHabilidade = normalizarHabilidadeOrientacaoV01400_(habilidade);
  const areaRegistros = registros.filter(function(item) { return item.area === codigoArea; });
  const atual = areaRegistros.find(function(item) { return item.habilidade === codigoHabilidade; });
  if (!atual || areaRegistros.length !== 30) return recorrenciaIndisponivelOrientacaoV01400_();
  const media = areaRegistros.reduce(function(total, item) { return total + item.quantidade; }, 0) / areaRegistros.length;
  const posicao = 1 + areaRegistros.filter(function(item) { return item.quantidade > atual.quantidade; }).length;
  const classificacao = atual.quantidade >= media * 1.25 ? 'Alta' :
    (atual.quantidade >= media * 0.75 ? 'Média' : 'Baixa');
  return {
    quantidadeItens2016_2025: atual.quantidade,
    mediaArea: Math.round(media * 10) / 10,
    posicaoNaArea: posicao,
    totalHabilidadesArea: areaRegistros.length,
    recorrencia: classificacao
  };
}


function lerBaseOrientacaoV01400_(ss) {
  const aba = ss.getSheetByName('QUESTOES_GERAL');
  if (!aba || aba.getLastRow() < 2) throw new Error('QUESTOES_GERAL não está disponível.');
  const dados = aba.getDataRange().getValues();
  const idx = resolverCamposQuestoesOrientacaoV01400_(dados[0]);
  const porId = new Map();
  const duplicados = new Set();
  dados.slice(1).forEach(function(linha) {
    const id = textoOrientacaoV01400_(linha[idx.id_ocorrencia]);
    if (!id) return;
    if (porId.has(id)) duplicados.add(id); else porId.set(id, linha);
  });
  if (duplicados.size) {
    throw new Error('IDs duplicados em QUESTOES_GERAL: ' + Array.from(duplicados).slice(0, 20).join(', '));
  }
  return { linhas: dados.slice(1), idx: idx, porId: porId };
}

function resolverCamposQuestoesOrientacaoV01400_(headers) {
  const posicoes = {};
  (headers || []).forEach(function(header, indice) {
    const nome = textoOrientacaoV01400_(header);
    if (!nome) return;
    if (!posicoes[nome]) posicoes[nome] = [];
    posicoes[nome].push(indice);
  });
  const resolvido = {};
  Object.keys(CAMPOS_QUESTOES_ORIENTACAO_V01400_).forEach(function(campo) {
    const contrato = CAMPOS_QUESTOES_ORIENTACAO_V01400_[campo];
    const candidatos = [];
    contrato.nomes.forEach(function(nome) {
      (posicoes[nome] || []).forEach(function(indice) {
        candidatos.push({ nome: nome, indice: indice });
      });
    });
    if (candidatos.length > 1) {
      throw new Error('Colunas ambíguas em QUESTOES_GERAL para ' + campo + ': ' +
        candidatos.map(function(item) { return item.nome; }).join(', '));
    }
    if (!candidatos.length) {
      if (contrato.obrigatorio) {
        throw new Error('Coluna ausente em QUESTOES_GERAL para ' + campo +
          '. Nomes aceitos: ' + contrato.nomes.join(', '));
      }
      return;
    }
    resolvido[campo] = candidatos[0].indice;
  });
  return resolvido;
}


function montarItemOrientacaoV01400_(linha, idx, ordem) {
  const valor = function() {
    for (let i = 0; i < arguments.length; i += 1) {
      const coluna = idx[arguments[i]];
      if (coluna !== undefined && linha[coluna] !== '') return linha[coluna];
    }
    return '';
  };
  const statusValidacao = textoOrientacaoV01400_(valor('status_validacao'));
  const maturidade = textoOrientacaoV01400_(valor('maturidade_curadoria'));
  const liberacao = determinarLiberacaoOrientacaoV01400_(statusValidacao, maturidade);
  return {
    id: textoOrientacaoV01400_(valor('id_ocorrencia')),
    ordem: ordem,
    area: derivarAreaIdCanonicoOrientacaoV01400_(valor('id_canonico')),
    componente: textoOrientacaoV01400_(valor('componente')),
    competencia: textoOrientacaoV01400_(valor('competencia')),
    habilidade: textoOrientacaoV01400_(valor('habilidade')),
    objetoPrincipal: textoOrientacaoV01400_(valor('objeto_principal')),
    acaoCognitiva: textoOrientacaoV01400_(valor('acao_cognitiva')),
    dificuldade: textoOrientacaoV01400_(valor('dificuldade')),
    funcaoPedagogica: textoOrientacaoV01400_(valor('funcao_pedagogica')),
    tempoEstimadoMin: Number(valor('tempo_estimado_min')) || 0,
    gabaritoOficial: textoOrientacaoV01400_(valor('gabarito_oficial')),
    ano: textoOrientacaoV01400_(valor('ano')),
    edicao: textoOrientacaoV01400_(valor('edicao')),
    consolidada: liberacao === 'Liberada' || liberacao === 'Liberada com revisão'
  };
}

function derivarAreaIdCanonicoOrientacaoV01400_(idCanonico) {
  const id = textoOrientacaoV01400_(idCanonico).toUpperCase();
  const importado = id.match(/^CAN_(CN|CH|LC|MT)(?:_|$)/);
  const manual = id.match(/^CAN_MAN_(CN|CH|LC|MT)(?:_|$)/);
  const area = importado ? importado[1] : (manual ? manual[1] : '');
  if (!area) {
    throw new Error('id_canonico ausente ou inválido para derivação da área: ' +
      (id || '[vazio]'));
  }
  return area;
}


function determinarLiberacaoOrientacaoV01400_(status, maturidade) {
  if (['Não avaliada', 'Com divergência aberta', 'Aguardando nova avaliação',
       'Suspensa', 'Suspensa pela coordenação'].includes(status) ||
      ['Importada', 'Com divergência', 'Em validação', 'Suspensa'].includes(maturidade)) {
    return 'Bloqueada';
  }
  return determinarLiberacaoPacoteCentralV01120_(status, maturidade);
}


function lerMatrizAprovadaOrientacaoV01400_(ss) {
  const mapa = new Map();
  const aba = ss.getSheetByName('MATRIZ_ENEM_PEDAGOGICA');
  if (!aba || aba.getLastRow() < 2) return mapa;
  const dados = aba.getDataRange().getValues();
  const idx = indexarOrientacaoV01400_(dados[0]);
  ['area', 'competencia', 'habilidade', 'status_revisao'].forEach(function(campo) {
    if (idx[campo] === undefined) throw new Error('Coluna ausente em MATRIZ_ENEM_PEDAGOGICA: ' + campo);
  });
  dados.slice(1).forEach(function(linha) {
    if (normalizarOrientacaoV01400_(linha[idx.status_revisao]) !== 'aprovado') return;
    const area = textoOrientacaoV01400_(linha[idx.area]).toUpperCase();
    const competencia = textoOrientacaoV01400_(linha[idx.competencia]).toUpperCase();
    const habilidade = textoOrientacaoV01400_(linha[idx.habilidade]).toUpperCase();
    const chave = chaveOrientacaoV01400_(area, competencia, habilidade);
    if (mapa.has(chave)) throw new Error('Conteúdo pedagógico aprovado duplicado: ' + chave);
    const campo = function(nome) {
      return idx[nome] === undefined ? '' : textoOrientacaoV01400_(linha[idx[nome]]);
    };
    mapa.set(chave, {
      descricaoCompetencia: campo('descricao_competencia'),
      descricaoHabilidade: campo('descricao_habilidade'),
      verboCentral: campo('verbo_central'),
      operacaoCognitiva: campo('operacao_cognitiva'),
      interpretacaoPedagogica: campo('interpretacao_pedagogica'),
      expectativaAprendizagem: campo('expectativa_aprendizagem'),
      evidenciasDominio: campo('evidencias_de_dominio'),
      dificuldadesFrequentes: campo('dificuldades_frequentes'),
      perguntasDiagnosticas: campo('perguntas_diagnosticas'),
      antesDaQuestao: campo('antes_da_questao') || campo('como_trabalhar_antes'),
      duranteAQuestao: campo('durante_a_questao') || campo('como_trabalhar_durante'),
      depoisDaQuestao: campo('depois_da_questao') || campo('como_trabalhar_depois'),
      retomada: campo('retomada') || campo('intervencao_retomada'),
      mediacao: campo('mediacao') || campo('intervencao_mediacao'),
      consolidacao: campo('consolidacao') || campo('intervencao_consolidacao'),
      orientacoesIntervencao: campo('orientacoes_intervencao'),
      versao: campo('versao'), revisadoPor: campo('revisado_por'),
      revisadoEm: campo('revisado_em')
    });
  });
  return mapa;
}


function agruparHabilidadesOrientacaoV01400_(itens) {
  const mapa = new Map();
  itens.forEach(function(item) {
    const chave = chaveOrientacaoV01400_(item.area, item.competencia, item.habilidade);
    if (!mapa.has(chave)) mapa.set(chave, {
      area: item.area, competencia: item.competencia, habilidade: item.habilidade,
      componentes: [], itens: []
    });
    const grupo = mapa.get(chave);
    if (item.componente && !grupo.componentes.includes(item.componente)) grupo.componentes.push(item.componente);
    grupo.itens.push(item);
  });
  return Array.from(mapa.values());
}


function montarPanoramaOrientacaoV01400_(itens, habilidades) {
  return {
    areas: valoresUnicosOrientacaoV01400_(itens, 'area'),
    componentes: valoresUnicosOrientacaoV01400_(itens, 'componente'),
    competencias: valoresUnicosOrientacaoV01400_(itens, 'competencia'),
    habilidades: valoresUnicosOrientacaoV01400_(itens, 'habilidade'),
    dificuldades: contarValoresOrientacaoV01400_(itens, 'dificuldade'),
    funcoesPedagogicas: contarValoresOrientacaoV01400_(itens, 'funcaoPedagogica'),
    tabelaHabilidades: habilidades.map(function(item) {
      return {
        habilidade: item.habilidade, questoes: item.questoes,
        quantidadeItens2016_2025: item.recorrencia.quantidadeItens2016_2025,
        mediaArea: item.recorrencia.mediaArea, recorrencia: item.recorrencia.recorrencia
      };
    })
  };
}


function montarSinteseOrientacaoV01400_(itens, habilidades) {
  const maiorPresenca = Math.max.apply(null, habilidades.map(function(h) { return h.quantidadeQuestoes; }));
  return {
    habilidadesMaisPresentes: habilidades.filter(function(h) { return h.quantidadeQuestoes === maiorPresenca; })
      .map(function(h) { return h.habilidade; }),
    habilidadesMaiorRecorrencia: habilidades.filter(function(h) {
      return h.recorrencia.recorrencia === 'Alta';
    }).map(function(h) { return h.habilidade; }),
    operacoesCognitivas: valoresUnicosOrientacaoV01400_(itens, 'acaoCognitiva'),
    dificuldades: contarValoresOrientacaoV01400_(itens, 'dificuldade'),
    funcoesPedagogicas: contarValoresOrientacaoV01400_(itens, 'funcaoPedagogica')
  };
}


function removerIdTecnicoOrientacaoV01400_(item) {
  return {
    ordem: item.ordem, objetoPrincipal: item.objetoPrincipal,
    acaoCognitiva: item.acaoCognitiva, dificuldade: item.dificuldade,
    funcaoPedagogica: item.funcaoPedagogica, tempoEstimadoMin: item.tempoEstimadoMin,
    gabaritoOficial: item.gabaritoOficial, ano: item.ano, edicao: item.edicao
  };
}


function valoresUnicosOrientacaoV01400_(itens, campo) {
  return Array.from(new Set(itens.map(function(item) { return item[campo]; }).filter(Boolean)));
}


function contarValoresOrientacaoV01400_(itens, campo) {
  const mapa = {};
  itens.forEach(function(item) {
    const valor = item[campo] || 'Não informado';
    mapa[valor] = (mapa[valor] || 0) + 1;
  });
  return mapa;
}


function recorrenciaIndisponivelOrientacaoV01400_() {
  return { quantidadeItens2016_2025: null, mediaArea: null, posicaoNaArea: null,
    totalHabilidadesArea: null, recorrencia: 'Indisponível' };
}


function chaveOrientacaoV01400_(area, competencia, habilidade) {
  return [area, competencia, habilidade].map(function(v) { return textoOrientacaoV01400_(v).toUpperCase(); }).join('|');
}


function indexarOrientacaoV01400_(headers) {
  return headers.reduce(function(mapa, header, indice) {
    mapa[textoOrientacaoV01400_(header)] = indice;
    return mapa;
  }, {});
}


function textoOrientacaoV01400_(valor) {
  return valor === null || valor === undefined ? '' : String(valor).replace(/\s+/g, ' ').trim();
}


function normalizarOrientacaoV01400_(valor) {
  return textoOrientacaoV01400_(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
