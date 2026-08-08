/**
 * NAVE | MATRIZ ENEM PARA SELETORES — V1.4.2
 *
 * Competências e habilidades são determinadas pela Matriz de Referência,
 * e não pela cobertura atual de QUESTOES_GERAL.
 */

const NAVE_MATRIZ_ENEM_V142 = Object.freeze({
  CN: Object.freeze({
    C1: Object.freeze(['H1','H2','H3','H4']),
    C2: Object.freeze(['H5','H6','H7']),
    C3: Object.freeze(['H8','H9','H10','H11','H12']),
    C4: Object.freeze(['H13','H14','H15','H16']),
    C5: Object.freeze(['H17','H18','H19']),
    C6: Object.freeze(['H20','H21','H22','H23']),
    C7: Object.freeze(['H24','H25','H26','H27']),
    C8: Object.freeze(['H28','H29','H30'])
  }),
  MT: Object.freeze({
    C1: Object.freeze(['H1','H2','H3','H4','H5']),
    C2: Object.freeze(['H6','H7','H8','H9']),
    C3: Object.freeze(['H10','H11','H12','H13','H14']),
    C4: Object.freeze(['H15','H16','H17','H18']),
    C5: Object.freeze(['H19','H20','H21','H22','H23']),
    C6: Object.freeze(['H24','H25','H26']),
    C7: Object.freeze(['H27','H28','H29','H30'])
  }),
  CH: Object.freeze({
    C1: Object.freeze(['H1','H2','H3','H4','H5']),
    C2: Object.freeze(['H6','H7','H8','H9','H10']),
    C3: Object.freeze(['H11','H12','H13','H14','H15']),
    C4: Object.freeze(['H16','H17','H18','H19','H20']),
    C5: Object.freeze(['H21','H22','H23','H24','H25']),
    C6: Object.freeze(['H26','H27','H28','H29','H30'])
  }),
  LC: Object.freeze({
    C1: Object.freeze(['H1','H2','H3','H4']),
    C2: Object.freeze(['H5','H6','H7','H8']),
    C3: Object.freeze(['H9','H10','H11']),
    C4: Object.freeze(['H12','H13','H14']),
    C5: Object.freeze(['H15','H16','H17']),
    C6: Object.freeze(['H18','H19','H20']),
    C7: Object.freeze(['H21','H22','H23','H24']),
    C8: Object.freeze(['H25','H26','H27']),
    C9: Object.freeze(['H28','H29','H30'])
  })
});

function obterMatrizSeletoresWebV142(area) {
  area = String(area || '').trim().toUpperCase();
  const mapa = NAVE_MATRIZ_ENEM_V142[area];
  if (!mapa) throw new Error('Área sem matriz configurada: ' + area);

  const competencias = Object.keys(mapa).sort(ordenarCodigoNumericoV142_);
  const habilidadesPorCompetencia = {};

  competencias.forEach(c => {
    habilidadesPorCompetencia[c] =
      mapa[c].slice().sort(ordenarCodigoNumericoV142_);
  });

  const habilidades = competencias
    .flatMap(c => habilidadesPorCompetencia[c])
    .sort(ordenarCodigoNumericoV142_);

  return { area, competencias, habilidades, habilidadesPorCompetencia };
}

function obterHabilidadesCompetenciaWebV142(area, competencia) {
  const matriz = obterMatrizSeletoresWebV142(area);
  const c = String(competencia || '').trim().toUpperCase();
  return c
    ? (matriz.habilidadesPorCompetencia[c] || [])
    : matriz.habilidades;
}

function ordenarCodigoNumericoV142_(a, b) {
  return extrairNumeroCodigoV142_(a) - extrairNumeroCodigoV142_(b);
}

function extrairNumeroCodigoV142_(valor) {
  const m = String(valor || '').match(/\d+/);
  return m ? Number(m[0]) : 9999;
}
