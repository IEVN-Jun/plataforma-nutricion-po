const pool = require('../db/pool');
const { obtenerObjeto, obtenerLista } = require('../utils/helpers');

// ============================================================
// CATALOGO DE EJERCICIOS
// ============================================================

// GET /api/ejercicios — Lista todos, agrupados por grupo muscular
const listarCatalogo = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM catalogo_ejercicios ORDER BY grupo_muscular, nombre_ejercicio'
    );
    // Retornamos la lista plana; el frontend agrupa en el render
    res.status(200).json(obtenerLista(result));
  } catch (error) {
    console.error('[CATALOGO] Error al listar:', error);
    res.status(500).json({ error: 'Error al consultar el catalogo de ejercicios.' });
  }
};

// ============================================================
// RUTINAS
// ============================================================

// GET /api/pacientes/:pacienteId/rutinas
// Lista todas las rutinas de un paciente (solo cabeceras)
const listarRutinasDePaciente = async (req, res) => {
  const { pacienteId } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.*, COUNT(rd.id)::int AS total_dias
       FROM rutinas r
       LEFT JOIN rutina_dias rd ON rd.rutina_id = r.id
       WHERE r.paciente_id = $1
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      [pacienteId]
    );
    res.status(200).json(obtenerLista(result));
  } catch (error) {
    console.error('[RUTINAS] Error al listar:', error);
    res.status(500).json({ error: 'Error al consultar rutinas.' });
  }
};

// GET /api/rutinas/:id — Rutina completa con dias y ejercicios
const obtenerRutinaCompleta = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Cabecera
    const rutinaQ = await pool.query('SELECT * FROM rutinas WHERE id = $1', [id]);
    const rutina  = obtenerObjeto(rutinaQ);
    if (!rutina) return res.status(404).json({ error: 'Rutina no encontrada.' });

    // 2. Dias
    const diasQ = await pool.query(
      'SELECT * FROM rutina_dias WHERE rutina_id = $1 ORDER BY numero_dia',
      [id]
    );
    const dias = obtenerLista(diasQ);

    // 3. Para cada dia, obtenemos sus ejercicios con datos del catalogo
    const diasConEjercicios = await Promise.all(
      dias.map(async (dia) => {
        const ejerciciosQ = await pool.query(
          `SELECT re.*, ce.nombre_ejercicio AS nombre_catalogo, ce.grupo_muscular
           FROM rutina_ejercicios re
           LEFT JOIN catalogo_ejercicios ce ON ce.id = re.ejercicio_id
           WHERE re.rutina_dia_id = $1
           ORDER BY re.orden`,
          [dia.id]
        );
        return { ...dia, ejercicios: obtenerLista(ejerciciosQ) };
      })
    );

    res.status(200).json({ ...rutina, dias: diasConEjercicios });
  } catch (error) {
    console.error('[RUTINAS] Error al obtener:', error);
    res.status(500).json({ error: 'Error del servidor.' });
  }
};

// POST /api/pacientes/:pacienteId/rutinas — Crear nueva rutina (solo cabecera)
const crearRutina = async (req, res) => {
  const { pacienteId } = req.params;
  const { nombre, objetivo, tipo_entrenamiento, sistemas_trabajo, recomendaciones } = req.body;

  if (!nombre) return res.status(400).json({ error: 'El campo nombre es requerido.' });

  try {
    const result = await pool.query(
      `INSERT INTO rutinas (paciente_id, nombre, objetivo, tipo_entrenamiento, sistemas_trabajo, recomendaciones)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [pacienteId, nombre, objetivo, tipo_entrenamiento, sistemas_trabajo, recomendaciones]
    );
    res.status(201).json({ mensaje: 'Rutina creada.', rutina: obtenerObjeto(result) });
  } catch (error) {
    console.error('[RUTINAS] Error al crear:', error);
    res.status(500).json({ error: 'Error al crear la rutina.' });
  }
};

// PUT /api/rutinas/:id — Editar cabecera de rutina
const editarRutina = async (req, res) => {
  const { id } = req.params;
  const { nombre, objetivo, tipo_entrenamiento, sistemas_trabajo, recomendaciones, activa } = req.body;
  try {
    const result = await pool.query(
      `UPDATE rutinas
       SET nombre=$1, objetivo=$2, tipo_entrenamiento=$3, sistemas_trabajo=$4,
           recomendaciones=$5, activa=$6
       WHERE id=$7 RETURNING *`,
      [nombre, objetivo, tipo_entrenamiento, sistemas_trabajo, recomendaciones, activa ?? true, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rutina no encontrada.' });
    res.status(200).json({ mensaje: 'Rutina actualizada.', rutina: obtenerObjeto(result) });
  } catch (error) {
    console.error('[RUTINAS] Error al editar:', error);
    res.status(500).json({ error: 'Error al actualizar la rutina.' });
  }
};

// DELETE /api/rutinas/:id
const eliminarRutina = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM rutinas WHERE id=$1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rutina no encontrada.' });
    res.status(200).json({ mensaje: 'Rutina eliminada correctamente.' });
  } catch (error) {
    console.error('[RUTINAS] Error al eliminar:', error);
    res.status(500).json({ error: 'Error al eliminar la rutina.' });
  }
};

// ============================================================
// DIAS DE RUTINA
// ============================================================

// POST /api/rutinas/:rutinaId/dias
const crearDia = async (req, res) => {
  const { rutinaId } = req.params;
  const { numero_dia, nombre_dia, cardio_min, link_cardio, orden } = req.body;

  if (!nombre_dia) return res.status(400).json({ error: 'El campo nombre_dia es requerido.' });

  try {
    const result = await pool.query(
      `INSERT INTO rutina_dias (rutina_id, numero_dia, nombre_dia, cardio_min, link_cardio, orden)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [rutinaId, numero_dia, nombre_dia, cardio_min || 0, link_cardio || null, orden || 0]
    );
    res.status(201).json({ mensaje: 'Dia creado.', dia: obtenerObjeto(result) });
  } catch (error) {
    console.error('[DIAS] Error al crear:', error);
    res.status(500).json({ error: 'Error al crear el dia.' });
  }
};

// PUT /api/dias/:diaId
const editarDia = async (req, res) => {
  const { diaId } = req.params;
  const { numero_dia, nombre_dia, cardio_min, link_cardio, orden } = req.body;
  try {
    const result = await pool.query(
      `UPDATE rutina_dias SET numero_dia=$1, nombre_dia=$2, cardio_min=$3, link_cardio=$4, orden=$5
       WHERE id=$6 RETURNING *`,
      [numero_dia, nombre_dia, cardio_min || 0, link_cardio || null, orden || 0, diaId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Dia no encontrado.' });
    res.status(200).json({ mensaje: 'Dia actualizado.', dia: obtenerObjeto(result) });
  } catch (error) {
    console.error('[DIAS] Error al editar:', error);
    res.status(500).json({ error: 'Error al actualizar el dia.' });
  }
};

// DELETE /api/dias/:diaId
const eliminarDia = async (req, res) => {
  const { diaId } = req.params;
  try {
    const result = await pool.query('DELETE FROM rutina_dias WHERE id=$1 RETURNING id', [diaId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Dia no encontrado.' });
    res.status(200).json({ mensaje: 'Dia eliminado correctamente.' });
  } catch (error) {
    console.error('[DIAS] Error al eliminar:', error);
    res.status(500).json({ error: 'Error al eliminar el dia.' });
  }
};

// ============================================================
// EJERCICIOS DE UN DIA
// ============================================================

// POST /api/dias/:diaId/ejercicios
const agregarEjercicio = async (req, res) => {
  const { diaId } = req.params;
  const {
    ejercicio_id, nombre_ejercicio_custom,
    tipo_agrupacion, grupo_agrupacion, series_total, repeticiones,
    tecnica_especial, detalle_tecnica, link_youtube, notas, tipo_agarre, orden,
  } = req.body;

  if (!ejercicio_id && !nombre_ejercicio_custom) {
    return res.status(400).json({ error: 'Debe indicar un ejercicio del catalogo o un nombre personalizado.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO rutina_ejercicios
         (rutina_dia_id, ejercicio_id, nombre_ejercicio_custom, tipo_agrupacion, grupo_agrupacion,
          series_total, repeticiones, tecnica_especial, detalle_tecnica, link_youtube, notas, tipo_agarre, orden)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        diaId, ejercicio_id || null, nombre_ejercicio_custom || null,
        tipo_agrupacion || 'unica', grupo_agrupacion || null,
        series_total || null, repeticiones || null,
        tecnica_especial || 'ninguna', detalle_tecnica || null,
        link_youtube || null, notas || null, tipo_agarre || null, orden || 0,
      ]
    );
    res.status(201).json({ mensaje: 'Ejercicio agregado.', ejercicio: obtenerObjeto(result) });
  } catch (error) {
    console.error('[EJERCICIOS] Error al agregar:', error);
    res.status(500).json({ error: 'Error al agregar el ejercicio.' });
  }
};

// PUT /api/ejercicios/:ejercicioId
const editarEjercicio = async (req, res) => {
  const { ejercicioId } = req.params;
  const {
    ejercicio_id, nombre_ejercicio_custom,
    tipo_agrupacion, grupo_agrupacion, series_total, repeticiones,
    tecnica_especial, detalle_tecnica, link_youtube, notas, tipo_agarre, orden,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE rutina_ejercicios SET
         ejercicio_id=$1, nombre_ejercicio_custom=$2, tipo_agrupacion=$3, grupo_agrupacion=$4,
         series_total=$5, repeticiones=$6, tecnica_especial=$7, detalle_tecnica=$8,
         link_youtube=$9, notas=$10, tipo_agarre=$11, orden=$12
       WHERE id=$13 RETURNING *`,
      [
        ejercicio_id || null, nombre_ejercicio_custom || null,
        tipo_agrupacion || 'unica', grupo_agrupacion || null,
        series_total || null, repeticiones || null,
        tecnica_especial || 'ninguna', detalle_tecnica || null,
        link_youtube || null, notas || null, tipo_agarre || null, orden || 0,
        ejercicioId,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ejercicio no encontrado.' });
    res.status(200).json({ mensaje: 'Ejercicio actualizado.', ejercicio: obtenerObjeto(result) });
  } catch (error) {
    console.error('[EJERCICIOS] Error al editar:', error);
    res.status(500).json({ error: 'Error al actualizar el ejercicio.' });
  }
};

// DELETE /api/ejercicios/:ejercicioId
const eliminarEjercicio = async (req, res) => {
  const { ejercicioId } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM rutina_ejercicios WHERE id=$1 RETURNING id', [ejercicioId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ejercicio no encontrado.' });
    res.status(200).json({ mensaje: 'Ejercicio eliminado correctamente.' });
  } catch (error) {
    console.error('[EJERCICIOS] Error al eliminar:', error);
    res.status(500).json({ error: 'Error al eliminar el ejercicio.' });
  }
};

module.exports = {
  listarCatalogo,
  listarRutinasDePaciente,
  obtenerRutinaCompleta,
  crearRutina,
  editarRutina,
  eliminarRutina,
  crearDia,
  editarDia,
  eliminarDia,
  agregarEjercicio,
  editarEjercicio,
  eliminarEjercicio,
};