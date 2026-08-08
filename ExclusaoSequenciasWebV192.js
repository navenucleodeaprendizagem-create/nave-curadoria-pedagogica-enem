/**
 * NAVE | EXCLUSÃO DE SEQUÊNCIAS — V1.9.2
 *
 * Regra:
 * - o usuário só exclui uma sequência criada por ele;
 * - a exclusão é bloqueada se a sequência já possuir projeto editorial;
 * - remove SEQUENCIAS_SALVAS e seus ITENS_SEQUENCIAS;
 * - não interfere na SEQUENCIAS_WEB_ATUAIS.
 */

function excluirMinhaSequenciaWebV192(idSequencia) {
  const usuario = obterUsuarioAtualWebV130();
  const ss = SpreadsheetApp.getActive();

  const id = String(idSequencia || '').trim();

  if (!id) {
    throw new Error('Sequência não informada.');
  }

  const salvas = ss.getSheetByName('SEQUENCIAS_SALVAS');
  const itens = ss.getSheetByName('ITENS_SEQUENCIAS');
  const projetos = ss.getSheetByName('PROJETOS_EDITORIAIS');

  if (!salvas || salvas.getLastRow() < 2) {
    throw new Error('Nenhuma sequência salva foi localizada.');
  }

  const dadosSalvas = salvas.getDataRange().getDisplayValues();
  const idxS = indexarV130_(dadosSalvas[0]);

  if (
    idxS.id_sequencia === undefined ||
    idxS.criada_por === undefined
  ) {
    throw new Error(
      'SEQUENCIAS_SALVAS não possui os campos obrigatórios.'
    );
  }

  const linhaSequencia = dadosSalvas.findIndex((r, i) =>
    i > 0 &&
    String(r[idxS.id_sequencia] || '').trim() === id &&
    String(r[idxS.criada_por] || '')
      .trim()
      .toLowerCase() === usuario.email
  );

  if (linhaSequencia < 0) {
    throw new Error(
      'A sequência não foi localizada entre suas sequências.'
    );
  }

  const titulo =
    idxS.titulo === undefined
      ? id
      : String(
          dadosSalvas[linhaSequencia][idxS.titulo] || id
        ).trim();

  /*
   * Proteção editorial:
   * qualquer projeto vinculado impede a exclusão da sequência.
   */
  if (projetos && projetos.getLastRow() >= 2) {
    const dadosProjetos =
      projetos.getDataRange().getDisplayValues();

    const idxP = indexarV130_(dadosProjetos[0]);

    if (idxP.id_sequencia !== undefined) {
      const projeto = dadosProjetos
        .slice(1)
        .find(r =>
          String(r[idxP.id_sequencia] || '').trim() === id
        );

      if (projeto) {
        const tituloProjeto =
          idxP.titulo_projeto === undefined
            ? ''
            : String(
                projeto[idxP.titulo_projeto] || ''
              ).trim();

        throw new Error(
          'Esta sequência já possui projeto editorial' +
          (tituloProjeto ? ': "' + tituloProjeto + '"' : '') +
          '. Ela não pode ser excluída.'
        );
      }
    }
  }

  /*
   * Remove primeiro os itens, sempre de baixo para cima.
   */
  let itensRemovidos = 0;

  if (itens && itens.getLastRow() >= 2) {
    const dadosItens =
      itens.getDataRange().getDisplayValues();

    const idxI = indexarV130_(dadosItens[0]);

    if (idxI.id_sequencia !== undefined) {
      const linhasItens = [];

      for (let i = 1; i < dadosItens.length; i++) {
        if (
          String(
            dadosItens[i][idxI.id_sequencia] || ''
          ).trim() === id
        ) {
          linhasItens.push(i + 1);
        }
      }

      linhasItens
        .sort((a, b) => b - a)
        .forEach(linha => {
          itens.deleteRow(linha);
          itensRemovidos++;
        });
    }
  }

  /*
   * findIndex usa índice zero; a linha real na planilha é +1.
   */
  salvas.deleteRow(linhaSequencia + 1);

  SpreadsheetApp.flush();

  return {
    mensagem:
      'Sequência "' + titulo + '" excluída com sucesso.',
    idSequencia: id,
    itensRemovidos,
    sequencias: listarMinhasSequenciasWebV130()
  };
}
