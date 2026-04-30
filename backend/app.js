const express = require('express');
const cors    = require('cors');

const authRoutes     = require('./routes/auth.routes');
const pacientesRoutes = require('./routes/pacientes.routes');
const medidasRoutes  = require('./routes/medidas.routes');
const rutinasRoutes = require('./routes/rutinas.routes');

const app = express();

// --- Middleware global ---
app.use(cors());
app.use(express.json());

// --- Rutas ---
app.use('/api',           authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/medidas',   medidasRoutes);
app.use('/api', rutinasRoutes);

// --- Manejador de rutas no encontradas ---
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada.` });
});

// --- Manejador global de errores ---
app.use((err, req, res, _next) => {
  console.error('[ERROR NO CONTROLADO]:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;