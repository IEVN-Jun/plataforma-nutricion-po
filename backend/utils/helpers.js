/**
 * Convierte un valor a número. Retorna 0 si no es válido.
 * @param {*} valor
 * @returns {number}
 */
const num = (valor) => {
  const parseado = parseFloat(valor);
  return isNaN(parseado) ? 0 : parseado;
};

/**
 * Extrae el primer objeto de un resultado de pg.
 * @param {import('pg').QueryResult} resultadoDB
 * @returns {object|null}
 */
const obtenerObjeto = (resultadoDB) => {
  if (!resultadoDB) return null;
  const rows = resultadoDB.rows !== undefined ? resultadoDB.rows : resultadoDB;
  if (Array.isArray(rows)) return rows.length > 0 ? rows[0] : null;
  return rows || null;
};

/**
 * Extrae todos los registros de un resultado de pg.
 * @param {import('pg').QueryResult} resultadoDB
 * @returns {object[]}
 */
const obtenerLista = (resultadoDB) => {
  if (!resultadoDB) return [];
  const rows = resultadoDB.rows !== undefined ? resultadoDB.rows : resultadoDB;
  if (Array.isArray(rows)) return rows;
  return rows ? [rows] : [];
};

module.exports = { num, obtenerObjeto, obtenerLista };