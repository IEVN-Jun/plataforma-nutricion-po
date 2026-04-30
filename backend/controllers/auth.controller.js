const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    const usuario = result.rows[0];

    if (!usuario.password_hash) {
      console.error('[AUTH] Usuario sin password_hash. Email:', email);
      return res.status(401).json({ error: 'Cuenta sin contraseña configurada. Contacta al administrador.' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET || 'secreto_super_seguro',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    });

  } catch (error) {
    console.error('[AUTH] Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { login };