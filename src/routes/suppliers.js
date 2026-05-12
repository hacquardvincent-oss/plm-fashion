const router = require('express').Router();
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/suppliers
router.get('/', async (req, res) => {
  try {
    const { country, search, is_active } = req.query;
    let sql = `SELECT s.*,
      ROUND(AVG(e.score), 1) AS avg_score
      FROM suppliers s
      LEFT JOIN supplier_evaluations e ON e.supplier_id = s.id
      WHERE 1=1`;
    const params = [];
    if (country)   { params.push(country);              sql += ` AND s.country = $${params.length}`; }
    if (is_active) { params.push(is_active === 'true'); sql += ` AND s.is_active = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (s.name ILIKE $${params.length} OR s.code ILIKE $${params.length})`;
    }
    sql += ' GROUP BY s.id ORDER BY s.name';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res) => {
  try {
    const [sup, evals, materials] = await Promise.all([
      query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]),
      query(`SELECT e.*, u.first_name || ' ' || u.last_name AS evaluated_by_name
             FROM supplier_evaluations e
             LEFT JOIN users u ON u.id = e.evaluated_by
             WHERE e.supplier_id = $1 ORDER BY e.evaluated_at DESC`, [req.params.id]),
      query('SELECT id, code, name, type, price_per_unit, unit FROM materials WHERE supplier_id = $1', [req.params.id]),
    ]);
    if (!sup.rows.length) return res.status(404).json({ error: 'Fournisseur introuvable' });
    res.json({ ...sup.rows[0], evaluations: evals.rows, materials: materials.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/suppliers
router.post('/', authorize('admin', 'acheteur', 'chef_produit'), async (req, res) => {
  try {
    const { code, name, country, city, address, contact_name, contact_email,
            contact_phone, currency, payment_terms, lead_time_days,
            certifications, specialties, erp_code, notes } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'code et name requis' });
    const result = await query(`
      INSERT INTO suppliers (code, name, country, city, address, contact_name,
        contact_email, contact_phone, currency, payment_terms, lead_time_days,
        certifications, specialties, erp_code, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [code, name, country, city, address, contact_name, contact_email,
       contact_phone, currency || 'EUR', payment_terms, lead_time_days,
       certifications, specialties, erp_code, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Code fournisseur déjà existant' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/suppliers/:id/evaluations
router.post('/:id/evaluations', authorize('admin', 'acheteur', 'chef_produit', 'qualite'), async (req, res) => {
  try {
    const { score, quality, delay, communication, comment } = req.body;
    if (!score) return res.status(400).json({ error: 'score requis' });
    const result = await query(`
      INSERT INTO supplier_evaluations (supplier_id, evaluated_by, score, quality, delay, communication, comment)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, req.user.id, score, quality, delay, communication, comment]
    );
    // Mise à jour du quality_score moyen sur le fournisseur
    await query(`
      UPDATE suppliers SET quality_score = (
        SELECT ROUND(AVG(score)::numeric, 1) FROM supplier_evaluations WHERE supplier_id = $1
      ) WHERE id = $1`, [req.params.id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
