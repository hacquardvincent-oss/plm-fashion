/**
 * Correctif encodage UTF-8 — PLM Fashion
 * Corrige les caractères spéciaux corrompus en base (◆ à la place des accents).
 * Stratégie : UPDATE ciblés avec les valeurs correctes en dur + tentative de
 * réparation automatique du mojibake (UTF-8 stocké comme LATIN-1).
 *
 * Usage : node scripts/fix_encoding.js
 */

require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
})

const q = (text, params) => pool.query(text, params)

// ─── Correctifs ciblés — valeurs connues ─────────────────────────────────────
// Fournisseurs créés via l'UI (pas couverts par le seed ON CONFLICT)
const SUPPLIER_PATCHES = [
  // Maroc
  { code: 'MAR-001', name: 'Atelier Fès Leather', city: 'Fès' },
  // Portugal
  { code: 'PORT-001', name: 'Confeçções Lisboa', city: 'Lisboa' },
]

// Champs texte susceptibles de contenir des caractères spéciaux
const TEXT_COLUMNS = {
  suppliers:  ['name', 'city', 'contact_name', 'notes', 'specialty'],
  materials:  ['name', 'composition', 'color_name', 'notes'],
  collections: ['name', 'description'],
  products:   ['name', 'style_notes'],
}

// ─── Tentative de réparation automatique du mojibake ─────────────────────────
// Si UTF-8 a été stocké comme LATIN-1 (double encodage), on peut souvent
// récupérer la valeur correcte en faisant l'opération inverse côté PostgreSQL.
async function tryAutoRepair() {
  console.log('\n🔧 Tentative de réparation automatique (mojibake LATIN-1 → UTF-8)...')
  let fixed = 0

  for (const [table, columns] of Object.entries(TEXT_COLUMNS)) {
    for (const col of columns) {
      // Vérifie que la colonne existe
      const { rows: cols } = await q(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
      `, [table, col])
      if (cols.length === 0) continue

      // Tente la conversion : interprète les bytes stockés comme LATIN-1 et les
      // réinterprète en UTF-8. Ne s'applique que si le résultat diffère.
      try {
        const { rows } = await q(`
          SELECT id, ${col} as val,
            convert_from(${col}::bytea, 'LATIN1') as repaired
          FROM ${table}
          WHERE ${col} IS NOT NULL
            AND ${col} != ''
            AND convert_from(${col}::bytea, 'LATIN1') != ${col}
            AND ${col} ~ '[\\xC0-\\xFF]'
          LIMIT 100
        `)

        for (const row of rows) {
          if (row.repaired && row.repaired !== row.val) {
            await q(`UPDATE ${table} SET ${col} = $1 WHERE id = $2`, [row.repaired, row.id])
            console.log(`  ✓ ${table}.${col} [${row.id.slice(0, 8)}] : "${row.val}" → "${row.repaired}"`)
            fixed++
          }
        }
      } catch (err) {
        // La conversion peut échouer si les bytes ne forment pas du LATIN-1 valide — c'est normal
      }
    }
  }

  return fixed
}

// ─── Correctifs ciblés ────────────────────────────────────────────────────────
async function applyTargetedPatches() {
  console.log('\n🎯 Application des correctifs ciblés fournisseurs...')
  let fixed = 0

  for (const patch of SUPPLIER_PATCHES) {
    // Vérifie que le fournisseur existe
    const { rows } = await q(`SELECT id, name, city FROM suppliers WHERE code = $1`, [patch.code])
    if (rows.length === 0) {
      console.log(`  ⚠️  Fournisseur ${patch.code} introuvable — ignoré`)
      continue
    }
    const supplier = rows[0]

    const updates = []
    const values = [patch.code]
    let i = 2

    if (patch.name && supplier.name !== patch.name) {
      updates.push(`name = $${i++}`)
      values.push(patch.name)
    }
    if (patch.city && supplier.city !== patch.city) {
      updates.push(`city = $${i++}`)
      values.push(patch.city)
    }

    if (updates.length > 0) {
      await q(`UPDATE suppliers SET ${updates.join(', ')} WHERE code = $1`, values)
      console.log(`  ✓ ${patch.code} : ${updates.join(', ')}`)
      fixed++
    } else {
      console.log(`  ✓ ${patch.code} : déjà correct`)
    }
  }

  return fixed
}

// ─── Re-seed des données connues ──────────────────────────────────────────────
// Pour les matières et collections issues du seed, force la réécriture
async function reseedKnownData() {
  console.log('\n🌱 Réécriture des données seed avec encodage correct...')
  let fixed = 0

  const knownMaterials = [
    { code: 'SL-1710BVW', name: 'Satin Lourd 100% PL', composition: '100% Polyester' },
    { code: 'VISA-NR-441', name: 'Viscose Satinée', composition: '100% Viscose' },
    { code: 'CREM-GS-MULT', name: 'Crêpe de Soie Georgette', composition: '100% Soie', notes: 'Tissu imprimé floral ESIL. Développement en cours.' },
    { code: 'ETQ-COMP-FR', name: 'Étiquette Composition', composition: 'Satin polyester', notes: 'Conforme directive 1007/2011/CE — mentions obligatoires FR/EN/DE.' },
    { code: 'ETQ-MARQ-VB', name: 'Étiquette Marque Tissée', composition: 'Polyester tissé' },
  ]

  for (const m of knownMaterials) {
    const { rows } = await q(`SELECT id FROM materials WHERE code = $1`, [m.code])
    if (rows.length === 0) continue
    const sets = ['name = $2', 'composition = $3']
    const vals = [m.code, m.name, m.composition]
    if (m.notes) { sets.push(`notes = $${vals.length + 1}`); vals.push(m.notes) }
    await q(`UPDATE materials SET ${sets.join(', ')} WHERE code = $1`, vals)
    console.log(`  ✓ Matière ${m.code} corrigée`)
    fixed++
  }

  return fixed
}

async function main() {
  console.log('🔤 Correctif encodage UTF-8 — PLM Fashion\n')

  // Force UTF-8 sur la connexion
  await q("SET client_encoding = 'UTF8'")
  console.log('✓ client_encoding = UTF8')

  try {
    let total = 0
    total += await applyTargetedPatches()
    total += await reseedKnownData()
    total += await tryAutoRepair()

    console.log(`\n✅ Correction terminée — ${total} entrée(s) corrigée(s)`)
    if (total === 0) {
      console.log('   ℹ️  Aucune donnée ne nécessitait de correction (ou données déjà correctes).')
    }
  } catch (err) {
    console.error('\n❌ Erreur :', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
