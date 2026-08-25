/**
 * TESTE LOCAL CONTROLADO — CONTRATO EDITORIAL CENTRAL V2 — V0.13.10
 *
 * Executa somente com fixtures e planilhas em memória. Não acessa Drive,
 * não abre a planilha operacional e não cria pacote ou CSV de produção.
 */

function testeExportarPacoteRealFinalV2V01310() {
  const idProjetoEsperado =
    'PEC_F2ABF8D0-D6E8-43E4-9921-9219A95ED86E';
  const professorEsperado = 'Robson Carneiro';
  const quantidadeEsperada = 3;
  const ss = obterSpreadsheetOfflineSyncV070_();
  const contexto = obterContextoTesteManualExportacaoCentralV01210_(ss);
  const exportadoPor = obterAutorExportacaoCentralV01210_(contexto);

  // Preflight exclusivamente em memória. Em caso de divergência, nenhuma
  // chamada à camada Drive é realizada.
  const preflight = montarExportacaoEditorialCentralV01300_(
    ss,
    { idProjeto: idProjetoEsperado },
    'FINAL',
    {
      exportadoEm: new Date(),
      exportadoPor: exportadoPor
    }
  );

  validarPreflightPacoteRealFinalV2V01310_(
    preflight,
    idProjetoEsperado,
    professorEsperado,
    quantidadeEsperada,
    exportadoPor
  );

  const resultado = gerarCsvEditorialCentralV01310_(
    ss,
    { idProjeto: idProjetoEsperado },
    'FINAL',
    contexto
  );

  const auditoriaCsv = auditarCsvRealFinalV2V01310_(
    resultado,
    professorEsperado,
    quantidadeEsperada
  );

  const resposta = {
    id_exportacao: resultado.idExportacao,
    id_envio: resultado.idEnvio,
    id_projeto: resultado.idProjeto,
    schema_version: resultado.schemaVersion,
    modo: resultado.modo,
    nome_arquivo: resultado.nomeArquivo,
    id_arquivo_drive: resultado.idArquivoDrive,
    url_arquivo: resultado.urlArquivo,
    hash_snapshot: resultado.hashSnapshot,
    quantidade_questoes: resultado.quantidadeQuestoes,
    professor: resultado.professor,
    exportado_por: resultado.exportadoPor,
    fontes_incompletas: preflight.pacote.fontesIncompletas,
    gabaritos_incompletos: preflight.pacote.gabaritosIncompletos,
    itens_nao_liberados: preflight.pacote.itensNaoLiberados,
    consistenciaResumo: resultado.consistenciaResumo,
    auditoriaCsv: auditoriaCsv
  };

  Logger.log(JSON.stringify(resposta, null, 2));
  return resposta;
}


function validarPreflightPacoteRealFinalV2V01310_(
  exportacao,
  idProjetoEsperado,
  professorEsperado,
  quantidadeEsperada,
  exportadoPor
) {
  const pacote = exportacao && exportacao.pacote || {};
  afirmarTesteEditorialV01310_(
    exportacao.schemaVersion === 'NAVE_EDITORIAL_CENTRAL_V2',
    'Preflight bloqueado: schema V2 divergente.'
  );
  afirmarTesteEditorialV01310_(
    pacote.idProjeto === idProjetoEsperado && Boolean(pacote.idEnvio),
    'Preflight bloqueado: projeto ou id_envio não localizado.'
  );
  afirmarTesteEditorialV01310_(
    pacote.professor === professorEsperado,
    'Preflight bloqueado: professor divergente.'
  );
  afirmarTesteEditorialV01310_(
    Number(pacote.quantidadeQuestoes) === quantidadeEsperada &&
      exportacao.rows.length === quantidadeEsperada,
    'Preflight bloqueado: quantidade de questões divergente.'
  );
  afirmarTesteEditorialV01310_(
    Number(pacote.fontesIncompletas) === 0 &&
      Number(pacote.gabaritosIncompletos) === 0 &&
      Number(pacote.itensNaoLiberados) === 0,
    'Preflight bloqueado: o pacote possui pendências.'
  );
  afirmarTesteEditorialV01310_(
    exportacao.modo === 'FINAL' &&
      pacote.statusPacote === 'Preparado' &&
      exportacao.consistenciaResumo &&
      exportacao.consistenciaResumo.ok === true,
    'Preflight bloqueado: pacote incompatível com saída FINAL.'
  );
  afirmarTesteEditorialV01310_(
    exportacao.headers.length === 46 &&
      exportacao.headers[6] === 'professor' &&
      exportacao.rows.every(function(row) {
        return row.schema_version === 'NAVE_EDITORIAL_CENTRAL_V2' &&
          row.professor === professorEsperado &&
          row.exportado_por === exportadoPor;
      }),
    'Preflight bloqueado: contrato ou separação de identidade divergente.'
  );

  const ordens = exportacao.rows.map(function(row) { return Number(row.ordem); });
  const ids = exportacao.rows.map(function(row) { return String(row.id_questao || ''); });
  afirmarTesteEditorialV01310_(
    ordens.every(function(ordem, i) { return ordem === i + 1; }) &&
      ids.every(Boolean) && new Set(ids).size === quantidadeEsperada,
    'Preflight bloqueado: ordem ou IDs das questões são inválidos.'
  );

  // Exercita a serialização antes de qualquer persistência no Drive.
  const csv = serializarMatrizCsvEditorialCentralV01210_(exportacao.matrix);
  validarFormatoCsvFinalV2V01310_(csv, quantidadeEsperada);
}


function auditarCsvRealFinalV2V01310_(resultado, professorEsperado, quantidadeEsperada) {
  const arquivo = DriveApp.getFileById(resultado.idArquivoDrive);
  const csv = arquivo.getBlob().getDataAsString('UTF-8');
  const matriz = analisarCsvEntreAspasV01310_(csv);

  validarFormatoCsvFinalV2V01310_(csv, quantidadeEsperada);
  afirmarTesteEditorialV01310_(
    matriz.length === quantidadeEsperada + 1 &&
      matriz.every(function(linha) { return linha.length === 46; }),
    'Auditoria pós-gravação: CSV não possui 46 colunas e três questões.'
  );

  const headers = matriz[0];
  const idx = headers.reduce(function(mapa, header, i) {
    mapa[header] = i;
    return mapa;
  }, {});
  afirmarTesteEditorialV01310_(
    headers[6] === 'professor' &&
      idx.schema_version !== undefined &&
      idx.exportado_por !== undefined,
    'Auditoria pós-gravação: cabeçalho V2 incompatível.'
  );

  const dados = matriz.slice(1);
  const ordens = dados.map(function(linha) { return Number(linha[idx.ordem]); });
  const ids = dados.map(function(linha) { return linha[idx.id_questao]; });
  afirmarTesteEditorialV01310_(
    dados.every(function(linha) {
      return linha[idx.schema_version] === 'NAVE_EDITORIAL_CENTRAL_V2' &&
        linha[idx.professor] === professorEsperado &&
        linha[idx.exportado_por] === resultado.exportadoPor;
    }) &&
      ordens.every(function(ordem, i) { return ordem === i + 1; }) &&
      ids.every(Boolean) && new Set(ids).size === quantidadeEsperada,
    'Auditoria pós-gravação: conteúdo, ordem ou identidades divergentes.'
  );

  return {
    ok: true,
    colunas: 46,
    questoes: quantidadeEsperada,
    colunaProfessor: 7,
    professor: professorEsperado,
    utf8: csv.indexOf('\uFFFD') === -1,
    crlf: true,
    idsUnicos: true,
    ordem: ordens
  };
}


function validarFormatoCsvFinalV2V01310_(csv, quantidadeEsperada) {
  afirmarTesteEditorialV01310_(
    typeof csv === 'string' && csv.indexOf('\uFFFD') === -1,
    'CSV inválido ou com substituição de caractere UTF-8.'
  );
  afirmarTesteEditorialV01310_(
    csv.indexOf('\r\n') !== -1 && !/(^|[^\r])\n/.test(csv),
    'CSV deve utilizar exclusivamente CRLF.'
  );
  const matriz = analisarCsvEntreAspasV01310_(csv);
  afirmarTesteEditorialV01310_(
    matriz.length === quantidadeEsperada + 1 &&
      matriz.every(function(linha) { return linha.length === 46; }),
    'CSV deve possuir cabeçalho e exatamente três linhas de 46 colunas.'
  );
}


function analisarCsvEntreAspasV01310_(csv) {
  const matriz = [];
  let linha = [];
  let campo = '';
  let indice = 0;

  while (indice < csv.length) {
    if (csv.charAt(indice) !== '"') {
      throw new Error('TESTE V2: campo CSV não iniciado por aspas na posição ' + indice + '.');
    }
    indice += 1;
    campo = '';

    while (indice < csv.length) {
      const caractere = csv.charAt(indice);
      if (caractere === '"' && csv.charAt(indice + 1) === '"') {
        campo += '"';
        indice += 2;
      } else if (caractere === '"') {
        indice += 1;
        break;
      } else {
        campo += caractere;
        indice += 1;
      }
    }

    linha.push(campo);
    if (indice === csv.length) {
      matriz.push(linha);
      break;
    }
    if (csv.charAt(indice) === ',') {
      indice += 1;
      continue;
    }
    if (csv.substr(indice, 2) === '\r\n') {
      matriz.push(linha);
      linha = [];
      indice += 2;
      continue;
    }
    throw new Error('TESTE V2: separador CSV inválido na posição ' + indice + '.');
  }

  return matriz;
}

function testeContratoEditorialCentralV01310() {
  testarOrigemProfessorEditorialV01310_();
  const fixtureA = criarFixtureContratoEditorialV01310_(
    'ENVIO_TESTE_V2_A',
    'Professor Teste'
  );
  const ssA = fixtureA.ss;
  const contexto = {
    exportadoEm: new Date('2026-08-15T12:00:00.000Z'),
    exportadoPor: 'operador@example.org'
  };

  const exportacaoV1 = montarExportacaoEditorialCentralV01200_(
    ssA,
    { idEnvio: fixtureA.idEnvio },
    'DIAGNOSTICO',
    contexto
  );
  const exportacaoV2 = montarExportacaoEditorialCentralV01300_(
    ssA,
    { idEnvio: fixtureA.idEnvio },
    'DIAGNOSTICO',
    contexto
  );

  afirmarTesteEditorialV01310_(
    exportacaoV1.schemaVersion === 'NAVE_EDITORIAL_CENTRAL_V1' &&
      exportacaoV1.headers.length === 45 &&
      exportacaoV1.headers.indexOf('professor') === -1,
    'O contrato V1 deve permanecer com 45 colunas e sem professor.'
  );
  afirmarTesteEditorialV01310_(
    exportacaoV2.schemaVersion === 'NAVE_EDITORIAL_CENTRAL_V2' &&
      exportacaoV2.headers.length === 46 &&
      exportacaoV2.matrix.every(function(linha) { return linha.length === 46; }),
    'O contrato V2 deve possuir exatamente 46 colunas.'
  );
  afirmarTesteEditorialV01310_(
    exportacaoV2.headers.filter(function(h) { return h === 'professor'; }).length === 1 &&
      exportacaoV2.headers.filter(function(h) { return h !== 'professor'; })
        .every(function(h, i) { return h === exportacaoV1.headers[i]; }),
    'As 45 colunas V1 devem conservar sua ordem relativa no V2.'
  );
  afirmarTesteEditorialV01310_(
    exportacaoV2.rows[0].professor === 'Professor Teste' &&
      exportacaoV2.rows[0].exportado_por === 'operador@example.org' &&
      exportacaoV2.rows[0].professor !== exportacaoV2.rows[0].exportado_por,
    'Professor e autoria da exportação devem permanecer separados.'
  );

  testarProfessorVazioEditorialV01310_();
  const imutabilidade = testarImutabilidadeProfessorEditorialV01310_();
  const hashes = testarHashEditorialV01310_(exportacaoV2);
  const csv = testarCsvEditorialV01310_(exportacaoV2);
  const matriz = testarMatrizPedagogicaEditorialV01310_();
  testarPacoteHistoricoV1EditorialV01310_(contexto);

  const resultado = {
    ok: true,
    schemaV1: exportacaoV1.schemaVersion,
    colunasV1: exportacaoV1.headers.length,
    schemaV2: exportacaoV2.schemaVersion,
    colunasV2: exportacaoV2.headers.slice(),
    professor: exportacaoV2.rows[0].professor,
    exportadoPor: exportacaoV2.rows[0].exportado_por,
    professorVazioBloqueado: true,
    imutabilidade: imutabilidade,
    hashes: hashes,
    csv: csv,
    matriz: matriz
  };

  Logger.log(JSON.stringify(resultado, null, 2));
  return resultado;
}


function testarOrigemProfessorEditorialV01310_() {
  const headers = Array.from(NAVE_EDITORACAO_CENTRAL_V01111.CABECALHOS);
  const valores = {
    id_envio: 'ENVIO_ORIGEM_PROFESSOR', id_sequencia: 'SEQ_TESTE_V2',
    titulo: 'Aula 01', descricao: '3° Ano',
    ids_questoes_json: '["Q_TESTE_V2"]', quantidade_itens: 1,
    status: 'concluido', professor_email: 'nao-usar@example.org',
    professor_nome: 'Professor Teste', responsavel_editoracao_email: '',
    responsavel_editoracao_nome: '', criado_em: '', atualizado_em: '',
    iniciado_em: '', concluido_em: '', cancelado_em: ''
  };
  const aba = new AbaMemoriaEditorialV01310_([
    headers,
    headers.map(function(header) { return valores[header]; })
  ]);
  const jobs = lerJobsEditoracaoCentralV01111_(aba);
  afirmarTesteEditorialV01310_(
    jobs.length === 1 &&
      jobs[0].professorNome === 'Professor Teste' &&
      jobs[0].professorNome !== jobs[0].professorEmail,
    'EDITORACAO_CENTRAL.professor_nome deve originar professorNome sem fallback de e-mail.'
  );
}


function testarProfessorVazioEditorialV01310_() {
  const fixture = criarFixtureContratoEditorialV01310_(
    'ENVIO_TESTE_V2_SEM_PROFESSOR',
    ''
  );
  const erro = capturarErroTesteEditorialV01310_(function() {
    montarExportacaoEditorialCentralV01300_(
      fixture.ss,
      { idEnvio: fixture.idEnvio },
      'DIAGNOSTICO',
      { exportadoPor: 'operador@example.org' }
    );
  });

  afirmarTesteEditorialV01310_(
    erro && /professor/i.test(erro.message),
    'A exportação V2 deve bloquear professor vazio explicitamente.'
  );
}


function testarImutabilidadeProfessorEditorialV01310_() {
  const headers = cabecalhosPacoteTesteEditorialV01310_();
  const aba = new AbaMemoriaEditorialV01310_([headers]);
  const pacoteA = pacoteTesteEditorialV01310_('ENVIO_IMUTAVEL_A', 'Professor A');

  persistirPacoteCentralV01120_(aba, pacoteA);
  const congelado = obterPacoteCentralPorEnvioV01120_(aba, pacoteA.idEnvio);

  // Simula alteração posterior na origem. O resumo já persistido não é regravado.
  pacoteA.professor = 'Professor B';
  const reutilizado = obterPacoteCentralPorEnvioV01120_(aba, pacoteA.idEnvio);

  const pacoteB = pacoteTesteEditorialV01310_('ENVIO_IMUTAVEL_B', 'Professor B');
  persistirPacoteCentralV01120_(aba, pacoteB);
  const novoCiclo = obterPacoteCentralPorEnvioV01120_(aba, pacoteB.idEnvio);

  afirmarTesteEditorialV01310_(
    congelado.professor === 'Professor A' &&
      reutilizado.professor === 'Professor A' &&
      novoCiclo.professor === 'Professor B',
    'O mesmo pacote deve preservar Professor A e o novo ciclo capturar Professor B.'
  );

  return {
    pacoteCongelado: reutilizado.professor,
    novoCiclo: novoCiclo.professor
  };
}


function testarPacoteHistoricoV1EditorialV01310_(contexto) {
  const fixture = criarFixtureContratoEditorialV01310_(
    'ENVIO_HISTORICO_V1',
    null,
    true
  );
  const v1 = montarExportacaoEditorialCentralV01200_(
    fixture.ss,
    { idEnvio: fixture.idEnvio },
    'DIAGNOSTICO',
    contexto
  );
  afirmarTesteEditorialV01310_(v1.headers.length === 45, 'Pacote histórico deve continuar válido no V1.');

  const erroV2 = capturarErroTesteEditorialV01310_(function() {
    montarExportacaoEditorialCentralV01300_(
      fixture.ss,
      { idEnvio: fixture.idEnvio },
      'DIAGNOSTICO',
      contexto
    );
  });
  afirmarTesteEditorialV01310_(
    erroV2 && /professor/i.test(erroV2.message),
    'Pacote histórico sem professor deve ser bloqueado somente no V2.'
  );
}


function testarHashEditorialV01310_(exportacao) {
  const base = copiarTesteEditorialV01310_(exportacao);
  const hashBase = gerarHashSnapshotEditorialCentralV01310_(base);
  const mutacoes = {
    professor: copiarTesteEditorialV01310_(base),
    ordem: copiarTesteEditorialV01310_(base),
    idQuestao: copiarTesteEditorialV01310_(base),
    idProjeto: copiarTesteEditorialV01310_(base),
    idEnvio: copiarTesteEditorialV01310_(base),
    exportadoPor: copiarTesteEditorialV01310_(base)
  };
  mutacoes.professor.pacote.professor = 'Outro Professor';
  mutacoes.ordem.rows[0].ordem = 2;
  mutacoes.idQuestao.rows[0].id_questao = 'Q_OUTRA';
  mutacoes.idProjeto.pacote.idProjeto = 'PEC_OUTRO';
  mutacoes.idEnvio.pacote.idEnvio = 'ENVIO_OUTRO';
  mutacoes.exportadoPor.rows[0].exportado_por = 'outro@example.org';

  ['professor', 'ordem', 'idQuestao', 'idProjeto', 'idEnvio'].forEach(function(campo) {
    afirmarTesteEditorialV01310_(
      gerarHashSnapshotEditorialCentralV01310_(mutacoes[campo]) !== hashBase,
      'O hash V2 deve mudar quando muda: ' + campo
    );
  });
  afirmarTesteEditorialV01310_(
    gerarHashSnapshotEditorialCentralV01310_(mutacoes.exportadoPor) === hashBase,
    'O hash V2 não deve depender de exportado_por.'
  );

  return { ok: true, hashBase: hashBase, independenteDeExportadoPor: true };
}


function testarCsvEditorialV01310_(exportacao) {
  const copia = copiarTesteEditorialV01310_(exportacao);
  copia.rows[0].trecho_inicial = 'Texto, "teste" com acentuação';
  copia.matrix = [copia.headers].concat(copia.rows.map(function(row) {
    return copia.headers.map(function(header) { return row[header]; });
  }));
  const csv = serializarMatrizCsvEditorialCentralV01210_(copia.matrix);
  const linhas = csv.split('\r\n');
  const linhaCom46CamposEntreAspas =
    /^"(?:[^"]|"")*"(?:,"(?:[^"]|"")*"){45}$/;

  afirmarTesteEditorialV01310_(!/(^|[^\r])\n/.test(csv), 'O CSV deve usar CRLF.');
  afirmarTesteEditorialV01310_(
    linhas.every(function(linha) { return linhaCom46CamposEntreAspas.test(linha); }),
    'Cada linha CSV deve possuir exatamente 46 campos, todos entre aspas.'
  );
  afirmarTesteEditorialV01310_(
    csv.indexOf('"Texto, ""teste"" com acentuação"') !== -1,
    'O CSV deve preservar UTF-8, vírgula e escaping de aspas.'
  );
  afirmarTesteEditorialV01310_(
    linhas[0].split(',').length === 46,
    'O cabeçalho CSV V2 deve possuir 46 campos.'
  );

  return { ok: true, linhas: linhas.length, colunas: 46, separadorLinha: 'CRLF' };
}


function testarMatrizPedagogicaEditorialV01310_() {
  const headers = Array.from(MATRIZ_ENEM_PEDAGOGICA_V01320.CABECALHOS);
  const aprovada = linhaMatrizTesteEditorialV01310_('CN', 'C1', 'H1', 'Aprovado');
  const rascunho = linhaMatrizTesteEditorialV01310_('CN', 'C2', 'H2', 'Rascunho');
  const ss = new SpreadsheetMemoriaEditorialV01310_({
    MATRIZ_ENEM_PEDAGOGICA: new AbaMemoriaEditorialV01310_([headers, aprovada, rascunho])
  });
  const itens = listarMatrizEnemPedagogicaAprovadaV01320_(ss);
  afirmarTesteEditorialV01310_(
    itens.length === 1 && itens[0].status_revisao === 'Aprovado',
    'Somente conteúdo aprovado pode sair da matriz.'
  );

  const ssSemAprovado = new SpreadsheetMemoriaEditorialV01310_({
    MATRIZ_ENEM_PEDAGOGICA: new AbaMemoriaEditorialV01310_([headers, rascunho])
  });
  afirmarTesteEditorialV01310_(
    listarMatrizEnemPedagogicaAprovadaV01320_(ssSemAprovado).length === 0,
    'Ausência de conteúdo aprovado deve resultar em cobertura vazia detectável pelo R.'
  );

  const ssDuplicada = new SpreadsheetMemoriaEditorialV01310_({
    MATRIZ_ENEM_PEDAGOGICA: new AbaMemoriaEditorialV01310_([headers, aprovada, aprovada.slice()])
  });
  const erro = capturarErroTesteEditorialV01310_(function() {
    listarMatrizEnemPedagogicaAprovadaV01320_(ssDuplicada);
  });
  afirmarTesteEditorialV01310_(erro && /duplicada/i.test(erro.message), 'A matriz deve rejeitar chave aprovada duplicada.');

  return { ok: true, aprovados: 1, naoAprovadosExcluidos: 1, duplicidadeBloqueada: true };
}


function criarFixtureContratoEditorialV01310_(idEnvio, professor, semColunaProfessor) {
  const idProjeto = derivarIdProjetoPacoteCentralV01120_(idEnvio);
  const headersPacote = cabecalhosPacoteTesteEditorialV01310_();
  if (semColunaProfessor === true) headersPacote.pop();
  const valoresPacote = {
    id_envio: idEnvio,
    id_projeto: idProjeto,
    id_sequencia: 'SEQ_TESTE_V2',
    titulo: 'Aula 01',
    descricao: '3° Ano',
    ids_questoes_json: '["Q_TESTE_V2"]',
    quantidade_questoes: 1,
    fontes_incompletas: 0,
    gabaritos_incompletos: 0,
    itens_nao_liberados: 0,
    status_pacote: 'Preparado',
    criado_em: '2026-08-15T10:00:00.000Z',
    criado_por: 'criador@example.org',
    professor: professor === null ? '' : professor
  };
  const linhaPacote = headersPacote.map(function(h) { return valoresPacote[h]; });
  const headersItens = Array.from(NAVE_PACOTE_EDITORIAL_CENTRAL_V01120.CABECALHOS_ITENS);
  const valoresItem = itemTesteEditorialV01310_(idEnvio, idProjeto);
  const linhaItem = headersItens.map(function(h) { return valoresItem[h]; });
  const ss = new SpreadsheetMemoriaEditorialV01310_({
    PACOTES_EDITORIAIS_CENTRAIS: new AbaMemoriaEditorialV01310_([headersPacote, linhaPacote]),
    ITENS_PACOTES_CENTRAIS: new AbaMemoriaEditorialV01310_([headersItens, linhaItem])
  });
  return { ss: ss, idEnvio: idEnvio, idProjeto: idProjeto };
}


function pacoteTesteEditorialV01310_(idEnvio, professor) {
  return {
    idEnvio: idEnvio,
    idProjeto: derivarIdProjetoPacoteCentralV01120_(idEnvio),
    idSequencia: 'SEQ_TESTE',
    titulo: 'Aula 01',
    descricao: '3° Ano',
    questionIds: ['Q_TESTE_V2'],
    quantidadeQuestoes: 1,
    fontesIncompletas: 0,
    gabaritosIncompletos: 0,
    itensNaoLiberados: 0,
    statusPacote: 'Preparado',
    criadoEm: '2026-08-15T10:00:00.000Z',
    criadoPor: 'criador@example.org',
    professor: professor
  };
}


function cabecalhosPacoteTesteEditorialV01310_() {
  return Array.from(NAVE_PACOTE_EDITORIAL_CENTRAL_V01120.CABECALHOS_PACOTES)
    .concat(['professor']);
}


function itemTesteEditorialV01310_(idEnvio, idProjeto) {
  return {
    id_item_pacote: 'ITEM_TESTE', id_envio: idEnvio, id_projeto: idProjeto,
    id_sequencia: 'SEQ_TESTE_V2', ordem: 1, id_questao: 'Q_TESTE_V2',
    area: 'CN', componente: 'Química', competencia: 'C1', habilidade: 'H2',
    objeto_principal: 'Cinética química', acao_cognitiva: 'Analisar',
    dificuldade: 'Média', dificuldade_faixa: 0.5, funcao_pedagogica: 'Consolidação',
    gabarito_oficial: 'C', ano: '2024', edicao: 'Regular', colecao_origem: 'ENEM',
    pagina_pdf: 10, nome_publico_fonte: 'ENEM 2024',
    url_pdf: 'https://drive.google.com/file/d/ARQUIVO_TESTE/view', url_pagina: '',
    disponibilidade_fonte: true, pagina_localizada: true, motivo_fonte: '',
    status_validacao: 'Homologada', maturidade_curadoria: 'Homologada',
    status_curadoria: 'Validada', liberacao_editorial: 'Liberada',
    tempo_estimado_min: 3, trecho_inicial: 'Trecho controlado',
    criado_em: '2026-08-15T10:00:00.000Z'
  };
}


function linhaMatrizTesteEditorialV01310_(area, competencia, habilidade, status) {
  return [
    area, 'Química', competencia, 'Descrição oficial', habilidade,
    'Descrição oficial da habilidade', 'Interpretação revisada', 'Analisar',
    'Expectativa revisada', 'Dificuldades revisadas', 'Orientações revisadas',
    '1', 'revisor@example.org', '2026-08-15', status
  ];
}


function copiarTesteEditorialV01310_(valor) {
  return JSON.parse(JSON.stringify(valor));
}


function capturarErroTesteEditorialV01310_(acao) {
  try {
    acao();
    return null;
  } catch (erro) {
    return erro;
  }
}


function afirmarTesteEditorialV01310_(condicao, mensagem) {
  if (!condicao) throw new Error('TESTE V2: ' + mensagem);
}


class SpreadsheetMemoriaEditorialV01310_ {
  constructor(abas) {
    this.abas_ = abas || {};
  }

  getSheetByName(nome) {
    return this.abas_[nome] || null;
  }
}


class AbaMemoriaEditorialV01310_ {
  constructor(dados) {
    this.dados_ = dados.map(function(linha) { return linha.slice(); });
  }

  getLastRow() {
    return this.dados_.length;
  }

  getLastColumn() {
    return this.dados_.reduce(function(maximo, linha) {
      return Math.max(maximo, linha.length);
    }, 0);
  }

  getDataRange() {
    return this.getRange(1, 1, this.getLastRow(), this.getLastColumn());
  }

  getRange(linha, coluna, quantidadeLinhas, quantidadeColunas) {
    const self = this;
    const nLinhas = quantidadeLinhas || 1;
    const nColunas = quantidadeColunas || 1;
    return {
      getValues: function() {
        return Array.from({ length: nLinhas }, function(_, i) {
          return Array.from({ length: nColunas }, function(__, j) {
            return (self.dados_[linha - 1 + i] || [])[coluna - 1 + j];
          });
        });
      },
      getDisplayValues: function() {
        return this.getValues().map(function(valores) {
          return valores.map(function(valor) {
            return valor === null || valor === undefined ? '' : String(valor);
          });
        });
      },
      setValue: function(valor) {
        while (self.dados_.length < linha) self.dados_.push([]);
        self.dados_[linha - 1][coluna - 1] = valor;
      }
    };
  }

  appendRow(linha) {
    this.dados_.push(linha.slice());
  }
}
