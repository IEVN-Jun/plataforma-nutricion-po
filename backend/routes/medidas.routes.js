const express = require('express');
const router  = express.Router();
const { eliminarMedida } = require('../controllers/medidas.controller');
 
router.delete('/:medidaId', eliminarMedida);
 
module.exports = router;