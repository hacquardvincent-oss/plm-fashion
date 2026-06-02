/**
 * Seed bons de commande — PLM Fashion
 * Crée 4 BCs d'exemple avec lignes, statuts variés et réceptions partielles
 * Usage : node scripts/seed_purchases.js
 */

require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
  client_encoding: 'UTF8',
})
const q = (text, params) => pool.query(text, params)

async function seed() {
  console.log('🌱 Seed bons de commande...\n')

  try {
    // Récupérer l'admin
    const { rows: [admin] } = await q(`SELECT id FROM users LIMIT 1`)
    if (!admin) throw new Error('Aucun utilisateur trouvé. Lancer migrate.js d\'abord.')
    const adminId = admin.id

    // Récupérer ou créer les fournisseurs
    const suppliers = {}

    for (const s of [
      { code: 'HGT-CN', name: 'HONGTEX', country: 'Chine', city: 'Guangzhou', contact_name: 'Wei Zhang', contact_email: 'production@hongtex.cn', lead_time_days: 90 },
      { code: 'ITA-BI', name: 'Italtex SRL', country: 'Italie', city: 'Biella', contact_name: 'Marco Rossi', contact_email: 'm.rossi@italtex.it', lead_time_days: 45 },
      { code: 'FRN-LY', name: 'Tissus Gillet', country: 'France', city: 'Lyon', contact_name: 'Claire Gillet', contact_email: 'contact@gillet-tissus.fr', lead_time_days: 21 },
    ]) {
      const { rows: [existing] } = await q(`SELECT id FROM suppliers WHERE code = $1`, [s.code])
      if (existing) {
        suppliers[s.code] = existing.id
      } else {
        const { rows: [created] } = await q(`
          INSERT INTO suppliers (code, name, country, city, contact_name, contact_email, lead_time_days, is_active)
          VALUES ($1,$2,$3,$4,$5,$6,$7,true) RETURNING id
        `, [s.code, s.name, s.country, s.city, s.contact_name, s.contact_email, s.lead_time_days])
        suppliers[s.code] = created.id
      }
      console.log(`✓ Fournisseur ${s.name}`)
    }

    // Récupérer la collection existante si possible
    const { rows: [collection] } = await q(`SELECT id FROM collections LIMIT 1`)
    const collectionId = collection?.id ?? null

    // Récupérer matières existantes
    const { rows: mats } = await q(`SELECT id, name, unit FROM materials LIMIT 6`)

    // ─── BC 1 — Reçu et validé (HONGTEX, tissus collection) ───────────
    const { rows: [bc1] } = await q(`
      INSERT INTO purchase_orders
        (reference, supplier_id, collection_id, status, order_date, expected_delivery, actual_delivery,
         carrier, tracking_number, notes, created_by)
      VALUES ($1,$2,$3,'validated', NOW()-'90 days'::interval, NOW()-'30 days'::interval, NOW()-'28 days'::interval,
              'DHL Express', 'DHL-8821047CN', 'Commande tissus collection Vibrations 25H — priorité haute.', $4)
      ON CONFLICT DO NOTHING RETURNING id
    `, ['BC-2025-0001', suppliers['HGT-CN'], collectionId, adminId])

    if (bc1) {
      const lines1 = [
        { designation: 'Satin Lourd 100% PL', coloris: 'Rose 441', qty_ordered: 180, qty_received: 180, unit: 'ml', unit_price: 4.80, quality: 'ok', mat_id: mats[0]?.id ?? null },
        { designation: 'Viscose Satinée 100% VI', coloris: 'Rose 441', qty_ordered: 95, qty_received: 95, unit: 'ml', unit_price: 3.20, quality: 'ok', mat_id: mats[1]?.id ?? null },
        { designation: 'Crêpe Georgette 100% Soie', coloris: 'Multicolore floral', qty_ordered: 120, qty_received: 118, unit: 'ml', unit_price: 22.00, quality: 'analysis', mat_id: mats[2]?.id ?? null },
        { designation: 'Fermeture Invisible 16cm', coloris: 'Assorti', qty_ordered: 250, qty_received: 250, unit: 'pce', unit_price: 0.45, quality: 'ok', mat_id: mats[3]?.id ?? null },
      ]
      for (const l of lines1) {
        await q(`
          INSERT INTO purchase_order_lines
            (order_id, material_id, designation, coloris, quantity_ordered, quantity_received, unit, unit_price, quality_status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `, [bc1.id, l.mat_id, l.designation, l.coloris, l.qty_ordered, l.qty_received, l.unit, l.unit_price, l.quality])
      }
      console.log(`✓ BC-2025-0001 (validé) — ${lines1.length} lignes`)
    }

    // ─── BC 2 — Partiellement reçu (Italtex, lainages) ────────────────
    const { rows: [bc2] } = await q(`
      INSERT INTO purchase_orders
        (reference, supplier_id, collection_id, status, order_date, expected_delivery,
         carrier, tracking_number, notes, created_by)
      VALUES ($1,$2,$3,'partially_received', NOW()-'45 days'::interval, NOW()-'5 days'::interval,
              'Geodis', 'GEO-IT-20251104', 'Lainages et doublures — 2ème livraison partielle attendue semaine prochaine.', $4)
      ON CONFLICT DO NOTHING RETURNING id
    `, ['BC-2025-0002', suppliers['ITA-BI'], collectionId, adminId])

    if (bc2) {
      const lines2 = [
        { designation: 'Lainage Bouclé 60% Laine 40% PL', coloris: 'Camel 220', qty_ordered: 80, qty_received: 55, unit: 'ml', unit_price: 18.50, quality: 'ok' },
        { designation: 'Flanelle 100% Laine Vierge', coloris: 'Anthracite 890', qty_ordered: 60, qty_received: 60, unit: 'ml', unit_price: 24.00, quality: 'ok' },
        { designation: 'Doublure Acétate', coloris: 'Noir 000', qty_ordered: 140, qty_received: 0, unit: 'ml', unit_price: 5.20, quality: 'pending' },
        { designation: 'Boutons Corne Naturelle Ø 22mm', coloris: 'Naturel', qty_ordered: 400, qty_received: 400, unit: 'pce', unit_price: 1.20, quality: 'ok' },
      ]
      for (const l of lines2) {
        await q(`
          INSERT INTO purchase_order_lines
            (order_id, designation, coloris, quantity_ordered, quantity_received, unit, unit_price, quality_status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [bc2.id, l.designation, l.coloris, l.qty_ordered, l.qty_received, l.unit, l.unit_price, l.quality])
      }
      console.log(`✓ BC-2025-0002 (partiellement reçu) — ${lines2.length} lignes`)
    }

    // ─── BC 3 — En production / expédié (HONGTEX, confection) ─────────
    const { rows: [bc3] } = await q(`
      INSERT INTO purchase_orders
        (reference, supplier_id, collection_id, status, order_date, expected_delivery,
         carrier, notes, created_by)
      VALUES ($1,$2,$3,'shipped', NOW()-'60 days'::interval, NOW()+'10 days'::interval,
              'MSC Container Lines', 'Confection robes EURIA et ESIL — 450 pièces. Chargement confirmé semaine 44.', $4)
      ON CONFLICT DO NOTHING RETURNING id
    `, ['BC-2025-0003', suppliers['HGT-CN'], collectionId, adminId])

    if (bc3) {
      const lines3 = [
        { designation: 'Confection robe EURIA — Satin Lourd', coloris: 'Rose 441', qty_ordered: 240, qty_received: 0, unit: 'pce', unit_price: 28.50, quality: 'pending' },
        { designation: 'Confection robe ESIL — Crêpe Soie', coloris: 'Multicolore Floral', qty_ordered: 180, qty_received: 0, unit: 'pce', unit_price: 42.00, quality: 'pending' },
        { designation: 'Emballage polybag + cintre', coloris: 'Transparent', qty_ordered: 420, qty_received: 0, unit: 'pce', unit_price: 0.35, quality: 'pending' },
      ]
      for (const l of lines3) {
        await q(`
          INSERT INTO purchase_order_lines
            (order_id, designation, coloris, quantity_ordered, quantity_received, unit, unit_price, quality_status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [bc3.id, l.designation, l.coloris, l.qty_ordered, l.qty_received, l.unit, l.unit_price, l.quality])
      }
      console.log(`✓ BC-2025-0003 (expédié) — ${lines3.length} lignes`)
    }

    // ─── BC 4 — En retard / confirmé (Tissus Gillet, accessoires) ─────
    const { rows: [bc4] } = await q(`
      INSERT INTO purchase_orders
        (reference, supplier_id, collection_id, status, order_date, expected_delivery,
         notes, created_by)
      VALUES ($1,$2,$3,'confirmed', NOW()-'20 days'::interval, NOW()-'3 days'::interval,
              'Commande urgente accessoires finishing. Livraison initialement prévue il y a 3 jours — relancer le fournisseur.', $4)
      ON CONFLICT DO NOTHING RETURNING id
    `, ['BC-2025-0004', suppliers['FRN-LY'], collectionId, adminId])

    if (bc4) {
      const lines4 = [
        { designation: 'Étiquettes Composition FR/EN/DE', coloris: 'Blanc', qty_ordered: 2000, qty_received: 0, unit: 'pce', unit_price: 0.08, quality: 'pending' },
        { designation: 'Étiquettes Marque Tissées', coloris: 'Noir / Or', qty_ordered: 2000, qty_received: 0, unit: 'pce', unit_price: 0.22, quality: 'pending' },
        { designation: 'Ruban Gros-Grain Logo', coloris: 'Noir', qty_ordered: 500, qty_received: 0, unit: 'ml', unit_price: 1.10, quality: 'pending' },
        { designation: 'Anneaux Laiton Doré Ø 20mm', coloris: 'Or', qty_ordered: 300, qty_received: 0, unit: 'pce', unit_price: 0.65, quality: 'pending' },
      ]
      for (const l of lines4) {
        await q(`
          INSERT INTO purchase_order_lines
            (order_id, designation, coloris, quantity_ordered, quantity_received, unit, unit_price, quality_status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [bc4.id, l.designation, l.coloris, l.qty_ordered, l.qty_received, l.unit, l.unit_price, l.quality])
      }
      console.log(`✓ BC-2025-0004 (confirmé / en retard) — ${lines4.length} lignes`)
    }

    console.log('\n✅ Seed achats terminé !')
    console.log('   BC-2025-0001 : Validé — HONGTEX (tissus)')
    console.log('   BC-2025-0002 : Partiellement reçu — Italtex (lainages)')
    console.log('   BC-2025-0003 : Expédié — HONGTEX (confection)')
    console.log('   BC-2025-0004 : En retard — Tissus Gillet (accessoires)')

  } catch (err) {
    console.error('\n❌ Erreur :', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

seed()
