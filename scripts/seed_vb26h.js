/**
 * Seed fiches techniques — Collection VB Hiver 2026
 * Source : docs/conception/2-Product Specification
 * Produits : DOMPAY, JERRY, BELL, LAUREN, HALISSON
 */

require('dotenv').config()
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_URL?.includes('render.com')
    ? { rejectUnauthorized: false } : false,
})
const q = (text, params) => pool.query(text, params)

async function upsertSupplier(data) {
  const { rows: [existing] } = await q('SELECT id FROM suppliers WHERE code = $1', [data.code])
  if (existing) return existing.id
  const { rows: [s] } = await q(`
    INSERT INTO suppliers (code, name, country, city, contact_name, contact_email, lead_time_days, is_active, currency)
    VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8) RETURNING id
  `, [data.code, data.name, data.country, data.city, data.contact_name || null, data.contact_email || null, data.lead_time_days || 60, 'EUR'])
  console.log(`  ✓ Fournisseur ${data.name}`)
  return s.id
}

async function upsertMaterial(data, supplierId, orgId) {
  const { rows: [existing] } = await q('SELECT id FROM materials WHERE code = $1', [data.code])
  if (existing) return existing.id
  const { rows: [m] } = await q(`
    INSERT INTO materials (code, name, type, composition, width_cm, weight_gsm, color_reference, color_name,
      unit, price_per_unit, currency, supplier_id, supplier_ref, lead_time_days, is_validated, organization_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'EUR',$11,$12,$13,false,$14) RETURNING id
  `, [data.code, data.name, data.type, data.composition||null, data.width_cm||null, data.weight_gsm||null,
      data.color_reference||null, data.color_name||null, data.unit||'ml', data.price_per_unit||0,
      supplierId, data.supplier_ref||null, data.lead_time_days||60, orgId])
  return m.id
}

async function seed() {
  console.log('\n🌱 Seed VB Hiver 2026...\n')

  // ── Admin & org ────────────────────────────────────────────
  const { rows: [admin] } = await q('SELECT id FROM users LIMIT 1')
  if (!admin) throw new Error('Aucun utilisateur. Lancer migrate.js d\'abord.')
  const adminId = admin.id

  const { rows: [org] } = await q(`SELECT id FROM organizations LIMIT 1`)
  const orgId = org?.id ?? null

  // ── Fournisseurs ──────────────────────────────────────────
  console.log('Fournisseurs...')
  const blueDimoId = await upsertSupplier({
    code: 'BLU-DIM', name: 'BLUE DIMO', country: 'France', city: 'Paris',
    contact_name: null, lead_time_days: 45,
  })
  const evFashionId = await upsertSupplier({
    code: 'EV-FASH', name: 'EV FASHION', country: 'France', city: 'Paris',
    contact_name: null, lead_time_days: 45,
  })

  // ── Matières ──────────────────────────────────────────────
  console.log('\nMatières...')
  const veloursMilId = await upsertMaterial({
    code: 'MAT-VEL-MIL', name: 'Velours Milleraies', type: 'tissu',
    composition: '100% CO', unit: 'ml', supplier_ref: 'VELOURS MILLERAIES',
  }, blueDimoId, orgId)

  const voileFacId = await upsertMaterial({
    code: 'MAT-VOI-FAC', name: 'Voile Façonné', type: 'tissu',
    composition: '55% CO 45% VI', width_cm: 130, weight_gsm: 82,
    unit: 'ml', supplier_ref: 'VOILE FACONNE',
  }, evFashionId, orgId)

  const thermocollId = await upsertMaterial({
    code: 'MAT-THERM', name: 'Thermocollant', type: 'fourniture',
    unit: 'ml',
  }, blueDimoId, orgId)

  const doublureCOId = await upsertMaterial({
    code: 'MAT-DOUB-CO', name: 'Doublure 100% CO', type: 'doublure',
    composition: '100% CO', unit: 'ml',
  }, blueDimoId, orgId)

  const elasticId = await upsertMaterial({
    code: 'MAT-ELAS-1CM', name: 'Elastic Tape 1cm', type: 'fourniture',
    unit: 'ml',
  }, evFashionId, orgId)

  const lightFusId = await upsertMaterial({
    code: 'MAT-LIGHT-FUS', name: 'Light Fusible', type: 'fourniture',
    unit: 'ml',
  }, evFashionId, orgId)

  console.log('  ✓ 6 matières')

  // ── Collection ────────────────────────────────────────────
  console.log('\nCollection...')
  let collectionId
  const { rows: [existingColl] } = await q('SELECT id FROM collections WHERE code = $1', ['VB-26H'])
  if (existingColl) {
    collectionId = existingColl.id
    console.log('  - Collection VB-26H existante')
  } else {
    const { rows: [coll] } = await q(`
      INSERT INTO collections (code, name, season, year, status, target_refs, description, delivery_date, created_by, organization_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id
    `, ['VB-26H', 'Vibrations — Hiver 2026', '26H', 2026, 'en_cours', 60,
        'Collection Hiver 2026 — Marque SOLUNE. Prêt-à-porter féminin.',
        '2026-07-01', adminId, orgId])
    collectionId = coll.id
    console.log('  ✓ Collection VB-26H créée')
  }

  // ── Produits ──────────────────────────────────────────────
  const PRODUCTS = [
    {
      reference: '0HVA39-V04010',
      name: 'DOMPAY',
      theme: '6HVA71',
      type: 'bas',
      status: 'proto',
      supplier_id: blueDimoId,
      proto_size: '36',
      coloris: 'TONE ON TONE',
      notes: 'Modéliste: RECONDUIT. Fournisseur: BLUE DIMO.',
      bom: [],
    },
    {
      reference: '0HVA39-V04846',
      name: 'JERRY',
      theme: '0HVA39',
      type: 'bas',
      status: 'proto',
      supplier_id: blueDimoId,
      proto_size: '34',
      coloris: '566 BORDEAUX / 888 NAVY',
      notes: 'Modéliste: SC. Fournisseur: BLUE DIMO.',
      bom: [
        { material_id: veloursMilId, usage_type: 'matiere_principale', quantity: 1.5, unit: 'ml' },
        { material_id: thermocollId, usage_type: 'fourniture', quantity: 0.3, unit: 'ml' },
        { material_id: doublureCOId, usage_type: 'doublure', quantity: 1.2, unit: 'ml' },
      ],
    },
    {
      reference: '1EVA32-V09413',
      name: 'BELL',
      theme: '1EVA32',
      type: 'haut',
      status: 'proto',
      supplier_id: evFashionId,
      proto_size: 'M/L',
      coloris: 'TONE ON TONE / 001 BLANC',
      notes: 'Modéliste: RECONDUIT. Fournisseur: EV FASHION.',
      bom: [
        { material_id: voileFacId, usage_type: 'matiere_principale', quantity: 2.0, unit: 'ml' },
        { material_id: lightFusId, usage_type: 'fourniture', quantity: 0.3, unit: 'ml' },
        { material_id: elasticId, usage_type: 'fourniture', quantity: 0.5, unit: 'ml' },
      ],
    },
    {
      reference: '1EVA69-V04844',
      name: 'LAUREN',
      theme: '1EVA69',
      type: 'haut',
      status: 'concept',
      supplier_id: null,
      proto_size: '36',
      coloris: 'TONE ON TONE',
      notes: 'Saison 26H. Fournisseur à confirmer.',
      bom: [],
    },
    {
      reference: '1EVA94-V09928',
      name: 'HALISSON',
      theme: '1EVA94',
      type: 'haut',
      status: 'concept',
      supplier_id: null,
      proto_size: 'S',
      coloris: 'TONE ON TONE',
      notes: 'Saison 26H. Fournisseur à confirmer.',
      bom: [],
    },
  ]

  console.log('\nProduits...')
  for (const p of PRODUCTS) {
    // Vérifier si déjà existant
    const { rows: [existing] } = await q('SELECT id FROM products WHERE reference = $1', [p.reference])
    let productId

    if (existing) {
      productId = existing.id
      console.log(`  - Produit ${p.reference} (${p.name}) existe déjà`)
    } else {
      const { rows: [product] } = await q(`
        INSERT INTO products (reference, name, type, collection_id, status, gender,
          description, main_supplier_id, created_by, organization_id)
        VALUES ($1,$2,$3,$4,$5,'femme',$6,$7,$8,$9) RETURNING id
      `, [p.reference, p.name, p.type, collectionId, p.status,
          `${p.name} — Thème ${p.theme} — Proto ${p.proto_size} — ${p.coloris}. ${p.notes}`,
          p.supplier_id, adminId, orgId])
      productId = product.id
      console.log(`  ✓ Produit ${p.reference} (${p.name})`)

      // BOM
      for (const b of p.bom) {
        await q(`
          INSERT INTO product_bom (product_id, material_id, usage_type, quantity, unit, waste_factor)
          VALUES ($1,$2,$3,$4,$5,0.05)
        `, [productId, b.material_id, b.usage_type, b.quantity, b.unit])
      }
      if (p.bom.length) console.log(`    ✓ ${p.bom.length} composant(s) BOM`)

      // Variante de base
      await q(`
        INSERT INTO product_variants (product_id, sku, color_name, size_system)
        VALUES ($1,$2,$3,'FR')
        ON CONFLICT (sku) DO NOTHING
      `, [productId, `${p.reference}-V1`, p.coloris.split('/')[0].trim()])
      console.log(`    ✓ Variante de base`)
    }
  }

  await pool.end()
  console.log('\n✅ Seed VB-26H terminé !')
  console.log('   Collection : Vibrations — Hiver 2026')
  console.log('   Produits   : DOMPAY, JERRY, BELL, LAUREN, HALISSON')
  console.log('   Connexion  : admin@plm-fashion.com / Admin1234!')
}

seed().catch(err => { console.error('❌', err.message); process.exit(1) })
