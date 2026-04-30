require('dotenv').config();
require('./db/pool'); // Inicializa la conexión al arrancar
const app  = require('./app');
 
const PORT = process.env.PORT || 3000;
 
app.listen(PORT, () => {
  console.log(`[SISTEMA] Servidor corriendo en el puerto ${PORT}`);
});