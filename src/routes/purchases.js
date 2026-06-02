// src/routes/purchases.js
const express = require('express')
const router = express.Router()
const { pool } = require('../../config/database')
const { authenticate: auth } = require('../middleware/auth')

async function genRef() {
  const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) FROM purchase_orders')
  return `BC-${new Date().getFullYear()}-${String(Number(count) + 1).padStart(4, '0')}`
}

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT po.*, s.name as supplier_name, c.name as collection_name, (u.first_name || ' ' || u.last_name) as created_by_name,
        COUNT(pol.id)::int as lines_count,
        COALESCE(SUM(pol.quantity_ordered * pol.unit_price), 0)::numeric as total_amount,
        COUNT(pol.id) FILTER (WHERE pol.quality_status = 'nc')::int as nc_count,
        CASE
          WHEN po.expected_delivery < CURRENT_DATE AND po.status NOT IN ('received','validated','cancelled') THEN 'late'
          WHEN po.expected_delivery BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 AND po.status NOT IN ('received','validated','cancelled') THEN 'due_soon'
          ELSE 'ok'
        END as delivery_alert
      FROM purchase_orders po
      LEFT JOIN suppliers s ON s.id = po.supplier_id
      LEFT JOIN collections c ON c.id = po.collection_id
      LEFT JOIN users u ON u.id = po.created_by
      LEFT JOIN purchase_order_lines pol ON pol.order_id = po.id
      ${req.orgId ? 'WHERE po.organization_id = $1' : ''}
      GROUP BY po.id, s.name, c.name, u.first_name, u.last_name
      ORDER BY po.created_at DESC
    `, req.orgId ? [req.orgId] : [])
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/stats', auth, async (req, res) => {
  try {
    const { rows: [stats] } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('validated','cancelled'))::int as open_orders,
        COUNT(*) FILTER (WHERE expected_delivery < CURRENT_DATE AND status NOT IN ('received','validated','cancelled'))::int as late_orders,
        COUNT(*) FILTER (WHERE expected_delivery BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 AND status NOT IN ('received','validated','cancelled'))::int as due_this_week,
        COALESCE(SUM(t.total) FILTER (WHERE po.status NOT IN ('cancelled')), 0)::numeric as total_engaged
      FROM purchase_orders po
      LEFT JOIN LATERAL (SELECT COALESCE(SUM(quantity_ordered * unit_price),0) as total FROM purchase_order_lines WHERE order_id = po.id) t ON true
      ${req.orgId ? 'WHERE po.organization_id = $1' : ''}
    `, req.orgId ? [req.orgId] : [])
    res.json(stats)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const { rows: [po] } = await pool.query(`
      SELECT po.*, s.name as supplier_name, c.name as collection_name, (u.first_name || ' ' || u.last_name) as created_by_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON s.id = po.supplier_id
      LEFT JOIN collections c ON c.id = po.collection_id
      LEFT JOIN users u ON u.id = po.created_by
      WHERE po.id = $1
    `, [req.params.id])
    if (!po) return res.status(404).json({ error: 'Not found' })
    const { rows: lines } = await pool.query(`
      SELECT pol.*, m.name as material_name, p.name as product_name
      FROM purchase_order_lines pol
      LEFT JOIN materials m ON m.id = pol.material_id
      LEFT JOIN products p ON p.id = pol.product_id
      WHERE pol.order_id = $1 ORDER BY pol.id
    `, [req.params.id])
    res.json({ ...po, lines })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', auth, async (req, res) => {
  const { supplier_id, collection_id, expected_delivery, notes, lines = [] } = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const ref = await genRef()
    const { rows: [po] } = await client.query(`
      INSERT INTO purchase_orders (reference, supplier_id, collection_id, expected_delivery, notes, created_by, organization_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [ref, supplier_id, collection_id, expected_delivery, notes, req.user.id, req.orgId])
    for (const l of lines) {
      await client.query(`
        INSERT INTO purchase_order_lines (order_id,material_id,product_id,designation,coloris,quantity_ordered,unit,unit_price)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [po.id, l.material_id||null, l.product_id||null, l.designation, l.coloris, l.quantity_ordered, l.unit||'ml', l.unit_price||0])
    }
    await client.query('COMMIT')
    res.status(201).json(po)
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: e.message })
  } finally { client.release() }
})

router.patch('/:id', auth, async (req, res) => {
  const { status, expected_delivery, actual_delivery, tracking_number, carrier, notes } = req.body
  try {
    const { rows: [po] } = await pool.query(`
      UPDATE purchase_orders
      SET status=COALESCE($1,status), expected_delivery=COALESCE($2,expected_delivery),
          actual_delivery=COALESCE($3,actual_delivery), tracking_number=COALESCE($4,tracking_number),
          carrier=COALESCE($5,carrier), notes=COALESCE($6,notes), updated_at=NOW()
      WHERE id=$7 RETURNING *
    `, [status, expected_delivery, actual_delivery, tracking_number, carrier, notes, req.params.id])
    res.json(po)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.patch('/lines/:id/receive', auth, async (req, res) => {
  const { quantity_received, quality_status } = req.body
  try {
    const { rows: [line] } = await pool.query(`
      UPDATE purchase_order_lines SET quantity_received=$1, quality_status=$2 WHERE id=$3 RETURNING *
    `, [quantity_received, quality_status||'pending', req.params.id])
    const { rows: [{ all_received }] } = await pool.query(`
      SELECT BOOL_AND(quantity_received >= quantity_ordered) as all_received
      FROM purchase_order_lines WHERE order_id=$1
    `, [line.order_id])
    if (all_received) {
      await pool.query("UPDATE purchase_orders SET status='received', updated_at=NOW() WHERE id=$1", [line.order_id])
    } else {
      await pool.query("UPDATE purchase_orders SET status='partially_received', updated_at=NOW() WHERE id=$1 AND status NOT IN ('received','validated')", [line.order_id])
    }
    res.json(line)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows: [po] } = await pool.query('SELECT status FROM purchase_orders WHERE id=$1', [req.params.id])
    if (!po) return res.status(404).json({ error: 'Not found' })
    if (po.status !== 'draft') return res.status(400).json({ error: 'Seuls les brouillons peuvent être supprimés' })
    await pool.query('DELETE FROM purchase_orders WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
