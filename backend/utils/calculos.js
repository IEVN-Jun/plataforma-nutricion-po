const { num } = require('./helpers');

/**
 * Calcula todos los indicadores antropométricos y calóricos de una sesión.
 * Usa el método de Durnin & Womersley (4 pliegues) para la densidad corporal,
 * y la ecuación de Mifflin-St Jeor para el metabolismo basal.
 *
 * @param {object} body      - Datos crudos del formulario (pliegues, circunferencias, etc.)
 * @param {object} usuario   - Datos del paciente (genero, fecha_nacimiento, factor_actividad)
 * @returns {object}         - Resultados calculados listos para guardar en BD
 */
const calcularAntropometria = (body, usuario) => {
  // --- Edad ---
  let edad = 25;
  if (usuario.fecha_nacimiento) {
    const fn = new Date(usuario.fecha_nacimiento);
    const hoy = new Date();
    edad = hoy.getFullYear() - fn.getFullYear();
    const cumpleEsteAno = hoy.getMonth() < fn.getMonth() ||
      (hoy.getMonth() === fn.getMonth() && hoy.getDate() < fn.getDate());
    if (cumpleEsteAno) edad--;
  }

  const esHombre = usuario.genero && String(usuario.genero).trim().toLowerCase() === 'hombre';
  const peso  = num(body.peso_kg);
  const talla = num(body.talla_cm);

  // --- Pliegues cutáneos (mm) ---
  const pTri = num(body.pliegue_triceps);
  const pBi  = num(body.pliegue_biceps);
  const pSub = num(body.pliegue_subescapular);
  const pSup = num(body.pliegue_suprailiaco);

  // --- Densidad corporal (Durnin & Womersley) ---
  const sumaPliegues = pTri + pBi + pSub + pSup;
  const logPliegues  = Math.log10(sumaPliegues > 0 ? sumaPliegues : 1);
  let densidad = 1.1;

  if (esHombre) {
    if      (edad <= 19) densidad = 1.1620 - (0.0630 * logPliegues);
    else if (edad <= 29) densidad = 1.1631 - (0.0632 * logPliegues);
    else if (edad <= 39) densidad = 1.1422 - (0.0544 * logPliegues);
    else if (edad <= 49) densidad = 1.1620 - (0.0700 * logPliegues);
    else                 densidad = 1.1715 - (0.0779 * logPliegues);
  } else {
    if      (edad <= 19) densidad = 1.1549 - (0.0678 * logPliegues);
    else if (edad <= 29) densidad = 1.1599 - (0.0717 * logPliegues);
    else if (edad <= 39) densidad = 1.1423 - (0.0632 * logPliegues);
    else if (edad <= 49) densidad = 1.1333 - (0.0612 * logPliegues);
    else                 densidad = 1.1339 - (0.0645 * logPliegues);
  }

  // --- % Grasa (Siri) ---
  let porcentajeGrasa = (495 / densidad) - 450;
  if (porcentajeGrasa < 0 || isNaN(porcentajeGrasa)) porcentajeGrasa = 0;

  const masaGrasa    = peso * (porcentajeGrasa / 100);
  const masaMuscular = peso - masaGrasa;

  // --- Metabolismo basal (Mifflin-St Jeor) ---
  let metabolismoBasal = (10 * peso) + (6.25 * talla) - (5 * edad);
  metabolismoBasal += esHombre ? 5 : -161;

  // --- Gasto energético y calorías recomendadas ---
  const factorActividad      = num(usuario.factor_actividad) || 1.2;
  const gastoEnergeticoTotal = metabolismoBasal * factorActividad;
  const ajuste               = num(body.ajuste_calorico);
  const caloriasRecomendadas = gastoEnergeticoTotal + ajuste;

  return {
    peso, talla, pTri, pBi, pSub, pSup,
    porcentajeGrasa, masaGrasa, masaMuscular,
    metabolismoBasal, gastoEnergeticoTotal, ajuste, caloriasRecomendadas,
  };
};

module.exports = { calcularAntropometria };