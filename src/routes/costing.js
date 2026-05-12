const router = require('express').Router();
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/costing/:productId — costing courant
router.get('/:productId', async (req, res) => {
  try {
    const [costing, lines] = await Promise.all([
      query(`SELECT pc.*, u.first_name || ' ' || u.last_name AS created_by_name
             FROM product_costings pc
             LEFT JOIN users u ON u.id = pc.created_by
             WHERE pc.product_id = $1 AND pc.is_current = true`, [req.params.productId]),
      query(`SELECT cl.*, s.name AS supplier_name
             FROM costing_lines cl
             LEFT JOIN suppliers s ON s.id = cl.supplier_id
             WHERE cl.costing_id = (
               SELECT id FROM product_costings WHERE product_id = $1 AND is_current = true
             )`, [req.params.productId]),
    ]);
    if (!costing.rows.length) return res.status(404).json({ error: 'Costing introuvable' });
    res.json({ ...costing.rows[0], lines: lines.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/costing/:productId — créer ou mettre à jour le costing
router.post('/:productId', authorize('admin', 'chef_produit', 'acheteur'), async (req, res) => {
  const client = await require('../../config/database').getClient();
  try {
    await client.query('BEGIN');

    // Archiver le costing courant
    await client.query(
      'UPDATE product_costings SET is_current = false WHERE product_id = $1',
      [req.params.productId]
    );

    // Calculer la version suivante
    const vRes = await client.query(
      'SELECT COALESCE(MAX(version), 0) + 1 AS next FROM product_costings WHERE product_id = $1',
      [req.params.productId]
    );

    const { cmt_cost, accessories_cost, transport_cost, customs_cost,
            wholesale_price, retail_price, notes, lines } = req.body;

    // Calculer le coût matières depuis la BOM
    const bomRes = await client.query(`
      SELECT SUM(pb.quantity * (1 + pb.waste_factor) * m.price_per_unit) AS mat_cost
      FROM product_bom pb
      JOIN materials m ON m.id = pb.material_id
      WHERE pb.product_id = $1`, [req.params.productId]);
    const materials_cost = parseFloat(bomRes.rows[0].mat_cost || 0);

    const costing = await client.query(`
      INSERT INTO product_costings (product_id, version, is_current, materials_cost,
        cmt_cost, accessories_cost, transport_cost, customs_cost,
        wholesale_price, retail_price, notes, created_by)
      VALUES ($1,$2,true,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.params.productId, vRes.rows[0].next, materials_cost,
       cmt_cost || 0, accessories_cost || 0, transport_cost || 0, customs_cost || 0,
       wholesale_price, retail_price, notes, req.user.id]
    );

    // Insérer les lignes de détail
    if (lines && lines.length) {
      for (const line of lines) {
        await client.query(`
          INSERT INTO costing_lines (costing_id, category, label, quantity, unit_price, amount, currency, supplier_id, notes)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [costing.rows[0].id, line.category, line.label, line.quantity,
           line.unit_price, line.amount, line.currency || 'EUR', line.supplier_id, line.notes]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(costing.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// GET /api/costing/:productId/history
router.get('/:productId/history', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM product_costings WHERE product_id = $1 ORDER BY version DESC',
      [req.params.productId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
