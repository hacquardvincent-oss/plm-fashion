const router = require('express').Router();
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// ── GET /api/spec-sheets/:productId ──────────────────────────
router.get('/:productId', async (req, res) => {
  try {
    const result = await query(
      `SELECT ss.*, p.reference, p.name AS product_name
       FROM product_spec_sheets ss
       JOIN products p ON p.id = ss.product_id
       WHERE ss.product_id = $1 AND ss.is_current = true`,
      [req.params.productId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Aucune fiche technique' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/spec-sheets/:productId/history ───────────────────
router.get('/:productId/history', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, version, is_current, created_at, updated_at
       FROM product_spec_sheets
       WHERE product_id = $1
       ORDER BY version DESC`,
      [req.params.productId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/spec-sheets/:productId ──────────────────────────
// Crée ou met à jour la fiche courante (sans archivage de version)
router.put('/:productId', async (req, res) => {
  const { fiche_technique, fcm, mesures, prise_mesures, commentaires, labelling, croquis } = req.body;

  const SECTIONS = { fiche_technique, fcm, mesures, prise_mesures, commentaires, labelling, croquis };
  const allowed = ['fiche_technique', 'fcm', 'mesures', 'prise_mesures', 'commentaires', 'labelling', 'croquis'];

  try {
    const existing = await query(
      `SELECT id FROM product_spec_sheets WHERE product_id = $1 AND is_current = true`,
      [req.params.productId]
    );

    if (existing.rows.length) {
      const sets = [];
      const vals = [];
      for (const key of allowed) {
        if (SECTIONS[key] !== undefined) {
          vals.push(JSON.stringify(SECTIONS[key]));
          sets.push(`${key} = $${vals.length}`);
        }
      }
      if (!sets.length) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
      vals.push(req.user.id, existing.rows[0].id);
      const result = await query(
        `UPDATE product_spec_sheets
         SET ${sets.join(', ')}, updated_by = $${vals.length - 1}, updated_at = NOW()
         WHERE id = $${vals.length}
         RETURNING *`,
        vals
      );
      return res.json(result.rows[0]);
    }

    // Création
    const product = await query(`SELECT id FROM products WHERE id = $1`, [req.params.productId]);
    if (!product.rows.length) return res.status(404).json({ error: 'Produit introuvable' });

    const result = await query(
      `INSERT INTO product_spec_sheets
         (product_id, version, is_current,
          fiche_technique, fcm, mesures, prise_mesures, commentaires, labelling, croquis,
          created_by, updated_by)
       VALUES ($1, 1, true, $2, $3, $4, $5, $6, $7, $8, $9, $9)
       RETURNING *`,
      [
        req.params.productId,
        JSON.stringify(fiche_technique ?? {}),
        JSON.stringify(fcm ?? []),
        JSON.stringify(mesures ?? {}),
        JSON.stringify(prise_mesures ?? {}),
        JSON.stringify(commentaires ?? []),
        JSON.stringify(labelling ?? {}),
        JSON.stringify(croquis ?? {}),
        req.user.id,
      ]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/spec-sheets/:productId/new-version ─────────────
// Archive la version courante et en crée une nouvelle (clone)
router.post('/:productId/new-version', authorize('admin', 'chef_produit', 'directeur_artistique'), async (req, res) => {
  try {
    const current = await query(
      `SELECT * FROM product_spec_sheets WHERE product_id = $1 AND is_current = true`,
      [req.params.productId]
    );
    if (!current.rows.length) return res.status(404).json({ error: 'Aucune fiche courante à versionner' });

    const c = current.rows[0];

    await query(
      `UPDATE product_spec_sheets SET is_current = false WHERE id = $1`,
      [c.id]
    );

    const nextVer = await query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next FROM product_spec_sheets WHERE product_id = $1`,
      [req.params.productId]
    );

    const result = await query(
      `INSERT INTO product_spec_sheets
         (product_id, version, is_current,
          fiche_technique, fcm, mesures, prise_mesures, commentaires, labelling, croquis,
          created_by, updated_by)
       VALUES ($1, $2, true, $3, $4, $5, $6, $7, $8, $9, $10, $10)
       RETURNING *`,
      [
        req.params.productId,
        nextVer.rows[0].next,
        JSON.stringify(c.fiche_technique),
        JSON.stringify(c.fcm),
        JSON.stringify(c.mesures),
        JSON.stringify(c.prise_mesures),
        JSON.stringify(c.commentaires),
        JSON.stringify(c.labelling),
        JSON.stringify(c.croquis),
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PATCH /api/spec-sheets/:productId/commentaires ───────────
// Ajoute un commentaire de développement
router.patch('/:productId/commentaires', async (req, res) => {
  const { zone, commentaire, proto } = req.body;
  if (!commentaire) return res.status(400).json({ error: 'Commentaire requis' });

  try {
    const sheet = await query(
      `SELECT id, commentaires FROM product_spec_sheets WHERE product_id = $1 AND is_current = true`,
      [req.params.productId]
    );
    if (!sheet.rows.length) return res.status(404).json({ error: 'Fiche introuvable' });

    const existing = Array.isArray(sheet.rows[0].commentaires) ? sheet.rows[0].commentaires : [];
    const newComment = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      auteur: `${req.user.first_name} ${req.user.last_name}`,
      zone: zone ?? '',
      commentaire,
      proto: proto ?? '',
      statut: 'ouvert',
    };
    const updated = [...existing, newComment];

    const result = await query(
      `UPDATE product_spec_sheets
       SET commentaires = $1, updated_by = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [JSON.stringify(updated), req.user.id, sheet.rows[0].id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
