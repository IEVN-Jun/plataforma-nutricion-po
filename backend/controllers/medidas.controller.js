const pool                   = require('../db/pool');
const { num, obtenerObjeto } = require('../utils/helpers');
const { calcularAntropometria } = require('../utils/calculos');

// Construye el array de valores para INSERT/UPDATE a partir de los cálculos
const buildValores = (c, body, extraIds = []) => [
  c.peso, c.talla, c.pTri, c.pBi, c.pSub, c.pSup,
  num(body.pliegue_abdominal), num(body.pliegue_muslo), num(body.pliegue_pantorrilla),
  c.porcentajeGrasa.toFixed(2),
  c.masaGrasa.toFixed(2),
  c.masaMuscular.toFixed(2),
  c.metabolismoBasal.toFixed(2),
  num(body.circ_cuello), num(body.circ_brazo), num(body.circ_cintura),
  num(body.circ_abdomen), num(body.circ_cadera), num(body.circ_pierna), num(body.circ_pantorrilla),
  c.gastoEnergeticoTotal.toFixed(2),
  c.ajuste,
  c.caloriasRecomendadas.toFixed(2),
  body.notas_clinicas || '',
  ...extraIds,
];

// POST /api/pacientes/:id/medidas — Nueva sesión de medición
const crearMedida = async (req, res) => {
  const { id } = req.params;

  try {
    const userQ = await pool.query(
      'SELECT genero, fecha_nacimiento, factor_actividad FROM usuarios WHERE id = $1', [id]
    );
    if (userQ.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado.' });

    const c = calcularAntropometria(req.body, userQ.rows[0]);

    const query = `
      INSERT INTO registros_antropometricos
        (paciente_id,
         peso_kg, talla_cm, pliegue_triceps, pliegue_biceps, pliegue_subescapular, pliegue_suprailiaco,
         pliegue_abdominal, pliegue_muslo, pliegue_pantorrilla,
         porcentaje_grasa, masa_grasa_kg, masa_muscular_kg, metabolismo_basal,
         circ_cuello, circ_brazo, circ_cintura, circ_abdomen, circ_cadera, circ_pierna, circ_pantorrilla,
         gasto_energetico_total, ajuste_calorico, calorias_recomendadas, notas_clinicas)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
      RETURNING *;
    `;
    const valores = [id, ...buildValores(c, req.body)];
    const resultado = await pool.query(query, valores);

    res.status(201).json({ mensaje: 'Medición guardada.', medida: obtenerObjeto(resultado) });
  } catch (error) {
    console.error('[MEDIDAS] Error al crear:', error);
    res.status(500).json({ error: 'Error al procesar los cálculos.' });
  }
};

// PUT /api/pacientes/:pacienteId/medidas/:medidaId — Editar y recalcular una sesión
const editarMedida = async (req, res) => {
  const { pacienteId, medidaId } = req.params;

  try {
    // Verificar que el registro pertenece al paciente
    const check = await pool.query(
      'SELECT id FROM registros_antropometricos WHERE id = $1 AND paciente_id = $2',
      [medidaId, pacienteId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado o no pertenece al paciente.' });
    }

    const userQ = await pool.query(
      'SELECT genero, fecha_nacimiento, factor_actividad FROM usuarios WHERE id = $1', [pacienteId]
    );
    if (userQ.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado.' });

    const c = calcularAntropometria(req.body, userQ.rows[0]);

    const query = `
      UPDATE registros_antropometricos SET
        peso_kg = $1, talla_cm = $2,
        pliegue_triceps = $3, pliegue_biceps = $4, pliegue_subescapular = $5, pliegue_suprailiaco = $6,
        pliegue_abdominal = $7, pliegue_muslo = $8, pliegue_pantorrilla = $9,
        porcentaje_grasa = $10, masa_grasa_kg = $11, masa_muscular_kg = $12, metabolismo_basal = $13,
        circ_cuello = $14, circ_brazo = $15, circ_cintura = $16,
        circ_abdomen = $17, circ_cadera = $18, circ_pierna = $19, circ_pantorrilla = $20,
        gasto_energetico_total = $21, ajuste_calorico = $22, calorias_recomendadas = $23,
        notas_clinicas = $24
      WHERE id = $25 AND paciente_id = $26
      RETURNING *;
    `;
    const valores = [...buildValores(c, req.body, [medidaId, pacienteId])];
    const resultado = await pool.query(query, valores);

    res.status(200).json({ mensaje: 'Medición actualizada y recalculada.', medida: obtenerObjeto(resultado) });
  } catch (error) {
    console.error('[MEDIDAS] Error al editar:', error);
    res.status(500).json({ error: 'Error al actualizar la medición.' });
  }
};

// DELETE /api/medidas/:medidaId — Eliminar un registro
const eliminarMedida = async (req, res) => {
  const { medidaId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM registros_antropometricos WHERE id = $1 RETURNING id',
      [medidaId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado.' });
    }
    res.status(200).json({ mensaje: 'Registro eliminado correctamente.' });
  } catch (error) {
    console.error('[MEDIDAS] Error al eliminar:', error);
    res.status(500).json({ error: 'Error al eliminar el registro.' });
  }
};

module.exports = { crearMedida, editarMedida, eliminarMedida };