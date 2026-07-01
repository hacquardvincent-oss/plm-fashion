const router = require('express').Router();
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/returns/insights?type=&family=&sub_family=
// Remonte les patterns de retours pertinents pour les attributs d'une fiche.
// Un insight s'applique si son scope (type/family/sub_family) est null (générique)
// ou correspond exactement à la valeur fournie.
router.get('/insights', async (req, res) => {
  try {
    const { type, family, sub_family } = req.query;
    const params = [];
    let sql = 'SELECT * FROM return_insights WHERE 1=1';

    if (req.orgId) { params.push(req.orgId); sql += ` AND (organization_id = $${params.length} OR organization_id IS NULL)`; }

    if (type)       { params.push(type);       sql += ` AND (scope_type IS NULL OR scope_type = $${params.length})`; }
    if (family)     { params.push(family);     sql += ` AND (family IS NULL OR family = $${params.length})`; }
    if (sub_family) { params.push(sub_family); sql += ` AND (sub_family IS NULL OR sub_family = $${params.length})`; }

    sql += `
      ORDER BY
        CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
        return_rate DESC`;

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/returns — toute la base de connaissance (page dédiée)
router.get('/', async (req, res) => {
  try {
    const params = [];
    let sql = 'SELECT * FROM return_insights WHERE 1=1';
    if (req.orgId) { params.push(req.orgId); sql += ` AND (organization_id = $${params.length} OR organization_id IS NULL)`; }
    sql += `
      ORDER BY scope_type NULLS LAST, family NULLS LAST,
        CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
        return_rate DESC`;
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/returns — ajouter un insight à la base
router.post('/', authorize('admin', 'chef_produit', 'qualite'), async (req, res) => {
  try {
    const { scope_type, family, sub_family, attribute, reason, return_rate,
            sample_size, severity, recommendation } = req.body;
    if (!attribute || !reason || !recommendation || return_rate == null) {
      return res.status(400).json({ error: 'attribute, reason, return_rate et recommendation sont requis' });
    }
    const { rows: [ins] } = await query(`
      INSERT INTO return_insights
        (scope_type, family, sub_family, attribute, reason, return_rate, sample_size, severity, recommendation, organization_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [scope_type || null, family || null, sub_family || null, attribute, reason,
       return_rate, sample_size || 0, severity || 'warning', recommendation, req.orgId || null]
    );
    res.status(201).json(ins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
