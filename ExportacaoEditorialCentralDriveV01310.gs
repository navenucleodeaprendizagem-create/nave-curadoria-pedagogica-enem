/**
 * NAVE | EXPORTAÇÃO EDITORIAL CENTRAL V2 PARA DRIVE — V0.13.10
 *
 * Gera o CSV V2 e reutiliza a pasta e o log institucional da exportação V1.
 * Não executa R e não gera PDFs.
 */

function gerarCsvEditorialCentralV01310_(
  ss,
  referencia,
  modo,
  contexto
) {
  validarPermissaoEditoracaoV01111_(contexto);

  const exportadoPor = obterAutorExportacaoCentralV01210_(contexto);
  const exportadoEm = new Date();
  const exportacao = montarExportacaoEditorialCentralV01300_(
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
  const hashSnapshot = gerarHashSnapshotEditorialCentralV01310_(
    exportacao
  );
  const idExportacao = gerarIdExportacaoEditorialCentralV01210_();
  const nomeArquivo = gerarNomeArquivoEditorialCentralV01310_(
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
        'O CSV V2 foi criado, mas o log falhou. id_exportacao ' +
        idExportacao + ', arquivo ' + arquivo.getId() + '. Erro: ' +
        String(errorLog && errorLog.message || errorLog)
      );
    }

    return {
      idExportacao: idExportacao,
      idEnvio: exportacao.pacote.idEnvio,
      idProjeto: exportacao.pacote.idProjeto,
      professor: exportacao.pacote.professor,
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


function gerarHashSnapshotEditorialCentralV01310_(exportacao) {
  const pacote = exportacao && exportacao.pacote || {};
  const ordemEIds = (exportacao.rows || []).map(function(row) {
    return {
      ordem: Number(row.ordem || 0),
      id_questao: String(row.id_questao || '')
    };
  });

  const assinatura = JSON.stringify({
    schema_version: exportacao.schemaVersion,
    id_envio: pacote.idEnvio,
    id_projeto: pacote.idProjeto,
    professor: pacote.professor,
    quantidade_questoes: pacote.quantidadeQuestoes,
    ordem_e_ids: ordemEIds
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


function gerarNomeArquivoEditorialCentralV01310_(idProjeto, data) {
  const idSanitizado = String(idProjeto || '')
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!idSanitizado) {
    throw new Error('Não foi possível gerar nome do CSV V2.');
  }

  const timestamp = Utilities.formatDate(
    data,
    Session.getScriptTimeZone() || 'America/Sao_Paulo',
    'yyyyMMdd_HHmmss'
  );

  return 'EDITORIAL_V2_' + idSanitizado + '_' + timestamp + '.csv';
}
