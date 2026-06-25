require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false })

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Create product_versions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_versions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        version_number SMALLINT NOT NULL DEFAULT 1,
        label VARCHAR(100) NOT NULL DEFAULT 'Proto 1',
        status VARCHAR(50) NOT NULL DEFAULT 'proto_1',
        proto_size VARCHAR(20),
        coloris VARCHAR(255),
        notes TEXT,
        created_by UUID REFERENCES users(id),
        validated_by UUID REFERENCES users(id),
        validated_at TIMESTAMPTZ,
        is_current BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (product_id, version_number)
      )
    `)

    // Create version_bom table
    await client.query(`
      CREATE TABLE IF NOT EXISTS version_bom (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        version_id UUID NOT NULL REFERENCES product_versions(id) ON DELETE CASCADE,
        material_id UUID REFERENCES materials(id),
        designation VARCHAR(255),
        usage_type VARCHAR(100),
        quantity NUMERIC(10,4) NOT NULL DEFAULT 1,
        unit VARCHAR(20) NOT NULL DEFAULT 'ml',
        waste_factor NUMERIC(5,4) DEFAULT 0.05,
        unit_price NUMERIC(10,4) DEFAULT 0,
        notes TEXT
      )
    `)

    // For each existing product that has no version yet, create version_1
    const { rows: products } = await client.query(`
      SELECT p.id, p.status FROM products p
      WHERE NOT EXISTS (SELECT 1 FROM product_versions pv WHERE pv.product_id = p.id)
    `)

    for (const product of products) {
      const { rows: [pv] } = await client.query(`
        INSERT INTO product_versions (product_id, version_number, label, status, is_current)
        VALUES ($1, 1, 'Proto 1', $2, true) RETURNING *
      `, [product.id, product.status || 'proto_1'])

      // Copy product_bom rows into version_bom
      const { rows: bom } = await client.query('SELECT * FROM product_bom WHERE product_id = $1', [product.id])
      for (const b of bom) {
        await client.query(
          'INSERT INTO version_bom (version_id, material_id, usage_type, quantity, unit, waste_factor, notes) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [pv.id, b.material_id, b.usage_type, b.quantity, b.unit, b.waste_factor, b.notes]
        )
      }
    }

    await client.query('COMMIT')
    console.log(`Migration done. Processed ${products.length} products.`)
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('Migration failed:', e)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
