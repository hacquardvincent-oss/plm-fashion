const router = require('express').Router();
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/collections
router.get('/', async (req, res) => {
  try {
    const { status, year } = req.query;
    let sql = `
      SELECT c.*, u.first_name || ' ' || u.last_name AS created_by_name,
        COUNT(p.id)::int AS product_count
      FROM collections c
      LEFT JOIN users u ON u.id = c.created_by
      LEFT JOIN products p ON p.collection_id = c.id
      WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); sql += ` AND c.status = $${params.length}`; }
    if (year)   { params.push(year);   sql += ` AND c.year = $${params.length}`; }
    sql += ' GROUP BY c.id, u.first_name, u.last_name ORDER BY c.year DESC, c.created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/collections/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, u.first_name || ' ' || u.last_name AS created_by_name,
        COUNT(p.id)::int AS product_count
      FROM collections c
      LEFT JOIN users u ON u.id = c.created_by
      LEFT JOIN products p ON p.collection_id = c.id
      WHERE c.id = $1
      GROUP BY c.id, u.first_name, u.last_name`, [req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Collection introuvable' });

    const milestones = await query(
      'SELECT * FROM collection_milestones WHERE collection_id = $1 ORDER BY due_date',
      [req.params.id]
    );
    res.json({ ...result.rows[0], milestones: milestones.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/collections
router.post('/', authorize('admin', 'chef_produit', 'directeur_artistique'), async (req, res) => {
  try {
    const { code, name, season, year, target_refs, budget, description,
            brief_url, delivery_date, showroom_date } = req.body;
    if (!code || !name || !year) {
      return res.status(400).json({ error: 'code, name et year sont requis' });
    }
    const result = await query(`
      INSERT INTO collections (code, name, season, year, target_refs, budget,
        description, brief_url, delivery_date, showroom_date, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [code, name, season, year, target_refs, budget, description,
       brief_url, delivery_date, showroom_date, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Code collection déjà existant' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/collections/:id
router.patch('/:id', authorize('admin', 'chef_produit', 'directeur_artistique'), async (req, res) => {
  try {
    const allowed = ['name','season','year','status','target_refs','budget',
                     'description','brief_url','delivery_date','showroom_date'];
    const updates = Object.keys(req.body).filter(k => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'Aucun champ valide à mettre à jour' });

    const sets = updates.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = updates.map(k => req.body[k]);

    const result = await query(
      `UPDATE collections SET ${sets} WHERE id = $1 RETURNING *`,
      [req.params.id, ...values]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Collection introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/collections/:id
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const result = await query('DELETE FROM collections WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Collection introuvable' });
    res.json({ message: 'Collection supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
