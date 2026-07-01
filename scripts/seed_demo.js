/**
 * Seed de démonstration global — remplit tous les modules
 * - Backfill organization_id sur l'existant (sinon masqué par le filtre multi-tenant)
 * - Fournisseurs enrichis + évaluations
 * - Bons de commande (achats) avec lignes et statuts variés
 * - Fiches techniques complètes (fiche, FCM, mesures/grading, prise de mesures,
 *   labelling, commentaires) pour les produits VB-26H
 *
 * Idempotent : ré-exécutable sans doublons.
 */
require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_URL?.includes('render.com')
    ? { rejectUnauthorized: false } : false,
})
const q = (text, params) => pool.query(text, params)

// Backfill sûr de organization_id (ignore si la colonne n'existe pas)
async function backfillOrg(table, orgId) {
  if (!orgId) return
  try {
    const r = await q(`UPDATE ${table} SET organization_id = $1 WHERE organization_id IS NULL`, [orgId])
    if (r.rowCount) console.log(`  ✓ ${table} : ${r.rowCount} ligne(s) rattachée(s) à l'org`)
  } catch (e) {
    if (!/column .* does not exist/.test(e.message)) console.log(`  - ${table}: ${e.message}`)
  }
}

async function upsertSupplier(s, orgId) {
  const { rows: [ex] } = await q('SELECT id FROM suppliers WHERE code = $1', [s.code])
  if (ex) {
    await q(`UPDATE suppliers SET name=$2, country=$3, city=$4, contact_name=$5, contact_email=$6,
             contact_phone=$7, payment_terms=$8, lead_time_days=$9, quality_score=$10,
             certifications=$11, specialties=$12, is_active=true, organization_id=COALESCE(organization_id,$13)
             WHERE code=$1`,
      [s.code, s.name, s.country, s.city, s.contact_name, s.contact_email, s.contact_phone,
       s.payment_terms, s.lead_time_days, s.quality_score, s.certifications, s.specialties, orgId])
    return ex.id
  }
  const { rows: [ins] } = await q(`
    INSERT INTO suppliers (code, name, country, city, contact_name, contact_email, contact_phone,
      currency, payment_terms, lead_time_days, quality_score, certifications, specialties, is_active, organization_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,'EUR',$8,$9,$10,$11,$12,true,$13) RETURNING id`,
    [s.code, s.name, s.country, s.city, s.contact_name, s.contact_email, s.contact_phone,
     s.payment_terms, s.lead_time_days, s.quality_score, s.certifications, s.specialties, orgId])
  console.log(`  ✓ Fournisseur ${s.name}`)
  return ins.id
}

// Construit une fiche technique complète depuis les attributs produit
function buildSpecSheet(p) {
  const [colorisRef, colorisNom] = (p.coloris || 'TONE ON TONE').split('/').map(s => s.trim())
  return {
    fiche_technique: {
      theme_code: p.theme, modele_code: p.reference, fabricant: p.fabricant,
      saison: 'Hiver 2026', annee: '2026', genre: 'Femme',
      categorie: p.categorie, pays_fabrication: p.pays || 'Portugal',
      matiere_principale: p.matiere, composition: p.composition,
      grammage_gsm: p.grammage || '', largeur_cm: p.largeur || '150',
      certification: 'OEKO-TEX Standard 100', norme_qualite: 'ISO 105 (solidité couleur)',
      ref_fournisseur_tissu: p.ref_tissu || '',
      coloris_ref: colorisRef, coloris_nom: colorisNom || colorisRef,
      entretien: ['Lavage main 30°C', 'Ne pas essorer', 'Séchage à plat', 'Repassage fer doux 130°C', 'Nettoyage à sec autorisé'],
    },
    fcm: p.fcm || [],
    mesures: {
      systeme_taille: 'FR', taille_base: '38',
      points_mesure: [
        { code: 'A', nom: 'Tour de poitrine' },
        { code: 'B', nom: 'Tour de taille' },
        { code: 'C', nom: 'Tour de hanches' },
        { code: 'D', nom: 'Longueur totale' },
      ],
      grading: {
        '36': { A: 82, B: 64, C: 88, D: p.longueur ? p.longueur - 2 : 96 },
        '38': { A: 86, B: 68, C: 92, D: p.longueur || 98 },
        '40': { A: 90, B: 72, C: 96, D: p.longueur ? p.longueur + 2 : 100 },
        '42': { A: 94, B: 76, C: 100, D: p.longueur ? p.longueur + 4 : 102 },
      },
      tolerances: { A: { plus: 1, minus: 1 }, B: { plus: 1, minus: 1 }, C: { plus: 1, minus: 1 }, D: { plus: 1.5, minus: 1.5 } },
    },
    prise_mesures: {
      notes: 'Mesures prises à plat, pièce non étirée. Vérifier la stabilité dimensionnelle après lavage.',
      instructions: [
        { code: 'A', description: 'Tour de poitrine : mesurer à 2 cm sous l\'emmanchure, d\'un bord à l\'autre, x2.' },
        { code: 'B', description: 'Tour de taille : au point le plus étroit, à plat, x2.' },
        { code: 'C', description: 'Tour de hanches : à 20 cm sous la taille, à plat, x2.' },
        { code: 'D', description: 'Longueur totale : du point d\'épaule au bas, parallèlement au droit-fil.' },
      ],
    },
    commentaires: [
      { id: '1', zone: 'Montage', proto: 'P1', statut: 'traite', auteur: 'Studio modélisme',
        commentaire: 'Reprendre l\'aplomb des emmanchures, léger tirage constaté sur le premier proto.', date: '2026-03-12' },
      { id: '2', zone: 'Finitions', proto: 'P1', statut: 'ouvert', auteur: 'Chef de produit',
        commentaire: 'Vérifier la tenue des surpiqûres après lavage, retour attendu du fournisseur.', date: '2026-03-20' },
    ],
    labelling: {
      notes: 'Positionnement des étiquettes conforme à la charte marque SOLUNE.',
      etiquettes: [
        { type: 'Marque', position: 'Centre dos, encolure', contenu: 'Logo tissé SOLUNE — fond noir, lettres or', obligatoire: true },
        { type: 'Composition', position: 'Couture latérale gauche', contenu: p.composition || '100% matière principale', obligatoire: true },
        { type: 'Taille', position: 'Sous étiquette composition', contenu: 'FR 36 / 38 / 40 / 42', obligatoire: true },
        { type: 'Entretien', position: 'Sous étiquette taille', contenu: 'Pictogrammes ISO', obligatoire: true },
        { type: 'Origine', position: 'Étiquette composition', contenu: `Fabriqué au ${p.pays || 'Portugal'}`, obligatoire: true },
        { type: 'Prix / EAN', position: 'Étiquette volante', contenu: 'EAN-13 + prix public TTC', obligatoire: false },
      ],
    },
    croquis: {
      description: `Croquis technique ${p.name} — thème ${p.theme}.`,
      notes: 'Vues face/dos à jour du dernier proto. Détails de montage annotés.',
      details: [
        { label: 'Encolure', description: 'Finition propre par parementure thermocollée.' },
        { label: 'Fermeture', description: 'Zip invisible côté gauche, longueur 22 cm.' },
      ],
    },
  }
}

const PRODUCTS_META = {
  DOMPAY:  { theme: '6HVA71', fabricant: 'BLUE DIMO', categorie: 'Pantalon', matiere: 'Velours Milleraies', composition: '100% CO', grammage: '320', largeur: '150', longueur: 104, coloris: 'TONE ON TONE', pays: 'Portugal',
    fcm: [
      { position: 1, designation: 'Tissu principal', matiere: 'Velours Milleraies 100% CO', ref: 'VEL-MIL', fournisseur: 'BLUE DIMO', quantite: '1.5', unite: 'ml', coloris: 'Tone on tone', commentaire: '' },
      { position: 2, designation: 'Doublure poches', matiere: 'Doublure 100% CO', ref: 'DOUB-CO', fournisseur: 'BLUE DIMO', quantite: '0.4', unite: 'ml', coloris: 'Écru', commentaire: '' },
      { position: 3, designation: 'Fermeture', matiere: 'Zip invisible 22cm', ref: 'ZIP-22', fournisseur: 'BLUE DIMO', quantite: '1', unite: 'pce', coloris: 'Assorti', commentaire: '' },
    ] },
  JERRY:   { theme: '0HVA39', fabricant: 'BLUE DIMO', categorie: 'Veste', matiere: 'Velours Milleraies', composition: '100% CO', grammage: '320', largeur: '150', longueur: 68, coloris: '566 BORDEAUX / 888 NAVY', pays: 'Portugal',
    fcm: [
      { position: 1, designation: 'Tissu principal', matiere: 'Velours Milleraies 100% CO', ref: 'VEL-MIL', fournisseur: 'BLUE DIMO', quantite: '1.5', unite: 'ml', coloris: '566 Bordeaux', commentaire: '' },
      { position: 2, designation: 'Thermocollant', matiere: 'Thermocollant', ref: 'THERM', fournisseur: 'BLUE DIMO', quantite: '0.3', unite: 'ml', coloris: 'Noir', commentaire: 'Cols et parementures' },
      { position: 3, designation: 'Doublure', matiere: 'Doublure 100% CO', ref: 'DOUB-CO', fournisseur: 'BLUE DIMO', quantite: '1.2', unite: 'ml', coloris: 'Assortie', commentaire: '' },
    ] },
  BELL:    { theme: '1EVA32', fabricant: 'EV FASHION', categorie: 'Blouse', matiere: 'Voile Façonné', composition: '55% CO 45% VI', grammage: '82', largeur: '130', longueur: 62, coloris: 'TONE ON TONE / 001 BLANC', pays: 'Portugal',
    fcm: [
      { position: 1, designation: 'Tissu principal', matiere: 'Voile Façonné 55CO/45VI', ref: 'VOI-FAC', fournisseur: 'EV FASHION', quantite: '2.0', unite: 'ml', coloris: '001 Blanc', commentaire: '' },
      { position: 2, designation: 'Fusible léger', matiere: 'Light Fusible', ref: 'LIGHT-FUS', fournisseur: 'EV FASHION', quantite: '0.3', unite: 'ml', coloris: 'Blanc', commentaire: '' },
      { position: 3, designation: 'Élastique', matiere: 'Elastic Tape 1cm', ref: 'ELAS-1CM', fournisseur: 'EV FASHION', quantite: '0.5', unite: 'ml', coloris: 'Blanc', commentaire: 'Poignets' },
    ] },
  LAUREN:  { theme: '1EVA69', fabricant: 'EV FASHION', categorie: 'Robe', matiere: 'Voile Façonné', composition: '55% CO 45% VI', grammage: '82', largeur: '130', longueur: 110, coloris: 'TONE ON TONE', pays: 'Portugal', fcm: [] },
  HALISSON:{ theme: '1EVA94', fabricant: 'EV FASHION', categorie: 'Robe', matiere: 'Voile Façonné', composition: '55% CO 45% VI', grammage: '82', largeur: '130', longueur: 96, coloris: 'TONE ON TONE', pays: 'Portugal', fcm: [] },
}

async function seed() {
  console.log('\n🌱 Seed de démonstration global...\n')

  const { rows: [admin] } = await q('SELECT id FROM users ORDER BY created_at LIMIT 1')
  if (!admin) throw new Error('Aucun utilisateur.')
  const adminId = admin.id
  const { rows: [org] } = await q('SELECT id FROM organizations LIMIT 1').catch(() => ({ rows: [] }))
  const orgId = org?.id ?? null
  console.log(orgId ? `Organisation : ${orgId}` : 'Pas d\'organisation (mono-tenant)')

  // 1. Backfill org sur l'existant (rend visibles les fournisseurs/achats déjà seedés)
  console.log('\n1. Rattachement des données existantes à l\'organisation...')
  for (const t of ['collections', 'products', 'materials', 'suppliers', 'purchase_orders']) {
    await backfillOrg(t, orgId)
  }

  // 2. Fournisseurs enrichis
  console.log('\n2. Fournisseurs...')
  const suppliers = {}
  suppliers.blueDimo = await upsertSupplier({
    code: 'BLU-DIM', name: 'BLUE DIMO', country: 'Portugal', city: 'Porto',
    contact_name: 'Sofia Marques', contact_email: 'sofia@bluedimo.pt', contact_phone: '+351 22 000 1122',
    payment_terms: '30 jours fin de mois', lead_time_days: 45, quality_score: 8.5,
    certifications: ['OEKO-TEX', 'GOTS'], specialties: ['Velours', 'Maille', 'Tailleur'],
  }, orgId)
  suppliers.evFashion = await upsertSupplier({
    code: 'EV-FASH', name: 'EV FASHION', country: 'Portugal', city: 'Guimarães',
    contact_name: 'Rui Almeida', contact_email: 'rui@evfashion.pt', contact_phone: '+351 25 300 4455',
    payment_terms: '45 jours', lead_time_days: 50, quality_score: 7.8,
    certifications: ['OEKO-TEX'], specialties: ['Voile', 'Chemiserie', 'Blouses'],
  }, orgId)
  suppliers.textileLyon = await upsertSupplier({
    code: 'TEX-LYON', name: 'Textile Lyonnais', country: 'France', city: 'Lyon',
    contact_name: 'Claire Fontaine', contact_email: 'claire@textile-lyon.fr', contact_phone: '+33 4 72 00 33 44',
    payment_terms: '30 jours', lead_time_days: 30, quality_score: 9.1,
    certifications: ['OEKO-TEX', 'GOTS', 'Made in France'], specialties: ['Soie', 'Jacquard', 'Impression'],
  }, orgId)
  suppliers.istanbulKnit = await upsertSupplier({
    code: 'IST-KNIT', name: 'Istanbul Knitwear', country: 'Turquie', city: 'Istanbul',
    contact_name: 'Emre Yilmaz', contact_email: 'emre@istanbulknit.com', contact_phone: '+90 212 000 6677',
    payment_terms: '50% acompte / 50% livraison', lead_time_days: 60, quality_score: 7.2,
    certifications: ['OEKO-TEX'], specialties: ['Maille', 'Pull', 'Cardigan'],
  }, orgId)
  suppliers.cuirParis = await upsertSupplier({
    code: 'CUIR-PAR', name: 'Maison du Cuir', country: 'France', city: 'Paris',
    contact_name: 'Antoine Rey', contact_email: 'antoine@maisonducuir.fr', contact_phone: '+33 1 42 00 88 99',
    payment_terms: '30 jours fin de mois', lead_time_days: 40, quality_score: 8.9,
    certifications: ['Leather Working Group'], specialties: ['Maroquinerie', 'Cuir pleine fleur', 'Petite maroquinerie'],
  }, orgId)

  // 3. Évaluations fournisseurs
  console.log('\n3. Évaluations fournisseurs...')
  await q('DELETE FROM supplier_evaluations')
  const EVALS = [
    { s: suppliers.blueDimo, score: 8.5, quality: 9, delay: 8, communication: 8.5, comment: 'Très bonne maîtrise du velours, quelques retards ponctuels en pleine saison.' },
    { s: suppliers.textileLyon, score: 9.1, quality: 9.5, delay: 9, communication: 9, comment: 'Partenaire premium, réactivité exemplaire. Coût plus élevé mais qualité constante.' },
    { s: suppliers.evFashion, score: 7.8, quality: 8, delay: 7, communication: 8, comment: 'Bon rapport qualité/prix sur la chemiserie. Suivi qualité à renforcer.' },
    { s: suppliers.istanbulKnit, score: 7.2, quality: 7.5, delay: 6.5, communication: 7, comment: 'Maille correcte, délais à surveiller. Prévoir marge sur le planning.' },
  ]
  for (const e of EVALS) {
    await q(`INSERT INTO supplier_evaluations (supplier_id, evaluated_by, score, quality, delay, communication, comment)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [e.s, adminId, e.score, e.quality, e.delay, e.communication, e.comment])
  }
  console.log(`  ✓ ${EVALS.length} évaluations`)

  // 4. Collection VB-26H
  const { rows: [coll] } = await q('SELECT id FROM collections WHERE code = $1', ['VB-26H'])
  const collId = coll?.id ?? null

  // 5. Bons de commande (achats)
  console.log('\n4. Bons de commande...')
  const { rows: products } = await q('SELECT id, reference, name FROM products')
  const byName = Object.fromEntries(products.map(p => [p.name, p]))
  const { rows: materials } = await q('SELECT id, code, name, price_per_unit FROM materials')
  const matByCode = Object.fromEntries(materials.map(m => [m.code, m]))

  const PO_DEFS = [
    { ref: 'BC-2026-001', supplier: suppliers.blueDimo, status: 'received', order_date: '2026-02-10', expected: '2026-03-27', carrier: 'DHL', tracking: 'DHL-4471209',
      lines: [
        { mat: 'MAT-VEL-MIL', product: 'JERRY', designation: 'Velours Milleraies — 566 Bordeaux', coloris: '566 Bordeaux', qty: 450, received: 450, unit: 'ml', price: 8.4, quality: 'ok' },
        { mat: 'MAT-DOUB-CO', product: 'JERRY', designation: 'Doublure 100% CO', coloris: 'Écru', qty: 360, received: 360, unit: 'ml', price: 2.1, quality: 'ok' },
      ] },
    { ref: 'BC-2026-002', supplier: suppliers.evFashion, status: 'shipped', order_date: '2026-03-05', expected: '2026-04-24', carrier: 'UPS', tracking: 'UPS-88123045',
      lines: [
        { mat: 'MAT-VOI-FAC', product: 'BELL', designation: 'Voile Façonné 55CO/45VI', coloris: '001 Blanc', qty: 600, received: 0, unit: 'ml', price: 6.9, quality: 'pending' },
        { mat: 'MAT-LIGHT-FUS', product: 'BELL', designation: 'Light Fusible', coloris: 'Blanc', qty: 120, received: 0, unit: 'ml', price: 1.4, quality: 'pending' },
      ] },
    { ref: 'BC-2026-003', supplier: suppliers.blueDimo, status: 'partially_received', order_date: '2026-03-18', expected: '2026-05-02', carrier: 'DHL', tracking: 'DHL-4490871',
      lines: [
        { mat: 'MAT-VEL-MIL', product: 'DOMPAY', designation: 'Velours Milleraies — Tone on tone', coloris: 'Tone on tone', qty: 500, received: 300, unit: 'ml', price: 8.4, quality: 'ok' },
        { mat: 'MAT-THERM', product: 'DOMPAY', designation: 'Thermocollant', coloris: 'Noir', qty: 150, received: 0, unit: 'ml', price: 1.2, quality: 'pending' },
      ] },
    { ref: 'BC-2026-004', supplier: suppliers.textileLyon, status: 'confirmed', order_date: '2026-04-02', expected: '2026-05-04', carrier: null, tracking: null,
      lines: [
        { mat: null, product: 'LAUREN', designation: 'Soie imprimée exclusive — développement', coloris: 'Tone on tone', qty: 380, received: 0, unit: 'ml', price: 22.5, quality: 'pending' },
      ] },
    { ref: 'BC-2026-005', supplier: suppliers.evFashion, status: 'draft', order_date: '2026-04-15', expected: '2026-06-01', carrier: null, tracking: null,
      lines: [
        { mat: 'MAT-VOI-FAC', product: 'HALISSON', designation: 'Voile Façonné — Tone on tone', coloris: 'Tone on tone', qty: 420, received: 0, unit: 'ml', price: 6.9, quality: 'pending' },
        { mat: 'MAT-ELAS-1CM', product: 'HALISSON', designation: 'Elastic Tape 1cm', coloris: 'Blanc', qty: 90, received: 0, unit: 'ml', price: 0.6, quality: 'pending' },
      ] },
  ]

  for (const po of PO_DEFS) {
    const { rows: [ex] } = await q('SELECT id FROM purchase_orders WHERE reference = $1', [po.ref])
    let poId
    if (ex) {
      poId = ex.id
      await q(`UPDATE purchase_orders SET supplier_id=$2, collection_id=$3, status=$4, order_date=$5,
               expected_delivery=$6, carrier=$7, tracking_number=$8, organization_id=COALESCE(organization_id,$9)
               WHERE id=$1`,
        [poId, po.supplier, collId, po.status, po.order_date, po.expected, po.carrier, po.tracking, orgId])
      await q('DELETE FROM purchase_order_lines WHERE order_id = $1', [poId])
    } else {
      const { rows: [ins] } = await q(`
        INSERT INTO purchase_orders (reference, supplier_id, collection_id, status, order_date,
          expected_delivery, carrier, tracking_number, created_by, organization_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [po.ref, po.supplier, collId, po.status, po.order_date, po.expected, po.carrier, po.tracking, adminId, orgId])
      poId = ins.id
    }
    for (const l of po.lines) {
      await q(`INSERT INTO purchase_order_lines (order_id, material_id, product_id, designation, coloris,
               quantity_ordered, quantity_received, unit, unit_price, quality_status)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [poId, l.mat ? matByCode[l.mat]?.id ?? null : null, byName[l.product]?.id ?? null,
         l.designation, l.coloris, l.qty, l.received, l.unit, l.price, l.quality])
    }
    console.log(`  ✓ ${po.ref} (${po.status}) — ${po.lines.length} ligne(s)`)
  }

  // 6. Fiches techniques complètes pour les produits VB-26H
  console.log('\n5. Fiches techniques...')
  for (const [name, meta] of Object.entries(PRODUCTS_META)) {
    const prod = byName[name]
    if (!prod) { console.log(`  - ${name} introuvable, ignoré`); continue }
    const sheet = buildSpecSheet({ ...meta, name, reference: prod.reference })
    const { rows: [ex] } = await q('SELECT id FROM product_spec_sheets WHERE product_id = $1 AND is_current = true', [prod.id])
    const S = {
      ft: JSON.stringify(sheet.fiche_technique), fcm: JSON.stringify(sheet.fcm),
      mes: JSON.stringify(sheet.mesures), pm: JSON.stringify(sheet.prise_mesures),
      com: JSON.stringify(sheet.commentaires), lab: JSON.stringify(sheet.labelling),
      cro: JSON.stringify(sheet.croquis),
    }
    if (ex) {
      await q(`UPDATE product_spec_sheets SET fiche_technique=$2, fcm=$3, mesures=$4, prise_mesures=$5,
               commentaires=$6, labelling=$7, croquis=$8, updated_by=$9, updated_at=NOW() WHERE id=$1`,
        [ex.id, S.ft, S.fcm, S.mes, S.pm, S.com, S.lab, S.cro, adminId])
    } else {
      await q(`INSERT INTO product_spec_sheets (product_id, version, is_current, fiche_technique, fcm,
               mesures, prise_mesures, commentaires, labelling, croquis, created_by, updated_by)
               VALUES ($1,1,true,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
        [prod.id, S.ft, S.fcm, S.mes, S.pm, S.com, S.lab, S.cro, adminId])
    }
    console.log(`  ✓ Fiche technique ${name}`)
  }

  await pool.end()
  console.log('\n✅ Seed de démonstration terminé !')
  console.log('   Fournisseurs, achats et fiches techniques sont désormais renseignés.')
}

seed().catch(err => { console.error('❌', err.message); process.exit(1) })
