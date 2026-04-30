const express = require('express');
const router  = express.Router();
const {
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
} = require('../controllers/rutinas.controller');

// ---- Catalogo de ejercicios ----
// GET /api/ejercicios
router.get('/ejercicios', listarCatalogo);

// ---- Rutinas vinculadas a un paciente ----
// GET  /api/pacientes/:pacienteId/rutinas
// POST /api/pacientes/:pacienteId/rutinas
router.get ('/pacientes/:pacienteId/rutinas',  listarRutinasDePaciente);
router.post('/pacientes/:pacienteId/rutinas', crearRutina);

// ---- Rutina individual ----
// GET    /api/rutinas/:id
// PUT    /api/rutinas/:id
// DELETE /api/rutinas/:id
router.get   ('/rutinas/:id', obtenerRutinaCompleta);
router.put   ('/rutinas/:id', editarRutina);
router.delete('/rutinas/:id', eliminarRutina);

// ---- Dias de rutina ----
// POST   /api/rutinas/:rutinaId/dias
// PUT    /api/dias/:diaId
// DELETE /api/dias/:diaId
router.post  ('/rutinas/:rutinaId/dias', crearDia);
router.put   ('/dias/:diaId',            editarDia);
router.delete('/dias/:diaId',            eliminarDia);

// ---- Ejercicios de un dia ----
// POST   /api/dias/:diaId/ejercicios
// PUT    /api/ejercicios/:ejercicioId
// DELETE /api/ejercicios/:ejercicioId
router.post  ('/dias/:diaId/ejercicios',         agregarEjercicio);
router.put   ('/ejercicios/:ejercicioId',         editarEjercicio);
router.delete('/ejercicios/:ejercicioId',         eliminarEjercicio);

module.exports = router;