const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); 

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect()
  .then(() => console.log('[SISTEMA] Conexion exitosa a PostgreSQL'))
  .catch(err => console.error('[ERROR] Conectando a BD', err.stack));

// FUNCIONES DE EXTRACCION SEGURA (Evitan que vuelva a ocurrir el error de datos vacios)
const num = (valor) => {
  const parseado = parseFloat(valor);
  return isNaN(parseado) ? 0 : parseado;
};

const obtenerObjeto = (resultadoDB) => {
  if (!resultadoDB) return null;
  let datos = resultadoDB.rows ? resultadoDB.rows : resultadoDB;
  if (Array.isArray(datos)) {
    datos = datos.flat(Infinity);
    return datos.length > 0 ? datos : null;
  }
  return datos;
};

const obtenerLista = (resultadoDB) => {
  if (!resultadoDB) return [];
  let datos = resultadoDB.rows ? resultadoDB.rows : resultadoDB;
  if (Array.isArray(datos)) {
     return datos.flat(Infinity);
  }
  return [datos];
};

// --- RUTAS DEL SISTEMA ---

app.post('/api/pacientes', async (req, res) => {
  const { nombre, email, password, genero, fecha_nacimiento, telefono, objetivo, referencias_medicas, actividad_fisica, horarios_alimentacion, factor_actividad } = req.body;
  try {
    const resultQuery = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const datosExistentes = obtenerLista(resultQuery);
    if (datosExistentes.find(item => item && item.email === email)) return res.status(400).json({ error: 'Ya existe un paciente con este correo.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const queryInsert = `
      INSERT INTO usuarios (nombre, email, password_hash, rol, genero, fecha_nacimiento, telefono, objetivo, referencias_medicas, actividad_fisica, horarios_alimentacion, factor_actividad)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const valores = [nombre, email, passwordHash, 'paciente', genero, fecha_nacimiento, telefono, objetivo, referencias_medicas, actividad_fisica, horarios_alimentacion, factor_actividad];
    const nuevoUsuario = await pool.query(queryInsert, valores);
    
    res.status(201).json({ mensaje: 'Paciente registrado', paciente: obtenerObjeto(nuevoUsuario) });
  } catch (error) {
    console.error('[ERROR] Registro:', error);
    res.status(500).json({ error: 'Error al registrar paciente.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = obtenerObjeto(result);

    if (!usuario || !usuario.password_hash) return res.status(401).json({ error: 'Correo o contrasena incorrectos.' });
    
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) return res.status(401).json({ error: 'Correo o contrasena incorrectos' });

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET || 'secreto', { expiresIn: '24h' });
    res.status(200).json({ mensaje: 'Login exitoso', token, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } });
  } catch (error) {
    res.status(500).json({ error: 'Error interno.' });
  }
});

app.get('/api/pacientes', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM usuarios WHERE rol = 'paciente' ORDER BY id DESC`);
    const pacientes = obtenerLista(result).filter(item => item && item.rol === 'paciente');
    res.status(200).json(pacientes);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar BD' });
  }
});

app.get('/api/pacientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pacienteResult = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);
    const paciente = obtenerObjeto(pacienteResult);
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

    const medidasResult = await pool.query("SELECT * FROM registros_antropometricos WHERE paciente_id = $1 ORDER BY fecha DESC", [id]);
    const medidas = obtenerLista(medidasResult).filter(m => m && m.id);
    
    res.status(200).json({ paciente, historial: medidas });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// NUEVA RUTA PARA EDITAR LOS DATOS DEL PACIENTE
app.put('/api/pacientes/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, email, telefono, genero, fecha_nacimiento, objetivo, factor_actividad } = req.body;
  try {
    const queryUpdate = `
      UPDATE usuarios 
      SET nombre = $1, email = $2, telefono = $3, genero = $4, fecha_nacimiento = $5, objetivo = $6, factor_actividad = $7
      WHERE id = $8
      RETURNING *;
    `;
    const valores = [nombre, email, telefono, genero, fecha_nacimiento, objetivo, factor_actividad, id];
    const resultado = await pool.query(queryUpdate, valores);
    res.status(200).json({ mensaje: 'Actualizado', paciente: obtenerObjeto(resultado) });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar los datos.' });
  }
});

app.post('/api/pacientes/:id/medidas', async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  try {
    const userQ = await pool.query("SELECT genero, fecha_nacimiento, factor_actividad FROM usuarios WHERE id = $1", [id]);
    const usuario = obtenerObjeto(userQ);
    
    if (!usuario) return res.status(404).json({ error: 'Paciente no encontrado' });

    let edad = 25; 
    if (usuario.fecha_nacimiento) {
      const fn = new Date(usuario.fecha_nacimiento);
      const hoy = new Date();
      edad = hoy.getFullYear() - fn.getFullYear();
      if (hoy.getMonth() < fn.getMonth() || (hoy.getMonth() === fn.getMonth() && hoy.getDate() < fn.getDate())) {
        edad--;
      }
    }

    const esHombre = usuario.genero && String(usuario.genero).trim().toLowerCase() === 'hombre';

    const peso = num(body.peso_kg);
    const talla = num(body.talla_cm);
    
    const pTri = num(body.pliegue_triceps);
    const pBi = num(body.pliegue_biceps);
    const pSub = num(body.pliegue_subescapular);
    const pSup = num(body.pliegue_suprailiaco);

    const sumaPliegues = pTri + pBi + pSub + pSup;
    const logPliegues = Math.log10(sumaPliegues > 0 ? sumaPliegues : 1);
    let densidad = 1.1;

    if (esHombre) {
      if (edad <= 19) densidad = 1.1620 - (0.0630 * logPliegues);
      else if (edad <= 29) densidad = 1.1631 - (0.0632 * logPliegues);
      else if (edad <= 39) densidad = 1.1422 - (0.0544 * logPliegues);
      else if (edad <= 49) densidad = 1.1620 - (0.0700 * logPliegues);
      else densidad = 1.1715 - (0.0779 * logPliegues);
    } else { 
      if (edad <= 19) densidad = 1.1549 - (0.0678 * logPliegues);
      else if (edad <= 29) densidad = 1.1599 - (0.0717 * logPliegues);
      else if (edad <= 39) densidad = 1.1423 - (0.0632 * logPliegues);
      else if (edad <= 49) densidad = 1.1333 - (0.0612 * logPliegues);
      else densidad = 1.1339 - (0.0645 * logPliegues);
    }

    let porcentajeGrasa = ((495 / densidad) - 450);
    if (porcentajeGrasa < 0 || isNaN(porcentajeGrasa)) porcentajeGrasa = 0;
    
    const masaGrasa = peso * (porcentajeGrasa / 100);
    const masaMuscular = peso - masaGrasa;
    
    let metabolismoBasal = (10 * peso) + (6.25 * talla) - (5 * edad);
    metabolismoBasal += esHombre ? 5 : -161;
    
    const factorActividad = num(usuario.factor_actividad) || 1.2;
    const gastoEnergeticoTotal = metabolismoBasal * factorActividad;
    
    const ajuste = num(body.ajuste_calorico);
    const caloriasRecomendadas = gastoEnergeticoTotal + ajuste;

    const queryInsert = `
      INSERT INTO registros_antropometricos 
      (paciente_id, peso_kg, talla_cm, pliegue_triceps, pliegue_biceps, pliegue_subescapular, pliegue_suprailiaco, 
      pliegue_abdominal, pliegue_muslo, pliegue_pantorrilla, porcentaje_grasa, masa_grasa_kg, masa_muscular_kg, 
      metabolismo_basal, circ_cuello, circ_brazo, circ_cintura, circ_abdomen, circ_cadera, circ_pierna, circ_pantorrilla, 
      gasto_energetico_total, ajuste_calorico, calorias_recomendadas, notas_clinicas)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *;
    `;
    const valores = [
      id, peso, talla, pTri, pBi, pSub, pSup, 
      num(body.pliegue_abdominal), num(body.pliegue_muslo), num(body.pliegue_pantorrilla),
      porcentajeGrasa.toFixed(2), masaGrasa.toFixed(2), masaMuscular.toFixed(2), 
      metabolismoBasal.toFixed(2), num(body.circ_cuello), num(body.circ_brazo), num(body.circ_cintura), 
      num(body.circ_abdomen), num(body.circ_cadera), num(body.circ_pierna), num(body.circ_pantorrilla), 
      gastoEnergeticoTotal.toFixed(2), ajuste, caloriasRecomendadas.toFixed(2), body.notas_clinicas || ''
    ];
    
    const nuevaMedida = await pool.query(queryInsert, valores);
    res.status(201).json({ mensaje: 'Medicion guardada', medida: obtenerObjeto(nuevaMedida) });
  } catch (error) {
    console.error('[ERROR] Calculos:', error);
    res.status(500).json({ error: 'Error al procesar calculos.' });
  }
});

app.listen(port, () => console.log(`[SISTEMA] Servidor corriendo en el puerto ${port}`));