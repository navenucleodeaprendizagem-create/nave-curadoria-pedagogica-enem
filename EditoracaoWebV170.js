/**
 * NAVE | EDITORAÇÃO WEB + RECORTES — V1.7.0
 *
 * Funções:
 * - enviar uma sequência salva para editoração;
 * - listar e abrir projetos editoriais;
 * - preparar metadados de recorte por questão;
 * - registrar gabarito;
 * - exportar pacote técnico para o RStudio;
 * - gerar Caderno do Estudante e Caderno do Professor no RStudio.
 *
 * O recorte físico do PDF é realizado pelo script R da V1.7.
 */

const NAVE_ED_WEB_V170 = Object.freeze({
  ABA_SEQUENCIAS: 'SEQUENCIAS_SALVAS',
  ABA_ITENS_SEQ: 'ITENS_SEQUENCIAS',
  ABA_PROJETOS: 'PROJETOS_EDITORIAIS',
  ABA_ITENS: 'ITENS_EDITORACAO',
  ABA_BASE: 'QUESTOES_GERAL',
  ABA_RECORTES: 'RECORTES_QUESTOES',
  PASTA_DRIVE: 'NAVE_PACOTES_EDITORIAIS',

  CAB_RECORTES: Object.freeze([
    'id_ocorrencia',
    'gabarito',
    'crop_x',
    'crop_y',
    'crop_w',
    'crop_h',
    'status_recorte',
    'origem_recorte',
    'atualizado_em',
    'atualizado_por'
  ])
});


function instalarEditoracaoWebV170() {
  exigirPermissaoWebV150_('editoracao');

  const ss = SpreadsheetApp.getActive();
  let aba = ss.getSheetByName(NAVE_ED_WEB_V170.ABA_RECORTES);

  if (!aba) {
    aba = ss.insertSheet(NAVE_ED_WEB_V170.ABA_RECORTES);
  }

  garantirCabecalhosEdWebV170_(
    aba,
    NAVE_ED_WEB_V170.CAB_RECORTES
  );

  aba.setFrozenRows(1);
  aba.getRange(1, 1, 1, aba.getLastColumn())
    .setBackground('#0F766E')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');

  SpreadsheetApp.getUi().alert(
    'Editoração V1.7 instalada',
    'A aba RECORTES_QUESTOES está pronta.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


function criarProjetoEditorialWebV170(idSequencia) {
  const usuario = exigirPermissaoWebV150_('editoracao');
  const ss = SpreadsheetApp.getActive();

  const seq = exigirAbaEdWebV170_(ss, NAVE_ED_WEB_V170.ABA_SEQUENCIAS);
  const itensSeq = exigirAbaEdWebV170_(ss, NAVE_ED_WEB_V170.ABA_ITENS_SEQ);
  const projetos = exigirAbaEdWebV170_(ss, NAVE_ED_WEB_V170.ABA_PROJETOS);
  const itensEd = exigirAbaEdWebV170_(ss, NAVE_ED_WEB_V170.ABA_ITENS);
  const base = exigirAbaEdWebV170_(ss, NAVE_ED_WEB_V170.ABA_BASE);

  const ds = seq.getDataRange().getValues();
  const iseq = indexarEdWebV170_(ds[0]);

  const linhaSeq = ds.findIndex((r, i) =>
    i > 0 &&
    textoEdWebV170_(r[iseq.id_sequencia]) === textoEdWebV170_(idSequencia)
  );

  if (linhaSeq < 0) {
    throw new Error('Sequência não localizada: ' + idSequencia);
  }

  const s = ds[linhaSeq];

  const dp = projetos.getDataRange().getValues();
  const ip = indexarEdWebV170_(dp[0]);

  const projetoExistente = dp.slice(1).find(r =>
    textoEdWebV170_(r[ip.id_sequencia]) === textoEdWebV170_(idSequencia) &&
    textoEdWebV170_(r[ip.status_editorial]) !== 'Cancelado'
  );

  if (projetoExistente) {
    return {
      mensagem: 'Esta sequência já possui projeto editorial.',
      idProjeto: projetoExistente[ip.id_projeto_editorial],
      existente: true
    };
  }

  const di = itensSeq.getDataRange().getValues();
  const ii = indexarEdWebV170_(di[0]);

  const selecionados = di.slice(1)
    .filter(r =>
      textoEdWebV170_(r[ii.id_sequencia]) === textoEdWebV170_(idSequencia) &&
      textoEdWebV170_(r[ii.status_item_sequencia]) !== 'Removido'
    )
    .sort((a, b) =>
      Number(a[ii.ordem]) - Number(b[ii.ordem])
    );

  if (!selecionados.length) {
    throw new Error('A sequência não possui questões para editoração.');
  }

  const db = base.getDataRange().getValues();
  const ib = indexarEdWebV170_(db[0]);
  const mapaBase = new Map();

  db.slice(1).forEach(r => {
    const id = textoEdWebV170_(r[ib.id_ocorrencia]);
    if (id) mapaBase.set(id, r);
  });

  const agora = new Date();
  const idProjeto = gerarIdEdWebV170_('ED');
  const tituloSeq =
    valorEdWebV170_(s, iseq, 'titulo') || idSequencia;

  anexarPorCabecalhoEdWebV170_(projetos, {
    id_projeto_editorial: idProjeto,
    criado_em: agora,
    criado_por: usuario.email,
    id_sequencia: idSequencia,
    titulo_projeto: 'Editoração — ' + tituloSeq,
    titulo_sequencia: tituloSeq,
    versao_sequencia: valorEdWebV170_(s, iseq, 'versao') || 1,
    quantidade_questoes: selecionados.length,
    tempo_total_min: selecionados.reduce(
      (acc, r) => acc + (Number(valorEdWebV170_(r, ii, 'tempo_estimado_min')) || 0),
      0
    ),
    status_editorial: 'Preparação de recortes',
    tipo_saida: 'Caderno do estudante + Caderno do professor',
    observacoes_editoriais: '',
    atualizado_em: agora,
    atualizado_por: usuario.email
  });

  selecionados.forEach(r => {
    const id = textoEdWebV170_(
      valorEdWebV170_(r, ii, 'id_ocorrencia')
    );
    const b = mapaBase.get(id) || [];
    const statusValidacao =
      textoEdWebV170_(
        valorEdWebV170_(b, ib, 'status_validacao') ||
        valorEdWebV170_(r, ii, 'status_validacao') ||
        'Não avaliada'
      );
    const maturidade =
      textoEdWebV170_(
        valorEdWebV170_(b, ib, 'maturidade_curadoria') ||
        valorEdWebV170_(r, ii, 'maturidade_curadoria') ||
        'Importada'
      );

    const colecao =
      valorEdWebV170_(b, ib, 'colecao_origem') ||
      valorEdWebV170_(r, ii, 'colecao_origem');

    const pagina =
      valorEdWebV170_(b, ib, 'pagina_pdf') ||
      valorEdWebV170_(r, ii, 'pagina_pdf');

    anexarPorCabecalhoEdWebV170_(itensEd, {
      id_item_editorial: gerarIdEdWebV170_('ITEMED'),
      id_projeto_editorial: idProjeto,
      id_sequencia: idSequencia,
      ordem_editorial: valorEdWebV170_(r, ii, 'ordem'),
      id_ocorrencia: id,
      ano: valorEdWebV170_(b, ib, 'ano') || valorEdWebV170_(r, ii, 'ano'),
      edicao: valorEdWebV170_(b, ib, 'edicao') || valorEdWebV170_(r, ii, 'edicao'),
      competencia: valorEdWebV170_(b, ib, 'competencia') || valorEdWebV170_(r, ii, 'competencia'),
      habilidade: valorEdWebV170_(b, ib, 'habilidade') || valorEdWebV170_(r, ii, 'habilidade'),
      objeto_principal: valorEdWebV170_(b, ib, 'objeto_principal') || valorEdWebV170_(r, ii, 'objeto_principal'),
      dificuldade_rotulo: valorEdWebV170_(b, ib, 'dificuldade_rotulo') || valorEdWebV170_(r, ii, 'dificuldade_rotulo'),
      funcao_pedagogica_sugerida:
        valorEdWebV170_(b, ib, 'funcao_pedagogica_sugerida') ||
        valorEdWebV170_(r, ii, 'funcao_pedagogica_sugerida'),
      tempo_estimado_min:
        valorEdWebV170_(b, ib, 'tempo_estimado_min') ||
        valorEdWebV170_(r, ii, 'tempo_estimado_min'),
      status_validacao: statusValidacao,
      maturidade_curadoria: maturidade,
      colecao_origem: colecao,
      pagina_pdf: pagina,
      status_fonte_pdf: colecao && pagina ? 'Fonte localizada' : 'Fonte incompleta',
      liberacao_editorial: determinarLiberacaoEdWebV170_(
        statusValidacao,
        maturidade
      ),
      observacao_professor: valorEdWebV170_(r, ii, 'observacao_professor'),
      observacao_editorial: '',
      status_item_editorial: 'Pendente de recorte',
      incluido_em: agora,
      incluido_por: usuario.email
    });
  });

  return {
    mensagem: 'Sequência enviada para editoração.',
    idProjeto,
    existente: false,
    quantidade: selecionados.length
  };
}


function listarProjetosEditoracaoWebV170() {
  exigirPermissaoWebV150_('editoracao');

  const ss = SpreadsheetApp.getActive();
  const projetos = exigirAbaEdWebV170_(ss, NAVE_ED_WEB_V170.ABA_PROJETOS);
  const itens = exigirAbaEdWebV170_(ss, NAVE_ED_WEB_V170.ABA_ITENS);

  const dp = projetos.getDataRange().getDisplayValues();
  const ip = indexarEdWebV170_(dp[0]);

  const di = itens.getDataRange().getDisplayValues();
  const ii = indexarEdWebV170_(di[0]);

  const recortes = criarMapaRecortesEdWebV170_(ss);

  return dp.slice(1)
    .filter(r => textoEdWebV170_(r[ip.id_projeto_editorial]))
    .map(r => {
      const idProjeto = textoEdWebV170_(r[ip.id_projeto_editorial]);
      const itensProjeto = di.slice(1).filter(x =>
        textoEdWebV170_(x[ii.id_projeto_editorial]) === idProjeto
      );

      const preparados = itensProjeto.filter(x => {
        const id = textoEdWebV170_(x[ii.id_ocorrencia]);
        const rec = recortes.get(id);
        return rec && rec.statusRecorte === 'Validado';
      }).length;

      const comGabarito = itensProjeto.filter(x => {
        const id = textoEdWebV170_(x[ii.id_ocorrencia]);
        return Boolean(obterGabaritoEdWebV170_(ss, id, recortes));
      }).length;

      return {
        id: idProjeto,
        idSequencia: textoEdWebV170_(r[ip.id_sequencia]),
        titulo: textoEdWebV170_(r[ip.titulo_projeto]),
        tituloSequencia: textoEdWebV170_(r[ip.titulo_sequencia]),
        quantidade: itensProjeto.length,
        recortesPreparados: preparados,
        gabaritosPreparados: comGabarito,
        status: textoEdWebV170_(r[ip.status_editorial]),
        criadoEm: formatarDataEdWebV170_(r[ip.criado_em]),
        atualizadoEm: formatarDataEdWebV170_(r[ip.atualizado_em])
      };
    })
    .reverse();
}


function obterProjetoEditoracaoWebV170(idProjeto) {
  exigirPermissaoWebV150_('editoracao');

  /*
   * V1.7.2:
   * O projeto editorial é um retrato da sequência no momento da criação.
   * Antes de exibi-lo, sincronizamos status/maturidade/liberação diretamente
   * da QUESTOES_GERAL. Isso evita mostrar "Aguardando validação" depois de
   * a Coordenação já ter resolvido o caso.
   */
  sincronizarProjetoEditorialWebV172_(idProjeto);

  const ss = SpreadsheetApp.getActive();
  const projetos = exigirAbaEdWebV170_(ss, NAVE_ED_WEB_V170.ABA_PROJETOS);
  const itens = exigirAbaEdWebV170_(ss, NAVE_ED_WEB_V170.ABA_ITENS);
  const base = exigirAbaEdWebV170_(ss, NAVE_ED_WEB_V170.ABA_BASE);

  const dp = projetos.getDataRange().getDisplayValues();
  const ip = indexarEdWebV170_(dp[0]);
  const p = dp.slice(1).find(r =>
    textoEdWebV170_(r[ip.id_projeto_editorial]) === textoEdWebV170_(idProjeto)
  );

  if (!p) throw new Error('Projeto não localizado: ' + idProjeto);

  const di = itens.getDataRange().getDisplayValues();
  const ii = indexarEdWebV170_(di[0]);

  const db = base.getDataRange().getDisplayValues();
  const ib = indexarEdWebV170_(db[0]);
  const mapaBase = new Map();

  db.slice(1).forEach(r => {
    const id = textoEdWebV170_(r[ib.id_ocorrencia]);
    if (id) mapaBase.set(id, r);
  });

  const recortes = criarMapaRecortesEdWebV170_(ss);

  const lista = di.slice(1)
    .filter(r =>
      textoEdWebV170_(r[ii.id_projeto_editorial]) === textoEdWebV170_(idProjeto)
    )
    .sort((a, b) =>
      Number(a[ii.ordem_editorial]) - Number(b[ii.ordem_editorial])
    )
    .map(r => {
      const id = textoEdWebV170_(r[ii.id_ocorrencia]);
      const b = mapaBase.get(id) || [];
      const componente = valorEdWebV170_(b, ib, 'componente_principal');
      const area = valorEdWebV170_(b, ib, 'area') ||
        inferirAreaFonteWebV144_(id, componente);
      const colecao = valorEdWebV170_(b, ib, 'colecao_origem') ||
        valorEdWebV170_(r, ii, 'colecao_origem');
      const fonte = resolverFontePdfWebV144_(
        ss,
        colecao,
        area,
        componente
      );
      const rec = recortes.get(id) || {};

      return {
        ordem: Number(valorEdWebV170_(r, ii, 'ordem_editorial')) || 0,
        id,
        area,
        componente,
        competencia: valorEdWebV170_(b, ib, 'competencia') ||
          valorEdWebV170_(r, ii, 'competencia'),
        habilidade: valorEdWebV170_(b, ib, 'habilidade') ||
          valorEdWebV170_(r, ii, 'habilidade'),
        objeto: valorEdWebV170_(b, ib, 'objeto_principal') ||
          valorEdWebV170_(r, ii, 'objeto_principal'),
        dificuldade: valorEdWebV170_(b, ib, 'dificuldade_rotulo') ||
          valorEdWebV170_(r, ii, 'dificuldade_rotulo'),
        funcao: valorEdWebV170_(b, ib, 'funcao_pedagogica_sugerida') ||
          valorEdWebV170_(r, ii, 'funcao_pedagogica_sugerida'),
        ano: valorEdWebV170_(b, ib, 'ano') || valorEdWebV170_(r, ii, 'ano'),
        edicao: valorEdWebV170_(b, ib, 'edicao') || valorEdWebV170_(r, ii, 'edicao'),
        colecao,
        pagina: valorEdWebV170_(b, ib, 'pagina_pdf') ||
          valorEdWebV170_(r, ii, 'pagina_pdf'),
        liberacao: valorEdWebV170_(r, ii, 'liberacao_editorial'),
        fonteDisponivel: fonte.disponivel,
        urlPdf: fonte.url || '',
        gabarito: obterGabaritoEdWebV170_(ss, id, recortes),
        cropX: rec.cropX ?? '',
        cropY: rec.cropY ?? '',
        cropW: rec.cropW ?? '',
        cropH: rec.cropH ?? '',
        statusRecorte: rec.statusRecorte || 'Não preparado'
      };
    });

  return {
    projeto: {
      id: textoEdWebV170_(p[ip.id_projeto_editorial]),
      idSequencia: textoEdWebV170_(p[ip.id_sequencia]),
      titulo: textoEdWebV170_(p[ip.titulo_projeto]),
      tituloSequencia: textoEdWebV170_(p[ip.titulo_sequencia]),
      status: textoEdWebV170_(p[ip.status_editorial]),
      tipoSaida: textoEdWebV170_(p[ip.tipo_saida])
    },
    itens: lista,
    resumo: {
      total: lista.length,
      fontesOk: lista.filter(x => x.fonteDisponivel).length,
      gabaritosOk: lista.filter(x => x.gabarito).length,
      recortesOk: lista.filter(x => x.statusRecorte === 'Validado').length,
      liberados: lista.filter(x =>
        ['Liberada', 'Liberada com revisão'].includes(x.liberacao)
      ).length
    }
  };
}


function salvarMetadadosRecorteWebV170(form) {
  const usuario = exigirPermissaoWebV150_('editoracao');
  form = form || {};

  const id = textoEdWebV170_(form.idOcorrencia);
  if (!id) throw new Error('Questão não informada.');

  const gabarito = textoEdWebV170_(form.gabarito).toUpperCase();
  if (gabarito && !/^[A-E]$/.test(gabarito)) {
    throw new Error('O gabarito deve ser A, B, C, D ou E.');
  }

  const nums = ['cropX', 'cropY', 'cropW', 'cropH'].map(k => {
    const v = textoEdWebV170_(form[k]);
    return v === '' ? '' : Number(String(v).replace(',', '.'));
  });

  nums.forEach(v => {
    if (v !== '' && (!Number.isFinite(v) || v < 0 || v > 1)) {
      throw new Error('As coordenadas de recorte devem ficar entre 0 e 1.');
    }
  });

  const completo = nums.every(v => v !== '') &&
    nums[2] > 0 &&
    nums[3] > 0;

  const ss = SpreadsheetApp.getActive();
  let aba = ss.getSheetByName(NAVE_ED_WEB_V170.ABA_RECORTES);
  if (!aba) {
    aba = ss.insertSheet(NAVE_ED_WEB_V170.ABA_RECORTES);
    garantirCabecalhosEdWebV170_(aba, NAVE_ED_WEB_V170.CAB_RECORTES);
  }

  upsertRecorteEdWebV170_(aba, {
    id_ocorrencia: id,
    gabarito,
    crop_x: nums[0],
    crop_y: nums[1],
    crop_w: nums[2],
    crop_h: nums[3],
    status_recorte: completo ? 'Validado' : 'Não preparado',
    origem_recorte: completo ? 'Aplicação web' : 'Gabarito / metadados',
    atualizado_em: new Date(),
    atualizado_por: usuario.email
  });

  return {
    mensagem: completo
      ? 'Recorte e gabarito atualizados.'
      : 'Metadados atualizados. O recorte será preparado no RStudio.',
    id
  };
}


function gerarPacoteTecnicoEditoracaoWebV170(idProjeto) {
  const usuario = exigirPermissaoWebV150_('editoracao');
  const dados = obterProjetoEditoracaoWebV170(idProjeto);

  const naoLiberadas = dados.itens.filter(x =>
    !['Liberada', 'Liberada com revisão'].includes(
      String(x.liberacao || '').trim()
    )
  );

  if (naoLiberadas.length) {
    throw new Error(
      'O projeto possui questões ainda não liberadas editorialmente: ' +
      naoLiberadas
        .slice(0, 10)
        .map(x => x.id + ' (' + (x.liberacao || 'sem status') + ')')
        .join(', ') +
      '. Conclua a validação/coordenação antes de gerar o pacote.'
    );
  }

  const pendenciasFonte = dados.itens.filter(x => !x.fonteDisponivel);

  if (pendenciasFonte.length) {
    throw new Error(
      'Há questões sem PDF de origem: ' +
      pendenciasFonte.slice(0, 10).map(x => x.id).join(', ')
    );
  }

  const pendenciasGabarito = dados.itens.filter(x => !x.gabarito);

  if (pendenciasGabarito.length) {
    throw new Error(
      'Preencha o gabarito antes de gerar o pacote: ' +
      pendenciasGabarito.slice(0, 10).map(x => x.id).join(', ')
    );
  }

  const ss = SpreadsheetApp.getActive();

  const timestamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'America/Sao_Paulo',
    'yyyyMMdd_HHmmss'
  );

  const idPacote =
    'REC_' +
    timestamp +
    '_' +
    Utilities.getUuid().slice(0, 6).toUpperCase();

  const headers = [
    'id_pacote_pdf',
    'id_projeto_editorial',
    'id_sequencia',
    'titulo_projeto',
    'ordem_pdf',
    'id_ocorrencia',
    'area',
    'componente',
    'ano',
    'edicao',
    'competencia',
    'habilidade',
    'objeto_principal',
    'dificuldade_rotulo',
    'funcao_pedagogica_sugerida',
    'gabarito',
    'colecao_origem',
    'url_pdf',
    'id_arquivo_drive',
    'pagina_pdf',
    'crop_x',
    'crop_y',
    'crop_w',
    'crop_h',
    'status_recorte',
    'liberacao_editorial',
    'spreadsheet_id'
  ];

  const rows = dados.itens.map(x => ({
    id_pacote_pdf: idPacote,
    id_projeto_editorial: dados.projeto.id,
    id_sequencia: dados.projeto.idSequencia,
    titulo_projeto: dados.projeto.titulo,
    ordem_pdf: x.ordem,
    id_ocorrencia: x.id,
    area: x.area,
    componente: x.componente,
    ano: x.ano,
    edicao: x.edicao,
    competencia: x.competencia,
    habilidade: x.habilidade,
    objeto_principal: x.objeto,
    dificuldade_rotulo: x.dificuldade,
    funcao_pedagogica_sugerida: x.funcao,
    gabarito: x.gabarito,
    colecao_origem: x.colecao,
    url_pdf: x.urlPdf,
    id_arquivo_drive: extrairIdDriveEdWebV170_(x.urlPdf),
    pagina_pdf: x.pagina,
    crop_x: x.cropX,
    crop_y: x.cropY,
    crop_w: x.cropW,
    crop_h: x.cropH,
    status_recorte: x.statusRecorte,
    liberacao_editorial: x.liberacao,
    spreadsheet_id: ss.getId()
  }));

  const csv = gerarCsvEdWebV170_(headers, rows);
  const pasta = obterOuCriarPastaEdWebV170_();

  const nome =
    'pacote_recortes_' +
    idPacote +
    '.csv';

  const arquivo = pasta.createFile(
    nome,
    csv,
    MimeType.CSV
  );

  return {
    mensagem: 'Pacote técnico de recortes gerado.',
    idPacote,
    arquivo: nome,
    url: arquivo.getUrl(),
    quantidade: rows.length,
    recortesPendentes:
      rows.filter(r => r.status_recorte !== 'Validado').length,
    geradoPor: usuario.email
  };
}



/* =========================================================
   V1.7.2 — SINCRONIZAÇÃO WEB-SAFE DO PROJETO EDITORIAL
   ========================================================= */

function sincronizarProjetoEditorialWebV172_(idProjeto) {
  const ss = SpreadsheetApp.getActive();

  const base = exigirAbaEdWebV170_(
    ss,
    NAVE_ED_WEB_V170.ABA_BASE
  );

  const itens = exigirAbaEdWebV170_(
    ss,
    NAVE_ED_WEB_V170.ABA_ITENS
  );

  const projetos = exigirAbaEdWebV170_(
    ss,
    NAVE_ED_WEB_V170.ABA_PROJETOS
  );

  const dadosBase = base.getDataRange().getValues();
  const idxBase = indexarEdWebV170_(dadosBase[0]);

  const dadosItens = itens.getDataRange().getValues();
  const idxItens = indexarEdWebV170_(dadosItens[0]);

  const mapaBase = new Map();

  for (let i = 1; i < dadosBase.length; i++) {
    const id = textoEdWebV170_(
      valorEdWebV170_(
        dadosBase[i],
        idxBase,
        'id_ocorrencia'
      )
    );

    if (id) {
      mapaBase.set(id, dadosBase[i]);
    }
  }

  let liberadas = 0;
  let liberadasComRevisao = 0;
  let aguardando = 0;
  let bloqueadas = 0;
  let fontesIncompletas = 0;
  let atualizados = 0;

  /*
   * Atualizamos o array em memória e gravamos de uma só vez.
   * É mais rápido e mais seguro para a aplicação web do que
   * escrever célula por célula.
   */
  for (let i = 1; i < dadosItens.length; i++) {
    const linha = dadosItens[i];

    if (
      textoEdWebV170_(
        valorEdWebV170_(
          linha,
          idxItens,
          'id_projeto_editorial'
        )
      ) !== textoEdWebV170_(idProjeto)
    ) {
      continue;
    }

    const idQuestao = textoEdWebV170_(
      valorEdWebV170_(
        linha,
        idxItens,
        'id_ocorrencia'
      )
    );

    const linhaBase = mapaBase.get(idQuestao);

    if (!linhaBase) {
      continue;
    }

    const statusValidacao =
      textoEdWebV170_(
        valorEdWebV170_(
          linhaBase,
          idxBase,
          'status_validacao'
        )
      ) || 'Não avaliada';

    const maturidade =
      textoEdWebV170_(
        valorEdWebV170_(
          linhaBase,
          idxBase,
          'maturidade_curadoria'
        )
      ) || 'Importada';

    const colecao =
      valorEdWebV170_(
        linhaBase,
        idxBase,
        'colecao_origem'
      ) ||
      valorEdWebV170_(
        linha,
        idxItens,
        'colecao_origem'
      );

    const pagina =
      valorEdWebV170_(
        linhaBase,
        idxBase,
        'pagina_pdf'
      ) ||
      valorEdWebV170_(
        linha,
        idxItens,
        'pagina_pdf'
      );

    const statusFonte =
      textoEdWebV170_(colecao) &&
      textoEdWebV170_(pagina)
        ? 'Fonte localizada'
        : 'Fonte incompleta';

    const liberacao =
      determinarLiberacaoEdWebV170_(
        statusValidacao,
        maturidade
      );

    if (idxItens.status_validacao !== undefined) {
      linha[idxItens.status_validacao] = statusValidacao;
    }

    if (idxItens.maturidade_curadoria !== undefined) {
      linha[idxItens.maturidade_curadoria] = maturidade;
    }

    if (idxItens.colecao_origem !== undefined) {
      linha[idxItens.colecao_origem] = colecao;
    }

    if (idxItens.pagina_pdf !== undefined) {
      linha[idxItens.pagina_pdf] = pagina;
    }

    if (idxItens.status_fonte_pdf !== undefined) {
      linha[idxItens.status_fonte_pdf] = statusFonte;
    }

    if (idxItens.liberacao_editorial !== undefined) {
      linha[idxItens.liberacao_editorial] = liberacao;
    }

    atualizados++;

    if (liberacao === 'Liberada') {
      liberadas++;
    } else if (liberacao === 'Liberada com revisão') {
      liberadasComRevisao++;
    } else if (liberacao === 'Bloqueada') {
      bloqueadas++;
    } else {
      aguardando++;
    }

    if (statusFonte === 'Fonte incompleta') {
      fontesIncompletas++;
    }
  }

  if (atualizados) {
    itens.getRange(
      1,
      1,
      dadosItens.length,
      dadosItens[0].length
    ).setValues(dadosItens);
  }

  atualizarStatusProjetoWebV172_(
    projetos,
    idProjeto,
    liberadas,
    liberadasComRevisao,
    aguardando,
    bloqueadas,
    fontesIncompletas
  );

  SpreadsheetApp.flush();

  return {
    idProjeto,
    atualizados,
    liberadas,
    liberadasComRevisao,
    aguardando,
    bloqueadas,
    fontesIncompletas
  };
}


function atualizarStatusProjetoWebV172_(
  projetos,
  idProjeto,
  liberadas,
  liberadasComRevisao,
  aguardando,
  bloqueadas,
  fontesIncompletas
) {
  if (!projetos || projetos.getLastRow() < 2) return;

  const dados = projetos.getDataRange().getValues();
  const idx = indexarEdWebV170_(dados[0]);

  const linha = dados.findIndex((r, i) =>
    i > 0 &&
    textoEdWebV170_(
      valorEdWebV170_(
        r,
        idx,
        'id_projeto_editorial'
      )
    ) === textoEdWebV170_(idProjeto)
  );

  if (linha < 0) return;

  let status = 'Preparação de recortes';

  if (bloqueadas > 0) {
    status = 'Bloqueado';
  } else if (aguardando > 0) {
    status = 'Aguardando validação';
  } else if (fontesIncompletas > 0) {
    status = 'Fonte incompleta';
  } else if (liberadas + liberadasComRevisao > 0) {
    status = 'Liberado para editoração';
  }

  const registro = dados[linha];

  if (idx.status_editorial !== undefined) {
    registro[idx.status_editorial] = status;
  }

  if (idx.atualizado_em !== undefined) {
    registro[idx.atualizado_em] = new Date();
  }

  if (idx.atualizado_por !== undefined) {
    registro[idx.atualizado_por] =
      Session.getActiveUser().getEmail() ||
      'Usuário não identificado';
  }

  projetos.getRange(
    linha + 1,
    1,
    1,
    registro.length
  ).setValues([registro]);
}


/* =========================================================
   APOIO
   ========================================================= */

function determinarLiberacaoEdWebV170_(statusValidacao, maturidade) {
  const s = textoEdWebV170_(statusValidacao);
  const m = textoEdWebV170_(maturidade);

  /*
   * V1.7.3 — regra coerente com o fluxo real de validação:
   *
   * - validação docente SEM divergência encerra a etapa docente
   *   e libera a questão diretamente para editoração;
   *
   * - validação COM divergência precisa da coordenação;
   *
   * - decisão resolvida pela coordenação libera com revisão;
   *
   * - homologação explícita também libera.
   */

  if (
    s === 'Homologada' ||
    m === 'Homologada' ||
    s === 'Validada por docente' ||
    s === 'Validada por docentes' ||
    m === 'Validada por docente'
  ) {
    return 'Liberada';
  }

  if (
    s === 'Divergência resolvida' ||
    s === 'Resolvida pela coordenação' ||
    m === 'Ajustada pela coordenação'
  ) {
    return 'Liberada com revisão';
  }

  if (
    s === 'Com divergência aberta' ||
    s === 'Aguardando nova avaliação' ||
    s === 'Suspensa pela coordenação' ||
    m === 'Com divergência' ||
    m === 'Suspensa'
  ) {
    return 'Bloqueada';
  }

  return 'Aguardando validação';
}


function criarMapaRecortesEdWebV170_(ss) {
  const aba = ss.getSheetByName(NAVE_ED_WEB_V170.ABA_RECORTES);
  const mapa = new Map();

  if (!aba || aba.getLastRow() < 2) return mapa;

  const d = aba.getDataRange().getDisplayValues();
  const i = indexarEdWebV170_(d[0]);

  d.slice(1).forEach(r => {
    const id = textoEdWebV170_(r[i.id_ocorrencia]);
    if (!id) return;

    mapa.set(id, {
      gabarito: textoEdWebV170_(r[i.gabarito]).toUpperCase(),
      cropX: numeroEdWebV170_(r[i.crop_x]),
      cropY: numeroEdWebV170_(r[i.crop_y]),
      cropW: numeroEdWebV170_(r[i.crop_w]),
      cropH: numeroEdWebV170_(r[i.crop_h]),
      statusRecorte: textoEdWebV170_(r[i.status_recorte])
    });
  });

  return mapa;
}


function obterGabaritoEdWebV170_(ss, id, mapaRecortes) {
  const rec = mapaRecortes.get(id);
  if (rec && rec.gabarito) return rec.gabarito;

  const base = ss.getSheetByName(NAVE_ED_WEB_V170.ABA_BASE);
  if (!base || base.getLastRow() < 2) return '';

  const d = base.getDataRange().getDisplayValues();
  const i = indexarEdWebV170_(d[0]);

  const aliases = [
    'gabarito',
    'tx_gabarito',
    'alternativa_correta',
    'resposta_correta'
  ];

  const campo = aliases.find(a => i[a] !== undefined);
  if (!campo) return '';

  const r = d.slice(1).find(x =>
    textoEdWebV170_(x[i.id_ocorrencia]) === textoEdWebV170_(id)
  );

  return r ? textoEdWebV170_(r[i[campo]]).toUpperCase() : '';
}


function upsertRecorteEdWebV170_(aba, registro) {
  garantirCabecalhosEdWebV170_(aba, NAVE_ED_WEB_V170.CAB_RECORTES);

  const d = aba.getDataRange().getValues();
  const i = indexarEdWebV170_(d[0]);

  const linha = d.findIndex((r, idx) =>
    idx > 0 &&
    textoEdWebV170_(r[i.id_ocorrencia]) ===
      textoEdWebV170_(registro.id_ocorrencia)
  );

  if (linha < 0) {
    anexarPorCabecalhoEdWebV170_(aba, registro);
    return;
  }

  const headers = d[0].map(textoEdWebV170_);
  const atual = d[linha];

  headers.forEach((h, c) => {
    if (Object.prototype.hasOwnProperty.call(registro, h)) {
      atual[c] = registro[h];
    }
  });

  aba.getRange(linha + 1, 1, 1, headers.length).setValues([atual]);
}


function exigirAbaEdWebV170_(ss, nome) {
  const aba = ss.getSheetByName(nome);
  if (!aba) throw new Error('A aba ' + nome + ' não foi encontrada.');
  return aba;
}


function garantirCabecalhosEdWebV170_(aba, headers) {
  const atuais = aba.getLastColumn()
    ? aba.getRange(1, 1, 1, aba.getLastColumn())
        .getDisplayValues()[0]
        .map(textoEdWebV170_)
    : [];

  const ausentes = headers.filter(h => !atuais.includes(h));

  if (ausentes.length) {
    aba.getRange(1, aba.getLastColumn() + 1, 1, ausentes.length)
      .setValues([ausentes]);
  }
}


function anexarPorCabecalhoEdWebV170_(aba, registro) {
  const headers = aba.getRange(1, 1, 1, aba.getLastColumn())
    .getDisplayValues()[0]
    .map(textoEdWebV170_);

  aba.appendRow(
    headers.map(h =>
      Object.prototype.hasOwnProperty.call(registro, h)
        ? registro[h]
        : ''
    )
  );
}


function indexarEdWebV170_(headers) {
  return headers.reduce((m, h, i) => {
    const k = textoEdWebV170_(h);
    if (k) m[k] = i;
    return m;
  }, {});
}


function valorEdWebV170_(linha, idx, campo) {
  if (!linha || idx[campo] === undefined) return '';
  return linha[idx[campo]];
}


function textoEdWebV170_(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function numeroEdWebV170_(valor) {
  const t = textoEdWebV170_(valor);
  if (!t) return '';
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : '';
}


function gerarIdEdWebV170_(prefixo) {
  const t = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'America/Sao_Paulo',
    'yyyyMMddHHmmss'
  );

  return prefixo + '_' + t + '_' +
    Utilities.getUuid().slice(0, 8).toUpperCase();
}


function extrairIdDriveEdWebV170_(url) {
  const t = textoEdWebV170_(url);
  const padroes = [
    /\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{20,})$/
  ];

  for (const p of padroes) {
    const m = t.match(p);
    if (m && m[1]) return m[1];
  }

  return '';
}


function obterOuCriarPastaEdWebV170_() {
  const pastas = DriveApp.getFoldersByName(NAVE_ED_WEB_V170.PASTA_DRIVE);
  return pastas.hasNext()
    ? pastas.next()
    : DriveApp.createFolder(NAVE_ED_WEB_V170.PASTA_DRIVE);
}


function gerarCsvEdWebV170_(headers, rows) {
  const esc = v => {
    if (v === null || v === undefined) return '""';
    const t = String(v).replace(/\r?\n/g, ' ').replace(/"/g, '""');
    return '"' + t + '"';
  };

  return '\uFEFF' + [
    headers.map(esc).join(','),
    ...rows.map(r => headers.map(h => esc(r[h])).join(','))
  ].join('\r\n');
}


function formatarDataEdWebV170_(valor) {
  if (!valor) return '';
  const d = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(d.getTime())) return String(valor);

  return Utilities.formatDate(
    d,
    Session.getScriptTimeZone() || 'America/Sao_Paulo',
    'dd/MM/yyyy HH:mm:ss'
  );
}
