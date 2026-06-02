const router = require('express').Router()
const { query, getClient } = require('../../config/database')
const { authenticate, authorize } = require('../middleware/auth')

router.use(authenticate)

// GET /api/integrations — liste les intégrations de l'org
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT i.*, COUNT(im.id)::int AS mappings_count
       FROM integrations i
       LEFT JOIN integration_mappings im ON im.integration_id = i.id
       WHERE i.organization_id = $1
       GROUP BY i.id
       ORDER BY i.type, i.name`,
      [req.orgId]
    )
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/integrations/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows: [integration] } = await query(
      'SELECT * FROM integrations WHERE id = $1 AND organization_id = $2',
      [req.params.id, req.orgId]
    )
    if (!integration) return res.status(404).json({ error: 'Intégration introuvable' })

    const { rows: mappings } = await query(
      'SELECT * FROM integration_mappings WHERE integration_id = $1 ORDER BY plm_field',
      [req.params.id]
    )
    res.json({ ...integration, mappings })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PATCH /api/integrations/:id — config + activation
router.patch('/:id', authorize('admin', 'chef_produit'), async (req, res) => {
  try {
    const { config, is_active, name } = req.body
    const { rows: [updated] } = await query(
      `UPDATE integrations SET
        config = COALESCE($1, config),
        is_active = COALESCE($2, is_active),
        name = COALESCE($3, name),
        updated_at = NOW()
       WHERE id = $4 AND organization_id = $5 RETURNING *`,
      [config ? JSON.stringify(config) : null, is_active, name, req.params.id, req.orgId]
    )
    if (!updated) return res.status(404).json({ error: 'Intégration introuvable' })
    res.json(updated)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/integrations/:id/mappings — remplace tous les mappings
router.put('/:id/mappings', authorize('admin', 'chef_produit'), async (req, res) => {
  const { mappings = [] } = req.body
  const client = await getClient()
  try {
    await client.query('BEGIN')
    // Vérifie que l'intégration appartient à l'org
    const { rows: [intg] } = await client.query(
      'SELECT id FROM integrations WHERE id = $1 AND organization_id = $2',
      [req.params.id, req.orgId]
    )
    if (!intg) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Intégration introuvable' }) }

    await client.query('DELETE FROM integration_mappings WHERE integration_id = $1', [req.params.id])
    for (const m of mappings) {
      await client.query(
        'INSERT INTO integration_mappings (integration_id, plm_field, external_field, transform) VALUES ($1,$2,$3,$4)',
        [req.params.id, m.plm_field, m.external_field, JSON.stringify(m.transform ?? {})]
      )
    }
    await client.query('COMMIT')

    const { rows } = await query('SELECT * FROM integration_mappings WHERE integration_id = $1', [req.params.id])
    res.json(rows)
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: e.message })
  } finally { client.release() }
})

module.exports = router
