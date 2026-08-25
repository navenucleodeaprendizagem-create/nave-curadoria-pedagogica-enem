/**
 * MATRIZ ENEM PEDAGÓGICA — V0.13.20
 * Estrutura institucional; não gera conteúdo interpretativo automaticamente.
 */

const MATRIZ_ENEM_PEDAGOGICA_V01320 = Object.freeze({
  ABA: 'MATRIZ_ENEM_PEDAGOGICA',
  CABECALHOS: Object.freeze([
    'area',
    'componente',
    'competencia',
    'descricao_competencia',
    'habilidade',
    'descricao_habilidade',
    'verbo_central',
    'interpretacao_pedagogica',
    'operacao_cognitiva',
    'expectativa_aprendizagem',
    'evidencias_de_dominio',
    'dificuldades_frequentes',
    'perguntas_diagnosticas',
    'antes_da_questao',
    'durante_a_questao',
    'depois_da_questao',
    'retomada',
    'mediacao',
    'consolidacao',
    'orientacoes_intervencao',
    'versao',
    'revisado_por',
    'revisado_em',
    'status_revisao'
  ]),
  AREAS: Object.freeze(['CN', 'CH', 'LC', 'MT'])
});


function garantirMatrizEnemPedagogicaV01320_(ss) {
  let aba = ss.getSheetByName(MATRIZ_ENEM_PEDAGOGICA_V01320.ABA);

  if (!aba) {
    aba = ss.insertSheet(MATRIZ_ENEM_PEDAGOGICA_V01320.ABA);
  }

  const esperados = Array.from(MATRIZ_ENEM_PEDAGOGICA_V01320.CABECALHOS);
  if (aba.getLastRow() === 0) {
    aba.getRange(1, 1, 1, esperados.length).setValues([esperados]);
    aba.setFrozenRows(1);
    return aba;
  }

  const atuais = aba.getRange(1, 1, 1, Math.max(aba.getLastColumn(), 1))
    .getDisplayValues()[0]
    .map(function(x) { return String(x || '').trim(); });

  const duplicados = atuais.filter(function(header, indice) {
    return header && atuais.indexOf(header) !== indice;
  });
  if (duplicados.length) {
    throw new Error('Cabeçalhos duplicados em MATRIZ_ENEM_PEDAGOGICA: ' +
      Array.from(new Set(duplicados)).join(', '));
  }
  const desconhecidos = atuais.filter(function(header) {
    return header && !esperados.includes(header);
  });
  if (desconhecidos.length) {
    throw new Error('Colunas não reconhecidas em MATRIZ_ENEM_PEDAGOGICA: ' +
      desconhecidos.join(', '));
  }
  const ausentes = esperados.filter(function(header) {
    return !atuais.includes(header);
  });
  if (ausentes.length) {
    aba.getRange(1, aba.getLastColumn() + 1, 1, ausentes.length)
      .setValues([ausentes]);
  }

  return aba;
}


function listarMatrizEnemPedagogicaAprovadaV01320_(ss) {
  const aba = garantirMatrizEnemPedagogicaV01320_(ss);
  if (aba.getLastRow() < 2) return [];

  const dados = aba.getDataRange().getValues();
  const idx = dados[0].reduce(function(m, h, i) {
    m[String(h || '').trim()] = i;
    return m;
  }, {});
  const chaves = new Set();

  return dados.slice(1).filter(function(linha) {
    return normalizarMatrizPedagogicaV01320_(linha[idx.status_revisao]) ===
      'aprovado';
  }).map(function(linha) {
    const area = String(linha[idx.area] || '').trim().toUpperCase();
    const competencia = String(linha[idx.competencia] || '').trim().toUpperCase();
    const habilidade = String(linha[idx.habilidade] || '').trim().toUpperCase();
    const chave = [area, competencia, habilidade].join('|');

    if (!MATRIZ_ENEM_PEDAGOGICA_V01320.AREAS.includes(area)) {
      throw new Error('Área inválida na matriz pedagógica: ' + area);
    }
    if (!competencia || !habilidade) {
      throw new Error('Competência/habilidade ausente na matriz pedagógica.');
    }
    if (chaves.has(chave)) {
      throw new Error('Chave duplicada na matriz pedagógica: ' + chave);
    }
    chaves.add(chave);

    const item = {};
    dados[0].forEach(function(header, i) {
      item[String(header)] = linha[i];
    });
    return item;
  });
}


function normalizarMatrizPedagogicaV01320_(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
