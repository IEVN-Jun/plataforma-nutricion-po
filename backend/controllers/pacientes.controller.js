const bcrypt = require('bcrypt');
const pool   = require('../db/pool');
const { obtenerObjeto, obtenerLista } = require('../utils/helpers');

// POST /api/pacientes — Registrar nuevo paciente
const crearPaciente = async (req, res) => {
  const {
    nombre, email, password, genero, fecha_nacimiento, telefono,
    objetivo, referencias_medicas, actividad_fisica, horarios_alimentacion, factor_actividad,
  } = req.body;

  try {
    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un paciente con este correo.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO usuarios
        (nombre, email, password_hash, rol, genero, fecha_nacimiento, telefono,
         objetivo, referencias_medicas, actividad_fisica, horarios_alimentacion, factor_actividad)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *;
    `;
    const valores = [
      nombre, email, passwordHash, 'paciente', genero, fecha_nacimiento, telefono,
      objetivo, referencias_medicas, actividad_fisica, horarios_alimentacion, factor_actividad,
    ];

    const resultado = await pool.query(query, valores);
    res.status(201).json({ mensaje: 'Paciente registrado', paciente: obtenerObjeto(resultado) });

  } catch (error) {
    console.error('[PACIENTES] Error al crear:', error);
    res.status(500).json({ error: 'Error al registrar paciente.' });
  }
};

// GET /api/pacientes — Listar todos los pacientes con resumen de consultas
const listarPacientes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.nombre,
        u.email,
        u.genero,
        u.fecha_nacimiento,
        u.telefono,
        u.objetivo,
        u.factor_actividad,
        MAX(r.fecha)     AS ultima_consulta,
        COUNT(r.id)::int AS total_sesiones
      FROM usuarios u
      LEFT JOIN registros_antropometricos r ON r.paciente_id = u.id
      WHERE u.rol = 'paciente'
      GROUP BY u.id
      ORDER BY u.id DESC
    `);
    res.status(200).json(obtenerLista(result));
  } catch (error) {
    console.error('[PACIENTES] Error al listar:', error);
    res.status(500).json({ error: 'Error al consultar la base de datos.' });
  }
};

// GET /api/pacientes/:id — Expediente completo de un paciente
const obtenerExpediente = async (req, res) => {
  const { id } = req.params;
  try {
    const pacienteResult = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    const paciente = obtenerObjeto(pacienteResult);

    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado.' });

    const medidasResult = await pool.query(
      'SELECT * FROM registros_antropometricos WHERE paciente_id = $1 ORDER BY fecha DESC',
      [id]
    );

    res.status(200).json({ paciente, historial: obtenerLista(medidasResult) });
  } catch (error) {
    console.error('[PACIENTES] Error al obtener expediente:', error);
    res.status(500).json({ error: 'Error del servidor.' });
  }
};

// PUT /api/pacientes/:id — Editar datos del paciente
const editarPaciente = async (req, res) => {
  const { id } = req.params;
  const { nombre, email, telefono, genero, fecha_nacimiento, objetivo, factor_actividad } = req.body;

  try {
    const query = `
      UPDATE usuarios
      SET nombre = $1, email = $2, telefono = $3, genero = $4,
          fecha_nacimiento = $5, objetivo = $6, factor_actividad = $7
      WHERE id = $8
      RETURNING *;
    `;
    const resultado = await pool.query(query, [nombre, email, telefono, genero, fecha_nacimiento, objetivo, factor_actividad, id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado.' });
    }

    res.status(200).json({ mensaje: 'Datos actualizados correctamente.', paciente: obtenerObjeto(resultado) });
  } catch (error) {
    console.error('[PACIENTES] Error al editar:', error);
    res.status(500).json({ error: 'Error al actualizar los datos.' });
  }
};

module.exports = { crearPaciente, listarPacientes, obtenerExpediente, editarPaciente };