const express = require('express');
const router  = express.Router();
const {
  crearPaciente,
  listarPacientes,
  obtenerExpediente,
  editarPaciente,
} = require('../controllers/pacientes.controller');
const { crearMedida, editarMedida } = require('../controllers/medidas.controller');

router.post  ('/',                          crearPaciente);
router.get   ('/',                          listarPacientes);
router.get   ('/:id',                       obtenerExpediente);
router.put   ('/:id',                       editarPaciente);
router.post  ('/:id/medidas',               crearMedida);
router.put   ('/:pacienteId/medidas/:medidaId', editarMedida);

module.exports = router;