/**
 * Seed base de connaissance retours clients (données de démo)
 * Patterns de retours agrégés exploités pour recommander à la conception.
 */
require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_URL?.includes('render.com')
    ? { rejectUnauthorized: false } : false,
})
const q = (text, params) => pool.query(text, params)

const INSIGHTS = [
  // ── Pantalons ────────────────────────────────────────────────
  { scope_type: 'pret_a_porter', family: 'Pantalons', sub_family: null,
    attribute: 'Tour de hanches', reason: 'Taille trop juste aux hanches (grading insuffisant 40-44)',
    return_rate: 34.5, sample_size: 1820, severity: 'critical',
    recommendation: 'Élargir le tour de hanches de +2 cm sur les tailles 40 à 44. 68% des retours de cette sous-famille citent un ajustement hanches trop serré.' },
  { scope_type: 'pret_a_porter', family: 'Pantalons', sub_family: null,
    attribute: 'Longueur entrejambe', reason: 'Longueur perçue trop courte',
    return_rate: 18.2, sample_size: 1820, severity: 'warning',
    recommendation: 'Prévoir +1,5 cm d\'entrejambe ou proposer une déclinaison "long". 41% des retours longueur concernent les tailles ≥ 40.' },
  { scope_type: 'pret_a_porter', family: 'Pantalons', sub_family: 'Pantalon taille haute',
    attribute: 'Tour de taille', reason: 'Bâillement à la taille dans le dos',
    return_rate: 22.7, sample_size: 640, severity: 'warning',
    recommendation: 'Ajouter une légère cintrure dos ou un élastique de propreté. Le bâillement taille génère 1 retour sur 4 sur ce modèle.' },

  // ── Robes ────────────────────────────────────────────────────
  { scope_type: 'pret_a_porter', family: 'Robes', sub_family: null,
    attribute: 'Tour de poitrine', reason: 'Poitrine trop ajustée (bonnets > C)',
    return_rate: 27.9, sample_size: 2140, severity: 'critical',
    recommendation: 'Revoir l\'aisance poitrine (+1,5 cm) ou ajouter des pinces. La poitrine est la 1ʳᵉ cause de retour sur les robes ajustées.' },
  { scope_type: 'pret_a_porter', family: 'Robes', sub_family: 'Robe longue',
    attribute: 'Longueur totale', reason: 'Longueur inadaptée aux petites tailles',
    return_rate: 15.4, sample_size: 910, severity: 'info',
    recommendation: 'Mentionner clairement la longueur (fiche + visuel porté). Envisager une version "petite". 33% des retours viennent des tailles 34-36.' },

  // ── Vestes / Manteaux ────────────────────────────────────────
  { scope_type: 'pret_a_porter', family: 'Vestes', sub_family: null,
    attribute: 'Carrure épaules', reason: 'Épaules trop étroites, gêne aux emmanchures',
    return_rate: 24.1, sample_size: 1180, severity: 'warning',
    recommendation: 'Élargir la carrure de +1 cm et vérifier le tour d\'emmanchure. Les épaules concentrent 54% des retours ajustement sur les vestes structurées.' },
  { scope_type: 'pret_a_porter', family: 'Vestes', sub_family: null,
    attribute: 'Longueur de manche', reason: 'Manches trop longues',
    return_rate: 12.8, sample_size: 1180, severity: 'info',
    recommendation: 'Raccourcir la manche de 1 cm ou border un revers ajustable. Retours plus fréquents sur les tailles 34-38.' },

  // ── Maille ───────────────────────────────────────────────────
  { scope_type: 'pret_a_porter', family: 'Maille', sub_family: null,
    attribute: 'Stabilité dimensionnelle', reason: 'Rétrécissement / déformation au lavage',
    return_rate: 29.6, sample_size: 1450, severity: 'critical',
    recommendation: 'Exiger un test de rétrécissement < 3% et valider l\'entretien fournisseur. La tenue au lavage est la 1ʳᵉ cause de retour maille.' },
  { scope_type: 'pret_a_porter', family: 'Maille', sub_family: null,
    attribute: 'Boulochage', reason: 'Boulochage rapide de la matière',
    return_rate: 14.3, sample_size: 1450, severity: 'warning',
    recommendation: 'Privilégier un fil peigné / titrage supérieur. Demander un test martindale au fournisseur avant validation.' },

  // ── Chaussures / Maroquinerie ────────────────────────────────
  { scope_type: 'maroquinerie', family: null, sub_family: null,
    attribute: 'Tenue des coutures', reason: 'Coutures qui lâchent sur les anses',
    return_rate: 9.7, sample_size: 520, severity: 'warning',
    recommendation: 'Renforcer les points d\'ancrage des anses (rivets + surpiqûre). Contrôle qualité renforcé sur les 100 premières pièces.' },

  // ── Transverse (tous PAP) ────────────────────────────────────
  { scope_type: 'pret_a_porter', family: null, sub_family: null,
    attribute: 'Cohérence du guide des tailles', reason: 'Écart entre taille commandée et taille réelle',
    return_rate: 21.0, sample_size: 8600, severity: 'warning',
    recommendation: 'Aligner le grading sur le guide des tailles maison et l\'afficher sur la fiche produit. Le mauvais choix de taille = ~40% des retours toutes familles.' },
  { scope_type: 'pret_a_porter', family: null, sub_family: null,
    attribute: 'Conformité couleur', reason: 'Couleur reçue différente du visuel',
    return_rate: 8.4, sample_size: 8600, severity: 'info',
    recommendation: 'Valider un bon à tirer couleur (BAT) et calibrer les visuels e-commerce. Écart couleur = 1 retour sur 12.' },
]

async function seed() {
  console.log('\n🌱 Seed base de connaissance retours...\n')

  const { rows: [org] } = await q('SELECT id FROM organizations LIMIT 1').catch(() => ({ rows: [] }))
  const orgId = org?.id ?? null

  // On repart propre pour éviter les doublons à chaque exécution
  await q('DELETE FROM return_insights')

  for (const i of INSIGHTS) {
    await q(`
      INSERT INTO return_insights
        (scope_type, family, sub_family, attribute, reason, return_rate, sample_size, severity, recommendation, organization_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `, [i.scope_type, i.family, i.sub_family, i.attribute, i.reason,
        i.return_rate, i.sample_size, i.severity, i.recommendation, orgId])
    console.log(`  ✓ ${i.attribute} — ${i.family ?? i.scope_type} (${i.return_rate}%)`)
  }

  await pool.end()
  console.log(`\n✅ Seed retours terminé ! ${INSIGHTS.length} insights chargés.`)
}

seed().catch(err => { console.error('❌', err.message); process.exit(1) })
