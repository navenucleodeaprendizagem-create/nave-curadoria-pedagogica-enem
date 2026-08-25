/**
 * NAVE | EXPORTAÇÃO EDITORIAL CENTRAL V2 — V0.13.00
 *
 * Extensão aditiva do contrato V1. Reutiliza todas as validações editoriais
 * consolidadas da V0.12.00 e acrescenta exclusivamente o professor do snapshot.
 */

const NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01300 = Object.freeze({
  SCHEMA_VERSION: 'NAVE_EDITORIAL_CENTRAL_V2',
  ABA_PACOTES: 'PACOTES_EDITORIAIS_CENTRAIS',
  CABECALHOS: Object.freeze([
    'schema_version',
    'id_envio',
    'id_projeto',
    'id_sequencia',
    'titulo',
    'descricao',
    'professor',
    'quantidade_questoes',
    'ordem',
    'id_questao',
    'area',
    'componente',
    'competencia',
    'habilidade',
    'objeto_principal',
    'acao_cognitiva',
    'dificuldade',
    'dificuldade_faixa',
    'funcao_pedagogica',
    'tempo_estimado_min',
    'gabarito_oficial',
    'ano',
    'edicao',
    'colecao_origem',
    'nome_publico_fonte',
    'url_pdf',
    'id_arquivo_drive',
    'pagina_pdf',
    'disponibilidade_fonte',
    'pagina_localizada',
    'motivo_fonte',
    'status_validacao',
    'maturidade_curadoria',
    'liberacao_editorial',
    'crop_x',
    'crop_y',
    'crop_w',
    'crop_h',
    'status_recorte',
    'trecho_inicial',
    'fontes_incompletas',
    'gabaritos_incompletos',
    'itens_nao_liberados',
    'status_pacote',
    'exportado_em',
    'exportado_por'
  ])
});


function montarExportacaoEditorialCentralV01300_(
  ss,
  referencia,
  modo,
  contexto
) {
  const exportacaoV1 = montarExportacaoEditorialCentralV01200_(
    ss,
    referencia,
    modo,
    contexto
  );

  const professor = obterProfessorPacoteExportacaoV01300_(
    ss,
    exportacaoV1.pacote.idEnvio
  );

  if (!professor) {
    throw new Error(
      'Exportação V2 bloqueada: professor_nome não foi preservado no pacote editorial.'
    );
  }

  const pacote = Object.assign({}, exportacaoV1.pacote, {
    professor: professor
  });

  const rows = exportacaoV1.rows.map(function(row) {
    const rowV2 = Object.assign({}, row, {
      schema_version:
        NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01300.SCHEMA_VERSION,
      professor: professor
    });

    return rowV2;
  });

  const headers = Array.from(
    NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01300.CABECALHOS
  );

  if (headers.length !== 46) {
    throw new Error('Schema V2 deve possuir exatamente 46 colunas.');
  }

  return {
    schemaVersion:
      NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01300.SCHEMA_VERSION,
    modo: exportacaoV1.modo,
    pacote: pacote,
    headers: headers,
    rows: rows,
    matrix: [headers].concat(rows.map(function(row) {
      return headers.map(function(header) {
        return row[header];
      });
    })),
    pendencias: exportacaoV1.pendencias,
    consistenciaResumo: exportacaoV1.consistenciaResumo
  };
}


function obterProfessorPacoteExportacaoV01300_(
  ss,
  idEnvio
) {
  const aba = ss.getSheetByName(
    NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01300.ABA_PACOTES
  );

  if (!aba || aba.getLastRow() < 2) {
    throw new Error('PACOTES_EDITORIAIS_CENTRAIS não está disponível.');
  }

  const dados = aba.getDataRange().getValues();
  const idx = indexarExportacaoCentralV01200_(dados[0]);

  validarCabecalhosExportacaoCentralV01200_(
    idx,
    ['id_envio', 'professor'],
    NAVE_EXPORTACAO_EDITORIAL_CENTRAL_V01300.ABA_PACOTES
  );

  const linhas = dados.slice(1).filter(function(linha) {
    return textoExportacaoCentralV01200_(linha[idx.id_envio]) ===
      textoExportacaoCentralV01200_(idEnvio);
  });

  if (linhas.length !== 1) {
    throw new Error(
      'Exportação V2 exige exatamente um pacote para id_envio: ' + idEnvio
    );
  }

  return textoExportacaoCentralV01200_(linhas[0][idx.professor]);
}
