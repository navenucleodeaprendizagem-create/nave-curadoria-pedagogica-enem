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
    'interpretacao_pedagogica',
    'operacao_cognitiva',
    'expectativa_aprendizagem',
    'dificuldades_frequentes',
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

  if (
    atuais.length !== esperados.length ||
    esperados.some(function(h, i) { return atuais[i] !== h; })
  ) {
    throw new Error('Schema incompatível em MATRIZ_ENEM_PEDAGOGICA.');
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
