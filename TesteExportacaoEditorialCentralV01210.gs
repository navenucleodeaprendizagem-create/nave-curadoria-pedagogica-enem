/**
 * TESTE MANUAL CONTROLADO — EXPORTAÇÃO EDITORIAL CENTRAL V0.12.10
 *
 * Execute exclusivamente pelo editor do Google Apps Script.
 * Não expõe endpoint e não fabrica contexto de autorização.
 */

function testeExportarPacoteQuimicaDiagnosticoV01210() {
  const ss = obterSpreadsheetOfflineSyncV070_();
  const contexto = obterContextoTesteManualExportacaoCentralV01210_(ss);

  const resultado = gerarCsvEditorialCentralV01210_(
    ss,
    {
      idProjeto: 'PEC_11AB7581-5CC3-491B-A39D-B49A1FB27269'
    },
    'DIAGNOSTICO',
    contexto
  );

  Logger.log(JSON.stringify(resultado, null, 2));
  return resultado;
}


function testeExportarPacoteQuimicaFinalV01210() {
  const ss = obterSpreadsheetOfflineSyncV070_();
  const contexto = obterContextoTesteManualExportacaoCentralV01210_(ss);

  return gerarCsvEditorialCentralV01210_(
    ss,
    {
      idProjeto: 'PEC_11AB7581-5CC3-491B-A39D-B49A1FB27269'
    },
    'FINAL',
    contexto
  );
}


function obterContextoTesteManualExportacaoCentralV01210_(ss) {
  const emailAtivo = normalizarEmailIdentidadeNaveV091_(
    Session.getActiveUser().getEmail()
  );
  const emailEfetivo = normalizarEmailIdentidadeNaveV091_(
    Session.getEffectiveUser().getEmail()
  );

  if (!emailAtivo || !emailEfetivo || emailAtivo !== emailEfetivo) {
    throw new Error(
      'TESTE V0.12.10 bloqueado: a conta ativa e a conta efetiva devem ser identificáveis e iguais.'
    );
  }

  const abaUsuarios = ss.getSheetByName(NAVE_IDENTIDADE_V090.ABA_USUARIOS);

  if (!abaUsuarios || abaUsuarios.getLastRow() < 2) {
    throw new Error(
      'TESTE V0.12.10 bloqueado: a aba de usuários não está configurada.'
    );
  }

  const dados = abaUsuarios.getDataRange().getDisplayValues();
  const validacaoHeaders = validarCabecalhosIdentidadeNaveV091_(
    dados[0] || [],
    false
  );

  if (validacaoHeaders.ok !== true) {
    throw new Error(
      'TESTE V0.12.10 bloqueado: schema da aba de usuários incompatível.'
    );
  }

  const idx = indexarIdentidadeNaveV090_(dados[0]);
  const correspondencias = dados.slice(1).filter(function(linha) {
    return normalizarEmailIdentidadeNaveV091_(
      linha[idx.email_autenticacao]
    ) === emailAtivo;
  });

  if (correspondencias.length !== 1) {
    throw new Error(
      'TESTE V0.12.10 bloqueado: o e-mail da sessão deve corresponder a exatamente um usuário.'
    );
  }

  const idGoogle = String(
    correspondencias[0][idx.id_google] || ''
  ).trim();

  if (!idGoogle) {
    throw new Error(
      'TESTE V0.12.10 bloqueado: usuário manual sem id_google previamente vinculado.'
    );
  }

  const contexto = obterContextoUsuarioAutenticadoV090_(
    emailAtivo,
    idGoogle,
    ss,
    false
  );

  validarPermissaoEditoracaoV01111_(contexto);
  return contexto;
}
