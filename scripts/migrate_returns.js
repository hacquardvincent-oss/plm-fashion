/**
 * Migration base de connaissance retours clients
 * Crée return_insights : patterns de retours agrégés (par type/famille/attribut)
 * exploités pour pousser des recommandations à la création d'une fiche technique.
 */
require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_URL?.includes('render.com')
    ? { rejectUnauthorized: false } : false,
})

async function run() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    console.log('🔄 Migration base de connaissance retours...\n')

    await client.query(`
      CREATE TABLE IF NOT EXISTS return_insights (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        scope_type      product_type,               -- null = tous types
        family          VARCHAR(100),               -- null = toutes familles
        sub_family      VARCHAR(100),               -- null = toutes sous-familles
        attribute       VARCHAR(120) NOT NULL,      -- ex: 'Taille hanches'
        reason          VARCHAR(255) NOT NULL,      -- ex: 'Taille trop juste aux hanches'
        return_rate     NUMERIC(5,2) NOT NULL,      -- % de retour observé
        sample_size     INTEGER NOT NULL DEFAULT 0, -- nb de commandes analysées
        severity        VARCHAR(20) NOT NULL DEFAULT 'warning', -- info | warning | critical
        recommendation  TEXT NOT NULL,
        organization_id UUID,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    console.log('✓ Table return_insights')

    await client.query('CREATE INDEX IF NOT EXISTS idx_return_insights_scope ON return_insights(scope_type, family, sub_family)')
    console.log('✓ Index')

    await client.query('COMMIT')
    console.log('\n✅ Migration retours terminée !')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('❌', e.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
