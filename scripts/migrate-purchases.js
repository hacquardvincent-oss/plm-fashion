const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false })

async function migratePurchases() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Bons de commande
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        reference VARCHAR(50) UNIQUE NOT NULL,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
        status VARCHAR(30) DEFAULT 'draft',
        order_date DATE DEFAULT CURRENT_DATE,
        expected_delivery DATE,
        actual_delivery DATE,
        tracking_number VARCHAR(100),
        carrier VARCHAR(100),
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Lignes de BC
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_order_lines (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
        material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        designation VARCHAR(255),
        coloris VARCHAR(100),
        quantity_ordered NUMERIC(10,2) NOT NULL DEFAULT 0,
        quantity_received NUMERIC(10,2) DEFAULT 0,
        unit VARCHAR(20) DEFAULT 'ml',
        unit_price NUMERIC(10,2),
        currency VARCHAR(3) DEFAULT 'EUR',
        quality_status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Non-conformités qualité
    await client.query(`
      CREATE TABLE IF NOT EXISTS quality_issues (
        id SERIAL PRIMARY KEY,
        line_id INTEGER REFERENCES purchase_order_lines(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        severity VARCHAR(20) DEFAULT 'non_blocking',
        action_required VARCHAR(50),
        status VARCHAR(20) DEFAULT 'open',
        resolved_at TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query('COMMIT')
    console.log('✅ Migration module Achats terminée')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('Migration Achats failed:', e.message)
    throw e
  } finally {
    client.release()
    await pool.end()
  }
}

migratePurchases().catch(e => { console.error(e); process.exit(1) })
