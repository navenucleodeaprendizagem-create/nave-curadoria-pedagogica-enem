/**
 * NAVE | COORDENAÇÃO WEB — V1.6.0
 *
 * Reutiliza a governança já validada de CoordenacaoQualidadeV100.gs:
 * obterDadosDecisaoCoordenacaoV05()
 * salvarDecisaoCoordenacaoV05()
 */

const NAVE_COORD_WEB_V160 = Object.freeze({
  ABA_FILA: 'FILA_COORDENACAO_V05',
  ABA_BASE: 'QUESTOES_GERAL',
  DECISOES: Object.freeze([
    'Manter classificação atual',
    'Aceitar sugestão docente',
    'Solicitar nova avaliação',
    'Suspender questão',
    'Homologar questão'
  ])
});

function obterPainelCoordenacaoWebV160() {
  exigirPermissaoWebV150_('coordenacao');

  const ss = SpreadsheetApp.getActive();
  const fila = ss.getSheetByName(NAVE_COORD_WEB_V160.ABA_FILA);

  if (!fila || fila.getLastRow() < 2) {
    return {
      indicadores: { total: 0, pendentes: 0, resolvidos: 0, devolvidos: 0 },
      casos: [],
      decisoes: NAVE_COORD_WEB_V160.DECISOES.slice()
    };
  }

  const dados = fila.getDataRange().getDisplayValues();
  const idx = indexarCoordWebV160_(dados[0]);

  const base = ss.getSheetByName(NAVE_COORD_WEB_V160.ABA_BASE);
  const mapa = new Map();

  if (base && base.getLastRow() >= 2) {
    const db = base.getDataRange().getDisplayValues();
    const ib = indexarCoordWebV160_(db[0]);

    db.slice(1).forEach(r => {
      const id = campoCoordWebV160_(r, ib, 'id_ocorrencia');
      if (!id) return;
      mapa.set(id, {
        componente: campoCoordWebV160_(r, ib, 'componente_principal'),
        competencia: campoCoordWebV160_(r, ib, 'competencia'),
        habilidade: campoCoordWebV160_(r, ib, 'habilidade'),
        objeto: campoCoordWebV160_(r, ib, 'objeto_principal'),
        dificuldade: campoCoordWebV160_(r, ib, 'dificuldade_rotulo')
      });
    });
  }

  const casos = dados.slice(1)
    .filter(r => campoCoordWebV160_(r, idx, 'id_validacao'))
    .map(r => {
      const idQuestao = campoCoordWebV160_(r, idx, 'id_ocorrencia');
      const q = mapa.get(idQuestao) || {};
      const resolvido = estaResolvidoCoordWebV160_(
        campoCoordWebV160_(r, idx, 'resolvido')
      );

      return {
        idValidacao: campoCoordWebV160_(r, idx, 'id_validacao'),
        idQuestao,
        prioridade: campoCoordWebV160_(r, idx, 'prioridade') || '—',
        status: campoCoordWebV160_(r, idx, 'status_fila') ||
          (resolvido ? 'Resolvida' : 'Aguardando coordenação'),
        professor: campoCoordWebV160_(r, idx, 'professor'),
        dataEntrada: campoCoordWebV160_(r, idx, 'data_entrada'),
        componente: q.componente || '',
        competencia: q.competencia || '',
        habilidade: campoCoordWebV160_(r, idx, 'habilidade') || q.habilidade || '',
        objeto: campoCoordWebV160_(r, idx, 'objeto_atual') || q.objeto || '',
        dificuldade: q.dificuldade || '',
        divergencias: campoCoordWebV160_(r, idx, 'tipos_divergencia'),
        parecer: campoCoordWebV160_(r, idx, 'parecer_geral'),
        observacao: campoCoordWebV160_(r, idx, 'observacao_docente'),
        decisao: campoCoordWebV160_(r, idx, 'decisao_coordenacao'),
        responsavel: campoCoordWebV160_(r, idx, 'responsavel_coordenacao'),
        resolvido
      };
    });

  const pendentes = casos.filter(c => !c.resolvido);
  const resolvidos = casos.filter(c => c.resolvido);
  const devolvidos = casos.filter(c =>
    normalizarCoordWebV160_(c.status).includes('devolvid')
  );

  casos.sort((a, b) => Number(a.resolvido) - Number(b.resolvido));

  return {
    indicadores: {
      total: casos.length,
      pendentes: pendentes.length,
      resolvidos: resolvidos.length,
      devolvidos: devolvidos.length
    },
    casos,
    decisoes: NAVE_COORD_WEB_V160.DECISOES.slice()
  };
}

function obterCasoCoordenacaoWebV160(idValidacao) {
  exigirPermissaoWebV150_('coordenacao');

  const dados = obterDadosDecisaoCoordenacaoV05(idValidacao);

  const ss = SpreadsheetApp.getActive();
  const base = ss.getSheetByName('QUESTOES_GERAL');

  if (base && base.getLastRow() >= 2) {
    const db = base.getDataRange().getDisplayValues();
    const ib = indexarCoordWebV160_(db[0]);

    const linha = db.slice(1).find(r =>
      String(r[ib.id_ocorrencia] || '').trim() ===
      String(dados.idQuestao || '').trim()
    );

    if (linha) {
      dados.componente =
        campoCoordWebV160_(linha, ib, 'componente_principal');

      dados.competencia =
        campoCoordWebV160_(linha, ib, 'competencia');

      dados.habilidade =
        dados.habilidade ||
        campoCoordWebV160_(linha, ib, 'habilidade');

      dados.ano =
        campoCoordWebV160_(linha, ib, 'ano');

      dados.edicao =
        campoCoordWebV160_(linha, ib, 'edicao');

      dados.dificuldadeAtual =
        dados.dificuldadeAtual ||
        campoCoordWebV160_(linha, ib, 'dificuldade_rotulo');

      dados.trecho =
        campoCoordWebV160_(linha, ib, 'trecho_inicial');
    }
  }

  try {
    const q = obterQuestaoWebV140(dados.idQuestao);

    dados.trecho = dados.trecho || q.trecho || '';
    dados.pdfDisponivel = Boolean(q.pdfDisponivel);
    dados.urlPdf = q.urlPdf || '';
    dados.pagina = q.pagina || '';
  } catch (e) {
    dados.pdfDisponivel = false;
    dados.urlPdf = '';
    dados.pagina = '';
  }

  dados.decisoes = NAVE_COORD_WEB_V160.DECISOES.slice();

  return dados;
}

function salvarDecisaoCoordenacaoWebV160(form) {
  exigirPermissaoWebV150_('coordenacao');
  form = form || {};

  const decisao = String(form.decisao || '').trim();

  if (!NAVE_COORD_WEB_V160.DECISOES.includes(decisao)) {
    throw new Error('Selecione uma decisão válida.');
  }

  return salvarDecisaoCoordenacaoV05(form);
}

function indexarCoordWebV160_(headers) {
  return headers.reduce((m, h, i) => {
    const chave = String(h || '').trim();
    if (chave) m[chave] = i;
    return m;
  }, {});
}

function campoCoordWebV160_(linha, idx, campo) {
  if (idx[campo] === undefined) return '';
  return String(linha[idx[campo]] || '').trim();
}

function estaResolvidoCoordWebV160_(valor) {
  const v = normalizarCoordWebV160_(valor);
  return ['true', 'sim', 's', '1', 'resolvido', 'resolvida'].includes(v);
}

function normalizarCoordWebV160_(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
