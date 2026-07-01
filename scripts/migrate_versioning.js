/**
 * Migration versioning produit
 * Crée product_versions et version_bom
 * Initialise une version V1 pour chaque produit existant
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
    console.log('🔄 Migration versioning produit...\n')

    // ── 1. Table product_versions ────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_versions (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        version_number  SMALLINT NOT NULL DEFAULT 1,
        label           VARCHAR(100) NOT NULL DEFAULT 'Proto 1',
        status          VARCHAR(50) NOT NULL DEFAULT 'proto_1',
        proto_size      VARCHAR(20),
        coloris         VARCHAR(255),
        notes           TEXT,
        created_by      UUID REFERENCES users(id),
        validated_by    UUID REFERENCES users(id),
        validated_at    TIMESTAMPTZ,
        is_current      BOOLEAN NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (product_id, version_number)
      )
    `)
    console.log('✓ Table product_versions')

    // ── 2. Table version_bom ─────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS version_bom (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        version_id   UUID NOT NULL REFERENCES product_versions(id) ON DELETE CASCADE,
        material_id  UUID REFERENCES materials(id),
        designation  VARCHAR(255),
        usage_type   VARCHAR(100),
        quantity     NUMERIC(10,4) NOT NULL DEFAULT 1,
        unit         VARCHAR(20) NOT NULL DEFAULT 'ml',
        waste_factor NUMERIC(5,4) DEFAULT 0.05,
        unit_price   NUMERIC(10,4) DEFAULT 0,
        notes        TEXT
      )
    `)
    console.log('✓ Table version_bom')

    // ── 3. Initialiser V1 pour chaque produit sans version ───
    const { rows: products } = await client.query(`
      SELECT p.id, p.status, p.created_by
      FROM products p
      WHERE NOT EXISTS (
        SELECT 1 FROM product_versions pv WHERE pv.product_id = p.id
      )
    `)
    console.log(`\n${products.length} produit(s) à initialiser...`)

    for (const p of products) {
      const { rows: [pv] } = await client.query(`
        INSERT INTO product_versions (product_id, version_number, label, status, created_by, is_current)
        VALUES ($1, 1, 'Proto 1', $2, $3, true) RETURNING id
      `, [p.id, p.status || 'proto_1', p.created_by])

      // Copier le BOM existant
      const { rows: bom } = await client.query(
        'SELECT * FROM product_bom WHERE product_id = $1', [p.id]
      )
      for (const b of bom) {
        await client.query(`
          INSERT INTO version_bom (version_id, material_id, usage_type, quantity, unit, waste_factor, notes)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
        `, [pv.id, b.material_id, b.usage_type, b.quantity, b.unit, b.waste_factor, b.notes])
      }
      console.log(`  ✓ ${p.id} — V1 créée (${bom.length} BOM)`)
    }

    await client.query('COMMIT')
    console.log('\n✅ Migration versioning terminée !')
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
