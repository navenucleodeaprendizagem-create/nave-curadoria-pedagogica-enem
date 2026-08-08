/**
 * NAVE — ADMINISTRAÇÃO E DIAGNÓSTICOS
 * Consolidação estrutural V1.0
 *
 * Origem:
 * - VerificarFuso.gs
 *
 * Melhorias incorporadas:
 * - remove o ID fixo da planilha;
 * - usa sempre a planilha ativa;
 * - mantém os nomes públicos já usados pelo menu;
 * - centraliza o fuso oficial do projeto.
 */

const NAVE_ADMIN_V100 = Object.freeze({
  FUSO_OFICIAL: 'America/Sao_Paulo'
});


/**
 * Corrige o fuso da planilha ativa para o padrão oficial do projeto.
 */
function corrigirFusoPlanilhaNave() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error('Não foi possível localizar a planilha ativa.');
  }

  ss.setSpreadsheetTimeZone(NAVE_ADMIN_V100.FUSO_OFICIAL);

  const fusoPlanilha = ss.getSpreadsheetTimeZone();
  const fusoScript = Session.getScriptTimeZone();

  SpreadsheetApp.getUi().alert(
    'Fuso horário corrigido',
    [
      'Planilha: ' + ss.getName(),
      'Fuso da planilha: ' + fusoPlanilha,
      'Fuso do Apps Script: ' + fusoScript
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


/**
 * Exibe os fusos e os horários calculados para diagnóstico.
 */
function verificarFusosNave() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error('Não foi possível localizar a planilha ativa.');
  }

  const fusoPlanilha = ss.getSpreadsheetTimeZone();
  const fusoScript = Session.getScriptTimeZone();
  const agora = new Date();

  const horarioPlanilha = Utilities.formatDate(
    agora,
    fusoPlanilha,
    'dd/MM/yyyy HH:mm:ss'
  );

  const horarioScript = Utilities.formatDate(
    agora,
    fusoScript,
    'dd/MM/yyyy HH:mm:ss'
  );

  const situacao =
    fusoPlanilha === NAVE_ADMIN_V100.FUSO_OFICIAL &&
    fusoScript === NAVE_ADMIN_V100.FUSO_OFICIAL
      ? 'Configuração correta'
      : 'Atenção: os fusos não estão totalmente padronizados';

  SpreadsheetApp.getUi().alert(
    'Verificação de fusos',
    [
      'Planilha: ' + ss.getName(),
      '',
      'Fuso oficial NAVE: ' + NAVE_ADMIN_V100.FUSO_OFICIAL,
      'Fuso da planilha: ' + fusoPlanilha,
      'Fuso do Apps Script: ' + fusoScript,
      '',
      'Horário pela planilha: ' + horarioPlanilha,
      'Horário pelo script: ' + horarioScript,
      '',
      'Situação: ' + situacao
    ].join('\n'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
