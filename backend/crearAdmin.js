const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Conexión a la base de datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function sembrarAdmin() {
  try {
    console.log("Iniciando limpieza y creación de Paulina...");

    // 1. ELIMINACIÓN SEGURA: Borramos cualquier registro corrupto
    await pool.query("DELETE FROM usuarios WHERE email = 'paulina@nutricion.com'");
    console.log("Registros anteriores eliminados.");

    // 2. CREACIÓN DEL HASH: Encriptamos la contraseña 'admin123'
    const passwordPlana = 'admin123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(passwordPlana, saltRounds);
    
    console.log("Hash generado correctamente.");

    // 3. INSERCIÓN: Guardamos en la base de datos
    const queryInsert = `
      INSERT INTO usuarios (nombre, email, password_hash, rol, genero, fecha_nacimiento)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    
    const valores = [
      'Paulina Ortega',
      'paulina@nutricion.com',
      passwordHash,
      'admin',
      'Mujer',
      '1995-01-01' // Puedes ajustar su fecha real luego
    ];

    await pool.query(queryInsert, valores);
    
    console.log("¡Éxito absoluto! Paulina registrada correctamente en la BD.");
    console.log(`Correo para iniciar sesión: paulina@nutricion.com`);
    console.log(`Contraseña: ${passwordPlana}`);

  } catch (error) {
    console.error("Error grave al crear admin:", error);
  } finally {
    pool.end(); // Es vital cerrar la conexión para que la consola no se quede pasmada
  }
}

sembrarAdmin();