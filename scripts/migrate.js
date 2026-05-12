require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Migration de la base de données...');

    // Lire le schéma SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schema);
    console.log('✅ Schéma appliqué avec succès');

    // Créer l'utilisateur admin par défaut si inexistant
    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@plm-fashion.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';

    const exists = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (!exists.rows.length) {
      const hash = await bcrypt.hash(adminPassword, 12);
      await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ($1, $2, 'Admin', 'PLM', 'admin')`,
        [adminEmail, hash]
      );
      console.log(`✅ Utilisateur admin créé : ${adminEmail}`);
      console.log(`   ⚠️  Changez le mot de passe en production !`);
    } else {
      console.log('ℹ️  Utilisateur admin déjà existant');
    }

    console.log('🚀 Migration terminée !');
  } catch (err) {
    console.error('❌ Erreur de migration :', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
