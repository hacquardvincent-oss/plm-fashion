'use strict';

// ─────────────────────────────────────────────────────────────
//  VOCABULAIRE MATIÈRES
// ─────────────────────────────────────────────────────────────

const MATERIAL_VOCAB = {
  lin: {
    fr: { adj: 'naturel et respirant', qualities: 'légèreté, son tombé fluide et ses propriétés thermorégulatrices', care: 'Lavage à 30 °C, repassage vapeur recommandé.' },
    en: { adj: 'natural and breathable', qualities: 'lightweight feel, fluid drape and natural thermoregulation', care: 'Machine wash at 30 °C, steam iron recommended.' },
  },
  soie: {
    fr: { adj: 'précieux et soyeux', qualities: 'brillance naturelle, toucher incomparable et légèreté extrême', care: 'Lavage à la main ou pressing professionnel recommandé.' },
    en: { adj: 'precious and silky', qualities: 'natural sheen, unparalleled softness and featherlight weight', care: 'Hand wash or professional dry cleaning recommended.' },
  },
  coton: {
    fr: { adj: 'doux et résistant', qualities: 'confort au quotidien, facilité d\'entretien et durabilité', care: 'Lavage machine à 30 °C.' },
    en: { adj: 'soft and durable', qualities: 'everyday comfort, easy care and long-lasting wear', care: 'Machine wash at 30 °C.' },
  },
  laine: {
    fr: { adj: 'noble et chaud', qualities: 'régulation thermique naturelle, drapé structuré et tenue dans le temps', care: 'Lavage délicat 30 °C ou pressing. Séchage à plat.' },
    en: { adj: 'noble and warm', qualities: 'natural thermal regulation, structured drape and lasting shape', care: 'Delicate wash 30 °C or dry clean. Lay flat to dry.' },
  },
  cachemire: {
    fr: { adj: 'ultra-doux et luxueux', qualities: 'douceur exceptionnelle, légèreté et chaleur incomparables, symbole de raffinement', care: 'Lavage à la main à l\'eau froide ou pressing. Séchage à plat.' },
    en: { adj: 'ultra-soft and luxurious', qualities: 'exceptional softness, unmatched warmth and lightness, symbol of refinement', care: 'Hand wash in cold water or dry clean. Lay flat to dry.' },
  },
  cuir: {
    fr: { adj: 'noble et résistant', qualities: 'robustesse, patine avec le temps et caractère inimitable du cuir pleine fleur', care: 'Nourrissage régulier avec une crème adaptée. Éviter l\'humidité.' },
    en: { adj: 'noble and durable', qualities: 'strength, beautiful patina over time and the inimitable character of full-grain leather', care: 'Regular conditioning with appropriate cream. Avoid moisture.' },
  },
  'cuir suède': {
    fr: { adj: 'velouté et raffiné', qualities: 'toucher velouté, aspect mat sophistiqué et souplesse caractéristique du suède', care: 'Brossage régulier avec brosse spéciale suède. Imperméabilisant conseillé.' },
    en: { adj: 'velvety and refined', qualities: 'velvety touch, sophisticated matte finish and characteristic suppleness of suede', care: 'Regular brushing with suede brush. Waterproofing spray recommended.' },
  },
  polyester: {
    fr: { adj: 'technique et facile d\'entretien', qualities: 'résistance aux froissements, séchage rapide et stabilité dimensionnelle', care: 'Lavage machine 40 °C, séchage facile.' },
    en: { adj: 'technical and easy-care', qualities: 'wrinkle resistance, quick drying and dimensional stability', care: 'Machine wash 40 °C, easy drying.' },
  },
  viscose: {
    fr: { adj: 'fluide et doux', qualities: 'tombé soyeux, douceur sur la peau et légèreté agréable à porter', care: 'Lavage délicat 30 °C ou lavage à la main.' },
    en: { adj: 'fluid and soft', qualities: 'silky drape, gentle on skin and pleasant lightweight feel', care: 'Delicate wash 30 °C or hand wash.' },
  },
};

// ─────────────────────────────────────────────────────────────
//  TYPES PRODUIT — intitulés + contexte rédactionnel
// ─────────────────────────────────────────────────────────────

const TYPE_CONTEXT = {
  pret_a_porter: {
    fr: { label: 'vêtement', labelPlural: 'vêtements', verb: 'porte', article: 'ce', occasion: 'au quotidien comme pour les occasions habillées' },
    en: { label: 'garment', labelPlural: 'garments', verb: 'wear', article: 'this', occasion: 'for everyday wear and dressed-up occasions' },
  },
  maroquinerie: {
    fr: { label: 'pièce de maroquinerie', labelPlural: 'pièces de maroquinerie', verb: 'accompagne', article: 'cette', occasion: 'au quotidien comme en soirée' },
    en: { label: 'leather goods piece', labelPlural: 'leather goods', verb: 'accompanies', article: 'this', occasion: 'from everyday use to evening occasions' },
  },
  accessoire: {
    fr: { label: 'accessoire', labelPlural: 'accessoires', verb: 'complète', article: 'cet', occasion: 'pour sublimer chaque tenue' },
    en: { label: 'accessory', labelPlural: 'accessories', verb: 'completes', article: 'this', occasion: 'to elevate any look' },
  },
};

const FAMILY_LABELS = {
  veste: { fr: 'veste', en: 'jacket' },
  manteau: { fr: 'manteau', en: 'coat' },
  robe: { fr: 'robe', en: 'dress' },
  pantalon: { fr: 'pantalon', en: 'trousers' },
  jupe: { fr: 'jupe', en: 'skirt' },
  chemise: { fr: 'chemise', en: 'shirt' },
  top: { fr: 'top', en: 'top' },
  pull: { fr: 'pull', en: 'sweater' },
  sac: { fr: 'sac', en: 'bag' },
  pochette: { fr: 'pochette', en: 'clutch' },
  portefeuille: { fr: 'portefeuille', en: 'wallet' },
  ceinture: { fr: 'ceinture', en: 'belt' },
  'porte-monnaie': { fr: 'porte-monnaie', en: 'coin purse' },
};

const PRICE_TIER = {
  luxury: { fr: 'positionnement luxe', en: 'luxury positioning' },
  premium: { fr: 'positionnement premium', en: 'premium positioning' },
  mid: { fr: 'bon rapport qualité/prix', en: 'excellent value for quality' },
};

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

// Sélection déterministe : même produit = même formulation
function pick(arr, seed) {
  return arr[hashCode(String(seed)) % arr.length];
}

function getPriceTier(price) {
  if (!price) return 'mid';
  const p = parseFloat(price);
  if (p >= 600) return 'luxury';
  if (p >= 250) return 'premium';
  return 'mid';
}

function getMaterialVocab(materialName) {
  if (!materialName) return null;
  const name = materialName.toLowerCase();
  for (const [key, val] of Object.entries(MATERIAL_VOCAB)) {
    if (name.includes(key)) return val;
  }
  return null;
}

function getMainMaterial(bom) {
  if (!bom?.length) return null;
  // Priorité : tissu principal (usage_type = 'tissu_principal' ou premier item)
  const main = bom.find((b) => b.usage_type?.includes('principal')) ?? bom[0];
  return main ?? null;
}

function getFamilyLabel(family, lang) {
  if (!family) return null;
  const key = family.toLowerCase();
  for (const [k, v] of Object.entries(FAMILY_LABELS)) {
    if (key.includes(k)) return v[lang];
  }
  return family.toLowerCase();
}

function getColors(variants) {
  return [...new Set((variants ?? []).map((v) => v.color_name).filter(Boolean))];
}

function getSizes(variants) {
  return [...new Set((variants ?? []).map((v) => v.size).filter(Boolean))];
}

function formatPrice(val) {
  if (!val) return null;
  return `${parseFloat(val).toFixed(2)} €`;
}

function truncate(str, max) {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + '…';
}

// ─────────────────────────────────────────────────────────────
//  WHOLESALE — fiche acheteur (Markdown)
// ─────────────────────────────────────────────────────────────

function buildWholesaleTitle(p) {
  const parts = [p.name, `Réf. ${p.reference}`];
  if (p.collection_name) {
    const season = [p.collection_name, p.season, p.year].filter(Boolean).join(' ');
    parts.push(season);
  }
  return parts.join(' — ');
}

function buildWholesaleBody(p, bom, variants) {
  const type = TYPE_CONTEXT[p.type] ?? TYPE_CONTEXT.pret_a_porter;
  const mainMat = getMainMaterial(bom);
  const matVocab = getMaterialVocab(mainMat?.material_name);
  const colors = getColors(variants);
  const sizes = getSizes(variants);
  const tier = getPriceTier(p.costing?.retail_price ?? p.target_retail_price);
  const familyLabel = getFamilyLabel(p.family, 'fr') ?? type.fr.label;
  const seed = p.reference;

  // ── Description technique ──
  const intros = [
    `${p.name} est ${pick(['une pièce', 'un modèle'], seed)} de ${familyLabel} ${matVocab ? `en ${mainMat.material_name.toLowerCase()} ${matVocab.fr.adj}` : ''} ${p.collection_name ? `conçu pour la collection ${p.collection_name}` : ''}.`,
    `Proposé en ${familyLabel}${matVocab ? ` de ${mainMat.material_name.toLowerCase()}` : ''}, ${p.name} incarne l'exigence technique attendue pour ${p.collection_name ? `la collection ${p.collection_name}` : 'cette saison'}.`,
    `Ce ${familyLabel}${matVocab ? ` ${matVocab.fr.adj}` : ''} allie construction soignée et identité forte${p.collection_name ? `, s'inscrivant parfaitement dans la collection ${p.collection_name}` : ''}.`,
  ];
  const intro = pick(intros, seed);

  const matDetail = matVocab
    ? `Sa ${mainMat.material_name.toLowerCase()} se distingue par ${matVocab.fr.qualities}, garantissant une pièce à la fois qualitative et agréable à porter.`
    : '';

  const styleNote = p.style_notes
    ? `\n\n${p.style_notes}`
    : '';

  // ── BOM ──
  const bomLines = bom.length
    ? bom.map((b) => {
        const parts = [`**${b.material_name}**`];
        if (b.usage_type) parts.push(`(${b.usage_type})`);
        if (b.composition) parts.push(`— ${b.composition}`);
        if (b.supplier_name) parts.push(`[${b.supplier_name}]`);
        return `- ${parts.join(' ')}`;
      }).join('\n')
    : '_Non renseignée_';

  // ── Points forts ──
  const bullets = [];

  if (colors.length) bullets.push(`Coloris disponibles : ${colors.join(', ')}`);
  if (sizes.length) bullets.push(`Tailles : ${sizes.join(', ')}`);

  if (p.costing) {
    const c = p.costing;
    if (c.wholesale_price) bullets.push(`Prix grossiste : ${formatPrice(c.wholesale_price)}`);
    if (c.retail_price) bullets.push(`PVC : ${formatPrice(c.retail_price)}`);
    if (c.coefficient) bullets.push(`Coefficient : ×${parseFloat(c.coefficient).toFixed(2)}`);
    if (c.gross_margin_pct) bullets.push(`Marge brute distributeur : ${parseFloat(c.gross_margin_pct).toFixed(1)} %`);
  } else if (p.target_retail_price) {
    bullets.push(`PVC cible : ${formatPrice(p.target_retail_price)}`);
  }

  if (tier === 'luxury') bullets.push('Positionnement : segment luxe');
  if (tier === 'premium') bullets.push('Positionnement : segment premium');

  const bulletStr = bullets.map((b) => `- ${b}`).join('\n');

  const body = [
    '## Description technique',
    [intro, matDetail, styleNote].filter(Boolean).join(' '),
    '',
    '## Composition & matières',
    bomLines,
    '',
    '## Points forts acheteur',
    bulletStr || '_—_',
  ].join('\n');

  return body;
}

// ─────────────────────────────────────────────────────────────
//  E-COMMERCE — SEO Title
// ─────────────────────────────────────────────────────────────

function buildSeoTitle(p, lang) {
  const familyLabel = getFamilyLabel(p.family, lang);
  const mainMat = getMainMaterial(p.bom);
  const matName = mainMat?.material_name ? mainMat.material_name.split(' ')[0].toLowerCase() : null;

  let title;
  if (lang === 'fr') {
    const parts = [familyLabel ?? p.name, matName, p.name !== (familyLabel ?? '') ? null : null].filter(Boolean);
    // Format : "[famille] [matière] — [nom] | [Collection]" ou similaire
    const base = familyLabel && matName
      ? `${cap(familyLabel)} ${matName} ${p.name}`
      : p.name;
    title = p.collection_name
      ? truncate(`${base} — ${p.collection_name}`, 60)
      : truncate(base, 60);
  } else {
    const base = familyLabel && matName
      ? `${cap(familyLabel)} ${matName} ${p.name}`
      : p.name;
    title = p.collection_name
      ? truncate(`${base} — ${p.collection_name}`, 60)
      : truncate(base, 60);
  }

  return title;
}

function cap(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─────────────────────────────────────────────────────────────
//  E-COMMERCE — Meta description
// ─────────────────────────────────────────────────────────────

function buildMeta(p, lang) {
  const type = TYPE_CONTEXT[p.type] ?? TYPE_CONTEXT.pret_a_porter;
  const mainMat = getMainMaterial(p.bom);
  const colors = getColors(p.variants);
  const tier = getPriceTier(p.costing?.retail_price ?? p.target_retail_price);
  const seed = p.reference;

  if (lang === 'fr') {
    const matStr = mainMat ? `en ${mainMat.material_name.toLowerCase()}` : '';
    const colorStr = colors.length ? `, disponible${colors.length > 1 ? 's' : ''} en ${colors.slice(0, 3).join(', ')}` : '';
    const cta = pick([
      'Découvrez cette pièce et commandez en ligne.',
      'Explorez notre collection et trouvez votre taille.',
      'Livraison rapide — commandez dès maintenant.',
    ], seed);
    const raw = `${p.name} ${matStr}${colorStr}. ${p.description ? p.description.slice(0, 80) + '.' : ''} ${cta}`;
    return truncate(raw.replace(/\s+/g, ' ').trim(), 155);
  } else {
    const matStr = mainMat ? `in ${mainMat.material_name.toLowerCase()}` : '';
    const colorStr = colors.length ? `, available in ${colors.slice(0, 3).join(', ')}` : '';
    const cta = pick([
      'Discover this piece and shop online.',
      'Explore our collection and find your size.',
      'Fast delivery — order now.',
    ], seed);
    const raw = `${p.name} ${matStr}${colorStr}. ${p.description ? p.description.slice(0, 80) + '.' : ''} ${cta}`;
    return truncate(raw.replace(/\s+/g, ' ').trim(), 155);
  }
}

// ─────────────────────────────────────────────────────────────
//  E-COMMERCE — Description HTML
// ─────────────────────────────────────────────────────────────

function buildEcomDescription(p, lang) {
  const type = (TYPE_CONTEXT[p.type] ?? TYPE_CONTEXT.pret_a_porter)[lang];
  const mainMat = getMainMaterial(p.bom);
  const matVocab = getMaterialVocab(mainMat?.material_name);
  const colors = getColors(p.variants);
  const sizes = getSizes(p.variants);
  const seed = p.reference;

  if (lang === 'fr') {
    // ── Accroche
    const accrocheTemplates = [
      `<p>${cap(type.article)} ${p.name.toLowerCase()} ${type.verb} chaque silhouette avec élégance${p.collection_name ? `, au cœur de la collection ${p.collection_name}` : ''}.</p>`,
      `<p>Pièce ${pick(['incontournable', 'emblématique', 'signature'], seed)} de ${p.collection_name ? `la collection ${p.collection_name}` : 'la saison'}, ${p.name} allie savoir-faire et style contemporain.</p>`,
      `<p>Conçu pour ${type.occasion}, ${p.name.toLowerCase()} s'impose comme une pièce de caractère${p.collection_name ? ` dans la collection ${p.collection_name}` : ''}.</p>`,
    ];
    const accroche = pick(accrocheTemplates, seed);

    // ── Matières & fabrication
    const matSection = mainMat ? `<h2>Matières &amp; fabrication</h2>
<p>${p.name} est réalisé${p.type === 'maroquinerie' ? 'e' : ''} en <strong>${mainMat.material_name.toLowerCase()}</strong>${matVocab ? `, sélectionné pour ${matVocab.fr.qualities}` : ''}. ${p.bom.length > 1 ? `La composition intègre également ${p.bom.slice(1).map((b) => b.material_name.toLowerCase()).join(', ')} pour un résultat ${pick(['soigné', 'abouti', 'maîtrisé'], seed)}.` : ''}</p>` : '';

    // ── Style & occasions
    const styleSection = `<h2>Style &amp; occasions</h2>
<p>${p.description ?? `${cap(type.article)} ${type.label} ${pick(['se porte', 'convient parfaitement', 's\'adapte'], seed)} ${type.occasion}${p.gender === 'femme' ? ', pour une femme qui affirme son style' : p.gender === 'homme' ? ', pour une allure masculine affirmée' : ''}.`}</p>
<ul>
${[
  mainMat && matVocab ? `<li>${cap(matVocab.fr.adj)} — ${mainMat.material_name.toLowerCase()} de qualité</li>` : null,
  colors.length ? `<li>Disponible en ${colors.join(', ')}</li>` : null,
  sizes.length ? `<li>Tailles : ${sizes.join(' — ')}</li>` : null,
  p.costing?.retail_price ? `<li>PVC : ${formatPrice(p.costing.retail_price)}</li>` : p.target_retail_price ? `<li>PVC indicatif : ${formatPrice(p.target_retail_price)}</li>` : null,
].filter(Boolean).join('\n')}
</ul>`;

    // ── Entretien
    const careStr = matVocab?.fr.care ?? 'Suivre les instructions de la griffe d\'entretien.';
    const careSection = `<h2>Entretien</h2><p>${careStr}</p>`;

    return [accroche, matSection, styleSection, careSection].filter(Boolean).join('\n');

  } else {
    // English
    const accrocheTemplates = [
      `<p>${cap(type.article)} ${p.name} brings effortless style to every wardrobe${p.collection_name ? `, as part of the ${p.collection_name} collection` : ''}.</p>`,
      `<p>A ${pick(['standout', 'defining', 'signature'], seed)} piece ${p.collection_name ? `from the ${p.collection_name} collection` : 'of the season'}, ${p.name} blends craftsmanship with contemporary style.</p>`,
      `<p>Designed ${type.occasion}, ${p.name} makes a confident style statement${p.collection_name ? ` within the ${p.collection_name} collection` : ''}.</p>`,
    ];
    const accroche = pick(accrocheTemplates, seed);

    const matSection = mainMat ? `<h2>Materials &amp; craftsmanship</h2>
<p>${p.name} is crafted in <strong>${mainMat.material_name.toLowerCase()}</strong>${matVocab ? `, chosen for its ${matVocab.en.qualities}` : ''}. ${p.bom.length > 1 ? `The composition also features ${p.bom.slice(1).map((b) => b.material_name.toLowerCase()).join(', ')} for a ${pick(['refined', 'polished', 'considered'], seed)} finish.` : ''}</p>` : '';

    const styleSection = `<h2>Style &amp; occasions</h2>
<p>${p.description ?? `This ${type.label} ${pick(['works beautifully', 'is perfect', 'adapts seamlessly'], seed)} ${type.occasion}${p.gender === 'femme' ? ', for a woman who owns her style' : p.gender === 'homme' ? ', for a confident masculine look' : ''}.`}</p>
<ul>
${[
  mainMat && matVocab ? `<li>${cap(matVocab.en.adj)} — quality ${mainMat.material_name.toLowerCase()}</li>` : null,
  colors.length ? `<li>Available in ${colors.join(', ')}</li>` : null,
  sizes.length ? `<li>Sizes: ${sizes.join(' — ')}</li>` : null,
  p.costing?.retail_price ? `<li>RRP: ${formatPrice(p.costing.retail_price)}</li>` : p.target_retail_price ? `<li>Suggested RRP: ${formatPrice(p.target_retail_price)}</li>` : null,
].filter(Boolean).join('\n')}
</ul>`;

    const careStr = matVocab?.en.care ?? 'Follow care label instructions.';
    const careSection = `<h2>Care instructions</h2><p>${careStr}</p>`;

    return [accroche, matSection, styleSection, careSection].filter(Boolean).join('\n');
  }
}

// ─────────────────────────────────────────────────────────────
//  E-COMMERCE — Keywords
// ─────────────────────────────────────────────────────────────

const KW_BY_TYPE = {
  pret_a_porter: { fr: ['mode femme', 'prêt-à-porter', 'vêtement tendance'], en: ['womenswear', 'ready-to-wear', 'fashion'] },
  maroquinerie: { fr: ['maroquinerie', 'sac de luxe', 'accessoire cuir'], en: ['leather goods', 'luxury bag', 'leather accessory'] },
  accessoire: { fr: ['accessoire mode', 'bijou', 'complément tenue'], en: ['fashion accessory', 'style accessory', 'outfit accessory'] },
};

const KW_BY_GENDER = {
  femme: { fr: ['mode femme', 'tenue femme', 'style féminin'], en: ['womenswear', 'women fashion', 'feminine style'] },
  homme: { fr: ['mode homme', 'tenue homme', 'style masculin'], en: ['menswear', 'men fashion', 'masculine style'] },
};

function buildKeywords(p, lang) {
  const mainMat = getMainMaterial(p.bom);
  const base = (KW_BY_TYPE[p.type] ?? KW_BY_TYPE.pret_a_porter)[lang] ?? [];
  const gender = (KW_BY_GENDER[p.gender] ?? {})[lang] ?? [];
  const matKw = mainMat ? [mainMat.material_name.toLowerCase()] : [];
  const collKw = p.collection_name ? [p.collection_name.toLowerCase()] : [];
  const familyKw = p.family ? [lang === 'fr' ? getFamilyLabel(p.family, 'fr') ?? p.family : getFamilyLabel(p.family, 'en') ?? p.family] : [];
  const nameKw = [p.name.toLowerCase()];
  const refKw = [p.reference.toLowerCase()];

  const all = [...nameKw, ...familyKw, ...matKw, ...base, ...gender.slice(0, 2), ...collKw, ...refKw];
  // Dédoublonnage, 8–10 mots-clés
  return [...new Set(all.filter(Boolean))].slice(0, 10);
}

// ─────────────────────────────────────────────────────────────
//  E-COMMERCE — FAQ (GEO)
// ─────────────────────────────────────────────────────────────

function buildFaq(p, lang) {
  const mainMat = getMainMaterial(p.bom);
  const matVocab = getMaterialVocab(mainMat?.material_name);
  const colors = getColors(p.variants);
  const sizes = getSizes(p.variants);
  const type = (TYPE_CONTEXT[p.type] ?? TYPE_CONTEXT.pret_a_porter)[lang];
  const faq = [];

  if (lang === 'fr') {
    // Q1 — Composition
    if (mainMat) {
      const allMats = (p.bom ?? []).map((b) => b.material_name).join(', ');
      faq.push({
        q: `Quelle est la composition de ${p.name.toLowerCase()} ?`,
        a: `${p.name} est composé${p.type === 'maroquinerie' ? 'e' : ''} de ${allMats}.${matVocab ? ` La ${mainMat.material_name.toLowerCase()} a été sélectionnée pour ${matVocab.fr.qualities}.` : ''}`,
      });
    }

    // Q2 — Coloris
    if (colors.length) {
      faq.push({
        q: `Dans quels coloris ${p.name.toLowerCase()} est-il disponible ?`,
        a: `${p.name} est disponible en ${colors.join(', ')}. ${colors.length > 2 ? 'Ces coloris ont été sélectionnés pour leur polyvalence et leur accord avec les tendances de la saison.' : 'Cette sélection de coloris s\'adapte à toutes les occasions.'}`,
      });
    }

    // Q3 — Tailles / dimensions
    if (sizes.length) {
      faq.push({
        q: p.type === 'maroquinerie'
          ? `Quelles sont les dimensions de ${p.name.toLowerCase()} ?`
          : `Quelles tailles sont disponibles pour ${p.name.toLowerCase()} ?`,
        a: p.type === 'maroquinerie'
          ? `${p.name} est disponible dans les dimensions suivantes : ${sizes.join(', ')}.`
          : `${p.name} est proposé en tailles ${sizes.join(', ')}. En cas de doute, consultez notre guide des tailles ou contactez notre service client.`,
      });
    }

    // Q4 — Entretien
    if (mainMat) {
      const care = matVocab?.fr.care ?? 'Suivre les instructions de la griffe d\'entretien.';
      faq.push({
        q: `Comment entretenir ${p.name.toLowerCase()} ?`,
        a: `Pour préserver la qualité de votre ${p.name.toLowerCase()}, nous recommandons : ${care}`,
      });
    }

    // Q5 — Prix / disponibilité
    const price = p.costing?.retail_price ?? p.target_retail_price;
    if (price) {
      faq.push({
        q: `Quel est le prix de ${p.name.toLowerCase()} ?`,
        a: `${p.name} est proposé au prix public conseillé de ${formatPrice(price)}${p.collection_name ? `, dans le cadre de la collection ${p.collection_name}` : ''}.`,
      });
    }

  } else {
    // English FAQ
    if (mainMat) {
      const allMats = (p.bom ?? []).map((b) => b.material_name).join(', ');
      faq.push({
        q: `What is ${p.name} made of?`,
        a: `${p.name} is made of ${allMats}.${matVocab ? ` The ${mainMat.material_name.toLowerCase()} was selected for its ${matVocab.en.qualities}.` : ''}`,
      });
    }

    if (colors.length) {
      faq.push({
        q: `What colors is ${p.name} available in?`,
        a: `${p.name} is available in ${colors.join(', ')}. ${colors.length > 2 ? 'These colors were selected for their versatility and alignment with current season trends.' : 'This color selection suits all occasions.'}`,
      });
    }

    if (sizes.length) {
      faq.push({
        q: p.type === 'maroquinerie'
          ? `What are the dimensions of ${p.name}?`
          : `What sizes does ${p.name} come in?`,
        a: p.type === 'maroquinerie'
          ? `${p.name} is available in the following: ${sizes.join(', ')}.`
          : `${p.name} is available in sizes ${sizes.join(', ')}. If unsure, please refer to our size guide or contact our customer service.`,
      });
    }

    if (mainMat) {
      const care = matVocab?.en.care ?? 'Follow care label instructions.';
      faq.push({
        q: `How do I care for ${p.name}?`,
        a: `To keep your ${p.name.toLowerCase()} looking its best: ${care}`,
      });
    }

    const price = p.costing?.retail_price ?? p.target_retail_price;
    if (price) {
      faq.push({
        q: `How much does ${p.name} cost?`,
        a: `${p.name} is available at a recommended retail price of ${formatPrice(price)}${p.collection_name ? `, as part of the ${p.collection_name} collection` : ''}.`,
      });
    }
  }

  return faq.slice(0, 5);
}

// ─────────────────────────────────────────────────────────────
//  JSON-LD schema.org/Product
// ─────────────────────────────────────────────────────────────

function buildJsonLd(p) {
  const colors = getColors(p.variants);
  const sizes = getSizes(p.variants);
  const mainMat = getMainMaterial(p.bom);
  const price = p.costing?.retail_price ?? p.target_retail_price;

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
    offers: price ? {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: parseFloat(price).toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    } : undefined,
    ...(p.collection_name ? {
      isPartOf: { '@type': 'Collection', name: p.collection_name },
    } : {}),
  };

  // Supprimer les champs undefined
  return JSON.parse(JSON.stringify(ld));
}

// ─────────────────────────────────────────────────────────────
//  EXPORT PRINCIPAL
// ─────────────────────────────────────────────────────────────

function buildFiche(p) {
  const bom = p.bom ?? [];
  const variants = p.variants ?? [];

  // Attacher costing au niveau p pour faciliter les helpers
  const pWithBom = { ...p, bom, variants };

  return {
    wholesale_title: buildWholesaleTitle(pWithBom),
    wholesale_body:  buildWholesaleBody(pWithBom, bom, variants),

    seo_title_fr:  buildSeoTitle(pWithBom, 'fr'),
    meta_desc_fr:  buildMeta(pWithBom, 'fr'),
    description_fr: buildEcomDescription(pWithBom, 'fr'),
    keywords_fr:   buildKeywords(pWithBom, 'fr'),
    faq_fr:        buildFaq(pWithBom, 'fr'),

    seo_title_en:  buildSeoTitle(pWithBom, 'en'),
    meta_desc_en:  buildMeta(pWithBom, 'en'),
    description_en: buildEcomDescription(pWithBom, 'en'),
    keywords_en:   buildKeywords(pWithBom, 'en'),
    faq_en:        buildFaq(pWithBom, 'en'),

    json_ld: buildJsonLd(pWithBom),
  };
}

module.exports = { buildFiche };
