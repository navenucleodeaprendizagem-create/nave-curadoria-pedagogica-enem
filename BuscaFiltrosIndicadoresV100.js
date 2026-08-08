/**
 * NAVE — BUSCA, FILTROS E INDICADORES DE VALIDAÇÃO
 * Consolidação estrutural V1.0
 *
 * Reúne, sem mudar os nomes públicos nem a lógica validada:
 * - filtros dependentes do painel;
 * - busca oficial com filtro de validação;
 * - score, ordenação e seleção por tempo;
 * - indicadores da busca;
 * - indicadores visuais de validação.
 */

/* ==========================================================
   BLOCO 1 — FILTROS E FUNÇÕES AUXILIARES DO NÚCLEO
   ========================================================== */

function atualizarFiltrosDependentes() {
  const ss = SpreadsheetApp.getActive();
  const painel = ss.getSheetByName(NAVE_MVP.ABAS.PAINEL);
  const base = ss.getSheetByName(NAVE_MVP.ABAS.BASE);
  if (!painel || !base) return;

  const dados = base.getDataRange().getValues();
  const idx = indexarCabecalhos_(dados[0]);

  let quimica = dados.slice(1).filter(r =>
    String(r[idx.componente_principal]).trim() === 'Química'
  );

  const habilidade = limparFiltro_(painel.getRange('B4').getDisplayValue());
  const competencia = limparFiltro_(painel.getRange('B5').getDisplayValue());
  const objeto = limparFiltro_(painel.getRange('B6').getDisplayValue());

  let paraObjetos = quimica;
  if (habilidade) paraObjetos = paraObjetos.filter(r => String(r[idx.habilidade]) === habilidade);
  if (competencia) paraObjetos = paraObjetos.filter(r => String(r[idx.competencia]) === competencia);

  let paraHabilidades = quimica;
  if (objeto) paraHabilidades = paraHabilidades.filter(r => String(r[idx.objeto_principal]) === objeto);
  if (competencia) paraHabilidades = paraHabilidades.filter(r => String(r[idx.competencia]) === competencia);

  let paraDificuldades = quimica;
  if (habilidade) paraDificuldades = paraDificuldades.filter(r => String(r[idx.habilidade]) === habilidade);
  if (objeto) paraDificuldades = paraDificuldades.filter(r => String(r[idx.objeto_principal]) === objeto);

  aplicarListaValidacao_(painel.getRange('B4'),
    ['Todas'].concat(unicosDeLinhas_(paraHabilidades, idx.habilidade))
  );
  aplicarListaValidacao_(painel.getRange('B6'),
    ['Todos'].concat(unicosDeLinhas_(paraObjetos, idx.objeto_principal))
  );
  aplicarListaValidacao_(painel.getRange('B7'),
    ['Todas'].concat(unicosDeLinhas_(paraDificuldades, idx.dificuldade_rotulo))
  );

  aplicarListaValidacao_(painel.getRange('B5'),
    ['Todas'].concat(unicosDeLinhas_(quimica, idx.competencia))
  );
  aplicarListaValidacao_(painel.getRange('B8'),
    ['Todos'].concat(unicosDeLinhas_(quimica, idx.ano))
  );
  aplicarListaValidacao_(painel.getRange('B9'),
    ['Todas'].concat(unicosDeLinhas_(quimica, idx.edicao))
  );
  aplicarListaValidacao_(painel.getRange('B10'),
    ['Todas'].concat(unicosDeLinhas_(quimica, idx.funcao_pedagogica_sugerida))
  );
}

function aplicarListaValidacao_(range, valores) {
  const atual = range.getDisplayValue();
  range.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(valores, true)
      .setAllowInvalid(false)
      .build()
  );
  if (atual && !valores.map(String).includes(String(atual))) {
    range.setValue(valores[0]);
  }
}

function buscarQuestoesQuimicaV03_backup() {
  const ss = SpreadsheetApp.getActive();
  validarBase_(ss);
  garantirEstruturaResultadoV03_(ss);

  const painel = ss.getSheetByName(NAVE_MVP.ABAS.PAINEL);
  const resultado = ss.getSheetByName(NAVE_MVP.ABAS.RESULTADO);
  const base = ss.getSheetByName(NAVE_MVP.ABAS.BASE);

  const filtros = {
    habilidade: limparFiltro_(painel.getRange('B4').getDisplayValue()),
    competencia: limparFiltro_(painel.getRange('B5').getDisplayValue()),
    objeto: limparFiltro_(painel.getRange('B6').getDisplayValue()),
    dificuldade: limparFiltro_(painel.getRange('B7').getDisplayValue()),
    ano: limparFiltro_(painel.getRange('B8').getDisplayValue()),
    edicao: limparFiltro_(painel.getRange('B9').getDisplayValue()),
    funcao: limparFiltro_(painel.getRange('B10').getDisplayValue()),
    status: limparFiltro_(painel.getRange('B11').getDisplayValue()),
    quantidade: Number(painel.getRange('B12').getValue()) || 20,
    tempo: Number(painel.getRange('B13').getValue()) || 999999,
    modo: painel.getRange('B14').getDisplayValue() || 'Pedagógica progressiva'
  };

  const dados = base.getDataRange().getValues();
  const idx = indexarCabecalhos_(dados[0]);
  let candidatos = [];

  for (let i=1;i<dados.length;i++) {
    const r = dados[i];

    if (String(r[idx.componente_principal]).trim() !== 'Química') continue;
    if (['Arquivada','Devolvida'].includes(String(r[idx.status_item]).trim())) continue;
    if (String(r[idx.status_curadoria]).trim() === 'Suspensa para revisão') continue;

    if (!corresponde_(r[idx.habilidade], filtros.habilidade)) continue;
    if (!corresponde_(r[idx.competencia], filtros.competencia)) continue;
    if (!corresponde_(r[idx.objeto_principal], filtros.objeto)) continue;
    if (!corresponde_(r[idx.dificuldade_rotulo], filtros.dificuldade)) continue;
    if (!corresponde_(r[idx.ano], filtros.ano)) continue;
    if (!corresponde_(r[idx.edicao], filtros.edicao)) continue;
    if (!corresponde_(r[idx.funcao_pedagogica_sugerida], filtros.funcao)) continue;
    if (!corresponde_(r[idx.status_curadoria], filtros.status)) continue;

    const score = calcularScore_(r,idx,filtros);
    candidatos.push({
      row:r,
      score,
      motivo:explicarScore_(r,idx,filtros,score),
      faixa:Number(r[idx.dificuldade_faixa])||3,
      tempo:Number(r[idx.tempo_estimado_min])||0,
      alerta:detectarAlertaTrecho_(r[idx.trecho_inicial])
    });
  }

  candidatos = ordenarCandidatos_(candidatos,filtros.modo);
  const selecionados = selecionarRespeitandoTempo_(
    candidatos,filtros.quantidade,filtros.tempo,filtros.modo
  );

  const saida = selecionados.map(c => {
    const r=c.row;
    return [
      false,r[idx.id_ocorrencia],r[idx.ano],r[idx.edicao],
      r[idx.competencia],r[idx.habilidade],r[idx.objeto_principal],
      r[idx.dificuldade_rotulo],r[idx.funcao_pedagogica_sugerida],
      c.tempo,r[idx.trecho_inicial],r[idx.status_curadoria],
      r[idx.quantidade_reportes],r[idx.possui_reporte_aberto],
      c.score,c.motivo,c.alerta
    ];
  });

  resultado.getRange(
    2,1,Math.max(resultado.getMaxRows()-1,1),17
  ).clearContent().clearDataValidations().setBackground(null);

  if (saida.length) {
    resultado.getRange(2,1,saida.length,17).setValues(saida);
    resultado.getRange(2,1,saida.length,1).insertCheckboxes();
    resultado.getRange(2,1,saida.length,17).setWrap(true).setVerticalAlignment('top');

    saida.forEach((r,i) => {
      if (r[16]) {
        resultado.getRange(i+2,11,1,7).setBackground(NAVE_MVP.COR_ALERTA);
      }
    });
  }

  atualizarIndicadoresBusca_(painel,saida);
  atualizarIndicadoresSelecao_();
  ss.setActiveSheet(resultado);
}

function calcularScore_(r,idx,filtros) {
  let score=50;

  if (filtros.habilidade && String(r[idx.habilidade])===filtros.habilidade) score+=25;
  if (filtros.objeto && String(r[idx.objeto_principal])===filtros.objeto) score+=25;
  if (filtros.dificuldade && String(r[idx.dificuldade_rotulo])===filtros.dificuldade) score+=15;
  if (filtros.funcao && String(r[idx.funcao_pedagogica_sugerida])===filtros.funcao) score+=15;

  const status=String(r[idx.status_curadoria]||'');
  if (status==='Homologada') score+=15;
  else if (status==='Revisada') score+=10;
  else if (status==='Corrigida') score+=7;
  else if (status==='Com reporte aberto') score-=15;

  score-=Math.min((Number(r[idx.quantidade_reportes])||0)*2,10);

  const alerta=detectarAlertaTrecho_(r[idx.trecho_inicial]);
  if (alerta) score-=12;

  return Math.max(0,Math.round(score));
}

function explicarScore_(r,idx,filtros,score) {
  const motivos=[];
  if (filtros.habilidade) motivos.push('habilidade aderente');
  if (filtros.objeto) motivos.push('objeto aderente');
  if (filtros.dificuldade) motivos.push('dificuldade aderente');
  if (filtros.funcao) motivos.push('função pedagógica aderente');

  const status=String(r[idx.status_curadoria]||'');
  if (['Homologada','Revisada','Corrigida'].includes(status)) motivos.push('registro revisado');
  if (status==='Com reporte aberto') motivos.push('reporte aberto');

  const alerta=detectarAlertaTrecho_(r[idx.trecho_inicial]);
  if (alerta) motivos.push(alerta.toLowerCase());

  return `Score ${score}: ${motivos.length?motivos.join('; '):'aderência geral'}.`;
}

function detectarAlertaTrecho_(valor) {
  const texto=String(valor||'').trim();
  if (!texto) return 'Trecho vazio';
  if (texto.length<80) return 'Trecho muito curto';
  if (/[ \uFFFD]/.test(texto)) return 'Caractere corrompido';
  if ((texto.match(/Compreender as ciências naturais/g)||[]).length>1) return 'Possível concatenação';
  return '';
}

function ordenarCandidatos_(candidatos,modo) {
  const copia=candidatos.slice();
  if (modo==='Mais fáceis primeiro') return copia.sort((a,b)=>a.faixa-b.faixa||b.score-a.score);
  if (modo==='Mais difíceis primeiro') return copia.sort((a,b)=>b.faixa-a.faixa||b.score-a.score);
  if (modo==='Ordem da base') return copia;
  return copia.sort((a,b)=>b.score-a.score||a.faixa-b.faixa);
}

function selecionarRespeitandoTempo_(candidatos,quantidade,tempoMaximo,modo) {
  const limite=Math.min(quantidade,NAVE_MVP.LIMITE_RESULTADOS);

  if (modo!=='Pedagógica progressiva') {
    const saida=[]; let tempo=0;
    for (const c of candidatos) {
      if (saida.length>=limite) break;
      if (tempo+c.tempo>tempoMaximo) continue;
      saida.push(c); tempo+=c.tempo;
    }
    return saida;
  }

  const proporcoes={1:.20,2:.25,3:.30,4:.20,5:.05};
  const grupos={1:[],2:[],3:[],4:[],5:[]};
  candidatos.forEach(c=>grupos[Math.min(Math.max(c.faixa,1),5)].push(c));

  const metas={};
  Object.keys(proporcoes).forEach(f=>metas[f]=Math.round(limite*proporcoes[f]));

  let soma=Object.values(metas).reduce((a,b)=>a+b,0);
  while (soma<limite) { metas[3]++; soma++; }
  while (soma>limite && metas[3]>0) { metas[3]--; soma--; }

  const saida=[]; let tempo=0;
  for (const faixa of [1,2,3,4,5]) {
    let usados=0;
    for (const c of grupos[faixa]) {
      if (usados>=metas[faixa] || saida.length>=limite) break;
      if (tempo+c.tempo>tempoMaximo) continue;
      saida.push(c); tempo+=c.tempo; usados++;
    }
  }

  const ids=new Set(saida.map(c=>String(c.row[0])));
  for (const c of candidatos) {
    if (saida.length>=limite) break;
    if (ids.has(String(c.row[0]))) continue;
    if (tempo+c.tempo>tempoMaximo) continue;
    saida.push(c); tempo+=c.tempo;
  }

  return saida.sort((a,b)=>a.faixa-b.faixa||b.score-a.score);
}

function atualizarIndicadoresBusca_(painel,linhas) {
  const c=contarDificuldades_(linhas.map(r=>r[7]));
  const tempo=linhas.reduce((s,r)=>s+(Number(r[9])||0),0);
  painel.getRange('E4:E9').setValues([
    [linhas.length],[tempo],[c.mf],[c.f],[c.m],[c.d]
  ]);
}

function unicosDeLinhas_(linhas,indice) {
  return [...new Set(linhas.map(r=>r[indice]).filter(v=>v!==''&&v!==null))]
    .sort((a,b)=>String(a).localeCompare(String(b),'pt-BR',{numeric:true}));
}

function limparFiltro_(valor) {
  const v=String(valor||'').trim();
  return (!v||['Todos','Todas'].includes(v))?'':v;
}

function corresponde_(valor,filtro) {
  return !filtro||String(valor).trim()===String(filtro).trim();
}

/* ==========================================================
   BLOCO 2 — BUSCA OFICIAL V0.5.8
   ========================================================== */

/**
 * NAVE — FILTRO DE VALIDAÇÃO NA BUSCA — V0.5.8
 *
 * Instalação:
 * 1. Crie um arquivo chamado FiltroValidacaoV058.gs.
 * 2. Cole este conteúdo.
 * 3. Execute instalarFiltroValidacaoV058() uma vez.
 * 4. No Código.gs, substitua integralmente a função
 *    buscarQuestoesQuimica() pela versão buscarQuestoesQuimicaV058()
 *    abaixo, mudando apenas o nome para buscarQuestoesQuimica.
 *
 * Observação:
 * O filtro será criado em PAINEL_QUIMICA!B15.
 */

const FILTRO_VALIDACAO_V058 = Object.freeze({
  CELULA_ROTULO: 'A15',
  CELULA_FILTRO: 'B15',
  OPCOES: [
    'Todos',
    'Não avaliada',
    'Validada por docente',
    'Validada por docentes',
    'Com divergência aberta',
    'Divergência resolvida',
    'Aguardando nova avaliação',
    'Homologada',
    'Suspensa pela coordenação'
  ]
});


function instalarFiltroValidacaoV058() {
  const ss = SpreadsheetApp.getActive();
  const painel = ss.getSheetByName(NAVE_MVP.ABAS.PAINEL);

  if (!painel) {
    throw new Error('A aba PAINEL_QUIMICA não foi encontrada.');
  }

  painel.getRange(FILTRO_VALIDACAO_V058.CELULA_ROTULO)
    .setValue('Status da validação')
    .setFontWeight('bold')
    .setBackground('#F8FAFC');

  painel.getRange(FILTRO_VALIDACAO_V058.CELULA_FILTRO)
    .setValue('Todos')
    .setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(FILTRO_VALIDACAO_V058.OPCOES, true)
        .setAllowInvalid(false)
        .build()
    );

  painel.setColumnWidth(1, 190);
  painel.setColumnWidth(2, 230);

  SpreadsheetApp.getUi().alert(
    'Filtro de validação instalado',
    'O novo filtro foi criado em PAINEL_QUIMICA, na célula B15.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


/**
 * SUBSTITUA a função buscarQuestoesQuimica() do Código.gs
 * por esta função, preservando o nome buscarQuestoesQuimica.
 */
function buscarQuestoesQuimica() {
  const ss = SpreadsheetApp.getActive();
  validarBase_(ss);
  garantirEstruturaResultadoV03_(ss);

  const painel = ss.getSheetByName(NAVE_MVP.ABAS.PAINEL);
  const resultado = ss.getSheetByName(NAVE_MVP.ABAS.RESULTADO);
  const base = ss.getSheetByName(NAVE_MVP.ABAS.BASE);

  const filtros = {
    habilidade: limparFiltro_(painel.getRange('B4').getDisplayValue()),
    competencia: limparFiltro_(painel.getRange('B5').getDisplayValue()),
    objeto: limparFiltro_(painel.getRange('B6').getDisplayValue()),
    dificuldade: limparFiltro_(painel.getRange('B7').getDisplayValue()),
    ano: limparFiltro_(painel.getRange('B8').getDisplayValue()),
    edicao: limparFiltro_(painel.getRange('B9').getDisplayValue()),
    funcao: limparFiltro_(painel.getRange('B10').getDisplayValue()),
    status: limparFiltro_(painel.getRange('B11').getDisplayValue()),
    statusValidacao:
      limparFiltro_(painel.getRange('B15').getDisplayValue()),
    quantidade: Number(painel.getRange('B12').getValue()) || 20,
    tempo: Number(painel.getRange('B13').getValue()) || 999999,
    modo:
      painel.getRange('B14').getDisplayValue() ||
      'Pedagógica progressiva'
  };

  const dados = base.getDataRange().getValues();
  const idx = indexarCabecalhos_(dados[0]);

  if (idx.status_validacao === undefined) {
    throw new Error(
      'O campo status_validacao não foi encontrado em QUESTOES_GERAL. ' +
      'Execute primeiro atualizarMvpV05().'
    );
  }

  let candidatos = [];

  for (let i = 1; i < dados.length; i++) {
    const r = dados[i];

    if (
      String(r[idx.componente_principal]).trim() !== 'Química'
    ) continue;

    if (
      ['Arquivada', 'Devolvida'].includes(
        String(r[idx.status_item]).trim()
      )
    ) continue;

    if (
      String(r[idx.status_curadoria]).trim() ===
      'Suspensa para revisão'
    ) continue;

    if (
      !corresponde_(r[idx.habilidade], filtros.habilidade)
    ) continue;

    if (
      !corresponde_(r[idx.competencia], filtros.competencia)
    ) continue;

    if (
      !corresponde_(r[idx.objeto_principal], filtros.objeto)
    ) continue;

    if (
      !corresponde_(
        r[idx.dificuldade_rotulo],
        filtros.dificuldade
      )
    ) continue;

    if (!corresponde_(r[idx.ano], filtros.ano)) continue;
    if (!corresponde_(r[idx.edicao], filtros.edicao)) continue;

    if (
      !corresponde_(
        r[idx.funcao_pedagogica_sugerida],
        filtros.funcao
      )
    ) continue;

    if (
      !corresponde_(
        r[idx.status_curadoria],
        filtros.status
      )
    ) continue;

    const statusValidacao =
      String(r[idx.status_validacao] || 'Não avaliada').trim();

    if (
      !corresponde_(
        statusValidacao,
        filtros.statusValidacao
      )
    ) continue;

    const score = calcularScore_(r, idx, filtros);

    candidatos.push({
      row: r,
      score,
      motivo: explicarScore_(r, idx, filtros, score),
      faixa: Number(r[idx.dificuldade_faixa]) || 3,
      tempo: Number(r[idx.tempo_estimado_min]) || 0,
      alerta: detectarAlertaTrecho_(r[idx.trecho_inicial])
    });
  }

  candidatos = ordenarCandidatos_(
    candidatos,
    filtros.modo
  );

  const selecionados = selecionarRespeitandoTempo_(
    candidatos,
    filtros.quantidade,
    filtros.tempo,
    filtros.modo
  );

  const saida = selecionados.map(c => {
    const r = c.row;

    return [
      false,
      r[idx.id_ocorrencia],
      r[idx.ano],
      r[idx.edicao],
      r[idx.competencia],
      r[idx.habilidade],
      r[idx.objeto_principal],
      r[idx.dificuldade_rotulo],
      r[idx.funcao_pedagogica_sugerida],
      c.tempo,
      r[idx.trecho_inicial],
      r[idx.status_curadoria],
      r[idx.quantidade_reportes],
      r[idx.possui_reporte_aberto],
      c.score,
      c.motivo,
      c.alerta
    ];
  });

  resultado.getRange(
    2,
    1,
    Math.max(resultado.getMaxRows() - 1, 1),
    17
  )
    .clearContent()
    .clearDataValidations()
    .setBackground(null);

  if (saida.length) {
    resultado.getRange(
      2,
      1,
      saida.length,
      17
    ).setValues(saida);

    resultado.getRange(
      2,
      1,
      saida.length,
      1
    ).insertCheckboxes();

    resultado.getRange(
      2,
      1,
      saida.length,
      17
    )
      .setWrap(true)
      .setVerticalAlignment('top');

    saida.forEach((r, i) => {
      if (r[16]) {
        resultado.getRange(
          i + 2,
          11,
          1,
          7
        ).setBackground(NAVE_MVP.COR_ALERTA);
      }
    });
  }

  atualizarIndicadoresBusca_(painel, saida);
  atualizarIndicadoresSelecao_();

  if (
    typeof sincronizarIndicadoresValidacaoV05 ===
    'function'
  ) {
    sincronizarIndicadoresValidacaoV05();
  }

  ss.setActiveSheet(resultado);
}


/**
 * Utilitário temporário para teste sem substituir a busca principal.
 * Lê o filtro de B15 e informa quantas questões de Química atendem
 * ao estado selecionado.
 */
function testarFiltroValidacaoV058() {
  const ss = SpreadsheetApp.getActive();
  const painel = ss.getSheetByName(NAVE_MVP.ABAS.PAINEL);
  const base = ss.getSheetByName(NAVE_MVP.ABAS.BASE);

  const filtro =
    limparFiltro_(painel.getRange('B15').getDisplayValue());

  const dados = base.getDataRange().getValues();
  const idx = indexarCabecalhos_(dados[0]);

  if (idx.status_validacao === undefined) {
    throw new Error(
      'O campo status_validacao não existe em QUESTOES_GERAL.'
    );
  }

  const quantidade = dados.slice(1).filter(r => {
    if (
      String(r[idx.componente_principal]).trim() !== 'Química'
    ) return false;

    const status =
      String(r[idx.status_validacao] || 'Não avaliada').trim();

    return corresponde_(status, filtro);
  }).length;

  SpreadsheetApp.getUi().alert(
    'Teste do filtro',
    `Filtro: ${filtro || 'Todos'}\nQuestões encontradas: ${quantidade}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  return quantidade;
}



/* ==========================================================
   BLOCO 3 — INDICADORES DE VALIDAÇÃO V0.5.7
   ========================================================== */

/**
 * NAVE — INDICADORES VISUAIS DE VALIDAÇÃO — V0.5.7
 *
 * Adicione este arquivo ao projeto com o nome:
 * IndicadoresValidacaoV057.gs
 *
 * Execute uma vez:
 * instalarIndicadoresValidacaoV057()
 *
 * O módulo acrescenta em:
 * - RESULTADO_BUSCA
 * - SEQUENCIA_ATUAL
 *
 * os campos:
 * - status_validacao
 * - maturidade_curadoria
 *
 * Também aplica cores por estado e permite atualização em lote.
 */

const IND_VALIDACAO_V057 = Object.freeze({
  ABA_BASE: 'QUESTOES_GERAL',
  ABA_RESULTADO: 'RESULTADO_BUSCA',
  ABA_SEQUENCIA: 'SEQUENCIA_ATUAL',

  LINHA_CABECALHO_RESULTADO: 1,
  LINHA_INICIO_RESULTADO: 2,

  LINHA_CABECALHO_SEQUENCIA: 11,
  LINHA_INICIO_SEQUENCIA: 12,

  CAMPOS: [
    'status_validacao',
    'maturidade_curadoria'
  ],

  CORES: {
    'Não avaliada': '#F8FAFC',
    'Validada por docente': '#D1FAE5',
    'Validada por docentes': '#A7F3D0',
    'Com divergência aberta': '#FED7AA',
    'Divergência resolvida': '#E0F2FE',
    'Aguardando nova avaliação': '#FEF3C7',
    'Homologada': '#BBF7D0',
    'Suspensa pela coordenação': '#FECACA',
    'Resolvida pela coordenação': '#E0F2FE',

    'Importada': '#F8FAFC',
    'Validada por docente': '#D1FAE5',
    'Com divergência': '#FED7AA',
    'Em validação': '#FEF3C7',
    'Ajustada pela coordenação': '#E0F2FE',
    'Homologada': '#BBF7D0',
    'Suspensa': '#FECACA'
  }
});


/* =========================================================
   INSTALAÇÃO
   ========================================================= */

function instalarIndicadoresValidacaoV057() {
  const ss = SpreadsheetApp.getActive();

  const base = ss.getSheetByName(IND_VALIDACAO_V057.ABA_BASE);
  const resultado = ss.getSheetByName(IND_VALIDACAO_V057.ABA_RESULTADO);
  const sequencia = ss.getSheetByName(IND_VALIDACAO_V057.ABA_SEQUENCIA);

  if (!base || !resultado || !sequencia) {
    throw new Error(
      'As abas QUESTOES_GERAL, RESULTADO_BUSCA e SEQUENCIA_ATUAL são obrigatórias.'
    );
  }

  garantirCamposIndicadoresV057_(
    resultado,
    IND_VALIDACAO_V057.LINHA_CABECALHO_RESULTADO
  );

  garantirCamposIndicadoresV057_(
    sequencia,
    IND_VALIDACAO_V057.LINHA_CABECALHO_SEQUENCIA
  );

  atualizarIndicadoresVisuaisValidacaoV05();

  SpreadsheetApp.getUi().alert(
    'Indicadores de validação instalados',
    [
      'Foram acrescentados:',
      '• status_validacao;',
      '• maturidade_curadoria.',
      '',
      'As colunas foram atualizadas em RESULTADO_BUSCA e SEQUENCIA_ATUAL.'
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


function garantirCamposIndicadoresV057_(aba, linhaCabecalho) {
  const ultimaColuna = Math.max(aba.getLastColumn(), 1);

  const headers = aba.getRange(
    linhaCabecalho,
    1,
    1,
    ultimaColuna
  ).getDisplayValues()[0].map(v => String(v || '').trim());

  const ausentes = IND_VALIDACAO_V057.CAMPOS.filter(
    campo => !headers.includes(campo)
  );

  if (!ausentes.length) return;

  const inicio = ultimaColuna + 1;

  aba.getRange(
    linhaCabecalho,
    inicio,
    1,
    ausentes.length
  ).setValues([ausentes]);

  aba.getRange(
    linhaCabecalho,
    inicio,
    1,
    ausentes.length
  )
    .setBackground('#0F766E')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  ausentes.forEach((_, i) => {
    aba.setColumnWidth(inicio + i, 185);
  });
}


/* =========================================================
   ATUALIZAÇÃO
   ========================================================= */

function atualizarIndicadoresVisuaisValidacaoV05() {
  const ss = SpreadsheetApp.getActive();

  const base = ss.getSheetByName(IND_VALIDACAO_V057.ABA_BASE);
  const resultado = ss.getSheetByName(IND_VALIDACAO_V057.ABA_RESULTADO);
  const sequencia = ss.getSheetByName(IND_VALIDACAO_V057.ABA_SEQUENCIA);

  if (!base || !resultado || !sequencia) {
    throw new Error(
      'As abas QUESTOES_GERAL, RESULTADO_BUSCA e SEQUENCIA_ATUAL são obrigatórias.'
    );
  }

  garantirCamposIndicadoresV057_(
    resultado,
    IND_VALIDACAO_V057.LINHA_CABECALHO_RESULTADO
  );

  garantirCamposIndicadoresV057_(
    sequencia,
    IND_VALIDACAO_V057.LINHA_CABECALHO_SEQUENCIA
  );

  const mapa = criarMapaIndicadoresV057_(base);

  const qtdResultado = atualizarAbaIndicadoresV057_(
    resultado,
    IND_VALIDACAO_V057.LINHA_CABECALHO_RESULTADO,
    IND_VALIDACAO_V057.LINHA_INICIO_RESULTADO,
    mapa
  );

  const qtdSequencia = atualizarAbaIndicadoresV057_(
    sequencia,
    IND_VALIDACAO_V057.LINHA_CABECALHO_SEQUENCIA,
    IND_VALIDACAO_V057.LINHA_INICIO_SEQUENCIA,
    mapa
  );

  SpreadsheetApp.flush();

  SpreadsheetApp.getActive().toast(
    `Resultado: ${qtdResultado} | Sequência: ${qtdSequencia}`,
    'NAVE — Indicadores de validação',
    7
  );

  return {
    resultado: qtdResultado,
    sequencia: qtdSequencia
  };
}


function criarMapaIndicadoresV057_(base) {
  const dados = base.getDataRange().getValues();
  const idx = indexarCabecalhosIndicadoresV057_(dados[0]);

  const obrigatorios = [
    'id_ocorrencia',
    'status_validacao',
    'maturidade_curadoria'
  ];

  const faltantes = obrigatorios.filter(
    campo => idx[campo] === undefined
  );

  if (faltantes.length) {
    throw new Error(
      'Campos ausentes em QUESTOES_GERAL: ' +
      faltantes.join(', ')
    );
  }

  const mapa = new Map();

  for (let i = 1; i < dados.length; i++) {
    const id = textoIndicadoresV057_(dados[i][idx.id_ocorrencia]);
    if (!id) continue;

    mapa.set(id, {
      statusValidacao:
        textoIndicadoresV057_(dados[i][idx.status_validacao]) ||
        'Não avaliada',
      maturidade:
        textoIndicadoresV057_(dados[i][idx.maturidade_curadoria]) ||
        'Importada'
    });
  }

  return mapa;
}


function atualizarAbaIndicadoresV057_(
  aba,
  linhaCabecalho,
  linhaInicio,
  mapa
) {
  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < linhaInicio) return 0;

  const ultimaColuna = aba.getLastColumn();

  const headers = aba.getRange(
    linhaCabecalho,
    1,
    1,
    ultimaColuna
  ).getDisplayValues()[0];

  const idx = indexarCabecalhosIndicadoresV057_(headers);

  if (idx.id_ocorrencia === undefined) {
    throw new Error(
      `Campo id_ocorrencia ausente em ${aba.getName()}.`
    );
  }

  const totalLinhas = ultimaLinha - linhaInicio + 1;

  const dados = aba.getRange(
    linhaInicio,
    1,
    totalLinhas,
    ultimaColuna
  ).getValues();

  const saidaStatus = [];
  const saidaMaturidade = [];
  let preenchidos = 0;

  dados.forEach(r => {
    const id = textoIndicadoresV057_(r[idx.id_ocorrencia]);
    const item = mapa.get(id);

    if (!id || !item) {
      saidaStatus.push(['']);
      saidaMaturidade.push(['']);
      return;
    }

    saidaStatus.push([item.statusValidacao]);
    saidaMaturidade.push([item.maturidade]);
    preenchidos++;
  });

  aba.getRange(
    linhaInicio,
    idx.status_validacao + 1,
    totalLinhas,
    1
  ).setValues(saidaStatus);

  aba.getRange(
    linhaInicio,
    idx.maturidade_curadoria + 1,
    totalLinhas,
    1
  ).setValues(saidaMaturidade);

  aplicarCoresIndicadoresV057_(
    aba,
    linhaInicio,
    totalLinhas,
    idx.status_validacao + 1
  );

  aplicarCoresIndicadoresV057_(
    aba,
    linhaInicio,
    totalLinhas,
    idx.maturidade_curadoria + 1
  );

  return preenchidos;
}


/* =========================================================
   CORES
   ========================================================= */

function aplicarCoresIndicadoresV057_(
  aba,
  linhaInicio,
  totalLinhas,
  coluna
) {
  if (totalLinhas <= 0) return;

  const valores = aba.getRange(
    linhaInicio,
    coluna,
    totalLinhas,
    1
  ).getDisplayValues();

  const fundos = valores.map(([valor]) => [
    IND_VALIDACAO_V057.CORES[
      textoIndicadoresV057_(valor)
    ] || '#FFFFFF'
  ]);

  aba.getRange(
    linhaInicio,
    coluna,
    totalLinhas,
    1
  )
    .setBackgrounds(fundos)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
}


/* =========================================================
   ATALHOS PARA INTEGRAÇÃO AUTOMÁTICA
   ========================================================= */

/**
 * Chame esta função depois de:
 * - buscarQuestoesQuimica();
 * - adicionarSelecionadas();
 * - substituirQuestaoSelecionada();
 * - salvarValidacaoDocenteV05();
 * - salvarDecisaoCoordenacaoV05();
 */
function sincronizarIndicadoresValidacaoV05() {
  return atualizarIndicadoresVisuaisValidacaoV05();
}


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function indexarCabecalhosIndicadoresV057_(headers) {
  const idx = {};

  headers.forEach((valor, i) => {
    const chave = textoIndicadoresV057_(valor);
    if (chave) idx[chave] = i;
  });

  return idx;
}


function textoIndicadoresV057_(valor) {
  if (valor === null || valor === undefined) return '';

  return String(valor)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
