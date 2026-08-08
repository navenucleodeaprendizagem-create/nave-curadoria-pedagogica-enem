/**
 * NAVE | CORREÇÃO DA VALIDAÇÃO WEB — V1.4.1
 *
 * Corrige a ausência das funções de compatibilidade da validação
 * após a generalização V1.4.
 *
 * Não altera a lógica já validada do MVP:
 * - obterDadosValidacaoV05()
 * - salvarValidacaoDocenteV05()
 */

function obterDadosValidacaoWebV121(idQuestao) {
  return obterDadosValidacaoV05(idQuestao);
}


function salvarValidacaoWebV121(form) {
  return salvarValidacaoDocenteV05(form);
}


function obterResumoValidacoesWebV121() {
  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName('VALIDACOES_DOCENTES');

  if (!aba || aba.getLastRow() < 2) {
    return {
      total: 0,
      semDivergencia: 0,
      comDivergencia: 0,
      recentes: []
    };
  }

  const dados = aba.getDataRange().getDisplayValues();
  const headers = dados[0].map(v => String(v || '').trim());

  const idx = headers.reduce((m, h, i) => {
    m[h] = i;
    return m;
  }, {});

  const email = String(
    Session.getActiveUser().getEmail() || ''
  ).trim().toLowerCase();

  const registros = dados.slice(1).filter(r => {
    const idValidacao =
      idx.id_validacao === undefined
        ? ''
        : String(r[idx.id_validacao] || '').trim();

    if (!idValidacao) return false;

    if (!email || idx.professor === undefined) {
      return true;
    }

    return String(r[idx.professor] || '')
      .trim()
      .toLowerCase() === email;
  });

  const possuiDivergencia = r =>
    idx.possui_divergencia === undefined
      ? ''
      : String(r[idx.possui_divergencia] || '').trim();

  const recentes = registros
    .slice(-8)
    .reverse()
    .map(r => ({
      idValidacao:
        idx.id_validacao === undefined
          ? ''
          : r[idx.id_validacao] || '',
      data:
        idx.data_validacao === undefined
          ? ''
          : r[idx.data_validacao] || '',
      idQuestao:
        idx.id_ocorrencia === undefined
          ? ''
          : r[idx.id_ocorrencia] || '',
      habilidade:
        idx.habilidade_atual === undefined
          ? ''
          : r[idx.habilidade_atual] || '',
      objeto:
        idx.objeto_atual === undefined
          ? ''
          : r[idx.objeto_atual] || '',
      possuiDivergencia: possuiDivergencia(r),
      status:
        idx.status_validacao === undefined
          ? ''
          : r[idx.status_validacao] || ''
    }));

  return {
    total: registros.length,
    semDivergencia: registros.filter(
      r => possuiDivergencia(r) === 'Não'
    ).length,
    comDivergencia: registros.filter(
      r => possuiDivergencia(r) === 'Sim'
    ).length,
    recentes
  };
}


/* =========================================================
   ALIASES DE COMPATIBILIDADE COM O FRONT-END V1.1/V1.3
   ========================================================= */

function obterDadosValidacaoWebV110(idQuestao) {
  return obterDadosValidacaoWebV121(idQuestao);
}


function salvarValidacaoWebV110(form) {
  return salvarValidacaoWebV121(form);
}


function obterResumoValidacoesWebV110() {
  return obterResumoValidacoesWebV121();
}
