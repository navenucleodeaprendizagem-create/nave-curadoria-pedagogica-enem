/**
 * Carga administrativa do piloto CN | C7 | H24 — V0.14.20.
 * Não é exposta pelo bridge e não altera outras linhas da matriz.
 */
const PILOTO_MATRIZ_H24_V01420_ = Object.freeze({
  area: 'CN',
  componente: 'Química',
  competencia: 'C7',
  descricao_competencia: 'Apropriar-se de conhecimentos da química para, em situações problema, interpretar, avaliar ou planejar intervenções científico-tecnológicas.',
  habilidade: 'H24',
  descricao_habilidade: 'Utilizar códigos e nomenclatura da química para caracterizar materiais, substâncias ou transformações químicas.',
  verbo_central: 'Utilizar',
  operacao_cognitiva: 'Mobilizar a linguagem química como instrumento de interpretação e caracterização.',
  interpretacao_pedagogica: 'A H24 não avalia apenas memorização de nomenclaturas, símbolos ou fórmulas. Ela exige que o estudante use a linguagem própria da Química como ferramenta para interpretar uma situação-problema e caracterizar materiais, substâncias ou transformações químicas. Isso pode envolver fórmulas moleculares e estruturais, símbolos, equações químicas, nomenclatura, grupos funcionais, cargas, espécies químicas e diferentes formas de representação. O código químico funciona como meio para interpretar, diferenciar, relacionar ou caracterizar aquilo que está sendo apresentado.',
  expectativa_aprendizagem: 'Compreender códigos e convenções da linguagem química; estabelecer correspondência entre nome, fórmula, estrutura e característica química; interpretar representações químicas em situações contextualizadas; utilizar nomenclatura e simbologia para diferenciar substâncias ou transformações; transitar entre diferentes formas de representação de uma mesma informação química; utilizar a linguagem química para sustentar uma decisão ou resolução.',
  evidencias_de_dominio: 'Identifica corretamente o significado da representação apresentada; interpreta fórmulas sem depender exclusivamente de memorização; relaciona nomenclatura e estrutura; distingue substâncias a partir de características presentes na representação; reconhece grupos ou padrões relevantes; interpreta corretamente equações químicas; explica verbalmente o que determinada representação química comunica; utiliza o código químico para resolver a situação-problema.',
  dificuldades_frequentes: 'Confundir reconhecimento visual com compreensão da representação; memorizar nomenclaturas sem compreender o que comunicam; apresentar dificuldade para transitar entre fórmula molecular, estrutural e nomenclatura; não identificar informações químicas relevantes no enunciado; confundir funções químicas com propriedades das substâncias; interpretar símbolos isoladamente sem relacioná-los à situação-problema; apresentar dificuldade para compreender equações químicas como representação de transformações; aplicar regras de nomenclatura mecanicamente sem perceber sua função na resolução.',
  perguntas_diagnosticas: 'O que essa representação química está comunicando?\nQue informação da estrutura permite diferenciar essas substâncias?\nQual parte da fórmula é relevante para resolver o problema?\nComo o nome da substância se relaciona com a estrutura apresentada?\nO que muda entre uma representação e outra?\nQue característica química pode ser inferida dessa fórmula?\nEssa informação seria suficiente se a fórmula ou estrutura não estivesse presente?\nQual código ou convenção química está sendo exigido para tomar a decisão?',
  antes_da_questao: 'Antes de olhar as alternativas, peça ao estudante que identifique o que pode ser extraído da fórmula, estrutura, equação ou nomenclatura apresentada. O objetivo é separar a leitura da linguagem química da tentativa de resolução por eliminação ou reconhecimento superficial.',
  durante_a_questao: 'Estimule o estudante a explicitar o encadeamento entre representação, informação química, característica e decisão. Peça que verbalize o significado da fórmula, estrutura ou equação e identifique qual informação química é realmente necessária para resolver a situação.',
  depois_da_questao: 'Explore qual representação foi decisiva para a resolução, quais informações eram secundárias, por que os distratores poderiam parecer plausíveis, que alteração na fórmula ou estrutura mudaria a resposta e se o mesmo raciocínio poderia ser transferido para outra substância ou transformação.',
  retomada: 'Retomar símbolos, convenções e representações básicas; trabalhar correspondência entre nome e representação; recuperar conceitos estruturantes da linguagem química; utilizar exemplos simples antes de situações contextualizadas.',
  mediacao: 'Solicitar que o estudante verbalize o significado da representação; decompor a resolução em informação química, característica e decisão; comparar representações semelhantes; exigir justificativa para eliminações e escolhas.',
  consolidacao: 'Variar a forma de representação; apresentar novos contextos com a mesma demanda cognitiva; exigir justificativas; comparar substâncias ou transformações; utilizar questões com distratores baseados em representações próximas.',
  versao: '1.0',
  status_revisao: 'Aprovado'
});

function carregarPilotoMatrizEnemPedagogicaH24V01420() {
  const ss = obterSpreadsheetOfflineSyncV070_();
  const revisadoPor = String(
    Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || ''
  ).trim().toLowerCase();
  if (!revisadoPor) throw new Error('Não foi possível identificar o revisor autenticado.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const aba = garantirMatrizEnemPedagogicaV01320_(ss);
    const headers = aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0]
      .map(function(header) { return String(header || '').trim(); });
    const idx = headers.reduce(function(mapa, header, indice) {
      mapa[header] = indice;
      return mapa;
    }, {});
    const obrigatorios = Object.keys(PILOTO_MATRIZ_H24_V01420_)
      .concat(['revisado_por', 'revisado_em']);
    const ausentes = obrigatorios.filter(function(campo) { return idx[campo] === undefined; });
    if (ausentes.length) throw new Error('Campos ausentes na matriz pedagógica: ' + ausentes.join(', '));

    const dados = aba.getLastRow() >= 2
      ? aba.getRange(2, 1, aba.getLastRow() - 1, headers.length).getValues()
      : [];
    const encontrados = [];
    dados.forEach(function(linha, indice) {
      const chave = [linha[idx.area], linha[idx.competencia], linha[idx.habilidade]]
        .map(function(valor) { return String(valor || '').trim().toUpperCase(); }).join('|');
      if (chave === 'CN|C7|H24') encontrados.push(indice + 2);
    });
    if (encontrados.length > 1) {
      throw new Error('Chave CN|C7|H24 duplicada em MATRIZ_ENEM_PEDAGOGICA. Linhas: ' + encontrados.join(', '));
    }

    const registro = Object.assign({}, PILOTO_MATRIZ_H24_V01420_, {
      revisado_por: revisadoPor,
      revisado_em: new Date()
    });
    const linhaAtual = encontrados.length
      ? aba.getRange(encontrados[0], 1, 1, headers.length).getValues()[0]
      : new Array(headers.length).fill('');
    Object.keys(registro).forEach(function(campo) { linhaAtual[idx[campo]] = registro[campo]; });
    const numeroLinha = encontrados.length ? encontrados[0] : aba.getLastRow() + 1;
    aba.getRange(numeroLinha, 1, 1, headers.length).setValues([linhaAtual]);

    const gravado = aba.getRange(numeroLinha, 1, 1, headers.length).getValues()[0];
    validarPilotoMatrizH24V01420_(gravado, idx);
    const resultado = { ok: true, chave: 'CN|C7|H24', linha: numeroLinha,
      versao: '1.0', statusRevisao: 'Aprovado', revisadoPor: revisadoPor };
    Logger.log(JSON.stringify(resultado));
    return resultado;
  } finally {
    lock.releaseLock();
  }
}

function validarPilotoMatrizH24V01420_(linha, idx) {
  const esperados = Object.assign({}, PILOTO_MATRIZ_H24_V01420_);
  Object.keys(esperados).forEach(function(campo) {
    const atual = String(linha[idx[campo]] || '').trim();
    if (!atual || atual !== String(esperados[campo]).trim()) {
      throw new Error('Falha ao validar o campo do piloto H24: ' + campo);
    }
  });
  if (!String(linha[idx.revisado_por] || '').trim() || !linha[idx.revisado_em]) {
    throw new Error('Autoria ou data de revisão ausente no piloto H24.');
  }
  return true;
}
