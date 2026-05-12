const router = require('express').Router();
const Anthropic = require('@anthropic-ai/sdk');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, convertInchesToTwip,
} = require('docx');
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Initialisation paresseuse : évite un crash au démarrage si la clé est absente
function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY non configurée');
  return new Anthropic({ apiKey: key });
}

// ── helpers ──────────────────────────────────────────────────

async function fetchProductData(productId) {
  const [product, bom, variants, costing] = await Promise.all([
    query(`
      SELECT p.*, c.name AS collection_name, c.season, c.year,
        s.name AS supplier_name
      FROM products p
      LEFT JOIN collections c ON c.id = p.collection_id
      LEFT JOIN suppliers s ON s.id = p.main_supplier_id
      WHERE p.id = $1`, [productId]),
    query(`
      SELECT pb.quantity, pb.unit, pb.usage_type,
        m.name AS material_name, m.type AS material_type, m.composition,
        m.color_reference, s.name AS supplier_name
      FROM product_bom pb
      JOIN materials m ON m.id = pb.material_id
      LEFT JOIN suppliers s ON s.id = m.supplier_id
      WHERE pb.product_id = $1`, [productId]),
    query(`SELECT DISTINCT color_name, color_ref, size, size_system
           FROM product_variants WHERE product_id = $1
           ORDER BY color_name, size`, [productId]),
    query(`SELECT * FROM product_costings WHERE product_id = $1 AND is_current = true`, [productId]),
  ]);
  if (!product.rows.length) return null;
  return {
    ...product.rows[0],
    bom: bom.rows,
    variants: variants.rows,
    costing: costing.rows[0] ?? null,
  };
}

function buildJsonLd(p) {
  const colors = [...new Set((p.variants ?? []).map((v) => v.color_name).filter(Boolean))];
  const sizes  = [...new Set((p.variants ?? []).map((v) => v.size).filter(Boolean))];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.reference,
    description: p.description ?? undefined,
    brand: { '@type': 'Brand', name: 'PLM Fashion' },
    material: (p.bom ?? []).map((b) => b.material_name).join(', ') || undefined,
    color: colors.join(', ') || undefined,
    size: sizes.join(', ') || undefined,
    offers: p.costing?.retail_price ? {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: parseFloat(p.costing.retail_price).toFixed(2),
      availability: 'https://schema.org/InStock',
    } : undefined,
  };
  Object.keys(ld).forEach((k) => ld[k] === undefined && delete ld[k]);
  return ld;
}

function buildPrompt(p) {
  const typeLabel = { pret_a_porter: 'prêt-à-porter', maroquinerie: 'maroquinerie', accessoire: 'accessoire' }[p.type] ?? p.type;
  const materialsLines = (p.bom ?? []).map((m) => {
    const parts = [m.material_name];
    if (m.usage_type) parts.push(`(${m.usage_type})`);
    if (m.composition) parts.push(`— ${m.composition}`);
    if (m.supplier_name) parts.push(`[${m.supplier_name}]`);
    return parts.join(' ');
  }).join('\n  ');
  const colors = [...new Set((p.variants ?? []).map((v) => v.color_name).filter(Boolean))].join(', ');
  const sizes  = [...new Set((p.variants ?? []).map((v) => v.size).filter(Boolean))].join(', ');
  const retail = p.costing?.retail_price ? `${parseFloat(p.costing.retail_price).toFixed(2)} €` : p.target_retail_price ? `${parseFloat(p.target_retail_price).toFixed(2)} € (cible)` : 'non renseigné';
  const wholesale = p.costing?.wholesale_price ? `${parseFloat(p.costing.wholesale_price).toFixed(2)} €` : 'non renseigné';

  return `Tu es expert en rédaction mode haut de gamme, SEO et GEO (Generative Engine Optimization).

## Fiche produit
Référence : ${p.reference}
Nom : ${p.name}
Catégorie : ${typeLabel}
Genre : ${p.gender ?? '—'}
Famille : ${p.family ?? '—'}${p.sub_family ? ` / ${p.sub_family}` : ''}
Collection : ${p.collection_name ? `${p.collection_name}${p.season ? ` ${p.season}` : ''}${p.year ? ` ${p.year}` : ''}` : '—'}
${p.description ? `Description interne : ${p.description}` : ''}
${p.style_notes ? `Notes de style : ${p.style_notes}` : ''}
Matières :
  ${materialsLines || '—'}
Coloris : ${colors || '—'}
Tailles : ${sizes || '—'}
Prix public : ${retail}
Prix grossiste : ${wholesale}

## Consignes

Génère exactement ce JSON (sans markdown autour, sans commentaire) :
{
  "wholesale_title": "titre court et professionnel pour fiche acheteur (max 80 chars)",
  "wholesale_body": "texte wholesale en markdown : 2-3 paragraphes, ton B2B, met en avant construction, matières, positionnement. Sections : ## Description technique, ## Composition & matières, ## Points forts acheteur",
  "seo_title_fr": "titre SEO FR max 60 chars, mot-clé principal en tête, marque en fin si possible",
  "meta_desc_fr": "meta description FR 140-155 chars, incitative, mot-clé inclus, appel à l'action",
  "description_fr": "description e-commerce FR en HTML simple (h2, p, ul/li uniquement) : accroche émotionnelle, description style, matières/qualité, conseils port. 200-280 mots.",
  "keywords_fr": ["8 à 10 mots-clés FR pertinents pour la pièce, mixant génériques et spécifiques"],
  "faq_fr": [
    {"q": "question naturelle qu'un client FR poserait (style vocal/recherche)", "a": "réponse factuelle et complète, 2-3 phrases"},
    {"q": "...", "a": "..."},
    {"q": "...", "a": "..."},
    {"q": "...", "a": "..."}
  ],
  "seo_title_en": "SEO title EN max 60 chars",
  "meta_desc_en": "meta description EN 140-155 chars",
  "description_en": "e-commerce description EN in simple HTML (h2, p, ul/li) : 200-280 words, same structure as FR",
  "keywords_en": ["8 to 10 relevant EN keywords"],
  "faq_en": [
    {"q": "natural question an EN-speaking customer would ask", "a": "factual complete answer, 2-3 sentences"},
    {"q": "...", "a": "..."},
    {"q": "...", "a": "..."},
    {"q": "...", "a": "..."}
  ]
}`;
}

// ── GET /api/fiches/:productId ────────────────────────────────

router.get('/:productId', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM product_fiches WHERE product_id = $1 AND is_current = true`,
      [req.params.productId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Aucune fiche générée' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/fiches/:productId/generate ─────────────────────

router.post('/:productId/generate', async (req, res) => {
  try {
    const p = await fetchProductData(req.params.productId);
    if (!p) return res.status(404).json({ error: 'Produit introuvable' });

    const message = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: buildPrompt(p) }],
    });

    const rawText = message.content[0].text.trim();
    let parsed;
    try {
      const m = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : rawText);
    } catch {
      return res.status(500).json({ error: 'Réponse IA non parseable', raw: rawText });
    }

    const jsonLd = buildJsonLd(p);

    // Archive version précédente
    await query(
      `UPDATE product_fiches SET is_current = false WHERE product_id = $1`,
      [req.params.productId]
    );
    const vRes = await query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next FROM product_fiches WHERE product_id = $1`,
      [req.params.productId]
    );

    const saved = await query(`
      INSERT INTO product_fiches (
        product_id, version, is_current,
        wholesale_title, wholesale_body,
        seo_title_fr, meta_desc_fr, description_fr, keywords_fr, faq_fr,
        seo_title_en, meta_desc_en, description_en, keywords_en, faq_en,
        json_ld, generated_by
      ) VALUES ($1,$2,true,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        req.params.productId, vRes.rows[0].next,
        parsed.wholesale_title ?? null,
        parsed.wholesale_body ?? null,
        parsed.seo_title_fr ?? null,
        parsed.meta_desc_fr ?? null,
        parsed.description_fr ?? null,
        parsed.keywords_fr ?? null,
        JSON.stringify(parsed.faq_fr ?? []),
        parsed.seo_title_en ?? null,
        parsed.meta_desc_en ?? null,
        parsed.description_en ?? null,
        parsed.keywords_en ?? null,
        JSON.stringify(parsed.faq_en ?? []),
        JSON.stringify(jsonLd),
        req.user.id,
      ]
    );

    res.status(201).json(saved.rows[0]);
  } catch (err) {
    console.error('Fiche generate error:', err?.message ?? err);
    if (err.message?.includes('ANTHROPIC_API_KEY')) {
      return res.status(503).json({ error: 'Clé API Anthropic non configurée sur le serveur (variable ANTHROPIC_API_KEY manquante)' });
    }
    if (err.status === 401) return res.status(503).json({ error: 'Clé API Anthropic invalide ou expirée' });
    if (err.status === 429) return res.status(503).json({ error: 'Quota API Anthropic dépassé' });
    if (err.code === '42P01') return res.status(500).json({ error: 'Table product_fiches absente — relancer la migration' });
    res.status(500).json({ error: err.message ?? 'Erreur interne lors de la génération' });
  }
});

// ── PATCH /api/fiches/:productId ─────────────────────────────

router.patch('/:productId', async (req, res) => {
  try {
    const allowed = [
      'wholesale_title','wholesale_body',
      'seo_title_fr','meta_desc_fr','description_fr','keywords_fr','faq_fr',
      'seo_title_en','meta_desc_en','description_en','keywords_en','faq_en',
    ];
    const sets = [];
    const vals = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        vals.push(key === 'faq_fr' || key === 'faq_en' ? JSON.stringify(req.body[key]) : req.body[key]);
        sets.push(`${key} = $${vals.length}`);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    vals.push(req.user.id, req.params.productId);
    const result = await query(
      `UPDATE product_fiches SET ${sets.join(', ')}, updated_by = $${vals.length - 1}, updated_at = NOW()
       WHERE product_id = $${vals.length} AND is_current = true
       RETURNING *`,
      vals
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Fiche introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/fiches/:productId/export/:type ───────────────────
// type = wholesale | ecommerce

router.get('/:productId/export/:type', async (req, res) => {
  try {
    const p = await fetchProductData(req.params.productId);
    if (!p) return res.status(404).json({ error: 'Produit introuvable' });

    const ficheRes = await query(
      `SELECT * FROM product_fiches WHERE product_id = $1 AND is_current = true`,
      [req.params.productId]
    );
    if (!ficheRes.rows.length) return res.status(404).json({ error: 'Fiche non générée' });
    const fiche = ficheRes.rows[0];

    const colors = [...new Set((p.variants ?? []).map((v) => v.color_name).filter(Boolean))];
    const sizes  = [...new Set((p.variants ?? []).map((v) => v.size).filter(Boolean))];
    const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    let doc;
    let filename;

    if (req.params.type === 'wholesale') {
      filename = `${p.reference}_wholesale.docx`;
      doc = buildWholesaleDoc(p, fiche, colors, sizes, dateStr);
    } else {
      filename = `${p.reference}_ecommerce.docx`;
      doc = buildEcommerceDoc(p, fiche, dateStr);
    }

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Export docx error:', err);
    res.status(500).json({ error: 'Erreur génération .docx' });
  }
});

// ── docx builders ─────────────────────────────────────────────

function h(text, level = HeadingLevel.HEADING_2) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}

function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, ...opts })],
    spacing: { after: 120 },
  });
}

function label(text) {
  return new TextRun({ text, bold: true, size: 22 });
}

function kv(key, value) {
  return new Paragraph({
    children: [label(`${key} : `), new TextRun({ text: value ?? '—', size: 22 })],
    spacing: { after: 80 },
  });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'b8860b' } },
    spacing: { before: 200, after: 200 },
    children: [],
  });
}

function chip(text) {
  return new Paragraph({
    children: [new TextRun({ text: `  ${text}  `, size: 20, color: '5c4a1e' })],
    shading: { type: ShadingType.SOLID, fill: 'f5e6c8' },
    spacing: { after: 60 },
  });
}

function markdownToParagraphs(md) {
  if (!md) return [];
  return md.split('\n').map((line) => {
    if (line.startsWith('## ')) {
      return new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
    }
    if (line.startsWith('### ')) {
      return new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 } });
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return new Paragraph({
        text: line.slice(2),
        bullet: { level: 0 },
        spacing: { after: 60 },
      });
    }
    if (!line.trim()) return new Paragraph({ children: [], spacing: { after: 60 } });
    return para(line);
  });
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '\n- $1')
    .replace(/<ul[^>]*>|<\/ul>/gi, '')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .trim();
}

function buildWholesaleDoc(p, fiche, colors, sizes, dateStr) {
  const costing = p.costing;
  const children = [
    new Paragraph({
      text: 'FICHE TECHNIQUE WHOLESALE',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: fiche.wholesale_title ?? p.name, bold: true, size: 32, color: 'b8860b' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Réf. ${p.reference}`, size: 22, color: '888888' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    p.collection_name ? new Paragraph({
      children: [new TextRun({ text: `${p.collection_name}${p.season ? ` · ${p.season}` : ''}${p.year ? ` ${p.year}` : ''}`, size: 22, color: '888888' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }) : new Paragraph({ children: [], spacing: { after: 300 } }),

    divider(),

    ...markdownToParagraphs(fiche.wholesale_body),

    divider(),
    h('Composition & matières', HeadingLevel.HEADING_2),
    ...(p.bom ?? []).map((b) => new Paragraph({
      children: [
        label(`${b.material_name} `),
        new TextRun({ text: b.usage_type ? `(${b.usage_type})` : '', size: 22, color: '666666' }),
        b.composition ? new TextRun({ text: ` — ${b.composition}`, size: 22, italics: true, color: '555555' }) : new TextRun(''),
      ],
      bullet: { level: 0 },
      spacing: { after: 80 },
    })),

    ...(colors.length ? [
      h('Coloris disponibles', HeadingLevel.HEADING_2),
      ...colors.map(chip),
    ] : []),

    ...(sizes.length ? [
      h('Tailles disponibles', HeadingLevel.HEADING_2),
      ...sizes.map(chip),
    ] : []),

    divider(),
    h('Tarification', HeadingLevel.HEADING_2),
    kv('Prix public conseillé (TTC)', costing?.retail_price ? `${parseFloat(costing.retail_price).toFixed(2)} €` : p.target_retail_price ? `${parseFloat(p.target_retail_price).toFixed(2)} € (cible)` : '—'),
    kv('Prix de vente grossiste', costing?.wholesale_price ? `${parseFloat(costing.wholesale_price).toFixed(2)} €` : '—'),
    kv('Coefficient', costing?.coefficient ? `×${parseFloat(costing.coefficient).toFixed(2)}` : '—'),
    kv('Marge brute', costing?.gross_margin_pct ? `${parseFloat(costing.gross_margin_pct).toFixed(1)} %` : '—'),

    divider(),
    new Paragraph({
      children: [new TextRun({ text: `Document généré le ${dateStr}`, size: 18, color: 'aaaaaa', italics: true })],
      alignment: AlignmentType.RIGHT,
    }),
  ];

  return new Document({
    sections: [{
      properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) } } },
      children,
    }],
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22, color: '0f0e0c' } } },
    },
  });
}

function buildEcommerceDoc(p, fiche, dateStr) {
  const faqFr = Array.isArray(fiche.faq_fr) ? fiche.faq_fr : (typeof fiche.faq_fr === 'string' ? JSON.parse(fiche.faq_fr) : []);
  const faqEn = Array.isArray(fiche.faq_en) ? fiche.faq_en : (typeof fiche.faq_en === 'string' ? JSON.parse(fiche.faq_en) : []);
  const kwFr = Array.isArray(fiche.keywords_fr) ? fiche.keywords_fr : [];
  const kwEn = Array.isArray(fiche.keywords_en) ? fiche.keywords_en : [];

  const children = [
    new Paragraph({
      text: 'FICHE E-COMMERCE — SEO / GEO',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: p.name, bold: true, size: 32, color: 'b8860b' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Réf. ${p.reference}`, size: 22, color: '888888' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),

    // ── VERSION FR ──────────────────────────────────────────
    new Paragraph({ text: '🇫🇷  VERSION FRANÇAISE', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),

    h('Titre SEO', HeadingLevel.HEADING_2),
    new Paragraph({
      children: [
        new TextRun({ text: fiche.seo_title_fr ?? '—', size: 24, bold: true }),
        new TextRun({ text: `  (${(fiche.seo_title_fr ?? '').length}/60 car.)`, size: 20, color: '888888' }),
      ],
      spacing: { after: 120 },
    }),

    h('Meta description', HeadingLevel.HEADING_2),
    new Paragraph({
      children: [
        new TextRun({ text: fiche.meta_desc_fr ?? '—', size: 22, italics: true }),
        new TextRun({ text: `  (${(fiche.meta_desc_fr ?? '').length}/155 car.)`, size: 20, color: '888888' }),
      ],
      spacing: { after: 120 },
    }),

    h('Mots-clés', HeadingLevel.HEADING_2),
    para(kwFr.join(' · ') || '—'),

    h('Description produit', HeadingLevel.HEADING_2),
    ...markdownToParagraphs(stripHtml(fiche.description_fr)),

    h('FAQ — Optimisation GEO', HeadingLevel.HEADING_2),
    ...faqFr.flatMap((item) => [
      new Paragraph({ children: [new TextRun({ text: `Q : ${item.q}`, bold: true, size: 22 })], spacing: { before: 120, after: 40 } }),
      new Paragraph({ children: [new TextRun({ text: `R : ${item.a}`, size: 22, color: '333333' })], spacing: { after: 140 } }),
    ]),

    divider(),

    // ── VERSION EN ──────────────────────────────────────────
    new Paragraph({ text: '🇬🇧  ENGLISH VERSION', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),

    h('SEO Title', HeadingLevel.HEADING_2),
    new Paragraph({
      children: [
        new TextRun({ text: fiche.seo_title_en ?? '—', size: 24, bold: true }),
        new TextRun({ text: `  (${(fiche.seo_title_en ?? '').length}/60 chars)`, size: 20, color: '888888' }),
      ],
      spacing: { after: 120 },
    }),

    h('Meta description', HeadingLevel.HEADING_2),
    new Paragraph({
      children: [
        new TextRun({ text: fiche.meta_desc_en ?? '—', size: 22, italics: true }),
        new TextRun({ text: `  (${(fiche.meta_desc_en ?? '').length}/155 chars)`, size: 20, color: '888888' }),
      ],
      spacing: { after: 120 },
    }),

    h('Keywords', HeadingLevel.HEADING_2),
    para(kwEn.join(' · ') || '—'),

    h('Product description', HeadingLevel.HEADING_2),
    ...markdownToParagraphs(stripHtml(fiche.description_en)),

    h('FAQ — GEO Optimization', HeadingLevel.HEADING_2),
    ...faqEn.flatMap((item) => [
      new Paragraph({ children: [new TextRun({ text: `Q: ${item.q}`, bold: true, size: 22 })], spacing: { before: 120, after: 40 } }),
      new Paragraph({ children: [new TextRun({ text: `A: ${item.a}`, size: 22, color: '333333' })], spacing: { after: 140 } }),
    ]),

    divider(),

    // ── JSON-LD ──────────────────────────────────────────────
    new Paragraph({ text: 'Données structurées — JSON-LD (schema.org/Product)', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
    new Paragraph({
      children: [new TextRun({
        text: JSON.stringify(typeof fiche.json_ld === 'string' ? JSON.parse(fiche.json_ld) : fiche.json_ld, null, 2),
        size: 18, font: 'Courier New', color: '333333',
      })],
      spacing: { after: 200 },
    }),

    divider(),
    new Paragraph({
      children: [new TextRun({ text: `Document généré le ${dateStr}`, size: 18, color: 'aaaaaa', italics: true })],
      alignment: AlignmentType.RIGHT,
    }),
  ];

  return new Document({
    sections: [{
      properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) } } },
      children,
    }],
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22, color: '0f0e0c' } } },
    },
  });
}

module.exports = router;
