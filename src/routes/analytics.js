const router = require('express').Router();
const { query } = require('../../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * Construit le filtre organisation conditionnel (multi-tenant).
 * Retourne { clause, params } prêts à concaténer.
 */
function orgFilter(req, alias = 'p') {
  if (req.orgId) return { clause: ` AND ${alias}.organization_id = $1`, params: [req.orgId] };
  return { clause: '', params: [] };
}

// ── GET /api/analytics/overview — KPI globaux ────────────────────
router.get('/overview', async (req, res) => {
  try {
    const { clause, params } = orgFilter(req);

    // Répartition par statut + marges cibles
    const products = await query(`
      SELECT
        COUNT(*)::int                                         AS total,
        COUNT(*) FILTER (WHERE p.status = 'valide')::int      AS valides,
        COUNT(*) FILTER (WHERE p.status = 'abandonne')::int   AS abandonnes,
        COUNT(*) FILTER (WHERE p.status IN ('concept','en_developpement','proto_1','proto_2','sms'))::int AS en_cours,
        AVG(p.target_margin)         AS avg_target_margin,
        AVG(p.target_cost)           AS avg_target_cost,
        AVG(p.target_retail_price)   AS avg_target_retail
      FROM products p
      WHERE 1=1${clause}
    `, params);

    // Marges réelles issues du costing courant
    const costing = await query(`
      SELECT
        AVG(pc.gross_margin_pct)  AS avg_real_margin,
        AVG(pc.total_cost)        AS avg_real_cost,
        AVG(pc.coefficient)       AS avg_coefficient,
        COUNT(*)::int             AS costed_count
      FROM product_costings pc
      JOIN products p ON p.id = pc.product_id
      WHERE pc.is_current = true${clause}
    `, params);

    const o = products.rows[0];
    const c = costing.rows[0];
    const decided = (o.valides ?? 0) + (o.abandonnes ?? 0);
    const cancellationRate = decided > 0 ? (o.abandonnes / decided) * 100 : 0;
    const validationRate = o.total > 0 ? (o.valides / o.total) * 100 : 0;

    res.json({
      total: o.total,
      valides: o.valides,
      abandonnes: o.abandonnes,
      en_cours: o.en_cours,
      cancellation_rate: Number(cancellationRate.toFixed(1)),
      validation_rate: Number(validationRate.toFixed(1)),
      avg_target_margin: o.avg_target_margin != null ? Number(Number(o.avg_target_margin).toFixed(1)) : null,
      avg_target_cost: o.avg_target_cost != null ? Number(Number(o.avg_target_cost).toFixed(2)) : null,
      avg_target_retail: o.avg_target_retail != null ? Number(Number(o.avg_target_retail).toFixed(2)) : null,
      avg_real_margin: c.avg_real_margin != null ? Number(Number(c.avg_real_margin).toFixed(1)) : null,
      avg_real_cost: c.avg_real_cost != null ? Number(Number(c.avg_real_cost).toFixed(2)) : null,
      avg_coefficient: c.avg_coefficient != null ? Number(Number(c.avg_coefficient).toFixed(2)) : null,
      costed_count: c.costed_count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/analytics/products — rentabilité par produit ────────
router.get('/products', async (req, res) => {
  try {
    const { clause, params } = orgFilter(req);

    const result = await query(`
      SELECT
        p.id, p.reference, p.name, p.status, p.type,
        p.target_cost, p.target_retail_price, p.target_margin,
        c.name AS collection_name, c.code AS collection_code,
        pc.total_cost      AS real_cost,
        pc.retail_price    AS real_retail,
        pc.wholesale_price AS real_wholesale,
        pc.gross_margin_pct AS real_margin,
        pc.coefficient     AS real_coefficient
      FROM products p
      LEFT JOIN collections c ON c.id = p.collection_id
      LEFT JOIN product_costings pc ON pc.product_id = p.id AND pc.is_current = true
      WHERE 1=1${clause}
      ORDER BY pc.gross_margin_pct DESC NULLS LAST, p.created_at DESC
    `, params);

    // Nombre d'itérations proto (versioning) — best effort
    const versions = await query(`
      SELECT product_id, COUNT(*)::int AS proto_count
      FROM product_versions
      GROUP BY product_id
    `).catch(() => ({ rows: [] }));
    const protoMap = Object.fromEntries(versions.rows.map((v) => [v.product_id, v.proto_count]));

    const rows = result.rows.map((p) => {
      const cost = p.real_cost != null ? Number(p.real_cost) : (p.target_cost != null ? Number(p.target_cost) : null);
      const price = p.real_retail != null ? Number(p.real_retail) : (p.target_retail_price != null ? Number(p.target_retail_price) : null);
      let margin = p.real_margin != null ? Number(p.real_margin) : null;
      if (margin == null && cost != null && price != null && price > 0) {
        margin = ((price - cost) / price) * 100;
      }
      return {
        ...p,
        effective_cost: cost,
        effective_retail: price,
        effective_margin: margin != null ? Number(margin.toFixed(1)) : null,
        is_estimated: p.real_margin == null, // true = basé sur la cible, pas le costing réel
        proto_count: protoMap[p.id] ?? 0,
      };
    });

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/analytics/collections — rentabilité par collection ──
router.get('/collections', async (req, res) => {
  try {
    const { clause, params } = orgFilter(req);

    const result = await query(`
      SELECT
        c.id, c.code, c.name, c.season, c.year,
        COUNT(p.id)::int                                       AS total,
        COUNT(p.id) FILTER (WHERE p.status = 'valide')::int    AS valides,
        COUNT(p.id) FILTER (WHERE p.status = 'abandonne')::int AS abandonnes,
        AVG(p.target_margin)                                   AS avg_target_margin,
        AVG(pc.gross_margin_pct)                               AS avg_real_margin,
        AVG(COALESCE(pc.total_cost, p.target_cost))            AS avg_cost,
        SUM(COALESCE(pc.retail_price, p.target_retail_price))  AS sum_retail
      FROM collections c
      LEFT JOIN products p ON p.collection_id = c.id
      LEFT JOIN product_costings pc ON pc.product_id = p.id AND pc.is_current = true
      WHERE 1=1${clause.replace(/p\./g, 'c.')}
      GROUP BY c.id
      ORDER BY c.year DESC NULLS LAST, c.code
    `, params);

    const rows = result.rows.map((r) => {
      const decided = (r.valides ?? 0) + (r.abandonnes ?? 0);
      return {
        ...r,
        cancellation_rate: decided > 0 ? Number(((r.abandonnes / decided) * 100).toFixed(1)) : 0,
        avg_target_margin: r.avg_target_margin != null ? Number(Number(r.avg_target_margin).toFixed(1)) : null,
        avg_real_margin: r.avg_real_margin != null ? Number(Number(r.avg_real_margin).toFixed(1)) : null,
        avg_cost: r.avg_cost != null ? Number(Number(r.avg_cost).toFixed(2)) : null,
        sum_retail: r.sum_retail != null ? Number(Number(r.sum_retail).toFixed(2)) : null,
      };
    });

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ══════════════════════════════════════════════════════════════
//  PERFORMANCE COMMERCIALE (sell-in réalisé par canal)
// ══════════════════════════════════════════════════════════════

// GET /api/analytics/commercial/overview — KPI commerciaux globaux
router.get('/commercial/overview', async (req, res) => {
  try {
    const { clause, params } = orgFilter(req);
    const r = await query(`
      SELECT
        SUM(cp.ordered_revenue)                                  AS ca_commande,
        SUM(cp.purchase_cost)                                    AS cout_achat,
        SUM(cp.returns_amount)                                   AS retours,
        SUM(cp.ordered_qty)::bigint                              AS qte_commandee,
        SUM(cp.returns_qty)::bigint                              AS qte_retours,
        SUM(cp.ordered_revenue) FILTER (WHERE cp.channel = 'retail')    AS ca_retail,
        SUM(cp.ordered_revenue) FILTER (WHERE cp.channel = 'digital')   AS ca_digital,
        SUM(cp.ordered_revenue) FILTER (WHERE cp.channel = 'wholesale') AS ca_wholesale
      FROM channel_performance cp
      JOIN products p ON p.id = cp.product_id
      WHERE 1=1${clause}
    `, params);
    const o = r.rows[0];
    const ca = Number(o.ca_commande || 0);
    const cost = Number(o.cout_achat || 0);
    const retours = Number(o.retours || 0);
    const caNet = ca - retours;
    const margeBrute = caNet - cost;
    res.json({
      ca_commande: ca,
      ca_net: caNet,
      cout_achat: cost,
      retours,
      marge_brute: margeBrute,
      marge_pct: caNet > 0 ? Number(((margeBrute / caNet) * 100).toFixed(1)) : null,
      taux_retour: Number(o.qte_commandee) > 0
        ? Number(((Number(o.qte_retours) / Number(o.qte_commandee)) * 100).toFixed(1)) : 0,
      qte_commandee: Number(o.qte_commandee || 0),
      mix: {
        retail: Number(o.ca_retail || 0),
        digital: Number(o.ca_digital || 0),
        wholesale: Number(o.ca_wholesale || 0),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/analytics/commercial/products — rentabilité réalisée par référence
router.get('/commercial/products', async (req, res) => {
  try {
    const { clause, params } = orgFilter(req);
    const r = await query(`
      SELECT
        p.id, p.reference, p.name, p.status,
        c.name AS collection_name, c.code AS collection_code,
        SUM(cp.ordered_qty)::bigint     AS qte_commandee,
        SUM(cp.ordered_revenue)         AS ca_commande,
        SUM(cp.purchase_cost)           AS cout_achat,
        SUM(cp.returns_amount)          AS retours,
        SUM(cp.returns_qty)::bigint     AS qte_retours,
        AVG(cp.unit_pri)                AS pri,
        SUM(cp.ordered_revenue) FILTER (WHERE cp.channel='retail')    AS ca_retail,
        SUM(cp.ordered_revenue) FILTER (WHERE cp.channel='digital')   AS ca_digital,
        SUM(cp.ordered_revenue) FILTER (WHERE cp.channel='wholesale') AS ca_wholesale
      FROM channel_performance cp
      JOIN products p ON p.id = cp.product_id
      LEFT JOIN collections c ON c.id = p.collection_id
      WHERE 1=1${clause}
      GROUP BY p.id, c.name, c.code
      ORDER BY (SUM(cp.ordered_revenue) - SUM(cp.returns_amount) - SUM(cp.purchase_cost)) DESC
    `, params);
    const rows = r.rows.map((p) => {
      const ca = Number(p.ca_commande || 0);
      const retours = Number(p.retours || 0);
      const cost = Number(p.cout_achat || 0);
      const caNet = ca - retours;
      const marge = caNet - cost;
      return {
        id: p.id, reference: p.reference, name: p.name, status: p.status,
        collection_name: p.collection_name, collection_code: p.collection_code,
        qte_commandee: Number(p.qte_commandee || 0),
        ca_commande: ca, ca_net: caNet, cout_achat: cost, retours,
        pri: p.pri != null ? Number(Number(p.pri).toFixed(2)) : null,
        marge_brute: marge,
        marge_pct: caNet > 0 ? Number(((marge / caNet) * 100).toFixed(1)) : null,
        taux_retour: Number(p.qte_commandee) > 0
          ? Number(((Number(p.qte_retours) / Number(p.qte_commandee)) * 100).toFixed(1)) : 0,
        mix: {
          retail: Number(p.ca_retail || 0),
          digital: Number(p.ca_digital || 0),
          wholesale: Number(p.ca_wholesale || 0),
        },
      };
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/analytics/commercial/collections — P&L par collection
router.get('/commercial/collections', async (req, res) => {
  try {
    const { clause, params } = orgFilter(req);
    const r = await query(`
      SELECT
        c.id, c.code, c.name, c.season, c.year,
        SUM(cp.ordered_revenue)  AS ca_commande,
        SUM(cp.purchase_cost)    AS cout_achat,
        SUM(cp.returns_amount)   AS retours,
        SUM(cp.ordered_qty)::bigint AS qte_commandee,
        SUM(cp.returns_qty)::bigint AS qte_retours
      FROM channel_performance cp
      JOIN products p ON p.id = cp.product_id
      JOIN collections c ON c.id = p.collection_id
      WHERE 1=1${clause}
      GROUP BY c.id
      ORDER BY SUM(cp.ordered_revenue) DESC
    `, params);
    const rows = r.rows.map((c) => {
      const ca = Number(c.ca_commande || 0);
      const retours = Number(c.retours || 0);
      const cost = Number(c.cout_achat || 0);
      const caNet = ca - retours;
      const marge = caNet - cost;
      return {
        id: c.id, code: c.code, name: c.name, season: c.season, year: c.year,
        ca_commande: ca, ca_net: caNet, cout_achat: cost, retours, marge_brute: marge,
        marge_pct: caNet > 0 ? Number(((marge / caNet) * 100).toFixed(1)) : null,
        taux_retour: Number(c.qte_commandee) > 0
          ? Number(((Number(c.qte_retours) / Number(c.qte_commandee)) * 100).toFixed(1)) : 0,
      };
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/analytics/commercial/funnel — funnel digital agrégé
router.get('/commercial/funnel', async (req, res) => {
  try {
    const { clause, params } = orgFilter(req);
    const r = await query(`
      SELECT
        SUM(cp.impressions)::bigint   AS impressions,
        SUM(cp.product_views)::bigint AS product_views,
        SUM(cp.cart_adds)::bigint     AS cart_adds,
        SUM(cp.ordered_qty)::bigint   AS purchases,
        SUM(cp.returns_qty)::bigint   AS returns
      FROM channel_performance cp
      JOIN products p ON p.id = cp.product_id
      WHERE cp.channel = 'digital'${clause}
    `, params);
    const f = r.rows[0];
    const impressions = Number(f.impressions || 0);
    const views = Number(f.product_views || 0);
    const cartAdds = Number(f.cart_adds || 0);
    const purchases = Number(f.purchases || 0);
    const returns = Number(f.returns || 0);
    const pct = (a, b) => (b > 0 ? Number(((a / b) * 100).toFixed(1)) : 0);
    res.json({
      steps: [
        { key: 'impressions', label: 'Impressions', value: impressions, rate: 100 },
        { key: 'views',       label: 'Vues fiche',  value: views,     rate: pct(views, impressions) },
        { key: 'cart_adds',   label: 'Ajouts panier', value: cartAdds, rate: pct(cartAdds, views) },
        { key: 'purchases',   label: 'Achats',      value: purchases, rate: pct(purchases, cartAdds) },
      ],
      returns,
      return_rate: pct(returns, purchases),
      global_conversion: pct(purchases, impressions),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
