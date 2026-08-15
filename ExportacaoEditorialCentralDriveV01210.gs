/**
 * NAVE | EXPORTAÇÃO EDITORIAL CENTRAL PARA DRIVE — V0.12.10
 *
 * Persiste no Google Drive a matriz validada por
 * montarExportacaoEditorialCentralV01200_() e registra uma linha de log.
 * Não integra RStudio e não gera PDFs.
 */

const NAVE_EXPORTACAO_EDITORIAL_CENTRAL_DRIVE_V01210 = Object.freeze({
  PASTA_DRIVE: 'NAVE_PACOTES_EDITORIAIS_CENTRAIS',
  ABA_LOG: 'EXPORTACOES_EDITORIAIS_CENTRAIS',
  CABECALHOS_LOG: Object.freeze([
    'id_exportacao',
    'id_envio',
    'id_projeto',
    'schema_version',
    'modo',
    'nome_arquivo',
    'id_arquivo_drive',
    'url_arquivo',
    'hash_snapshot',
    'quantidade_questoes',
    'fontes_incompletas',
    'gabaritos_incompletos',
    'itens_nao_liberados',
    'status_exportacao',
    'exportado_em',
    'exportado_por'
  ])
});


function gerarCsvEditorialCentralV01210_(
  ss,
  referencia,
  modo,
  contexto
) {
  validarPermissaoEditoracaoV01111_(contexto);

  const exportadoPor = obterAutorExportacaoCentralV01210_(contexto);
  const exportadoEm = new Date();

  // Toda validação ocorre antes de qualquer criação no Drive ou na planilha.
  const exportacao = montarExportacaoEditorialCentralV01200_(
    ss,
    referencia,
    modo,
    {
      exportadoEm: exportadoEm,
      exportadoPor: exportadoPor
    }
  );

  const csv = serializarMatrizCsvEditorialCentralV01210_(
    exportacao.matrix
  );
  const hashSnapshot = gerarHashSnapshotEditorialCentralV01210_(
    exportacao
  );
  const idExportacao = gerarIdExportacaoEditorialCentralV01210_();
  const nomeArquivo = gerarNomeArquivoEditorialCentralV01210_(
    exportacao.pacote.idProjeto,
    exportadoEm
  );

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  let arquivo = null;

  try {
    const pasta = obterOuCriarPastaEditorialCentralV01210_();
    const abaLog = obterOuCriarLogEditorialCentralV01210_(ss);
    const blob = Utilities.newBlob(
      csv,
      'text/csv;charset=UTF-8',
      nomeArquivo
    );

    arquivo = pasta.createFile(blob);

    try {
      abaLog.appendRow([
        idExportacao,
        exportacao.pacote.idEnvio,
        exportacao.pacote.idProjeto,
        exportacao.schemaVersion,
        exportacao.modo,
        nomeArquivo,
        arquivo.getId(),
        arquivo.getUrl(),
        hashSnapshot,
        exportacao.pacote.quantidadeQuestoes,
        exportacao.pacote.fontesIncompletas,
        exportacao.pacote.gabaritosIncompletos,
        exportacao.pacote.itensNaoLiberados,
        'GERADO',
        exportadoEm,
        exportadoPor
      ]);
    } catch (errorLog) {
      throw new Error(
        'O CSV foi criado no Drive, mas o registro da exportação falhou. ' +
        'Recupere a tentativa pelo id_exportacao ' + idExportacao +
        ', arquivo ' + arquivo.getId() + ' (' + arquivo.getUrl() + '). ' +
        'Erro do log: ' + String(errorLog && errorLog.message || errorLog)
      );
    }

    return {
      idExportacao: idExportacao,
      idEnvio: exportacao.pacote.idEnvio,
      idProjeto: exportacao.pacote.idProjeto,
      schemaVersion: exportacao.schemaVersion,
      modo: exportacao.modo,
      quantidadeQuestoes: exportacao.pacote.quantidadeQuestoes,
      nomeArquivo: nomeArquivo,
      idArquivoDrive: arquivo.getId(),
      urlArquivo: arquivo.getUrl(),
      hashSnapshot: hashSnapshot,
      exportadoEm: exportadoEm,
      exportadoPor: exportadoPor,
      pendencias: exportacao.pendencias,
      consistenciaResumo: exportacao.consistenciaResumo
    };
  } finally {
    lock.releaseLock();
  }
}


function serializarMatrizCsvEditorialCentralV01210_(matrix) {
  if (!Array.isArray(matrix) || !matrix.length) {
    throw new Error('Matriz editorial ausente ou vazia.');
  }

  const largura = matrix[0].length;
  if (!largura) {
    throw new Error('Cabeçalho da matriz editorial está vazio.');
  }

  return matrix.map(function(linha, indice) {
    if (!Array.isArray(linha) || linha.length !== largura) {
      throw new Error(
        'Linha ' + (indice + 1) + ' possui largura diferente do schema editorial.'
      );
    }

    return linha.map(escaparCampoCsvEditorialCentralV01210_).join(',');
  }).join('\r\n');
}


function escaparCampoCsvEditorialCentralV01210_(valor) {
  let texto;

  if (valor instanceof Date) {
    texto = valor.toISOString();
  } else if (valor === null || valor === undefined) {
    texto = '';
  } else if (typeof valor === 'boolean') {
    texto = valor ? 'true' : 'false';
  } else {
    texto = String(valor);
  }

  return '"' + texto.replace(/"/g, '""') + '"';
}


function gerarHashSnapshotEditorialCentralV01210_(exportacao) {
  const pacote = exportacao && exportacao.pacote || {};
  const idsOrdenados = (exportacao.rows || []).map(function(row) {
    return String(row.id_questao || '');
  });

  const assinatura = JSON.stringify({
    schema_version: exportacao.schemaVersion,
    id_envio: pacote.idEnvio,
    id_projeto: pacote.idProjeto,
    quantidade_questoes: pacote.quantidadeQuestoes,
    ids_questoes_ordenados: idsOrdenados
  });

  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    assinatura,
    Utilities.Charset.UTF_8
  );

  return digest.map(function(byte) {
    return ((byte + 256) % 256).toString(16).padStart(2, '0');
  }).join('');
}


function gerarNomeArquivoEditorialCentralV01210_(idProjeto, data) {
  const idSanitizado = String(idProjeto || '')
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!idSanitizado) {
    throw new Error('Não foi possível gerar nome de arquivo sem id_projeto válido.');
  }

  const timestamp = Utilities.formatDate(
    data,
    Session.getScriptTimeZone() || 'America/Sao_Paulo',
    'yyyyMMdd_HHmmss'
  );

  return 'NAVE_EDITORIAL_' + idSanitizado + '_' + timestamp + '.csv';
}


function obterOuCriarPastaEditorialCentralV01210_() {
  const pastas = DriveApp.getFoldersByName(
    NAVE_EXPORTACAO_EDITORIAL_CENTRAL_DRIVE_V01210.PASTA_DRIVE
  );
  const encontradas = [];

  while (pastas.hasNext() && encontradas.length < 2) {
    encontradas.push(pastas.next());
  }

  if (encontradas.length > 1) {
    throw new Error(
      'Mais de uma pasta do Drive possui o nome ' +
      NAVE_EXPORTACAO_EDITORIAL_CENTRAL_DRIVE_V01210.PASTA_DRIVE + '.'
    );
  }

  if (encontradas.length === 1) {
    return encontradas[0];
  }

  return DriveApp.createFolder(
    NAVE_EXPORTACAO_EDITORIAL_CENTRAL_DRIVE_V01210.PASTA_DRIVE
  );
}


function obterOuCriarLogEditorialCentralV01210_(ss) {
  const config = NAVE_EXPORTACAO_EDITORIAL_CENTRAL_DRIVE_V01210;
  let aba = ss.getSheetByName(config.ABA_LOG);

  if (!aba) {
    aba = ss.insertSheet(config.ABA_LOG);
  }

  if (aba.getLastRow() === 0) {
    aba.getRange(1, 1, 1, config.CABECALHOS_LOG.length)
      .setValues([Array.from(config.CABECALHOS_LOG)]);
    aba.setFrozenRows(1);
    return aba;
  }

  const atuais = aba.getRange(
    1,
    1,
    1,
    config.CABECALHOS_LOG.length
  ).getDisplayValues()[0];

  const divergente = config.CABECALHOS_LOG.some(function(header, indice) {
    return String(atuais[indice] || '').trim() !== header;
  });

  if (divergente) {
    throw new Error(
      'Cabeçalho incompatível na aba ' + config.ABA_LOG + '.'
    );
  }

  return aba;
}


function obterAutorExportacaoCentralV01210_(contexto) {
  const user = contexto && contexto.user || {};
  const email = String(
    user.emailAutenticacao || user.email || ''
  ).trim();

  if (!email) {
    throw new Error('Usuário autenticado sem autoria identificável para exportação.');
  }

  return email;
}


function gerarIdExportacaoEditorialCentralV01210_() {
  return 'EXP_CENTRAL_' + Utilities.getUuid().toUpperCase();
}
