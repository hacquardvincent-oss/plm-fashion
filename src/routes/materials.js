const router = require('express').Router();
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/materials
router.get('/', async (req, res) => {
  try {
    const { type, supplier_id, is_validated, search } = req.query;
    let sql = `
      SELECT m.*, s.name AS supplier_name,
        u.first_name || ' ' || u.last_name AS validated_by_name
      FROM materials m
      LEFT JOIN suppliers s ON s.id = m.supplier_id
      LEFT JOIN users u ON u.id = m.validated_by
      WHERE 1=1`;
    const params = [];
    if (req.orgId) { params.push(req.orgId); sql += ` AND m.organization_id = $${params.length}`; }
    if (type)         { params.push(type);         sql += ` AND m.type = $${params.length}`; }
    if (supplier_id)  { params.push(supplier_id);  sql += ` AND m.supplier_id = $${params.length}`; }
    if (is_validated !== undefined) {
      params.push(is_validated === 'true');
      sql += ` AND m.is_validated = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (m.name ILIKE $${params.length} OR m.code ILIKE $${params.length})`;
    }
    sql += ' ORDER BY m.name';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/materials/:id
router.get('/:id', async (req, res) => {
  try {
    const [mat, samples] = await Promise.all([
      query(`SELECT m.*, s.name AS supplier_name FROM materials m
             LEFT JOIN suppliers s ON s.id = m.supplier_id WHERE m.id = $1`, [req.params.id]),
      query('SELECT * FROM material_samples WHERE material_id = $1 ORDER BY requested_at DESC', [req.params.id]),
    ]);
    if (!mat.rows.length) return res.status(404).json({ error: 'Matière introuvable' });
    res.json({ ...mat.rows[0], samples: samples.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/materials
router.post('/', async (req, res) => {
  try {
    const { code, name, type, composition, width_cm, weight_gsm, color_reference,
            color_name, unit, min_order_qty, price_per_unit, currency,
            supplier_id, supplier_ref, lead_time_days, notes } = req.body;
    if (!code || !name || !type) {
      return res.status(400).json({ error: 'code, name et type sont requis' });
    }
    const result = await query(`
      INSERT INTO materials (code, name, type, composition, width_cm, weight_gsm,
        color_reference, color_name, unit, min_order_qty, price_per_unit, currency,
        supplier_id, supplier_ref, lead_time_days, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [code, name, type, composition, width_cm, weight_gsm, color_reference,
       color_name, unit || 'ml', min_order_qty, price_per_unit, currency || 'EUR',
       supplier_id, supplier_ref, lead_time_days, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Code matière déjà existant' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/materials/:id/validate
router.patch('/:id/validate', authorize('admin', 'chef_produit', 'qualite'), async (req, res) => {
  try {
    const result = await query(`
      UPDATE materials SET is_validated = true, validated_by = $1, validated_at = NOW()
      WHERE id = $2 RETURNING *`, [req.user.id, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Matière introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/materials/:id
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['name','composition','width_cm','weight_gsm','color_reference',
                     'color_name','unit','min_order_qty','price_per_unit','supplier_id',
                     'supplier_ref','lead_time_days','notes'];
    const updates = Object.keys(req.body).filter(k => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'Aucun champ valide' });
    const sets = updates.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const result = await query(
      `UPDATE materials SET ${sets} WHERE id = $1 RETURNING *`,
      [req.params.id, ...updates.map(k => req.body[k])]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Matière introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
