/**
 * Routes export — PLM Fashion
 * Gère les exports vers Cegid, NuOrder, e-commerce + Excel
 */
const router = require('express').Router()
const { query, getClient } = require('../../config/database')
const { authenticate, authorize } = require('../middleware/auth')

router.use(authenticate)

// ── GET /api/exports — historique des exports ─────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT ej.*, i.type AS integration_type, i.name AS integration_name,
              u.first_name || ' ' || u.last_name AS created_by_name
       FROM export_jobs ej
       LEFT JOIN integrations i ON i.id = ej.integration_id
       LEFT JOIN users u ON u.id = ej.created_by
       WHERE ej.organization_id = $1
       ORDER BY ej.created_at DESC LIMIT 100`,
      [req.orgId]
    )
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── POST /api/exports/cegid — export articles Cegid/Orli ─────
router.post('/cegid', authorize('admin', 'chef_produit', 'acheteur'), async (req, res) => {
  const { collection_id, product_ids, format = 'csv' } = req.body
  try {
    // Récupérer les produits + BOM
    let sql = `
      SELECT p.reference AS code_article, p.name AS designation, p.type AS famille,
             p.gender AS genre, p.status AS statut,
             c.name AS collection, c.season AS saison, c.year AS annee,
             s.name AS fournisseur_principal, s.erp_code AS code_erp_fournisseur,
             p.target_retail_price AS pv_public, p.target_cost AS prix_revient_cible,
             p.description, p.style_notes, p.erp_article_code AS code_erp
      FROM products p
      LEFT JOIN collections c ON c.id = p.collection_id
      LEFT JOIN suppliers s ON s.id = p.main_supplier_id
      WHERE p.organization_id = $1`
    const params = [req.orgId]

    if (collection_id) { params.push(collection_id); sql += ` AND p.collection_id = $${params.length}` }
    if (product_ids?.length) { params.push(product_ids); sql += ` AND p.id = ANY($${params.length})` }
    sql += ' ORDER BY c.year DESC, c.season, p.reference'

    const { rows: products } = await query(sql, params)

    // BOM pour chaque produit
    const productIds = products.map(p => p.code_article)
    const { rows: bomRows } = await query(
      `SELECT p.reference AS code_article,
              m.code AS code_matiere, m.name AS designation_matiere,
              m.composition, m.type AS type_matiere,
              pb.quantity AS quantite, pb.unit AS unite, pb.waste_factor AS dechet,
              s.name AS fournisseur_matiere, s.erp_code AS code_erp_matiere
       FROM product_bom pb
       JOIN products p ON p.id = pb.product_id
       JOIN materials m ON m.id = pb.material_id
       LEFT JOIN suppliers s ON s.id = m.supplier_id
       WHERE p.organization_id = $1
       ${collection_id ? `AND p.collection_id = $2` : ''}
       ORDER BY p.reference, m.code`,
      collection_id ? [req.orgId, collection_id] : [req.orgId]
    )

    // Générer le CSV Cegid
    const csvLines = ['CODE_ARTICLE;DESIGNATION;FAMILLE;GENRE;COLLECTION;SAISON;ANNEE;FOURNISSEUR;CODE_ERP_FOURN;PV_PUBLIC;PRIX_REVIENT;CODE_ERP_ARTICLE;STATUT']
    for (const p of products) {
      csvLines.push([
        p.code_article, p.designation, p.famille, p.genre,
        p.collection, p.saison, p.annee,
        p.fournisseur_principal, p.code_erp_fournisseur,
        p.pv_public ?? '', p.prix_revient_cible ?? '',
        p.code_erp ?? '', p.statut,
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
    }

    const csvNomencl = ['CODE_ARTICLE;CODE_MATIERE;DESIGNATION_MATIERE;COMPOSITION;TYPE;QUANTITE;UNITE;DECHET;FOURNISSEUR;CODE_ERP_MATIERE']
    for (const b of bomRows) {
      csvNomencl.push([
        b.code_article, b.code_matiere, b.designation_matiere, b.composition,
        b.type_matiere, b.quantite, b.unite, b.dechet,
        b.fournisseur_matiere, b.code_erp_matiere,
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
    }

    // Log le job
    await query(
      `INSERT INTO export_jobs (organization_id, integration_id, type, status, filters, result, rows_exported, completed_at, created_by)
       SELECT $1, i.id, 'cegid', 'done', $2, $3, $4, NOW(), $5
       FROM integrations i WHERE i.organization_id = $1 AND i.type = 'cegid' LIMIT 1`,
      [req.orgId, JSON.stringify({ collection_id, product_ids }), JSON.stringify({ articles: products.length, nomenclatures: bomRows.length }), products.length, req.user.id]
    )

    res.json({
      articles: { csv: csvLines.join('\n'), count: products.length },
      nomenclatures: { csv: csvNomencl.join('\n'), count: bomRows.length },
      format,
      exported_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

// ── POST /api/exports/nuorder — export catalogue NuOrder ─────
router.post('/nuorder', authorize('admin', 'chef_produit', 'acheteur'), async (req, res) => {
  const { collection_id, product_ids } = req.body
  try {
    let sql = `
      SELECT p.reference AS style_number, p.name AS style_name,
             p.type AS category, p.gender, p.description,
             c.name AS collection_name, c.season, c.year,
             p.target_retail_price AS retail_price,
             p.target_cost AS wholesale_price,
             s.name AS vendor
      FROM products p
      LEFT JOIN collections c ON c.id = p.collection_id
      LEFT JOIN suppliers s ON s.id = p.main_supplier_id
      WHERE p.organization_id = $1`
    const params = [req.orgId]
    if (collection_id) { params.push(collection_id); sql += ` AND p.collection_id = $${params.length}` }
    if (product_ids?.length) { params.push(product_ids); sql += ` AND p.id = ANY($${params.length})` }
    sql += ' ORDER BY p.reference'

    const { rows: products } = await query(sql, params)

    // Variantes
    const { rows: variants } = await query(
      `SELECT p.reference AS style_number, pv.sku, pv.color_name, pv.color_ref, pv.size, pv.size_system
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE p.organization_id = $1
       ${collection_id ? 'AND p.collection_id = $2' : ''}
       ORDER BY p.reference, pv.color_name, pv.size`,
      collection_id ? [req.orgId, collection_id] : [req.orgId]
    )

    const csvProducts = ['STYLE_NUMBER;STYLE_NAME;CATEGORY;GENDER;COLLECTION;SEASON;YEAR;RETAIL_PRICE;WHOLESALE_PRICE;VENDOR;DESCRIPTION']
    for (const p of products) {
      csvProducts.push([
        p.style_number, p.style_name, p.category, p.gender,
        p.collection_name, p.season, p.year,
        p.retail_price ?? '', p.wholesale_price ?? '', p.vendor, p.description,
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
    }

    const csvVariants = ['STYLE_NUMBER;SKU;COLOR_NAME;COLOR_REF;SIZE;SIZE_SYSTEM']
    for (const v of variants) {
      csvVariants.push([v.style_number, v.sku, v.color_name, v.color_ref, v.size, v.size_system]
        .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
    }

    await query(
      `INSERT INTO export_jobs (organization_id, integration_id, type, status, filters, result, rows_exported, completed_at, created_by)
       SELECT $1, i.id, 'nuorder', 'done', $2, $3, $4, NOW(), $5
       FROM integrations i WHERE i.organization_id = $1 AND i.type = 'nuorder' LIMIT 1`,
      [req.orgId, JSON.stringify({ collection_id }), JSON.stringify({ products: products.length, variants: variants.length }), products.length, req.user.id]
    )

    res.json({
      products: { csv: csvProducts.join('\n'), count: products.length },
      variants: { csv: csvVariants.join('\n'), count: variants.length },
      exported_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

// ── GET /api/exports/:id — détail d'un job ────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows: [job] } = await query(
      'SELECT * FROM export_jobs WHERE id = $1 AND organization_id = $2',
      [req.params.id, req.orgId]
    )
    if (!job) return res.status(404).json({ error: 'Export introuvable' })
    res.json(job)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
