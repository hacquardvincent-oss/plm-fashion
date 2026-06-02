/**
 * Migration multi-tenant — PLM Fashion
 * Ajoute la table organizations et organization_id sur toutes les tables métier.
 * Assigne les données existantes à l'organisation "PLM Fashion Demo".
 *
 * Usage : node scripts/migrate_multitenant.js
 * Idempotent : peut être relancé sans effet de bord.
 */

require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
})

const q = (text, params) => pool.query(text, params)

// Tables qui reçoivent organization_id directement
const TOP_LEVEL_TABLES = [
  'users',
  'collections',
  'materials',
  'suppliers',
  'purchase_orders',
  'documents',
]

async function run() {
  console.log('🏢 Migration multi-tenant — PLM Fashion\n')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // ── 1. Table organizations ────────────────────────────────
    console.log('1. Création table organizations...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name         VARCHAR(255) NOT NULL,
        slug         VARCHAR(100) UNIQUE NOT NULL,
        plan         VARCHAR(50) NOT NULL DEFAULT 'demo',
        settings     JSONB NOT NULL DEFAULT '{}',
        is_active    BOOLEAN NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    console.log('   ✓ organizations')

    // ── 2. Table integrations ─────────────────────────────────
    console.log('2. Création table integrations...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS integrations (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        type            VARCHAR(50) NOT NULL,
        name            VARCHAR(255) NOT NULL,
        config          JSONB NOT NULL DEFAULT '{}',
        is_active       BOOLEAN NOT NULL DEFAULT FALSE,
        last_sync_at    TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT integrations_org_type_name_unique UNIQUE (organization_id, type, name)
      )
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS integration_mappings (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
        plm_field      VARCHAR(255) NOT NULL,
        external_field VARCHAR(255) NOT NULL,
        transform      JSONB DEFAULT '{}',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    console.log('   ✓ integrations + integration_mappings')

    // ── 3. Table export_jobs ──────────────────────────────────
    console.log('3. Création table export_jobs...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS export_jobs (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        integration_id  UUID REFERENCES integrations(id) ON DELETE SET NULL,
        type            VARCHAR(100) NOT NULL,
        status          VARCHAR(30) NOT NULL DEFAULT 'pending',
        filters         JSONB DEFAULT '{}',
        result          JSONB,
        error           TEXT,
        rows_exported   INTEGER DEFAULT 0,
        file_url        TEXT,
        created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        started_at      TIMESTAMPTZ,
        completed_at    TIMESTAMPTZ
      )
    `)
    console.log('   ✓ export_jobs')

    // ── 4. Org démo ───────────────────────────────────────────
    console.log('4. Création organisation "PLM Fashion Demo"...')
    const { rows: [demoOrg] } = await client.query(`
      INSERT INTO organizations (name, slug, plan)
      VALUES ('PLM Fashion Demo', 'plm-fashion-demo', 'demo')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `)
    const orgId = demoOrg.id
    console.log(`   ✓ org id = ${orgId}`)

    // ── 5. Ajout organization_id sur les tables ───────────────
    console.log('5. Ajout colonne organization_id...')
    for (const table of TOP_LEVEL_TABLES) {
      // Vérifie si la colonne existe déjà
      const { rows } = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = $1 AND column_name = 'organization_id'
      `, [table])

      if (rows.length === 0) {
        await client.query(`ALTER TABLE ${table} ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE`)
        console.log(`   ✓ ALTER TABLE ${table} ADD COLUMN organization_id`)
      } else {
        console.log(`   - ${table} : organization_id existe déjà`)
      }
    }

    // ── 6. Assignation des données existantes à l'org démo ───
    console.log('6. Assignation des données existantes...')
    for (const table of TOP_LEVEL_TABLES) {
      const { rowCount } = await client.query(
        `UPDATE ${table} SET organization_id = $1 WHERE organization_id IS NULL`,
        [orgId]
      )
      if (rowCount > 0) console.log(`   ✓ ${table} : ${rowCount} ligne(s) mises à jour`)
    }

    // ── 7. FK organization_id sur users → organizations ───────
    console.log('7. Intégrations prédéfinies pour l\'org démo...')
    for (const integration of [
      { type: 'cegid', name: 'Cegid Y2 / Orli', config: { format: 'csv', encoding: 'UTF-8', delimiter: ';' } },
      { type: 'nuorder', name: 'NuOrder Wholesale', config: { format: 'csv', market: 'FR' } },
      { type: 'ecommerce', name: 'E-commerce (Shopify)', config: { markets: ['FR', 'EN'], seo: true } },
      { type: 'email', name: 'Email fournisseurs', config: { from: '', smtp: '' } },
    ]) {
      await client.query(`
        INSERT INTO integrations (organization_id, type, name, config)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (organization_id, type, name) DO NOTHING
      `, [orgId, integration.type, integration.name, JSON.stringify(integration.config)])
      console.log(`   ✓ intégration ${integration.name}`)
    }

    await client.query('COMMIT')
    console.log('\n✅ Migration multi-tenant terminée !')
    console.log(`   Organisation : PLM Fashion Demo (${orgId})`)
    console.log('   Tables mises à jour :', TOP_LEVEL_TABLES.join(', '))
    console.log('   Intégrations créées : Cegid, NuOrder, E-commerce, Email')

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('\n❌ Erreur (rollback) :', err.message)
    console.error(err.stack)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
