const router = require('express').Router();
const Anthropic = require('@anthropic-ai/sdk');
const { query } = require('../../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

const client = new Anthropic();

// POST /api/ai/products/:id/generate-description
router.post('/products/:id/generate-description', async (req, res) => {
  try {
    const [product, bom, variants] = await Promise.all([
      query(`
        SELECT p.*, c.name AS collection_name, c.season, c.year,
          s.name AS supplier_name,
          pc.retail_price, pc.wholesale_price, pc.materials_cost
        FROM products p
        LEFT JOIN collections c ON c.id = p.collection_id
        LEFT JOIN suppliers s ON s.id = p.main_supplier_id
        LEFT JOIN product_costings pc ON pc.product_id = p.id AND pc.is_current = true
        WHERE p.id = $1`, [req.params.id]),
      query(`
        SELECT pb.quantity, pb.unit, pb.usage_type,
          m.name AS material_name, m.type AS material_type, m.composition,
          m.color_reference, s.name AS supplier_name
        FROM product_bom pb
        JOIN materials m ON m.id = pb.material_id
        LEFT JOIN suppliers s ON s.id = m.supplier_id
        WHERE pb.product_id = $1`, [req.params.id]),
      query(`SELECT DISTINCT color_name, color_ref FROM product_variants WHERE product_id = $1`, [req.params.id]),
    ]);

    if (!product.rows.length) return res.status(404).json({ error: 'Produit introuvable' });

    const p = product.rows[0];
    const materials = bom.rows;
    const colors = variants.rows;

    const typeLabel = { pret_a_porter: 'prêt-à-porter', maroquinerie: 'maroquinerie', accessoire: 'accessoire' }[p.type] ?? p.type;

    const materialsDesc = materials.length
      ? materials.map(m => {
          const parts = [`${m.material_name} (${m.usage_type ?? m.material_type})`];
          if (m.composition) parts.push(`composition : ${m.composition}`);
          if (m.supplier_name) parts.push(`fournisseur : ${m.supplier_name}`);
          return parts.join(', ');
        }).join('\n- ')
      : 'non renseignées';

    const colorsDesc = colors.length
      ? colors.map(c => c.color_name + (c.color_ref ? ` (${c.color_ref})` : '')).join(', ')
      : 'non renseignées';

    const priceInfo = p.retail_price
      ? `Prix public : ${parseFloat(p.retail_price).toFixed(2)} €, prix grossiste : ${parseFloat(p.wholesale_price || 0).toFixed(2)} €`
      : p.target_retail_price
        ? `Prix public cible : ${parseFloat(p.target_retail_price).toFixed(2)} €`
        : '';

    const prompt = `Tu es expert en communication pour une maison de mode française haut de gamme.
Génère deux descriptions professionnelles pour le produit suivant.

## Fiche produit
- Référence : ${p.reference}
- Nom : ${p.name}
- Catégorie : ${typeLabel}
- Genre : ${p.gender ?? 'non précisé'}
- Famille : ${p.family ?? '—'}${p.sub_family ? ` / ${p.sub_family}` : ''}
- Collection : ${p.collection_name ? `${p.collection_name} (${p.season ?? ''} ${p.year ?? ''})` : 'non précisée'}
${p.description ? `- Description interne : ${p.description}` : ''}
${p.style_notes ? `- Notes de style : ${p.style_notes}` : ''}
- Matières :
  - ${materialsDesc}
- Coloris disponibles : ${colorsDesc}
${priceInfo ? `- ${priceInfo}` : ''}

## Instructions

Rédige EXACTEMENT ce format JSON (sans markdown, sans commentaire) :
{
  "wholesale": "<description showroom B2B, 80-120 mots, ton professionnel, met en valeur les matières, la construction et le positionnement de la pièce, vocabulaire technique mode>",
  "ecommerce": "<description e-commerce B2C, 100-140 mots, ton inspirant et lifestyle, met en avant le style, l'usage, les détails sensoriels, donne envie d'acheter>"
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content[0].text.trim();

    let parsed;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      return res.status(500).json({ error: 'Réponse IA non parseable', raw: rawText });
    }

    if (!parsed.wholesale || !parsed.ecommerce) {
      return res.status(500).json({ error: 'Format de réponse IA invalide', raw: rawText });
    }

    res.json({ wholesale: parsed.wholesale, ecommerce: parsed.ecommerce });
  } catch (err) {
    console.error('AI generate-description error:', err);
    if (err.status === 401) return res.status(503).json({ error: 'Clé API Anthropic invalide ou manquante' });
    if (err.status === 429) return res.status(503).json({ error: 'Quota API Anthropic dépassé' });
    res.status(500).json({ error: 'Erreur lors de la génération IA' });
  }
});

module.exports = router;
