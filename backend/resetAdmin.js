const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function restaurarPaulina() {
  try {
    console.log("[SISTEMA] Generando nueva firma criptografica...");
    
    // Generamos el hash perfecto y seguro para "admin123"
    const passwordHash = await bcrypt.hash('admin123', 10);
    const emailAdmin = 'paulina@nutricion.com';
    
    const queryUpdate = `
      UPDATE usuarios 
      SET password_hash = $1 
      WHERE email = $2
      RETURNING *;
    `;
    
    const res = await pool.query(queryUpdate, [passwordHash, emailAdmin]);
    
    if (res.rows.length > 0) {
      console.log("[EXITO] La contrasena ha sido restaurada con exito.");
      console.log("Usuario: " + emailAdmin);
      console.log("Contrasena: admin123");
    } else {
      console.log("[AVISO] No se encontro el correo de Paulina. Creando cuenta desde cero...");
      const queryInsert = `
        INSERT INTO usuarios (nombre, email, password_hash, rol, genero)
        VALUES ('Paulina', $1, $2, 'admin', 'Mujer')
        RETURNING *;
      `;
      await pool.query(queryInsert, [emailAdmin, passwordHash]);
      console.log("[EXITO] Cuenta de Paulina creada desde cero con contrasena: admin123");
    }
  } catch (error) {
    console.error("[ERROR GRAVE]:", error);
  } finally {
    pool.end();
  }
}

restaurarPaulina();