/**
 * NAVE — NÚCLEO OPERACIONAL
 * Consolidação estrutural V1.0
 *
 * Mantém as rotinas gerais, sequências, reportes e governança.
 * As rotinas de busca, filtros e indicadores foram transferidas
 * para BuscaFiltrosIndicadoresV100.gs.
 */

/**
 * NAVE — MVP DE CURADORIA PEDAGÓGICA DE QUÍMICA
 * Versão 0.3.0
 *
 * Substitua integralmente o Código.gs pela versão 0.3.
 * Preserve os arquivos HTML:
 * - SidebarReporte.html
 * - VisualizarQuestao.html
 */

const NAVE_MVP = Object.freeze({
  VERSAO: '0.3.0',
  ABAS: {
    BASE: 'QUESTOES_GERAL',
    PAINEL: 'PAINEL_QUIMICA',
    RESULTADO: 'RESULTADO_BUSCA',
    SEQUENCIA: 'SEQUENCIA_ATUAL',
    SALVAS: 'SEQUENCIAS_SALVAS',
    REPORTES: 'REPORTES',
    FILA: 'FILA_COORDENACAO',
    HISTORICO: 'HISTORICO_ALTERACOES',
    CONFIG: 'CONFIG_MVP'
  },
  LIMITE_RESULTADOS: 300,
  COR_PRINCIPAL: '#0F766E',
  COR_SECUNDARIA: '#D1FAE5',
  COR_ALERTA: '#FEF3C7',
  COR_ERRO: '#FECACA',
  COR_INFO: '#E0F2FE'
});

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  const menuBusca = ui.createMenu('Busca e seleção')
    .addItem('Buscar questões', 'buscarQuestoesQuimica')
    .addItem('Atualizar filtros', 'atualizarFiltrosDependentes')
    .addSeparator()
    .addItem('Visualizar questão selecionada', 'abrirVisualizacaoQuestaoV04')
    .addItem('Adicionar selecionadas à sequência', 'adicionarSelecionadas')
    .addItem('Substituir questão da sequência', 'substituirQuestaoSelecionada')
    .addSeparator()
    .addItem('Corrigir trecho selecionado', 'abrirCorrecaoTrechoV04')
    .addItem('Reportar problema na questão', 'abrirSidebarReporte');

  const menuSequencias = ui.createMenu('Sequências')
    .addItem('Salvar sequência atual', 'salvarSequenciaAtualV06')
    .addItem('Carregar sequência salva', 'solicitarCarregamentoSequenciaV06')
    .addSeparator()
    .addItem('Limpar sequência atual', 'limparSequenciaAtual');

  const menuValidacao = ui.createMenu('Validação docente')
    .addItem('Validar questão selecionada', 'abrirValidacaoQuestaoV05')
    .addItem('Abrir validações docentes', 'abrirValidacoesDocentesV05')
    .addSeparator()
    .addItem('Atualizar indicadores de validação', 'atualizarIndicadoresVisuaisValidacaoV05')
    .addItem('Abrir painel de qualidade', 'abrirPainelQualidadeV05');

  const menuCoordenacao = ui.createMenu('Coordenação')
    .addItem('Abrir painel operacional', 'abrirPainelCoordenacaoV05')
    .addItem('Abrir fila de validações', 'abrirFilaCoordenacaoV05')
    .addItem('Decidir caso selecionado', 'abrirDecisaoCoordenacaoV05')
    .addSeparator()
    .addItem('Recalcular consolidação', 'recalcularValidacoesV05')
    .addItem('Atualizar painel de qualidade', 'atualizarPainelQualidadeV05')
    .addSeparator()
    .addItem('Atualizar fila de reportes', 'atualizarFilaCoordenacao')
    .addItem('Aplicar decisão de reporte', 'aplicarDecisaoSelecionada');

  const menuEditoracao = ui.createMenu('Editoração')
    .addItem(
      'Enviar sequência salva para editoração',
      'solicitarEnvioSequenciaSalvaParaEditoracaoV063'
    )
    .addItem(
      'Atualizar projeto editorial',
      'solicitarAtualizacaoProjetoEditorialV063'
    )
    .addSeparator()
    .addItem('Gerar pacote PDF', 'solicitarGeracaoPacotePdfV062')
    .addItem(
      'Gerar pacote técnico para RStudio',
      'solicitarGeracaoPacoteRStudioV064'
    );

  const menuAdministracao = ui.createMenu('Administração')
    .addItem('Atualizar alertas técnicos', 'atualizarAlertasTecnicosV04')
    .addItem('Abrir painel de alertas', 'abrirPainelAlertasV04')
    .addSeparator()
    .addItem('Verificar fusos horários', 'verificarFusosNave');

  ui.createMenu('NAVE — Curadoria de Química')
    .addSubMenu(menuBusca)
    .addSubMenu(menuSequencias)
    .addSubMenu(menuValidacao)
    .addSubMenu(menuCoordenacao)
    .addSubMenu(menuEditoracao)
    .addSubMenu(menuAdministracao)
    .addToUi();
}


function onEdit(e) {
  if (!e || !e.range) return;
  processarAcoesRapidasV04_(e);

  const sheet = e.range.getSheet();
  const nome = sheet.getName();
  const row = e.range.getRow();
  const col = e.range.getColumn();

  try {
    if (nome === NAVE_MVP.ABAS.PAINEL && col === 2 && row >= 4 && row <= 10) {
      atualizarFiltrosDependentes();
      return;
    }

    if (nome === NAVE_MVP.ABAS.RESULTADO && col === 1 && row >= 2) {
      atualizarIndicadoresSelecao_();
      return;
    }

    if (nome === NAVE_MVP.ABAS.SEQUENCIA && row >= 12 && col === 12 && e.value === 'TRUE') {
      sheet.deleteRow(row);
      renumerarSequencia_();
      atualizarIndicadoresSequencia_();
      return;
    }
  } catch (err) {
    console.error(err);
  }
}

/* =========================================================
   ATUALIZAÇÃO DA ESTRUTURA
   ========================================================= */

function atualizarMvpV03() {
  const ss = SpreadsheetApp.getActive();
  validarBase_(ss);
  garantirCamposGovernanca_(ss);
  garantirEstruturaResultadoV03_(ss);
  garantirPainelV03_(ss);
  garantirSequenciaV03_(ss);
  garantirConfigV03_(ss);
  atualizarFiltrosDependentes();
  atualizarIndicadoresSelecao_();
  atualizarIndicadoresSequencia_();

  SpreadsheetApp.getUi().alert(
    'MVP atualizado',
    'A versão 0.3 foi aplicada. Reportes, histórico e sequências salvas foram preservados.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function garantirEstruturaResultadoV03_(ss) {
  const aba = ss.getSheetByName(NAVE_MVP.ABAS.RESULTADO);
  if (!aba) throw new Error('A aba RESULTADO_BUSCA não foi encontrada.');

  const headersDesejados = [
    'SELECIONAR','id_ocorrencia','ano','edicao','competencia','habilidade',
    'objeto_principal','dificuldade_rotulo','funcao_pedagogica_sugerida',
    'tempo_estimado_min','trecho_inicial','status_curadoria',
    'quantidade_reportes','possui_reporte_aberto',
    'score_recomendacao','motivo_recomendacao','alerta_trecho'
  ];

  aba.getRange(1,1,1,headersDesejados.length).setValues([headersDesejados]);
  estilizarCabecalho_(aba.getRange(1,1,1,headersDesejados.length));
  aba.setFrozenRows(1);

  aba.setColumnWidth(1, 90);
  aba.setColumnWidth(2, 170);
  aba.setColumnWidth(7, 280);
  aba.setColumnWidth(9, 220);
  aba.setColumnWidth(11, 520);
  aba.setColumnWidth(15, 140);
  aba.setColumnWidth(16, 360);
  aba.setColumnWidth(17, 240);

  aba.getRange('S1:T1').merge().setValue('SELEÇÃO ATUAL');
  estilizarCabecalho_(aba.getRange('S1:T1'));
  aba.getRange('S2:T7').setValues([
    ['Questões selecionadas',0],
    ['Tempo acumulado',0],
    ['Muito fáceis',0],
    ['Fáceis',0],
    ['Médias',0],
    ['Difíceis / muito difíceis',0]
  ]);
  aba.getRange('S2:S7').setFontWeight('bold').setBackground('#F8FAFC');
  aba.setColumnWidth(19, 190);
  aba.setColumnWidth(20, 110);
}

function garantirPainelV03_(ss) {
  const aba = ss.getSheetByName(NAVE_MVP.ABAS.PAINEL);
  if (!aba) throw new Error('A aba PAINEL_QUIMICA não foi encontrada.');

  aba.getRange('A14:B14').setValues([['Modo de recomendação','Pedagógica progressiva']]);
  aba.getRange('A14').setFontWeight('bold').setBackground('#F8FAFC');
  aba.getRange('B14').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Pedagógica progressiva','Mais aderentes',
        'Mais fáceis primeiro','Mais difíceis primeiro','Ordem da base'
      ], true)
      .setAllowInvalid(false)
      .build()
  );

  aba.getRange('D11:H11').merge().setValue('AÇÕES RÁPIDAS');
  estilizarCabecalho_(aba.getRange('D11:H11'));
  aba.getRange('D12:H15').setValues([
    ['1. Buscar','Menu: Buscar questões','','',''],
    ['2. Selecionar','Marque as caixas em RESULTADO_BUSCA','','',''],
    ['3. Adicionar','Menu: Adicionar selecionadas','','',''],
    ['4. Revisar','Visualizar, reportar ou substituir','','','']
  ]);
  aba.getRange('D12:D15').setFontWeight('bold').setBackground(NAVE_MVP.COR_SECUNDARIA);
  aba.getRange('E12:H15').setBackground('#FFFFFF');
}

function garantirSequenciaV03_(ss) {
  const aba = ss.getSheetByName(NAVE_MVP.ABAS.SEQUENCIA);
  if (!aba) throw new Error('A aba SEQUENCIA_ATUAL não foi encontrada.');

  aba.getRange('D3:E8').setValues([
    ['INDICADORES','VALOR'],
    ['Muito fáceis',0],
    ['Fáceis',0],
    ['Médias',0],
    ['Difíceis / muito difíceis',0],
    ['Objetos contemplados',0]
  ]);
  estilizarCabecalho_(aba.getRange('D3:E3'));
  aba.getRange('D4:D8').setFontWeight('bold').setBackground('#F8FAFC');

  const headers = [
    'ORDEM','id_ocorrencia','ano','edicao','habilidade','objeto_principal',
    'dificuldade_rotulo','funcao_pedagogica_sugerida','trecho_inicial',
    'tempo_estimado_min','observacao_professor','REMOVER','REPORTAR'
  ];
  aba.getRange(11,1,1,headers.length).setValues([headers]);
  estilizarCabecalho_(aba.getRange(11,1,1,headers.length));
  aba.setFrozenRows(11);
}

function garantirConfigV03_(ss) {
  const aba = ss.getSheetByName(NAVE_MVP.ABAS.CONFIG);
  if (!aba) return;

  const valores = aba.getDataRange().getValues().flat().map(String);
  if (!valores.includes('VERSAO_03')) {
    const linha = aba.getLastRow()+2;
    aba.getRange(linha,1,7,2).setValues([
      ['VERSAO_03',''],
      ['filtros_dependentes','Ativo'],
      ['indicadores_selecao','Ativo'],
      ['visualizacao_ampliada','Ativo'],
      ['substituicao_inteligente','Ativo'],
      ['remocao_automatica','Ativo'],
      ['alerta_trecho','Ativo']
    ]);
    aba.getRange(linha,1,1,2).setBackground(NAVE_MVP.COR_SECUNDARIA).setFontWeight('bold');
  }
}

/* =========================================================
   FILTROS DEPENDENTES
   ========================================================= */


/* =========================================================
   BUSCA E RECOMENDAÇÃO
   ========================================================= */


/* =========================================================
   INDICADORES EM TEMPO REAL
   ========================================================= */


function atualizarIndicadoresSelecao_() {
  const ss=SpreadsheetApp.getActive();
  const aba=ss.getSheetByName(NAVE_MVP.ABAS.RESULTADO);
  if (!aba) return;

  if (aba.getLastRow()<2) {
    aba.getRange('T2:T7').setValues([[0],[0],[0],[0],[0],[0]]);
    return;
  }

  const dados=aba.getRange(2,1,aba.getLastRow()-1,17).getValues()
    .filter(r=>r[0]===true);

  const c=contarDificuldades_(dados.map(r=>r[7]));
  const tempo=dados.reduce((s,r)=>s+(Number(r[9])||0),0);
  aba.getRange('T2:T7').setValues([
    [dados.length],[tempo],[c.mf],[c.f],[c.m],[c.d]
  ]);
}

function atualizarIndicadoresSequencia_() {
  const ss=SpreadsheetApp.getActive();
  const aba=ss.getSheetByName(NAVE_MVP.ABAS.SEQUENCIA);
  if (!aba || aba.getLastRow()<12) {
    if (aba) aba.getRange('E4:E8').setValues([[0],[0],[0],[0],[0]]);
    return;
  }

  const dados=aba.getRange(12,1,aba.getLastRow()-11,13).getValues()
    .filter(r=>String(r[1]).trim()!=='');
  const c=contarDificuldades_(dados.map(r=>r[6]));
  const objetos=new Set(dados.map(r=>String(r[5])).filter(Boolean));

  aba.getRange('E4:E8').setValues([
    [c.mf],[c.f],[c.m],[c.d],[objetos.size]
  ]);
}

function contarDificuldades_(valores) {
  const c={mf:0,f:0,m:0,d:0};
  valores.forEach(v=>{
    const dif=String(v).toLowerCase();
    if (dif.includes('muito fácil')) c.mf++;
    else if (dif==='fácil') c.f++;
    else if (dif.includes('méd')) c.m++;
    else c.d++;
  });
  return c;
}

/* =========================================================
   SEQUÊNCIA
   ========================================================= */

function adicionarSelecionadas() {
  const ss=SpreadsheetApp.getActive();
  const resultado=ss.getSheetByName(NAVE_MVP.ABAS.RESULTADO);
  const sequencia=ss.getSheetByName(NAVE_MVP.ABAS.SEQUENCIA);

  if (resultado.getLastRow()<2) {
    SpreadsheetApp.getUi().alert('Não há resultados para adicionar.');
    return;
  }

  const dados=resultado.getRange(2,1,resultado.getLastRow()-1,17).getValues();
  const selecionadas=dados.filter(r=>r[0]===true);

  if (!selecionadas.length) {
    SpreadsheetApp.getUi().alert('Marque pelo menos uma questão.');
    return;
  }

  const idsAtuais=new Set();
  if (sequencia.getLastRow()>=12) {
    sequencia.getRange(12,2,sequencia.getLastRow()-11,1).getValues()
      .flat().filter(Boolean).forEach(id=>idsAtuais.add(String(id)));
  }

  const novas=selecionadas.filter(r=>!idsAtuais.has(String(r[1])));
  if (!novas.length) {
    SpreadsheetApp.getUi().alert('As questões selecionadas já estão na sequência.');
    return;
  }

  const inicio=Math.max(sequencia.getLastRow()+1,12);
  const linhas=novas.map((r,i)=>[
    inicio-11+i,r[1],r[2],r[3],r[5],r[6],r[7],r[8],
    r[10],r[9],'',false,false
  ]);

  sequencia.getRange(inicio,1,linhas.length,13).setValues(linhas);
  sequencia.getRange(inicio,12,linhas.length,2).insertCheckboxes();

  incrementarUso_(novas.map(r=>r[1]));
  atualizarIndicadoresSequencia_();
  ss.setActiveSheet(sequencia);
}

function substituirQuestaoSelecionada() {
  const ss=SpreadsheetApp.getActive();
  const sequencia=ss.getSheetByName(NAVE_MVP.ABAS.SEQUENCIA);
  if (ss.getActiveSheet().getName()!==NAVE_MVP.ABAS.SEQUENCIA) {
    SpreadsheetApp.getUi().alert('Selecione uma questão em SEQUENCIA_ATUAL.');
    return;
  }

  const linha=sequencia.getActiveRange().getRow();
  if (linha<12) {
    SpreadsheetApp.getUi().alert('Selecione uma linha de questão.');
    return;
  }

  const atual=sequencia.getRange(linha,1,1,13).getValues()[0];
  const idAtual=String(atual[1]||'');
  if (!idAtual) throw new Error('A linha selecionada não possui questão.');

  const base=ss.getSheetByName(NAVE_MVP.ABAS.BASE);
  const dados=base.getDataRange().getValues();
  const idx=indexarCabecalhos_(dados[0]);

  const idsUsados=new Set(
    sequencia.getRange(12,2,Math.max(sequencia.getLastRow()-11,1),1)
      .getValues().flat().filter(Boolean).map(String)
  );

  const habilidade=String(atual[4]);
  const objeto=String(atual[5]);
  const dificuldade=String(atual[6]);
  const funcao=String(atual[7]);

  const candidatos=[];
  for (let i=1;i<dados.length;i++) {
    const r=dados[i];
    const id=String(r[idx.id_ocorrencia]);
    if (!id || id===idAtual || idsUsados.has(id)) continue;
    if (String(r[idx.componente_principal]).trim()!=='Química') continue;
    if (String(r[idx.status_curadoria])==='Suspensa para revisão') continue;
    if (String(r[idx.status_item])==='Arquivada') continue;

    let score=0;
    if (String(r[idx.habilidade])===habilidade) score+=40;
    if (String(r[idx.objeto_principal])===objeto) score+=35;
    if (String(r[idx.dificuldade_rotulo])===dificuldade) score+=15;
    if (String(r[idx.funcao_pedagogica_sugerida])===funcao) score+=10;
    if (detectarAlertaTrecho_(r[idx.trecho_inicial])) score-=15;

    candidatos.push({r,score});
  }

  candidatos.sort((a,b)=>b.score-a.score);
  if (!candidatos.length || candidatos[0].score<35) {
    SpreadsheetApp.getUi().alert('Não foi encontrada substituição suficientemente semelhante.');
    return;
  }

  const r=candidatos[0].r;
  const nova=[
    atual[0],r[idx.id_ocorrencia],r[idx.ano],r[idx.edicao],
    r[idx.habilidade],r[idx.objeto_principal],r[idx.dificuldade_rotulo],
    r[idx.funcao_pedagogica_sugerida],r[idx.trecho_inicial],
    r[idx.tempo_estimado_min],`Substituiu ${idAtual}`,false,false
  ];

  sequencia.getRange(linha,1,1,13).setValues([nova]);
  sequencia.getRange(linha,12,1,2).insertCheckboxes();
  incrementarUso_([r[idx.id_ocorrencia]]);
  atualizarIndicadoresSequencia_();

  SpreadsheetApp.getUi().alert(
    'Questão substituída',
    `${idAtual} foi substituída por ${r[idx.id_ocorrencia]}.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function renumerarSequencia_() {
  const ss=SpreadsheetApp.getActive();
  const aba=ss.getSheetByName(NAVE_MVP.ABAS.SEQUENCIA);
  if (!aba || aba.getLastRow()<12) return;

  const n=aba.getLastRow()-11;
  const valores=Array.from({length:n},(_,i)=>[i+1]);
  aba.getRange(12,1,n,1).setValues(valores);
}

function limparSequenciaAtual() {
  const ss=SpreadsheetApp.getActive();
  const aba=ss.getSheetByName(NAVE_MVP.ABAS.SEQUENCIA);
  if (aba.getLastRow()>=12) {
    aba.getRange(12,1,aba.getLastRow()-11,aba.getLastColumn())
      .clearContent().clearDataValidations();
  }
  atualizarIndicadoresSequencia_();
}

function salvarSequenciaAtual() {
  const ss=SpreadsheetApp.getActive();
  const aba=ss.getSheetByName(NAVE_MVP.ABAS.SEQUENCIA);
  const salvas=ss.getSheetByName(NAVE_MVP.ABAS.SALVAS);

  if (aba.getLastRow()<12) {
    SpreadsheetApp.getUi().alert('A sequência está vazia.');
    return;
  }

  const titulo=aba.getRange('B3').getDisplayValue().trim();
  if (!titulo) {
    SpreadsheetApp.getUi().alert('Informe um título para a sequência.');
    return;
  }

  const dados=aba.getRange(12,1,aba.getLastRow()-11,13).getValues()
    .filter(r=>String(r[1]).trim()!=='');

  const id=gerarId_('SEQ');
  salvas.appendRow([
    id,new Date(),aba.getRange('B4').getValue(),titulo,
    aba.getRange('B5').getValue(),aba.getRange('B6').getValue(),
    dados.length,dados.reduce((s,r)=>s+(Number(r[9])||0),0),
    'Rascunho',dados.map(r=>r[1]).join(';'),1
  ]);

  SpreadsheetApp.getUi().alert('Sequência salva com o ID '+id);
}

/* =========================================================
   VISUALIZAÇÃO AMPLIADA
   ========================================================= */

/**
 * Compatibilidade com chamadas antigas.
 * Direciona todo o fluxo para o visualizador oficial da versão 1.0.
 */
function abrirVisualizacaoQuestao() {
  abrirVisualizacaoQuestaoV04();
}


function obterDadosQuestaoCompleta(id) {
  const ss=SpreadsheetApp.getActive();
  const base=ss.getSheetByName(NAVE_MVP.ABAS.BASE);
  const dados=base.getDataRange().getValues();
  const idx=indexarCabecalhos_(dados[0]);
  const linha=dados.findIndex((r,i)=>i>0&&String(r[idx.id_ocorrencia])===String(id));
  if (linha<0) throw new Error('Questão não localizada: '+id);

  const r=dados[linha];
  return {
    id:r[idx.id_ocorrencia],
    ano:r[idx.ano],
    edicao:r[idx.edicao],
    competencia:r[idx.competencia],
    habilidade:r[idx.habilidade],
    objeto:r[idx.objeto_principal],
    objetoId:r[idx.objeto_id],
    dificuldade:r[idx.dificuldade_rotulo],
    funcao:r[idx.funcao_pedagogica_sugerida],
    tempo:r[idx.tempo_estimado_min],
    trecho:r[idx.trecho_inicial],
    status:r[idx.status_curadoria],
    reportes:r[idx.quantidade_reportes],
    alerta:detectarAlertaTrecho_(r[idx.trecho_inicial])
  };
}

function adicionarQuestaoPorId(id) {
  const ss=SpreadsheetApp.getActive();
  const base=ss.getSheetByName(NAVE_MVP.ABAS.BASE);
  const sequencia=ss.getSheetByName(NAVE_MVP.ABAS.SEQUENCIA);
  const dados=base.getDataRange().getValues();
  const idx=indexarCabecalhos_(dados[0]);
  const linha=dados.findIndex((r,i)=>i>0&&String(r[idx.id_ocorrencia])===String(id));
  if (linha<0) throw new Error('Questão não localizada.');

  const idsAtuais=sequencia.getLastRow()>=12
    ? sequencia.getRange(12,2,sequencia.getLastRow()-11,1).getValues().flat().map(String)
    : [];
  if (idsAtuais.includes(String(id))) return 'A questão já está na sequência.';

  const r=dados[linha];
  const destino=Math.max(sequencia.getLastRow()+1,12);
  sequencia.getRange(destino,1,1,13).setValues([[
    destino-11,r[idx.id_ocorrencia],r[idx.ano],r[idx.edicao],
    r[idx.habilidade],r[idx.objeto_principal],r[idx.dificuldade_rotulo],
    r[idx.funcao_pedagogica_sugerida],r[idx.trecho_inicial],
    r[idx.tempo_estimado_min],'',false,false
  ]]);
  sequencia.getRange(destino,12,1,2).insertCheckboxes();
  incrementarUso_([id]);
  atualizarIndicadoresSequencia_();
  return 'Questão adicionada à sequência.';
}

/* =========================================================
   REPORTE
   ========================================================= */

function abrirSidebarReporte() {
  const id=obterIdQuestaoSelecionada_();
  if (!id) {
    SpreadsheetApp.getUi().alert('Selecione uma questão em RESULTADO_BUSCA ou SEQUENCIA_ATUAL.');
    return;
  }

  const template=HtmlService.createTemplateFromFile('ReportarProblemaV100');
  template.idQuestao=id;
  SpreadsheetApp.getUi().showSidebar(
    template.evaluate().setTitle('Reportar ajuste').setWidth(430)
  );
}

function obterIdQuestaoSelecionada_() {
  const ss=SpreadsheetApp.getActive();
  const aba=ss.getActiveSheet();
  const row=aba.getActiveRange().getRow();

  if (aba.getName()===NAVE_MVP.ABAS.RESULTADO && row>=2) {
    return aba.getRange(row,2).getDisplayValue();
  }
  if (aba.getName()===NAVE_MVP.ABAS.SEQUENCIA && row>=12) {
    return aba.getRange(row,2).getDisplayValue();
  }
  return '';
}

function obterDadosQuestaoParaReporte(id) {
  return obterDadosQuestaoCompleta(id);
}

function registrarReporteSidebar(form) {
  if (!form||!form.idQuestao) throw new Error('Questão não informada.');
  if (!form.tipoProblema) throw new Error('Selecione o tipo de problema.');
  if (!form.campoContestado) throw new Error('Informe o campo contestado.');
  if (!form.justificativa) throw new Error('Informe a justificativa.');

  registrarReporte_(
    form.idQuestao,form.tipoProblema,form.campoContestado,
    form.valorSugerido||'',form.justificativa,form.prioridade||'Normal'
  );
  return 'Reporte registrado com sucesso.';
}

function registrarReporte_(id,tipo,campo,valorSugerido,justificativa,prioridade) {
  const ss=SpreadsheetApp.getActive();
  const base=ss.getSheetByName(NAVE_MVP.ABAS.BASE);
  const reportes=ss.getSheetByName(NAVE_MVP.ABAS.REPORTES);
  const dados=base.getDataRange().getValues();
  const idx=indexarCabecalhos_(dados[0]);
  const linha=dados.findIndex((r,i)=>i>0&&String(r[idx.id_ocorrencia])===String(id));

  if (linha<0) throw new Error('Questão não localizada: '+id);
  if (idx[campo]===undefined) throw new Error('Campo inexistente: '+campo);

  reportes.appendRow([
    gerarId_('REP'),new Date(),id,
    Session.getActiveUser().getEmail()||'Usuário não identificado',
    tipo,campo,dados[linha][idx[campo]],valorSugerido,
    justificativa,prioridade,'Pendente','','','','',''
  ]);

  base.getRange(linha+1,idx.quantidade_reportes+1)
    .setValue((Number(dados[linha][idx.quantidade_reportes])||0)+1);
  base.getRange(linha+1,idx.possui_reporte_aberto+1).setValue('Sim');
  base.getRange(linha+1,idx.status_curadoria+1).setValue('Com reporte aberto');
  atualizarFilaCoordenacao();
}

/* =========================================================
   COORDENAÇÃO
   ========================================================= */

function atualizarFilaCoordenacao() {
  const ss=SpreadsheetApp.getActive();
  const reportes=ss.getSheetByName(NAVE_MVP.ABAS.REPORTES);
  const fila=ss.getSheetByName(NAVE_MVP.ABAS.FILA);

  fila.getRange(2,1,Math.max(fila.getMaxRows()-1,1),fila.getLastColumn())
    .clearContent().clearDataValidations();

  if (reportes.getLastRow()<2) return;

  const dados=reportes.getRange(2,1,reportes.getLastRow()-1,reportes.getLastColumn()).getValues();
  const pendentes=dados.filter(r=>String(r[10])==='Pendente')
    .map(r=>r.slice(0,10).concat(['','','']));

  if (pendentes.length) {
    fila.getRange(2,1,pendentes.length,13).setValues(pendentes);
    fila.getRange(2,11,pendentes.length,1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList([
        'Aprovar sugestão','Aprovar com ajuste','Rejeitar',
        'Solicitar esclarecimento','Suspender questão','Arquivar reporte'
      ],true).build()
    );
  }
}

function aplicarDecisaoSelecionada() {
  const ss=SpreadsheetApp.getActive();
  const fila=ss.getSheetByName(NAVE_MVP.ABAS.FILA);
  const row=fila.getActiveRange().getRow();
  if (row<2) {
    SpreadsheetApp.getUi().alert('Selecione uma linha da fila.');
    return;
  }

  const f=fila.getRange(row,1,1,13).getValues()[0];
  const reporteId=f[0],idQuestao=f[2],valorSugerido=f[7],
        justificativa=f[8],decisao=f[10],valorAprovado=f[11],justCoord=f[12];

  if (!reporteId||!decisao) throw new Error('Informe a decisão.');

  const reportes=ss.getSheetByName(NAVE_MVP.ABAS.REPORTES);
  const dr=reportes.getDataRange().getValues();
  const ir=indexarCabecalhos_(dr[0]);
  const lr=dr.findIndex((r,i)=>i>0&&String(r[ir.reporte_id])===String(reporteId));
  if (lr<0) throw new Error('Reporte não localizado.');

  const campo=dr[lr][ir.campo_contestado];
  const base=ss.getSheetByName(NAVE_MVP.ABAS.BASE);
  const db=base.getDataRange().getValues();
  const ib=indexarCabecalhos_(db[0]);
  const lb=db.findIndex((r,i)=>i>0&&String(r[ib.id_ocorrencia])===String(idQuestao));
  if (lb<0) throw new Error('Questão não localizada.');

  const coordenador=Session.getActiveUser().getEmail()||'Coordenador';
  const va=Number(db[lb][ib.versao_registro])||1;
  const novo=valorAprovado||valorSugerido;
  let status='Resolvido';

  if (['Aprovar sugestão','Aprovar com ajuste'].includes(decisao)) {
    if (ib[campo]===undefined) throw new Error('Campo inexistente: '+campo);
    const anterior=db[lb][ib[campo]];
    base.getRange(lb+1,ib[campo]+1).setValue(novo);
    registrarHistorico_(idQuestao,campo,anterior,novo,justCoord||justificativa,reporteId,va,va+1);
    base.getRange(lb+1,ib.status_curadoria+1).setValue('Corrigida');
    base.getRange(lb+1,ib.ultima_revisao_em+1).setValue(new Date());
    base.getRange(lb+1,ib.ultima_revisao_por+1).setValue(coordenador);
    base.getRange(lb+1,ib.versao_registro+1).setValue(va+1);
  } else if (decisao==='Suspender questão') {
    const anterior=db[lb][ib.status_curadoria];
    base.getRange(lb+1,ib.status_curadoria+1).setValue('Suspensa para revisão');
    registrarHistorico_(idQuestao,'status_curadoria',anterior,'Suspensa para revisão',justCoord||justificativa,reporteId,va,va+1);
    base.getRange(lb+1,ib.versao_registro+1).setValue(va+1);
  } else if (decisao==='Solicitar esclarecimento') status='Aguardando esclarecimento';
  else if (decisao==='Rejeitar') status='Rejeitado';
  else if (decisao==='Arquivar reporte') status='Arquivado';

  reportes.getRange(lr+1,ir.status+1).setValue(status);
  reportes.getRange(lr+1,ir.coordenador_responsavel+1).setValue(coordenador);
  reportes.getRange(lr+1,ir.decisao+1).setValue(decisao);
  reportes.getRange(lr+1,ir.valor_aprovado+1).setValue(novo);
  reportes.getRange(lr+1,ir.justificativa_coordenacao+1).setValue(justCoord);
  reportes.getRange(lr+1,ir.data_decisao+1).setValue(new Date());
  base.getRange(lb+1,ib.possui_reporte_aberto+1).setValue('Não');
  atualizarFilaCoordenacao();
}

function registrarHistorico_(id,campo,anterior,novo,motivo,reporte,va,vn) {
  SpreadsheetApp.getActive().getSheetByName(NAVE_MVP.ABAS.HISTORICO).appendRow([
    gerarId_('ALT'),new Date(),Session.getActiveUser().getEmail()||'',
    id,campo,anterior,novo,motivo,reporte,va,vn
  ]);
}

/* =========================================================
   BASE E UTILITÁRIOS
   ========================================================= */

function validarBase_(ss) {
  const base=ss.getSheetByName(NAVE_MVP.ABAS.BASE);
  if (!base) throw new Error('QUESTOES_GERAL não encontrada.');
}

function garantirCamposGovernanca_(ss) {
  const base=ss.getSheetByName(NAVE_MVP.ABAS.BASE);
  const headers=base.getRange(1,1,1,base.getLastColumn()).getValues()[0];
  const novos=[
    'status_curadoria','nivel_confianca_classificacao','quantidade_usos',
    'quantidade_reportes','possui_reporte_aberto','ultima_revisao_em',
    'ultima_revisao_por','versao_registro'
  ];
  const ausentes=novos.filter(h=>!headers.includes(h));
  if (!ausentes.length) return;

  const inicio=base.getLastColumn()+1;
  base.getRange(1,inicio,1,ausentes.length).setValues([ausentes]);
  estilizarCabecalho_(base.getRange(1,inicio,1,ausentes.length));

  const n=base.getLastRow()-1;
  ausentes.forEach((campo,i)=>{
    let valor='';
    if (campo==='status_curadoria') valor='Classificação inicial';
    if (campo==='nivel_confianca_classificacao') valor='Não avaliado em uso';
    if (['quantidade_usos','quantidade_reportes'].includes(campo)) valor=0;
    if (campo==='possui_reporte_aberto') valor='Não';
    if (campo==='versao_registro') valor=1;
    if (valor!==''&&n>0) base.getRange(2,inicio+i,n,1).setValue(valor);
  });
}

function incrementarUso_(ids) {
  const ss=SpreadsheetApp.getActive();
  const base=ss.getSheetByName(NAVE_MVP.ABAS.BASE);
  const dados=base.getDataRange().getValues();
  const idx=indexarCabecalhos_(dados[0]);
  const conjunto=new Set(ids.map(String));

  for (let i=1;i<dados.length;i++) {
    if (!conjunto.has(String(dados[i][idx.id_ocorrencia]))) continue;
    base.getRange(i+1,idx.quantidade_usos+1)
      .setValue((Number(dados[i][idx.quantidade_usos])||0)+1);
    if (String(dados[i][idx.status_curadoria])==='Classificação inicial') {
      base.getRange(i+1,idx.status_curadoria+1).setValue('Em uso');
    }
  }
}

function estilizarCabecalho_(range) {
  range.setBackground(NAVE_MVP.COR_PRINCIPAL)
    .setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
}

function indexarCabecalhos_(headers) {
  const mapa={};
  headers.forEach((h,i)=>{const k=String(h).trim();if(k)mapa[k]=i;});
  return mapa;
}


function gerarId_(prefixo) {
  const agora=Utilities.formatDate(
    new Date(),Session.getScriptTimeZone()||'America/Sao_Paulo','yyyyMMddHHmmss'
  );
  return `${prefixo}_${agora}_${Utilities.getUuid().slice(0,8).toUpperCase()}`;
}
