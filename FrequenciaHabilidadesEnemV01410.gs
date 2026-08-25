/**
 * NAVE | FREQUÊNCIA HISTÓRICA ENEM — V0.14.10
 *
 * Carga administrativa, reexecutável e não exposta por HTTP.
 * Fonte factual: n_itens_validos_total do mapa histórico do Painel NAVE.
 */
const NAVE_FREQUENCIA_HABILIDADES_V01410_ = Object.freeze({
  ABA: 'FREQUENCIA_HABILIDADES_ENEM',
  CABECALHOS: Object.freeze([
    'area', 'habilidade', 'quantidade_itens_validos_2016_2025',
    'periodo_inicio', 'periodo_fim', 'fonte', 'gerado_em'
  ]),
  AREAS: Object.freeze(['CN', 'CH', 'LC', 'MT']),
  FONTE: 'Painel NAVE ENEM — mapa_habilidades_historico_2016_2025.csv',
  REGISTROS: Object.freeze([
  ['CH', 'H1', 20],
  ['CH', 'H2', 14],
  ['CH', 'H3', 19],
  ['CH', 'H4', 16],
  ['CH', 'H5', 18],
  ['CH', 'H6', 18],
  ['CH', 'H7', 16],
  ['CH', 'H8', 16],
  ['CH', 'H9', 12],
  ['CH', 'H10', 10],
  ['CH', 'H11', 19],
  ['CH', 'H12', 14],
  ['CH', 'H13', 11],
  ['CH', 'H14', 13],
  ['CH', 'H15', 18],
  ['CH', 'H16', 15],
  ['CH', 'H17', 11],
  ['CH', 'H18', 13],
  ['CH', 'H19', 15],
  ['CH', 'H20', 10],
  ['CH', 'H21', 14],
  ['CH', 'H22', 13],
  ['CH', 'H23', 20],
  ['CH', 'H24', 16],
  ['CH', 'H25', 11],
  ['CH', 'H26', 19],
  ['CH', 'H27', 18],
  ['CH', 'H28', 10],
  ['CH', 'H29', 12],
  ['CH', 'H30', 15],
  ['CN', 'H1', 18],
  ['CN', 'H2', 17],
  ['CN', 'H3', 19],
  ['CN', 'H4', 12],
  ['CN', 'H5', 17],
  ['CN', 'H6', 15],
  ['CN', 'H7', 14],
  ['CN', 'H8', 15],
  ['CN', 'H9', 14],
  ['CN', 'H10', 12],
  ['CN', 'H11', 11],
  ['CN', 'H12', 13],
  ['CN', 'H13', 10],
  ['CN', 'H14', 16],
  ['CN', 'H15', 13],
  ['CN', 'H16', 12],
  ['CN', 'H17', 19],
  ['CN', 'H18', 15],
  ['CN', 'H19', 16],
  ['CN', 'H20', 19],
  ['CN', 'H21', 16],
  ['CN', 'H22', 16],
  ['CN', 'H23', 16],
  ['CN', 'H24', 19],
  ['CN', 'H25', 13],
  ['CN', 'H26', 12],
  ['CN', 'H27', 13],
  ['CN', 'H28', 15],
  ['CN', 'H29', 13],
  ['CN', 'H30', 9],
  ['LC', 'H1', 15],
  ['LC', 'H2', 11],
  ['LC', 'H3', 12],
  ['LC', 'H4', 15],
  ['LC', 'H5', 26],
  ['LC', 'H6', 27],
  ['LC', 'H7', 24],
  ['LC', 'H8', 23],
  ['LC', 'H9', 17],
  ['LC', 'H10', 14],
  ['LC', 'H11', 11],
  ['LC', 'H12', 18],
  ['LC', 'H13', 12],
  ['LC', 'H14', 18],
  ['LC', 'H15', 19],
  ['LC', 'H16', 28],
  ['LC', 'H17', 21],
  ['LC', 'H18', 18],
  ['LC', 'H19', 12],
  ['LC', 'H20', 15],
  ['LC', 'H21', 14],
  ['LC', 'H22', 16],
  ['LC', 'H23', 16],
  ['LC', 'H24', 15],
  ['LC', 'H25', 15],
  ['LC', 'H26', 11],
  ['LC', 'H27', 11],
  ['LC', 'H28', 13],
  ['LC', 'H29', 13],
  ['LC', 'H30', 15],
  ['MT', 'H1', 16],
  ['MT', 'H2', 19],
  ['MT', 'H3', 20],
  ['MT', 'H4', 18],
  ['MT', 'H5', 13],
  ['MT', 'H6', 15],
  ['MT', 'H7', 13],
  ['MT', 'H8', 18],
  ['MT', 'H9', 16],
  ['MT', 'H10', 10],
  ['MT', 'H11', 14],
  ['MT', 'H12', 17],
  ['MT', 'H13', 12],
  ['MT', 'H14', 12],
  ['MT', 'H15', 13],
  ['MT', 'H16', 14],
  ['MT', 'H17', 13],
  ['MT', 'H18', 13],
  ['MT', 'H19', 16],
  ['MT', 'H20', 15],
  ['MT', 'H21', 15],
  ['MT', 'H22', 13],
  ['MT', 'H23', 9],
  ['MT', 'H24', 13],
  ['MT', 'H25', 18],
  ['MT', 'H26', 17],
  ['MT', 'H27', 16],
  ['MT', 'H28', 18],
  ['MT', 'H29', 15],
  ['MT', 'H30', 11]
  ])
});

function carregarFrequenciaHabilidadesEnemV01410() {
  const ss = obterSpreadsheetOfflineSyncV070_();
  const agora = new Date();
  const linhas = validarFrequenciasHabilidadesEnemV01410_(
    NAVE_FREQUENCIA_HABILIDADES_V01410_.REGISTROS.map(function(item) {
      return [
        item[0], item[1], item[2], 2016, 2025,
        NAVE_FREQUENCIA_HABILIDADES_V01410_.FONTE, agora
      ];
    })
  );

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    let aba = ss.getSheetByName(NAVE_FREQUENCIA_HABILIDADES_V01410_.ABA);
    if (!aba) aba = ss.insertSheet(NAVE_FREQUENCIA_HABILIDADES_V01410_.ABA);

    const matriz = [NAVE_FREQUENCIA_HABILIDADES_V01410_.CABECALHOS.slice()]
      .concat(linhas);
    aba.getRange(1, 1, matriz.length, matriz[0].length).setValues(matriz);

    const linhasExtras = aba.getLastRow() - matriz.length;
    if (linhasExtras > 0) {
      aba.getRange(matriz.length + 1, 1, linhasExtras, Math.max(aba.getLastColumn(), 1))
        .clearContent();
    }
    const colunasExtras = aba.getLastColumn() - matriz[0].length;
    if (colunasExtras > 0) {
      aba.getRange(1, matriz[0].length + 1, Math.max(aba.getLastRow(), 1), colunasExtras)
        .clearContent();
    }

    const conferencia = validarFrequenciasHabilidadesEnemV01410_(
      aba.getRange(2, 1, 120, 7).getValues()
    );
    const resultado = {
      ok: true,
      aba: NAVE_FREQUENCIA_HABILIDADES_V01410_.ABA,
      quantidade: conferencia.length,
      porArea: contarPorAreaFrequenciasV01410_(conferencia),
      fonte: NAVE_FREQUENCIA_HABILIDADES_V01410_.FONTE,
      geradoEm: agora.toISOString()
    };
    Logger.log(JSON.stringify(resultado));
    return resultado;
  } finally {
    lock.releaseLock();
  }
}

function validarFrequenciasHabilidadesEnemV01410_(linhas) {
  if (!Array.isArray(linhas) || linhas.length !== 120) {
    throw new Error('A frequência histórica deve conter exatamente 120 registros.');
  }
  const chaves = new Set();
  const porArea = {};
  linhas.forEach(function(linha, indice) {
    if (!Array.isArray(linha) || linha.length !== 7) {
      throw new Error('Registro histórico inválido na posição ' + (indice + 1) + '.');
    }
    const area = String(linha[0] || '').trim().toUpperCase();
    const habilidade = normalizarHabilidadeFrequenciaV01410_(linha[1]);
    const quantidade = Number(linha[2]);
    const inicio = Number(linha[3]);
    const fim = Number(linha[4]);
    const fonte = String(linha[5] || '').trim();
    const geradoEm = linha[6];
    if (!NAVE_FREQUENCIA_HABILIDADES_V01410_.AREAS.includes(area)) {
      throw new Error('Área histórica inválida na posição ' + (indice + 1) + ': ' + area);
    }
    if (!habilidade) {
      throw new Error('Habilidade histórica inválida na posição ' + (indice + 1) + '.');
    }
    if (!Number.isInteger(quantidade) || quantidade < 0) {
      throw new Error('Quantidade histórica inválida para ' + area + '|' + habilidade + '.');
    }
    if (inicio !== 2016 || fim !== 2025) {
      throw new Error('Período histórico inválido para ' + area + '|' + habilidade + '.');
    }
    if (!fonte || !geradoEm) {
      throw new Error('Fonte ou data de geração ausente para ' + area + '|' + habilidade + '.');
    }
    const chave = area + '|' + habilidade;
    if (chaves.has(chave)) throw new Error('Chave histórica duplicada: ' + chave);
    chaves.add(chave);
    porArea[area] = (porArea[area] || 0) + 1;
    linha[0] = area;
    linha[1] = habilidade;
    linha[2] = quantidade;
    linha[3] = inicio;
    linha[4] = fim;
    linha[5] = fonte;
  });
  NAVE_FREQUENCIA_HABILIDADES_V01410_.AREAS.forEach(function(area) {
    if (porArea[area] !== 30) throw new Error('A área ' + area + ' deve possuir exatamente 30 habilidades.');
    for (let numero = 1; numero <= 30; numero += 1) {
      const chave = area + '|H' + numero;
      if (!chaves.has(chave)) throw new Error('Cobertura histórica ausente: ' + chave);
    }
  });
  return linhas;
}

function normalizarHabilidadeFrequenciaV01410_(valor) {
  const texto = String(valor || '').trim().toUpperCase();
  const match = texto.match(/^H?0*([1-9]|[12][0-9]|30)$/);
  return match ? 'H' + Number(match[1]) : '';
}

function contarPorAreaFrequenciasV01410_(linhas) {
  return linhas.reduce(function(mapa, linha) {
    mapa[linha[0]] = (mapa[linha[0]] || 0) + 1;
    return mapa;
  }, {});
}

