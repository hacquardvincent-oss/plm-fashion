const router = require('express').Router();
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/workflows?product_id=&decision=en_attente
router.get('/', async (req, res) => {
  try {
    const { product_id, decision, stage } = req.query;
    let sql = `
      SELECT vw.*, p.name AS product_name, p.reference,
        u1.first_name || ' ' || u1.last_name AS requested_by_name,
        u2.first_name || ' ' || u2.last_name AS decided_by_name
      FROM validation_workflows vw
      JOIN products p ON p.id = vw.product_id
      LEFT JOIN users u1 ON u1.id = vw.requested_by
      LEFT JOIN users u2 ON u2.id = vw.decided_by
      WHERE 1=1`;
    const params = [];
    if (product_id) { params.push(product_id); sql += ` AND vw.product_id = $${params.length}`; }
    if (decision)   { params.push(decision);   sql += ` AND vw.decision = $${params.length}`; }
    if (stage)      { params.push(stage);      sql += ` AND vw.stage = $${params.length}`; }
    sql += ' ORDER BY vw.requested_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/workflows — créer une demande de validation
router.post('/', async (req, res) => {
  try {
    const { product_id, stage, due_date, next_stage } = req.body;
    if (!product_id || !stage) {
      return res.status(400).json({ error: 'product_id et stage requis' });
    }
    const result = await query(`
      INSERT INTO validation_workflows (product_id, stage, requested_by, due_date, next_stage)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [product_id, stage, req.user.id, due_date, next_stage]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/workflows/:id/decide — approuver ou rejeter
router.patch('/:id/decide', authorize('admin', 'chef_produit', 'direction', 'qualite'), async (req, res) => {
  const client = await require('../../config/database').getClient();
  try {
    await client.query('BEGIN');
    const { decision, comments } = req.body;
    if (!['approuve', 'rejete', 'revision'].includes(decision)) {
      return res.status(400).json({ error: 'decision doit être approuve, rejete ou revision' });
    }

    const wfRes = await client.query('SELECT * FROM validation_workflows WHERE id = $1', [req.params.id]);
    if (!wfRes.rows.length) return res.status(404).json({ error: 'Workflow introuvable' });
    const wf = wfRes.rows[0];

    // Mettre à jour le workflow
    await client.query(`
      UPDATE validation_workflows
      SET decision = $1, decided_by = $2, decided_at = NOW(), comments = $3
      WHERE id = $4`,
      [decision, req.user.id, comments, req.params.id]
    );

    // Si approuvé, faire avancer le statut du produit
    if (decision === 'approuve' && wf.next_stage) {
      await client.query(
        'UPDATE products SET status = $1 WHERE id = $2',
        [wf.next_stage, wf.product_id]
      );
    }

    await client.query('COMMIT');

    const updated = await query('SELECT * FROM validation_workflows WHERE id = $1', [req.params.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// POST /api/workflows/:id/comments
router.post('/:id/comments', async (req, res) => {
  try {
    const { comment, is_blocking, zone } = req.body;
    if (!comment) return res.status(400).json({ error: 'comment requis' });
    const result = await query(`
      INSERT INTO validation_comments (workflow_id, user_id, comment, is_blocking, zone)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, req.user.id, comment, is_blocking || false, zone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/workflows/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const result = await query(`
      SELECT vc.*, u.first_name || ' ' || u.last_name AS user_name
      FROM validation_comments vc
      JOIN users u ON u.id = vc.user_id
      WHERE vc.workflow_id = $1 ORDER BY vc.created_at`, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
