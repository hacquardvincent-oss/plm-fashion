/**
 * Migration performance commerciale
 * Crée l'enum sales_channel + la table channel_performance
 * (sell-in par canal, coûts, retours, funnel digital)
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
    console.log('🔄 Migration performance commerciale...\n')

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE sales_channel AS ENUM ('retail', 'digital', 'wholesale');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    console.log('✓ Enum sales_channel')

    await client.query(`
      CREATE TABLE IF NOT EXISTS channel_performance (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        channel         sales_channel NOT NULL,
        period          VARCHAR(20) NOT NULL DEFAULT 'S1',
        ordered_qty     INTEGER NOT NULL DEFAULT 0,
        ordered_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
        shipped_qty     INTEGER NOT NULL DEFAULT 0,
        purchase_cost   NUMERIC(12,2) NOT NULL DEFAULT 0,
        unit_pri        NUMERIC(10,2) NOT NULL DEFAULT 0,
        returns_qty     INTEGER NOT NULL DEFAULT 0,
        returns_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
        impressions     INTEGER,
        product_views   INTEGER,
        cart_adds       INTEGER,
        organization_id UUID,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (product_id, channel, period)
      )
    `)
    console.log('✓ Table channel_performance')

    await client.query('CREATE INDEX IF NOT EXISTS idx_channel_perf_product ON channel_performance(product_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_channel_perf_channel ON channel_performance(channel)')
    console.log('✓ Index')

    await client.query('COMMIT')
    console.log('\n✅ Migration commerciale terminée !')
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
