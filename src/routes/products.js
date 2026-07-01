const router = require('express').Router();
const { query, getClient } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { collection_id, status, type, search } = req.query;
    let sql = `
      SELECT p.*, c.name AS collection_name, c.code AS collection_code,
        s.name AS supplier_name,
        u.first_name || ' ' || u.last_name AS created_by_name
      FROM products p
      LEFT JOIN collections c ON c.id = p.collection_id
      LEFT JOIN suppliers s ON s.id = p.main_supplier_id
      LEFT JOIN users u ON u.id = p.created_by
      WHERE 1=1`;
    const params = [];
    if (req.orgId) { params.push(req.orgId); sql += ` AND p.organization_id = $${params.length}`; }
    if (collection_id) { params.push(collection_id); sql += ` AND p.collection_id = $${params.length}`; }
    if (status)        { params.push(status);         sql += ` AND p.status = $${params.length}`; }
    if (type)          { params.push(type);           sql += ` AND p.type = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (p.name ILIKE $${params.length} OR p.reference ILIKE $${params.length})`;
    }
    sql += ' ORDER BY p.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/products/:id — fiche technique complète
router.get('/:id', async (req, res) => {
  try {
    const [product, variants, bom, costings, workflows, versions] = await Promise.all([
      query(`
        SELECT p.*, c.name AS collection_name, s.name AS supplier_name
        FROM products p
        LEFT JOIN collections c ON c.id = p.collection_id
        LEFT JOIN suppliers s ON s.id = p.main_supplier_id
        WHERE p.id = $1`, [req.params.id]),
      query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY color_name, size', [req.params.id]),
      query(`
        SELECT pb.*, m.name AS material_name, m.type AS material_type,
          m.color_reference, s.name AS supplier_name
        FROM product_bom pb
        JOIN materials m ON m.id = pb.material_id
        LEFT JOIN suppliers s ON s.id = m.supplier_id
        WHERE pb.product_id = $1`, [req.params.id]),
      query(`
        SELECT * FROM product_costings WHERE product_id = $1 ORDER BY version DESC`, [req.params.id]),
      query(`
        SELECT vw.*, u.first_name || ' ' || u.last_name AS requested_by_name
        FROM validation_workflows vw
        LEFT JOIN users u ON u.id = vw.requested_by
        WHERE vw.product_id = $1 ORDER BY vw.requested_at DESC`, [req.params.id]),
      query(`
        SELECT pv.*, (u.first_name || ' ' || u.last_name) AS created_by_name,
          COUNT(vb.id)::int AS bom_count
        FROM product_versions pv
        LEFT JOIN users u ON u.id = pv.created_by
        LEFT JOIN version_bom vb ON vb.version_id = pv.id
        WHERE pv.product_id = $1
        GROUP BY pv.id, u.first_name, u.last_name
        ORDER BY pv.version_number ASC`, [req.params.id]).catch(() => ({ rows: [] })),
    ]);

    if (!product.rows.length) return res.status(404).json({ error: 'Produit introuvable' });

    res.json({
      ...product.rows[0],
      variants: variants.rows,
      bom: bom.rows,
      costings: costings.rows,
      workflows: workflows.rows,
      versions: versions.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/products
router.post('/', authorize('admin', 'chef_produit', 'directeur_artistique'), async (req, res) => {
  try {
    const { reference, name, type, collection_id, family, sub_family, status,
            gender, description, style_notes, target_retail_price, target_cost,
            target_margin, main_supplier_id, erp_article_code } = req.body;

    if (!reference || !name || !type || !collection_id) {
      return res.status(400).json({ error: 'reference, name, type et collection_id sont requis' });
    }
    const result = await query(`
      INSERT INTO products (reference, name, type, collection_id, family, sub_family,
        status, gender, description, style_notes, target_retail_price, target_cost,
        target_margin, main_supplier_id, erp_article_code, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [reference, name, type, collection_id, family, sub_family,
       status || 'concept', gender, description, style_notes,
       target_retail_price, target_cost, target_margin,
       main_supplier_id, erp_article_code, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Référence produit déjà existante' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/products/:id
router.patch('/:id', authorize('admin', 'chef_produit', 'directeur_artistique'), async (req, res) => {
  try {
    const allowed = ['name','type','family','sub_family','status','gender','description',
                     'style_notes','target_retail_price','target_cost','target_margin',
                     'main_supplier_id','erp_article_code'];
    const updates = Object.keys(req.body).filter(k => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'Aucun champ valide' });

    const sets = updates.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const result = await query(
      `UPDATE products SET ${sets} WHERE id = $1 RETURNING *`,
      [req.params.id, ...updates.map(k => req.body[k])]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── VARIANTES ─────────────────────────────────────────────────

// POST /api/products/:id/variants
router.post('/:id/variants', async (req, res) => {
  try {
    const { sku, color_name, color_ref, size, size_system, material_ref, barcode } = req.body;
    if (!sku) return res.status(400).json({ error: 'sku requis' });
    const result = await query(`
      INSERT INTO product_variants (product_id, sku, color_name, color_ref, size,
        size_system, material_ref, barcode)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, sku, color_name, color_ref, size, size_system || 'FR', material_ref, barcode]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'SKU déjà existant' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── BOM ───────────────────────────────────────────────────────

// POST /api/products/:id/bom
router.post('/:id/bom', async (req, res) => {
  try {
    const { material_id, usage_type, quantity, unit, waste_factor, notes } = req.body;
    if (!material_id || !quantity || !unit) {
      return res.status(400).json({ error: 'material_id, quantity et unit sont requis' });
    }
    const result = await query(`
      INSERT INTO product_bom (product_id, material_id, usage_type, quantity, unit, waste_factor, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, material_id, usage_type, quantity, unit, waste_factor || 0.05, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/products/:id/bom/:bomId
router.delete('/:id/bom/:bomId', async (req, res) => {
  try {
    await query('DELETE FROM product_bom WHERE id = $1 AND product_id = $2',
      [req.params.bomId, req.params.id]);
    res.json({ message: 'Ligne BOM supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── VERSIONS ──────────────────────────────────────────────────

// GET /api/products/:id/versions
router.get('/:id/versions', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT pv.*, (u.first_name || ' ' || u.last_name) AS created_by_name,
        COUNT(vb.id)::int AS bom_count
      FROM product_versions pv
      LEFT JOIN users u ON u.id = pv.created_by
      LEFT JOIN version_bom vb ON vb.version_id = pv.id
      WHERE pv.product_id = $1
      GROUP BY pv.id, u.first_name, u.last_name
      ORDER BY pv.version_number ASC
    `, [req.params.id])
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/products/:id/versions/:versionId
router.get('/:id/versions/:versionId', async (req, res) => {
  try {
    const [version, bom] = await Promise.all([
      query('SELECT * FROM product_versions WHERE id = $1 AND product_id = $2', [req.params.versionId, req.params.id]),
      query(`
        SELECT vb.*, m.name AS material_name, m.type AS material_type,
          m.code AS material_code, s.name AS supplier_name
        FROM version_bom vb
        LEFT JOIN materials m ON m.id = vb.material_id
        LEFT JOIN suppliers s ON s.id = m.supplier_id
        WHERE vb.version_id = $1 ORDER BY vb.id
      `, [req.params.versionId])
    ])
    if (!version.rows.length) return res.status(404).json({ error: 'Version introuvable' })
    res.json({ ...version.rows[0], bom: bom.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/products/:id/versions
router.post('/:id/versions', async (req, res) => {
  const { label, status, proto_size, coloris, notes, copy_from_version_id } = req.body
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const { rows: [{ max_v }] } = await client.query(
      'SELECT COALESCE(MAX(version_number), 0) AS max_v FROM product_versions WHERE product_id = $1',
      [req.params.id]
    )
    const newVersionNumber = Number(max_v) + 1
    await client.query('UPDATE product_versions SET is_current = false WHERE product_id = $1', [req.params.id])
    const { rows: [pv] } = await client.query(`
      INSERT INTO product_versions (product_id, version_number, label, status, proto_size, coloris, notes, created_by, is_current)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING *
    `, [req.params.id, newVersionNumber, label || `Proto ${newVersionNumber}`,
        status || 'proto_1', proto_size||null, coloris||null, notes||null, req.user.id])

    // Copier le BOM
    const srcId = copy_from_version_id
    const { rows: sourceBom } = srcId
      ? await client.query('SELECT * FROM version_bom WHERE version_id = $1', [srcId])
      : await client.query('SELECT * FROM product_bom WHERE product_id = $1', [req.params.id])
    for (const b of sourceBom) {
      await client.query(
        'INSERT INTO version_bom (version_id, material_id, designation, usage_type, quantity, unit, waste_factor, unit_price, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [pv.id, b.material_id||null, b.designation||null, b.usage_type||null,
         b.quantity, b.unit||'ml', b.waste_factor||0.05, b.unit_price||0, b.notes||null]
      )
    }
    await client.query('UPDATE products SET status=$1, updated_at=NOW() WHERE id=$2', [status||'proto_1', req.params.id])
    await client.query('COMMIT')
    res.status(201).json(pv)
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: e.message })
  } finally { client.release() }
})

// PATCH /api/products/:id/versions/:versionId
router.patch('/:id/versions/:versionId', async (req, res) => {
  try {
    const { status, label, notes, proto_size, coloris } = req.body
    const { rows: [pv] } = await query(`
      UPDATE product_versions
      SET status=COALESCE($1,status), label=COALESCE($2,label),
          notes=COALESCE($3,notes), proto_size=COALESCE($4,proto_size),
          coloris=COALESCE($5,coloris), updated_at=NOW()
      WHERE id=$6 AND product_id=$7 RETURNING *
    `, [status, label, notes, proto_size, coloris, req.params.versionId, req.params.id])
    if (!pv) return res.status(404).json({ error: 'Version introuvable' })
    if (status) {
      const extras = status === 'valide'
        ? await query('UPDATE product_versions SET validated_by=$1, validated_at=NOW() WHERE id=$2 RETURNING *', [req.user.id, req.params.versionId])
        : null
      await query('UPDATE products SET status=$1, updated_at=NOW() WHERE id=$2', [status, req.params.id])
    }
    res.json(pv)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/products/:id/versions/:versionId/bom
router.post('/:id/versions/:versionId/bom', async (req, res) => {
  try {
    const { material_id, designation, usage_type, quantity, unit, waste_factor, unit_price, notes } = req.body
    const { rows: [b] } = await query(`
      INSERT INTO version_bom (version_id, material_id, designation, usage_type, quantity, unit, waste_factor, unit_price, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [req.params.versionId, material_id||null, designation||null, usage_type||null,
        quantity||1, unit||'ml', waste_factor||0.05, unit_price||0, notes||null])
    res.status(201).json(b)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/products/:id/versions/:versionId/bom/:bomId
router.delete('/:id/versions/:versionId/bom/:bomId', async (req, res) => {
  try {
    await query('DELETE FROM version_bom WHERE id=$1 AND version_id=$2', [req.params.bomId, req.params.versionId])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router;
