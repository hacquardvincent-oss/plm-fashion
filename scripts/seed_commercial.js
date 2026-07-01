/**
 * Seed performance commerciale (données de démo)
 * Génère, par produit × canal (retail / digital / wholesale) :
 *   - sell-in (qté commandée, CA commandé, qté livrée)
 *   - coût total achat + PRI unitaire
 *   - retours (qté + montant)
 *   - funnel digital (impressions, vues, ajouts panier)
 *
 * Données pseudo-aléatoires mais DÉTERMINISTES (seed = référence produit),
 * donc ré-exécutable sans divergence.
 */
require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_URL?.includes('render.com')
    ? { rejectUnauthorized: false } : false,
})
const q = (text, params) => pool.query(text, params)

// PRNG déterministe (mulberry32 seedé par chaîne)
function makeRng(seedStr) {
  let h = 2166136261
  for (const c of String(seedStr)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) }
  return () => {
    h += 0x6D2B79F5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const between = (rng, a, b) => a + (b - a) * rng()
const iBetween = (rng, a, b) => Math.round(between(rng, a, b))

// Poids de volume selon le statut produit (les validés vendent, les concepts non)
const STATUS_VOLUME = {
  valide: 1, sms: 0.7, proto_2: 0.4, proto_1: 0.25,
  en_developpement: 0.15, concept: 0, abandonne: 0, archive: 0.5,
}

async function seed() {
  console.log('\n🌱 Seed performance commerciale...\n')

  const { rows: products } = await q(`
    SELECT p.id, p.reference, p.status,
      p.target_retail_price, p.target_cost,
      pc.total_cost AS costing_cost, pc.retail_price AS costing_retail
    FROM products p
    LEFT JOIN product_costings pc ON pc.product_id = p.id AND pc.is_current = true
  `)
  if (!products.length) { console.log('Aucun produit. Lancer seed d\'abord.'); await pool.end(); return }

  const { rows: [org] } = await q('SELECT id FROM organizations LIMIT 1').catch(() => ({ rows: [] }))
  const orgId = org?.id ?? null

  let inserted = 0
  for (const p of products) {
    const rng = makeRng(p.reference)
    const volumeFactor = STATUS_VOLUME[p.status] ?? 0.2
    if (volumeFactor === 0) continue

    // Prix & coûts de base
    const retail = Number(p.costing_retail || p.target_retail_price || iBetween(rng, 90, 320))
    const pri = Number(p.costing_cost || p.target_cost || (retail * between(rng, 0.28, 0.42)))
    const wholesalePrice = retail * between(rng, 0.46, 0.52) // prix de gros ~ 48% du retail

    // Volume total commandé sur la saison
    const baseVolume = iBetween(rng, 400, 2200) * volumeFactor

    // Répartition canal (part de volume) — varie légèrement par produit
    const retailShare = between(rng, 0.38, 0.50)
    const digitalShare = between(rng, 0.24, 0.34)
    const wholesaleShare = Math.max(0.10, 1 - retailShare - digitalShare)

    const channels = [
      { channel: 'retail',    qty: Math.round(baseVolume * retailShare),    price: retail,         returnRate: between(rng, 0.06, 0.12) },
      { channel: 'digital',   qty: Math.round(baseVolume * digitalShare),   price: retail,         returnRate: between(rng, 0.22, 0.36) },
      { channel: 'wholesale', qty: Math.round(baseVolume * wholesaleShare), price: wholesalePrice, returnRate: between(rng, 0.02, 0.06) },
    ]

    for (const ch of channels) {
      if (ch.qty <= 0) continue
      const orderedRevenue = +(ch.qty * ch.price).toFixed(2)
      const shippedQty = Math.round(ch.qty * between(rng, 0.9, 0.99))
      const purchaseCost = +(ch.qty * pri).toFixed(2)
      const returnsQty = Math.round(shippedQty * ch.returnRate)
      const returnsAmount = +(returnsQty * ch.price).toFixed(2)

      // Funnel digital uniquement
      let impressions = null, views = null, cartAdds = null
      if (ch.channel === 'digital') {
        const purchases = ch.qty
        cartAdds = Math.round(purchases / between(rng, 0.16, 0.26))       // conv panier→achat ~16-26%
        views = Math.round(cartAdds / between(rng, 0.10, 0.18))            // conv vue→panier ~10-18%
        impressions = Math.round(views / between(rng, 0.03, 0.07))        // CTR ~3-7%
      }

      await q(`
        INSERT INTO channel_performance
          (product_id, channel, period, ordered_qty, ordered_revenue, shipped_qty,
           purchase_cost, unit_pri, returns_qty, returns_amount,
           impressions, product_views, cart_adds, organization_id)
        VALUES ($1,$2,'S1',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (product_id, channel, period) DO UPDATE SET
          ordered_qty=EXCLUDED.ordered_qty, ordered_revenue=EXCLUDED.ordered_revenue,
          shipped_qty=EXCLUDED.shipped_qty, purchase_cost=EXCLUDED.purchase_cost,
          unit_pri=EXCLUDED.unit_pri, returns_qty=EXCLUDED.returns_qty,
          returns_amount=EXCLUDED.returns_amount, impressions=EXCLUDED.impressions,
          product_views=EXCLUDED.product_views, cart_adds=EXCLUDED.cart_adds
      `, [p.id, ch.channel, ch.qty, orderedRevenue, shippedQty, purchaseCost,
          +pri.toFixed(2), returnsQty, returnsAmount, impressions, views, cartAdds, orgId])
      inserted++
    }
    console.log(`  ✓ ${p.reference} — 3 canaux`)
  }

  await pool.end()
  console.log(`\n✅ Seed commercial terminé ! ${inserted} lignes canal générées.`)
}

seed().catch(err => { console.error('❌', err.message); process.exit(1) })
