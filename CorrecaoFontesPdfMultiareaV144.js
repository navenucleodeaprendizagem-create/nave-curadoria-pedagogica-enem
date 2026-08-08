/**
 * NAVE | RESOLUÇÃO MULTIAREA DE FONTES PDF — V1.4.4
 *
 * Substitui a correção V1.4.3 do "Visualizar questão".
 *
 * Objetivo:
 * - preservar o comportamento já funcional de CN;
 * - resolver CH, MT e LC usando a aba FONTES_PDF;
 * - priorizar coleção + área + componente;
 * - usar coleção + área como fallback;
 * - manter coleção isolada como compatibilidade legada;
 * - preservar url_pdf_manual para questões cadastradas manualmente.
 */


/* =========================================================
   FUNÇÃO CHAMADA PELO FRONT-END
   ========================================================= */

function obterQuestaoWebV140(idQuestao) {
  const id = String(idQuestao || '').trim();

  if (!id) {
    throw new Error('ID da questão não informado.');
  }

  const ss = SpreadsheetApp.getActive();
  const base = ss.getSheetByName('QUESTOES_GERAL');

  if (!base || base.getLastRow() < 2) {
    throw new Error('A aba QUESTOES_GERAL não foi encontrada ou está vazia.');
  }

  const valores = base.getDataRange().getValues();
  const idx = indexarFonteWebV144_(valores[0]);

  if (idx.id_ocorrencia === undefined) {
    throw new Error('Campo id_ocorrencia ausente em QUESTOES_GERAL.');
  }

  const r = valores.slice(1).find(linha =>
    String(linha[idx.id_ocorrencia] || '').trim() === id
  );

  if (!r) {
    throw new Error('Questão não encontrada: ' + id);
  }

  /*
   * Mantemos a leitura consolidada antiga para não alterar
   * campos já validados do modal.
   */
  const dados = obterDadosQuestaoCompletaV04(id);

  const colecao = valorFonteWebV144_(r, idx, 'colecao_origem');
  const componente = valorFonteWebV144_(r, idx, 'componente_principal');
  const areaInformada = valorFonteWebV144_(r, idx, 'area');
  const area = areaInformada || inferirAreaFonteWebV144_(id, componente);

  /*
   * Questão cadastrada manualmente tem prioridade absoluta.
   */
  const urlManual = valorFonteWebV144_(r, idx, 'url_pdf_manual');

  if (urlManual) {
    dados.urlPdf = urlManual;
    dados.pdfDisponivel = true;
    dados.statusFonte = 'Fonte cadastrada manualmente';
    return dados;
  }

  /*
   * Para as questões do banco, resolvemos a fonte pelo catálogo.
   */
  const fonte = resolverFontePdfWebV144_(
    ss,
    colecao,
    area,
    componente
  );

  dados.urlPdf = fonte.url;
  dados.pdfDisponivel = fonte.disponivel;
  dados.statusFonte = fonte.status;

  return dados;
}


function obterQuestaoWebV142(idQuestao) {
  return obterQuestaoWebV140(idQuestao);
}


/* =========================================================
   RESOLVEDOR DE FONTES
   ========================================================= */

function resolverFontePdfWebV144_(
  ss,
  colecao,
  area,
  componente
) {
  const aba = ss.getSheetByName('FONTES_PDF');

  if (!aba || aba.getLastRow() < 2) {
    return {
      disponivel: false,
      url: '',
      status: 'FONTES_PDF não configurada'
    };
  }

  const dados = aba.getDataRange().getValues();
  const idx = indexarFonteWebV144_(dados[0]);

  const obrigatorios = [
    'colecao_origem',
    'area',
    'componente',
    'url_pdf',
    'status_fonte'
  ];

  const ausentes = obrigatorios.filter(
    campo => idx[campo] === undefined
  );

  if (ausentes.length) {
    return {
      disponivel: false,
      url: '',
      status:
        'Campos ausentes em FONTES_PDF: ' +
        ausentes.join(', ')
    };
  }

  const alvoColecao = normalizarFonteWebV144_(colecao);
  const alvoArea = normalizarFonteWebV144_(area);
  const alvoComponente = normalizarComponenteFonteWebV144_(componente);

  const linhas = dados.slice(1)
    .map(r => ({
      colecao:
        normalizarFonteWebV144_(r[idx.colecao_origem]),
      area:
        normalizarFonteWebV144_(r[idx.area]),
      componente:
        normalizarComponenteFonteWebV144_(r[idx.componente]),
      url:
        String(r[idx.url_pdf] || '').trim(),
      status:
        String(r[idx.status_fonte] || '').trim(),
      nome:
        idx.nome_publico === undefined
          ? ''
          : String(r[idx.nome_publico] || '').trim()
    }))
    .filter(x => x.colecao);

  /*
   * 1. coleção + área + componente
   */
  let fonte = linhas.find(x =>
    x.colecao === alvoColecao &&
    x.area === alvoArea &&
    x.componente === alvoComponente
  );

  /*
   * 2. coleção + área
   *
   * Este fallback preserva exatamente o comportamento já
   * comprovado em CN: a fonte pode estar cadastrada como
   * "Química", mas o mesmo PDF atende Física e Biologia.
   */
  if (!fonte) {
    fonte = linhas.find(x =>
      x.colecao === alvoColecao &&
      x.area === alvoArea
    );
  }

  /*
   * 3. coleção isolada — compatibilidade com a versão antiga.
   */
  if (!fonte) {
    fonte = linhas.find(x =>
      x.colecao === alvoColecao
    );
  }

  if (!fonte) {
    return {
      disponivel: false,
      url: '',
      status:
        'Fonte não localizada para ' +
        [
          colecao || '?',
          area || '?',
          componente || '?'
        ].join(' · ')
    };
  }

  const disponivel =
    Boolean(fonte.url) &&
    normalizarFonteWebV144_(fonte.status) === 'disponivel';

  return {
    disponivel,
    url: fonte.url,
    status: disponivel
      ? 'Disponível'
      : (fonte.status || 'Fonte sem URL')
  };
}


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function indexarFonteWebV144_(headers) {
  return headers.reduce((mapa, h, i) => {
    const chave = String(h || '').trim();
    if (chave) mapa[chave] = i;
    return mapa;
  }, {});
}


function valorFonteWebV144_(linha, idx, campo) {
  if (idx[campo] === undefined) return '';
  return String(linha[idx[campo]] || '').trim();
}


function normalizarFonteWebV144_(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}


function normalizarComponenteFonteWebV144_(valor) {
  const v = normalizarFonteWebV144_(valor);

  const aliases = {
    'lingua portuguesa': 'portugues',
    'portugues': 'portugues',
    'língua portuguesa': 'portugues',
    'historia': 'historia',
    'geografia': 'geografia',
    'filosofia': 'filosofia',
    'sociologia': 'sociologia',
    'matematica': 'matematica',
    'quimica': 'quimica',
    'fisica': 'fisica',
    'biologia': 'biologia'
  };

  return aliases[v] || v;
}


function inferirAreaFonteWebV144_(id, componente) {
  const codigo = String(id || '').toUpperCase();

  if (/_CH_/.test(codigo)) return 'CH';
  if (/_MT_/.test(codigo)) return 'MT';
  if (/_LC_/.test(codigo)) return 'LC';
  if (/_CN_/.test(codigo)) return 'CN';

  const c = normalizarComponenteFonteWebV144_(componente);

  if (['quimica', 'fisica', 'biologia'].includes(c)) {
    return 'CN';
  }

  if (
    ['historia', 'geografia', 'filosofia', 'sociologia'].includes(c)
  ) {
    return 'CH';
  }

  if (c === 'matematica') return 'MT';

  if (
    [
      'portugues',
      'literatura',
      'lingua estrangeira moderna',
      'educacao fisica',
      'artes',
      'tecnologias da comunicacao e informacao'
    ].includes(c)
  ) {
    return 'LC';
  }

  return '';
}
