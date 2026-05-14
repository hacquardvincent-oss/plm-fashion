'use strict';

// ─────────────────────────────────────────────────────────────
//  VOCABULAIRE MATIÈRES
// ─────────────────────────────────────────────────────────────

const MATERIAL_VOCAB = {
  lin: {
    fr: {
      adj: 'naturel et respirant',
      qualities: 'légèreté, son tombé fluide et ses propriétés thermorégulatrices',
      care: 'Lavage à 30 °C, repassage vapeur recommandé.',
      careSteps: ['Laver à 30 °C en machine', 'Repasser à la vapeur sur l\'envers', 'Séchage à l\'air libre conseillé'],
      synonyms: ['lin naturel', 'toile de lin', 'fibre naturelle'],
    },
    en: {
      adj: 'natural and breathable',
      qualities: 'lightweight feel, fluid drape and natural thermoregulation',
      care: 'Machine wash at 30 °C, steam iron recommended.',
      careSteps: ['Machine wash at 30 °C', 'Steam iron on reverse side', 'Air dry recommended'],
      synonyms: ['natural linen', 'linen fabric', 'natural fibre'],
    },
  },
  soie: {
    fr: {
      adj: 'précieux et soyeux',
      qualities: 'brillance naturelle, toucher incomparable et légèreté extrême',
      care: 'Lavage à la main ou pressing professionnel recommandé.',
      careSteps: ['Laver à la main à l\'eau froide', 'Ne pas essorer', 'Sécher à l\'ombre à plat', 'Repassage fer doux à 110 °C sur l\'envers'],
      synonyms: ['soie naturelle', 'tissu soie', 'fibre soyeuse', 'soie véritable'],
    },
    en: {
      adj: 'precious and silky',
      qualities: 'natural sheen, unparalleled softness and featherlight weight',
      care: 'Hand wash or professional dry cleaning recommended.',
      careSteps: ['Hand wash in cold water', 'Do not wring', 'Dry flat in shade', 'Iron gently at 110 °C on reverse'],
      synonyms: ['natural silk', 'silk fabric', 'pure silk', 'silk textile'],
    },
  },
  coton: {
    fr: {
      adj: 'doux et résistant',
      qualities: 'confort au quotidien, facilité d\'entretien et durabilité',
      care: 'Lavage machine à 30 °C.',
      careSteps: ['Laver en machine à 30 °C', 'Séchage à l\'air libre ou sèche-linge doux', 'Repassage si nécessaire'],
      synonyms: ['coton naturel', 'tissu coton', 'fibre coton', 'coton certifié'],
    },
    en: {
      adj: 'soft and durable',
      qualities: 'everyday comfort, easy care and long-lasting wear',
      care: 'Machine wash at 30 °C.',
      careSteps: ['Machine wash at 30 °C', 'Tumble dry on low or air dry', 'Iron if needed'],
      synonyms: ['natural cotton', 'cotton fabric', 'cotton textile'],
    },
  },
  laine: {
    fr: {
      adj: 'noble et chaud',
      qualities: 'régulation thermique naturelle, drapé structuré et tenue dans le temps',
      care: 'Lavage délicat 30 °C ou pressing. Séchage à plat.',
      careSteps: ['Laver en cycle délicat à 30 °C ou confier à un pressing', 'Sécher à plat sans essorer', 'Repassage vapeur sur l\'envers'],
      synonyms: ['laine naturelle', 'tissu laine', 'laine vierge', 'fibre laine'],
    },
    en: {
      adj: 'noble and warm',
      qualities: 'natural thermal regulation, structured drape and lasting shape',
      care: 'Delicate wash 30 °C or dry clean. Lay flat to dry.',
      careSteps: ['Delicate machine wash at 30 °C or dry clean', 'Lay flat to dry, do not wring', 'Steam iron on reverse'],
      synonyms: ['natural wool', 'wool fabric', 'virgin wool', 'wool textile'],
    },
  },
  cachemire: {
    fr: {
      adj: 'ultra-doux et luxueux',
      qualities: 'douceur exceptionnelle, légèreté et chaleur incomparables, symbole de raffinement',
      care: 'Lavage à la main à l\'eau froide ou pressing. Séchage à plat.',
      careSteps: ['Laver à la main à l\'eau froide avec un détergent doux', 'Presser délicatement sans essorer', 'Sécher à plat à l\'abri de la lumière'],
      synonyms: ['cachemire pur', 'laine cachemire', 'fibre cachemire', 'cachemire de luxe'],
    },
    en: {
      adj: 'ultra-soft and luxurious',
      qualities: 'exceptional softness, unmatched warmth and lightness, symbol of refinement',
      care: 'Hand wash in cold water or dry clean. Lay flat to dry.',
      careSteps: ['Hand wash in cold water with gentle detergent', 'Gently press, do not wring', 'Lay flat to dry away from direct light'],
      synonyms: ['pure cashmere', 'cashmere wool', 'cashmere fibre', 'luxury cashmere'],
    },
  },
  cuir: {
    fr: {
      adj: 'noble et résistant',
      qualities: 'robustesse, patine avec le temps et caractère inimitable du cuir pleine fleur',
      care: 'Nourrissage régulier avec une crème adaptée. Éviter l\'humidité.',
      careSteps: ['Nourrir régulièrement avec une crème cuir adaptée', 'Éviter l\'exposition à l\'humidité prolongée', 'Ranger dans un sac à poussière', 'Dépoussiérer avec un chiffon doux'],
      synonyms: ['cuir véritable', 'cuir pleine fleur', 'cuir naturel', 'maroquinerie cuir'],
    },
    en: {
      adj: 'noble and durable',
      qualities: 'strength, beautiful patina over time and the inimitable character of full-grain leather',
      care: 'Regular conditioning with appropriate cream. Avoid moisture.',
      careSteps: ['Condition regularly with appropriate leather cream', 'Avoid prolonged moisture exposure', 'Store in dust bag', 'Wipe with soft cloth to dust'],
      synonyms: ['genuine leather', 'full-grain leather', 'natural leather', 'leather goods'],
    },
  },
  'cuir suède': {
    fr: {
      adj: 'velouté et raffiné',
      qualities: 'toucher velouté, aspect mat sophistiqué et souplesse caractéristique du suède',
      care: 'Brossage régulier avec brosse spéciale suède. Imperméabilisant conseillé.',
      careSteps: ['Brosser régulièrement avec une brosse spéciale suède', 'Appliquer un imperméabilisant suède', 'Sécher à l\'air libre en cas d\'humidité', 'Éviter la pluie et les taches'],
      synonyms: ['daim', 'velours de cuir', 'suède véritable', 'cuir velours'],
    },
    en: {
      adj: 'velvety and refined',
      qualities: 'velvety touch, sophisticated matte finish and characteristic suppleness of suede',
      care: 'Regular brushing with suede brush. Waterproofing spray recommended.',
      careSteps: ['Brush regularly with suede brush', 'Apply suede waterproofing spray', 'Air dry if wet', 'Avoid rain and stains'],
      synonyms: ['suede leather', 'nubuck', 'velvet leather', 'suede'],
    },
  },
  polyester: {
    fr: {
      adj: 'technique et facile d\'entretien',
      qualities: 'résistance aux froissements, séchage rapide et stabilité dimensionnelle',
      care: 'Lavage machine 40 °C, séchage facile.',
      careSteps: ['Laver en machine à 40 °C', 'Séchage à l\'air libre ou sèche-linge doux', 'Repassage basse température si nécessaire'],
      synonyms: ['polyester technique', 'tissu synthétique', 'matière technique', 'fibre synthétique'],
    },
    en: {
      adj: 'technical and easy-care',
      qualities: 'wrinkle resistance, quick drying and dimensional stability',
      care: 'Machine wash 40 °C, easy drying.',
      careSteps: ['Machine wash at 40 °C', 'Tumble dry low or air dry', 'Iron on low temperature if needed'],
      synonyms: ['technical polyester', 'synthetic fabric', 'technical material', 'synthetic fibre'],
    },
  },
  viscose: {
    fr: {
      adj: 'fluide et doux',
      qualities: 'tombé soyeux, douceur sur la peau et légèreté agréable à porter',
      care: 'Lavage délicat 30 °C ou lavage à la main.',
      careSteps: ['Laver en cycle délicat à 30 °C ou à la main', 'Ne pas essorer fortement', 'Sécher à plat ou sur cintre', 'Repassage vapeur si nécessaire'],
      synonyms: ['viscose naturelle', 'rayonne', 'tissu viscose', 'fibre cellulosique'],
    },
    en: {
      adj: 'fluid and soft',
      qualities: 'silky drape, gentle on skin and pleasant lightweight feel',
      care: 'Delicate wash 30 °C or hand wash.',
      careSteps: ['Delicate machine wash at 30 °C or hand wash', 'Do not wring tightly', 'Dry flat or on hanger', 'Steam iron if needed'],
      synonyms: ['viscose rayon', 'rayon fabric', 'cellulosic fibre', 'viscose textile'],
    },
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
  veste: { fr: 'veste', en: 'jacket', synonymsFr: ['blazer', 'veste de tailleur', 'veste habillée'], synonymsEn: ['blazer', 'tailored jacket', 'women\'s jacket'] },
  manteau: { fr: 'manteau', en: 'coat', synonymsFr: ['manteau long', 'pardessus', 'manteau femme'], synonymsEn: ['overcoat', 'women\'s coat', 'long coat'] },
  robe: { fr: 'robe', en: 'dress', synonymsFr: ['robe longue', 'robe de soirée', 'robe habillée', 'robe femme'], synonymsEn: ['long dress', 'evening dress', 'women\'s dress', 'gown'] },
  pantalon: { fr: 'pantalon', en: 'trousers', synonymsFr: ['pantalon femme', 'pantalon tailleur', 'pantalon habillé'], synonymsEn: ['pants', 'women\'s trousers', 'dress pants'] },
  jupe: { fr: 'jupe', en: 'skirt', synonymsFr: ['jupe longue', 'jupe midi', 'jupe femme'], synonymsEn: ['midi skirt', 'long skirt', 'women\'s skirt'] },
  chemise: { fr: 'chemise', en: 'shirt', synonymsFr: ['chemise femme', 'blouse', 'chemisier'], synonymsEn: ['blouse', 'women\'s shirt', 'top'] },
  top: { fr: 'top', en: 'top', synonymsFr: ['haut femme', 'top habillé', 'blouse'], synonymsEn: ['women\'s top', 'blouse', 'dressy top'] },
  pull: { fr: 'pull', en: 'sweater', synonymsFr: ['pull femme', 'pull maille', 'tricot'], synonymsEn: ['women\'s sweater', 'knitwear', 'pullover'] },
  sac: { fr: 'sac', en: 'bag', synonymsFr: ['sac à main', 'sac femme', 'sac de luxe'], synonymsEn: ['handbag', 'women\'s bag', 'luxury bag'] },
  pochette: { fr: 'pochette', en: 'clutch', synonymsFr: ['pochette soirée', 'clutch bag', 'minaudière'], synonymsEn: ['evening clutch', 'clutch bag', 'minaudière'] },
  portefeuille: { fr: 'portefeuille', en: 'wallet', synonymsFr: ['portefeuille femme', 'porte-cartes'], synonymsEn: ['women\'s wallet', 'card holder'] },
  ceinture: { fr: 'ceinture', en: 'belt', synonymsFr: ['ceinture cuir', 'ceinture femme'], synonymsEn: ['leather belt', 'women\'s belt'] },
  'porte-monnaie': { fr: 'porte-monnaie', en: 'coin purse', synonymsFr: ['porte-monnaie cuir'], synonymsEn: ['leather coin purse'] },
  blouse: { fr: 'blouse', en: 'blouse', synonymsFr: ['blouse femme', 'chemisier', 'top habillé'], synonymsEn: ['women\'s blouse', 'dressy top', 'shirt'] },
};

const PRICE_TIER = {
  luxury: { fr: 'positionnement luxe', en: 'luxury positioning' },
  premium: { fr: 'positionnement premium', en: 'premium positioning' },
  mid: { fr: 'bon rapport qualité/prix', en: 'excellent value for quality' },
};

// Occasions par type de produit
const USE_CASE_TEMPLATES = {
  pret_a_porter: {
    fr: ['Soirée et occasions habillées', 'Cocktail et événements professionnels', 'Déjeuner ou dîner chic', 'Voyage élégant', 'Cadeau mode haut de gamme'],
    en: ['Evening and formal occasions', 'Cocktail parties and professional events', 'Elegant lunch or dinner', 'Stylish travel', 'Premium fashion gift'],
  },
  maroquinerie: {
    fr: ['Usage quotidien en ville', 'Sortie professionnelle', 'Soirée et événements', 'Cadeau de luxe', 'Collection et investissement mode'],
    en: ['Everyday city use', 'Professional outings', 'Evening events', 'Luxury gift', 'Fashion collection and investment'],
  },
  accessoire: {
    fr: ['Complément d\'une tenue de soirée', 'Touch finale d\'un look professionnel', 'Cadeau élégant', 'Usage quotidien chic'],
    en: ['Evening outfit complement', 'Final touch for professional look', 'Elegant gift', 'Chic daily use'],
  },
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
  return bom.find((b) => b.usage_type?.includes('principal')) ?? bom[0] ?? null;
}

function getFamilyData(family) {
  if (!family) return null;
  const key = family.toLowerCase();
  for (const [k, v] of Object.entries(FAMILY_LABELS)) {
    if (key.includes(k)) return v;
  }
  return null;
}

function getFamilyLabel(family, lang) {
  const data = getFamilyData(family);
  if (data) return data[lang];
  return family?.toLowerCase() ?? null;
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

function cap(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
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

  const intros = [
    `${p.name} est ${pick(['une pièce', 'un modèle'], seed)} de ${familyLabel} ${matVocab ? `en ${mainMat.material_name.toLowerCase()} ${matVocab.fr.adj}` : ''} ${p.collection_name ? `conçu pour la collection ${p.collection_name}` : ''}.`,
    `Proposé en ${familyLabel}${matVocab ? ` de ${mainMat.material_name.toLowerCase()}` : ''}, ${p.name} incarne l'exigence technique attendue pour ${p.collection_name ? `la collection ${p.collection_name}` : 'cette saison'}.`,
    `Ce ${familyLabel}${matVocab ? ` ${matVocab.fr.adj}` : ''} allie construction soignée et identité forte${p.collection_name ? `, s'inscrivant parfaitement dans la collection ${p.collection_name}` : ''}.`,
  ];
  const intro = pick(intros, seed);
  const matDetail = matVocab
    ? `Sa ${mainMat.material_name.toLowerCase()} se distingue par ${matVocab.fr.qualities}, garantissant une pièce à la fois qualitative et agréable à porter.`
    : '';
  const styleNote = p.style_notes ? `\n\n${p.style_notes}` : '';

  const bomLines = bom.length
    ? bom.map((b) => {
        const parts = [`**${b.material_name}**`];
        if (b.usage_type) parts.push(`(${b.usage_type})`);
        if (b.composition) parts.push(`— ${b.composition}`);
        if (b.supplier_name) parts.push(`[${b.supplier_name}]`);
        return `- ${parts.join(' ')}`;
      }).join('\n')
    : '_Non renseignée_';

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

  return [
    '## Description technique',
    [intro, matDetail, styleNote].filter(Boolean).join(' '),
    '',
    '## Composition & matières',
    bomLines,
    '',
    '## Points forts acheteur',
    bullets.map((b) => `- ${b}`).join('\n') || '_—_',
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────
//  SEO Title + Meta
// ─────────────────────────────────────────────────────────────

function buildSeoTitle(p, lang) {
  const familyLabel = getFamilyLabel(p.family, lang);
  const mainMat = getMainMaterial(p.bom);
  const matName = mainMat?.material_name ? mainMat.material_name.split(' ')[0].toLowerCase() : null;
  const base = familyLabel && matName
    ? `${cap(familyLabel)} ${matName} ${p.name}`
    : p.name;
  return p.collection_name
    ? truncate(`${base} — ${p.collection_name}`, 60)
    : truncate(base, 60);
}

function buildMeta(p, lang) {
  const mainMat = getMainMaterial(p.bom);
  const colors = getColors(p.variants);
  const seed = p.reference;
  const matStr = mainMat ? (lang === 'fr' ? `en ${mainMat.material_name.toLowerCase()}` : `in ${mainMat.material_name.toLowerCase()}`) : '';
  const colorStr = colors.length
    ? (lang === 'fr'
        ? `, disponible${colors.length > 1 ? 's' : ''} en ${colors.slice(0, 3).join(', ')}`
        : `, available in ${colors.slice(0, 3).join(', ')}`)
    : '';
  const cta = lang === 'fr'
    ? pick(['Découvrez cette pièce et commandez en ligne.', 'Explorez notre collection et trouvez votre taille.', 'Livraison rapide — commandez dès maintenant.'], seed)
    : pick(['Discover this piece and shop online.', 'Explore our collection and find your size.', 'Fast delivery — order now.'], seed);
  const desc = p.description ? p.description.slice(0, 80) + '.' : '';
  return truncate(`${p.name} ${matStr}${colorStr}. ${desc} ${cta}`.replace(/\s+/g, ' ').trim(), 155);
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
  const price = p.costing?.retail_price ?? p.target_retail_price;

  if (lang === 'fr') {
    const accrocheTemplates = [
      `<p>${cap(type.article)} ${p.name.toLowerCase()} ${type.verb} chaque silhouette avec élégance${p.collection_name ? `, au cœur de la collection ${p.collection_name}` : ''}.</p>`,
      `<p>Pièce ${pick(['incontournable', 'emblématique', 'signature'], seed)} de ${p.collection_name ? `la collection ${p.collection_name}` : 'la saison'}, ${p.name} allie savoir-faire et style contemporain.</p>`,
      `<p>Conçu pour ${type.occasion}, ${p.name.toLowerCase()} s'impose comme une pièce de caractère${p.collection_name ? ` dans la collection ${p.collection_name}` : ''}.</p>`,
    ];
    const matSection = mainMat ? `<h2>Matières &amp; fabrication</h2>
<p>${p.name} est réalisé en <strong>${mainMat.material_name.toLowerCase()}</strong>${matVocab ? `, sélectionné pour ${matVocab.fr.qualities}` : ''}. ${p.bom.length > 1 ? `La composition intègre également ${p.bom.slice(1).map((b) => b.material_name.toLowerCase()).join(', ')} pour un résultat ${pick(['soigné', 'abouti', 'maîtrisé'], seed)}.` : ''}</p>` : '';
    const styleSection = `<h2>Style &amp; occasions</h2>
<p>${p.description ?? `${cap(type.article)} ${type.label} ${pick(['se porte', 'convient parfaitement', 's\'adapte'], seed)} ${type.occasion}${p.gender === 'Femme' ? ', pour une femme qui affirme son style' : p.gender === 'Homme' ? ', pour une allure masculine affirmée' : ''}.`}</p>
<ul>
${[
  mainMat && matVocab ? `<li>${cap(matVocab.fr.adj)} — ${mainMat.material_name.toLowerCase()} de qualité</li>` : null,
  colors.length ? `<li>Disponible en ${colors.join(', ')}</li>` : null,
  sizes.length ? `<li>Tailles : ${sizes.join(' — ')}</li>` : null,
  price ? `<li>Prix : ${formatPrice(price)}</li>` : null,
].filter(Boolean).join('\n')}
</ul>`;
    const careStr = matVocab?.fr.care ?? 'Suivre les instructions de la griffe d\'entretien.';
    const careSection = `<h2>Entretien</h2><p>${careStr}</p>`;
    return [pick(accrocheTemplates, seed), matSection, styleSection, careSection].filter(Boolean).join('\n');
  } else {
    const accrocheTemplates = [
      `<p>${cap(type.article)} ${p.name} brings effortless style to every wardrobe${p.collection_name ? `, as part of the ${p.collection_name} collection` : ''}.</p>`,
      `<p>A ${pick(['standout', 'defining', 'signature'], seed)} piece ${p.collection_name ? `from the ${p.collection_name} collection` : 'of the season'}, ${p.name} blends craftsmanship with contemporary style.</p>`,
      `<p>Designed ${type.occasion}, ${p.name} makes a confident style statement${p.collection_name ? ` within the ${p.collection_name} collection` : ''}.</p>`,
    ];
    const matSection = mainMat ? `<h2>Materials &amp; craftsmanship</h2>
<p>${p.name} is crafted in <strong>${mainMat.material_name.toLowerCase()}</strong>${matVocab ? `, chosen for its ${matVocab.en.qualities}` : ''}. ${p.bom.length > 1 ? `The composition also features ${p.bom.slice(1).map((b) => b.material_name.toLowerCase()).join(', ')} for a ${pick(['refined', 'polished', 'considered'], seed)} finish.` : ''}</p>` : '';
    const styleSection = `<h2>Style &amp; occasions</h2>
<p>${p.description ?? `This ${type.label} ${pick(['works beautifully', 'is perfect', 'adapts seamlessly'], seed)} ${type.occasion}${p.gender === 'Femme' ? ', for a woman who owns her style' : p.gender === 'Homme' ? ', for a confident masculine look' : ''}.`}</p>
<ul>
${[
  mainMat && matVocab ? `<li>${cap(matVocab.en.adj)} — quality ${mainMat.material_name.toLowerCase()}</li>` : null,
  colors.length ? `<li>Available in ${colors.join(', ')}</li>` : null,
  sizes.length ? `<li>Sizes: ${sizes.join(' — ')}</li>` : null,
  price ? `<li>Price: ${formatPrice(price)}</li>` : null,
].filter(Boolean).join('\n')}
</ul>`;
    const careStr = matVocab?.en.care ?? 'Follow care label instructions.';
    const careSection = `<h2>Care instructions</h2><p>${careStr}</p>`;
    return [pick(accrocheTemplates, seed), matSection, styleSection, careSection].filter(Boolean).join('\n');
  }
}

// ─────────────────────────────────────────────────────────────
//  KEYWORDS
// ─────────────────────────────────────────────────────────────

const KW_BY_TYPE = {
  pret_a_porter: { fr: ['mode femme', 'prêt-à-porter', 'vêtement tendance'], en: ['womenswear', 'ready-to-wear', 'fashion'] },
  maroquinerie:  { fr: ['maroquinerie', 'sac de luxe', 'accessoire cuir'],    en: ['leather goods', 'luxury bag', 'leather accessory'] },
  accessoire:    { fr: ['accessoire mode', 'bijou', 'complément tenue'],       en: ['fashion accessory', 'style accessory', 'outfit accessory'] },
};
const KW_BY_GENDER = {
  femme: { fr: ['mode femme', 'tenue femme', 'style féminin'], en: ['womenswear', 'women fashion', 'feminine style'] },
  homme: { fr: ['mode homme', 'tenue homme', 'style masculin'], en: ['menswear', 'men fashion', 'masculine style'] },
};

function buildKeywords(p, lang) {
  const mainMat = getMainMaterial(p.bom);
  const familyData = getFamilyData(p.family);
  const base = (KW_BY_TYPE[p.type] ?? KW_BY_TYPE.pret_a_porter)[lang] ?? [];
  const gender = (KW_BY_GENDER[(p.gender ?? '').toLowerCase()] ?? {})[lang] ?? [];
  const familySynonyms = lang === 'fr' ? (familyData?.synonymsFr ?? []) : (familyData?.synonymsEn ?? []);
  const matSynonyms = mainMat ? (getMaterialVocab(mainMat.material_name)?.[lang]?.synonyms ?? []) : [];
  const collKw = p.collection_name ? [p.collection_name.toLowerCase()] : [];
  const nameKw = [p.name.toLowerCase()];

  const all = [
    ...nameKw,
    lang === 'fr' ? getFamilyLabel(p.family, 'fr') : getFamilyLabel(p.family, 'en'),
    ...familySynonyms.slice(0, 2),
    mainMat ? mainMat.material_name.toLowerCase() : null,
    ...matSynonyms.slice(0, 2),
    ...base,
    ...gender.slice(0, 2),
    ...collKw,
    p.reference.toLowerCase(),
  ].filter(Boolean);

  return [...new Set(all)].slice(0, 12);
}

// ─────────────────────────────────────────────────────────────
//  FAQ GEO — 8-10 Q&A optimisées pour les moteurs génératifs
// ─────────────────────────────────────────────────────────────

function buildFaq(p, lang) {
  const mainMat = getMainMaterial(p.bom);
  const matVocab = getMaterialVocab(mainMat?.material_name);
  const colors = getColors(p.variants);
  const sizes = getSizes(p.variants);
  const type = (TYPE_CONTEXT[p.type] ?? TYPE_CONTEXT.pret_a_porter)[lang];
  const price = p.costing?.retail_price ?? p.target_retail_price;
  const familyLabel = getFamilyLabel(p.family, lang);
  const faq = [];

  if (lang === 'fr') {
    // Q1 — Composition
    if (mainMat) {
      const allMats = (p.bom ?? []).map((b) => b.material_name).join(', ');
      faq.push({ q: `Quelle est la composition de ${p.name} ?`, a: `${p.name} est composé de ${allMats}.${matVocab ? ` La ${mainMat.material_name.toLowerCase()} a été sélectionnée pour ${matVocab.fr.qualities}.` : ''}` });
    }
    // Q2 — Coloris
    if (colors.length) {
      faq.push({ q: `Dans quels coloris ${p.name} est-il disponible ?`, a: `${p.name} est disponible en ${colors.join(', ')}. ${colors.length > 2 ? 'Ces coloris ont été sélectionnés pour leur polyvalence et leur accord avec les tendances de la saison.' : 'Cette palette s\'adapte à toutes les occasions.'}` });
    }
    // Q3 — Tailles
    if (sizes.length) {
      faq.push({ q: `Quelles tailles sont disponibles pour ${p.name} ?`, a: `${p.name} est proposé en tailles ${sizes.join(', ')}. En cas de doute sur votre taille, consultez notre guide des tailles ou contactez notre service client.` });
    }
    // Q4 — Entretien
    if (mainMat) {
      const care = matVocab?.fr.care ?? 'Suivre les instructions de la griffe d\'entretien.';
      faq.push({ q: `Comment entretenir ${p.name} ?`, a: `Pour préserver la qualité de ${p.name}, nous recommandons : ${care}${matVocab?.fr.careSteps ? ` En détail : ${matVocab.fr.careSteps.join('. ')}.` : ''}` });
    }
    // Q5 — Prix
    if (price) {
      faq.push({ q: `Quel est le prix de ${p.name} ?`, a: `${p.name} est proposé au prix public conseillé de ${formatPrice(price)}${p.collection_name ? `, dans le cadre de la collection ${p.collection_name}` : ''}.` });
    }
    // Q6 — Occasions / usages
    const useCases = USE_CASE_TEMPLATES[p.type]?.fr ?? USE_CASE_TEMPLATES.pret_a_porter.fr;
    faq.push({ q: `Pour quelles occasions porter ${p.name} ?`, a: `${p.name} est une pièce polyvalente, idéale pour : ${useCases.join(', ')}. ${p.style_notes ? p.style_notes.slice(0, 100) + '.' : ''}` });
    // Q7 — Collection / saison
    if (p.collection_name) {
      faq.push({ q: `À quelle collection appartient ${p.name} ?`, a: `${p.name} fait partie de la collection ${p.collection_name}${p.season ? ` (${p.season})` : ''}. Cette collection ${p.year ? `a été conçue pour ${p.year}` : 'est disponible en boutiques et en ligne'}.` });
    }
    // Q8 — Provenance / qualité
    faq.push({ q: `Quelle est la qualité de fabrication de ${p.name} ?`, a: `${p.name} est fabriqué selon des standards de qualité rigoureux${mainMat ? `, en ${mainMat.material_name.toLowerCase()}${mainMat.composition ? ` (${mainMat.composition})` : ''}` : ''}. ${p.supplier_name ? `La fabrication est confiée à ${p.supplier_name}, partenaire de confiance.` : 'Chaque pièce est contrôlée avant expédition.'}` });
    // Q9 — Genre / destinataire
    if (p.gender) {
      faq.push({ q: `${p.name} est-il disponible pour les deux genres ?`, a: `${p.name} est conçu pour ${p.gender.toLowerCase()}. Le ${familyLabel ?? 'vêtement'} est étudié dans des proportions spécifiques pour offrir le meilleur résultat.` });
    }
    // Q10 — Alternative / comparaison
    faq.push({ q: `Qu'est-ce qui distingue ${p.name} des autres ${familyLabel ?? 'pièces'} ?`, a: `${p.name} se distingue par ${matVocab ? `sa matière ${matVocab.fr.adj} (${mainMat?.material_name?.toLowerCase()})` : 'sa construction soignée'}${p.collection_name ? `, son appartenance à la collection exclusive ${p.collection_name}` : ''} et sa versatilité. ${p.description ? p.description.slice(0, 120) + '.' : ''}` });

  } else {
    // English FAQ
    if (mainMat) {
      const allMats = (p.bom ?? []).map((b) => b.material_name).join(', ');
      faq.push({ q: `What is ${p.name} made of?`, a: `${p.name} is made of ${allMats}.${matVocab ? ` The ${mainMat.material_name.toLowerCase()} was selected for its ${matVocab.en.qualities}.` : ''}` });
    }
    if (colors.length) {
      faq.push({ q: `What colors is ${p.name} available in?`, a: `${p.name} is available in ${colors.join(', ')}. ${colors.length > 2 ? 'These colors were selected for their versatility and seasonal relevance.' : 'This color selection suits all occasions.'}` });
    }
    if (sizes.length) {
      faq.push({ q: `What sizes does ${p.name} come in?`, a: `${p.name} is available in sizes ${sizes.join(', ')}. Please refer to our size guide or contact customer service if you need help finding your size.` });
    }
    if (mainMat) {
      const care = matVocab?.en.care ?? 'Follow care label instructions.';
      faq.push({ q: `How do I care for ${p.name}?`, a: `To keep your ${p.name.toLowerCase()} in perfect condition: ${care}${matVocab?.en.careSteps ? ` Detailed steps: ${matVocab.en.careSteps.join('. ')}.` : ''}` });
    }
    if (price) {
      faq.push({ q: `How much does ${p.name} cost?`, a: `${p.name} is available at a recommended retail price of ${formatPrice(price)}${p.collection_name ? `, as part of the ${p.collection_name} collection` : ''}.` });
    }
    const useCases = USE_CASE_TEMPLATES[p.type]?.en ?? USE_CASE_TEMPLATES.pret_a_porter.en;
    faq.push({ q: `When can I wear ${p.name}?`, a: `${p.name} is a versatile piece, perfect for: ${useCases.join(', ')}. ${p.style_notes ? p.style_notes.slice(0, 100) + '.' : ''}` });
    if (p.collection_name) {
      faq.push({ q: `Which collection does ${p.name} belong to?`, a: `${p.name} is part of the ${p.collection_name} collection${p.season ? ` (${p.season})` : ''}. ${p.year ? `Designed for ${p.year}.` : 'Available in boutiques and online.'}` });
    }
    faq.push({ q: `What is the quality of ${p.name}?`, a: `${p.name} is crafted to rigorous quality standards${mainMat ? `, in ${mainMat.material_name.toLowerCase()}${mainMat.composition ? ` (${mainMat.composition})` : ''}` : ''}. ${p.supplier_name ? `Manufactured by ${p.supplier_name}, a trusted production partner.` : 'Each piece is quality-checked before dispatch.'}` });
    if (p.gender) {
      faq.push({ q: `Who is ${p.name} designed for?`, a: `${p.name} is designed for ${p.gender.toLowerCase()}. The ${familyLabel ?? 'garment'} is tailored with specific proportions for the best fit and silhouette.` });
    }
    faq.push({ q: `What makes ${p.name} different from other ${familyLabel ?? 'pieces'}?`, a: `${p.name} stands out for ${matVocab ? `its ${matVocab.en.adj} ${mainMat?.material_name?.toLowerCase()}` : 'its refined construction'}${p.collection_name ? `, its place in the exclusive ${p.collection_name} collection` : ''} and its versatility. ${p.description ? p.description.slice(0, 120) + '.' : ''}` });
  }

  return faq;
}

// ─────────────────────────────────────────────────────────────
//  GEO — Blurb factuel citable par IA
// ─────────────────────────────────────────────────────────────

function buildGeoBlurb(p, lang) {
  const mainMat = getMainMaterial(p.bom);
  const matVocab = getMaterialVocab(mainMat?.material_name);
  const price = p.costing?.retail_price ?? p.target_retail_price;
  const familyLabel = getFamilyLabel(p.family, lang);

  if (lang === 'fr') {
    const parts = [];
    parts.push(`${p.name} est ${familyLabel ? `un ${familyLabel}` : 'une pièce'} de la ${p.collection_name ?? 'collection'} ${p.season ?? ''} ${p.year ?? ''}.`.replace(/\s+/g, ' ').trim());
    if (mainMat) {
      parts.push(`Fabriqué en ${mainMat.material_name.toLowerCase()}${mainMat.composition ? ` (${mainMat.composition})` : ''}${matVocab ? `, réputé pour ${matVocab.fr.qualities}` : ''}.`);
    }
    if (price) {
      parts.push(`Prix public conseillé : ${formatPrice(price)}.`);
    }
    if (p.supplier_name) {
      parts.push(`Produit par ${p.supplier_name}.`);
    }
    return parts.join(' ');
  } else {
    const parts = [];
    parts.push(`${p.name} is ${familyLabel ? `a ${familyLabel}` : 'a piece'} from the ${p.collection_name ?? 'collection'} ${p.season ?? ''} ${p.year ?? ''}.`.replace(/\s+/g, ' ').trim());
    if (mainMat) {
      parts.push(`Crafted in ${mainMat.material_name.toLowerCase()}${mainMat.composition ? ` (${mainMat.composition})` : ''}${matVocab ? `, known for its ${matVocab.en.qualities}` : ''}.`);
    }
    if (price) {
      parts.push(`Recommended retail price: ${formatPrice(price)}.`);
    }
    if (p.supplier_name) {
      parts.push(`Manufactured by ${p.supplier_name}.`);
    }
    return parts.join(' ');
  }
}

// ─────────────────────────────────────────────────────────────
//  GEO — Titres alternatifs / synonymes
// ─────────────────────────────────────────────────────────────

function buildAlternateTitles(p, lang) {
  const mainMat = getMainMaterial(p.bom);
  const familyData = getFamilyData(p.family);
  const colors = getColors(p.variants);
  const matName = mainMat?.material_name?.toLowerCase() ?? '';
  const synonyms = lang === 'fr' ? (familyData?.synonymsFr ?? []) : (familyData?.synonymsEn ?? []);
  const matSynonyms = mainMat ? (getMaterialVocab(mainMat.material_name)?.[lang]?.synonyms ?? []) : [];
  const familyLabel = getFamilyLabel(p.family, lang) ?? '';

  const titles = [p.name];

  if (familyLabel && matName) {
    if (lang === 'fr') {
      titles.push(`${cap(familyLabel)} ${matName}`);
      if (colors[0]) titles.push(`${cap(familyLabel)} ${matName} ${colors[0].toLowerCase()}`);
      if (p.collection_name) titles.push(`${p.name} ${p.collection_name}`);
    } else {
      titles.push(`${cap(matName)} ${familyLabel}`);
      if (colors[0]) titles.push(`${cap(colors[0].toLowerCase())} ${matName} ${familyLabel}`);
      if (p.collection_name) titles.push(`${p.name} ${p.collection_name}`);
    }
  }
  titles.push(...synonyms.slice(0, 2));

  return [...new Set(titles.filter(Boolean))].slice(0, 8);
}

// ─────────────────────────────────────────────────────────────
//  GEO — Cas d'usage
// ─────────────────────────────────────────────────────────────

function buildUseCases(p, lang) {
  return USE_CASE_TEMPLATES[p.type]?.[lang] ?? USE_CASE_TEMPLATES.pret_a_porter[lang];
}

// ─────────────────────────────────────────────────────────────
//  GEO — Entités nommées structurées
// ─────────────────────────────────────────────────────────────

function buildEntities(p, lang) {
  const mainMat = getMainMaterial(p.bom);
  const colors = getColors(p.variants);
  const sizes = getSizes(p.variants);
  const price = p.costing?.retail_price ?? p.target_retail_price;

  const entities = {
    produit: p.name,
    reference: p.reference,
    famille: getFamilyLabel(p.family, lang) ?? p.family,
    genre: p.gender,
    collection: p.collection_name,
    saison: p.season,
    annee: p.year,
    fabricant: p.supplier_name,
    matiere_principale: mainMat?.material_name,
    composition: mainMat?.composition,
    coloris: colors,
    tailles: sizes,
    prix: price ? parseFloat(price).toFixed(2) : null,
    devise: 'EUR',
  };

  return JSON.parse(JSON.stringify(entities)); // remove undefined
}

// ─────────────────────────────────────────────────────────────
//  GEO — HowTo entretien (schema.org)
// ─────────────────────────────────────────────────────────────

function buildHowToCare(p, lang) {
  const mainMat = getMainMaterial(p.bom);
  const matVocab = getMaterialVocab(mainMat?.material_name);
  const careSteps = matVocab?.[lang]?.careSteps ?? (
    lang === 'fr'
      ? ['Suivre les instructions de la griffe d\'entretien', 'Stocker dans un endroit sec à l\'abri de la lumière']
      : ['Follow garment care label instructions', 'Store in a dry place away from direct light']
  );

  return {
    '@type': 'HowTo',
    name: lang === 'fr'
      ? `Comment entretenir ${p.name} — Guide d'entretien`
      : `How to care for ${p.name} — Care guide`,
    description: lang === 'fr'
      ? `Guide d'entretien complet pour ${p.name}${mainMat ? ` en ${mainMat.material_name.toLowerCase()}` : ''}.`
      : `Complete care guide for ${p.name}${mainMat ? ` in ${mainMat.material_name.toLowerCase()}` : ''}.`,
    supply: mainMat ? [{ '@type': 'HowToSupply', name: mainMat.material_name }] : [],
    step: careSteps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.split(' — ')[0] ?? step,
      text: step,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
//  JSON-LD @graph enrichi (Product + BreadcrumbList + HowTo)
// ─────────────────────────────────────────────────────────────

function buildJsonLd(p) {
  const colors = getColors(p.variants);
  const sizes = getSizes(p.variants);
  const mainMat = getMainMaterial(p.bom);
  const matVocab = getMaterialVocab(mainMat?.material_name);
  const price = p.costing?.retail_price ?? p.target_retail_price;
  const familyLabel = getFamilyLabel(p.family, 'en');

  // Product schema.org
  const product = {
    '@type': 'Product',
    '@id': `#product-${p.reference}`,
    name: p.name,
    sku: p.reference,
    mpn: p.reference,
    description: p.description ?? undefined,
    brand: {
      '@type': 'Brand',
      name: p.collection_name ?? 'PLM Fashion',
      ...(p.collection_name ? { description: `Collection ${p.collection_name}` } : {}),
    },
    material: (p.bom ?? []).map((b) => b.material_name).join(', ') || undefined,
    color: colors.join(', ') || undefined,
    size: sizes.join(', ') || undefined,
    audience: p.gender ? {
      '@type': 'PeopleAudience',
      suggestedGender: p.gender.toLowerCase() === 'femme' ? 'female' : p.gender.toLowerCase() === 'homme' ? 'male' : 'unisex',
    } : undefined,
    ...(mainMat?.composition ? { material: mainMat.composition } : {}),
    additionalProperty: [
      mainMat ? { '@type': 'PropertyValue', name: 'Material', value: mainMat.material_name } : null,
      mainMat?.composition ? { '@type': 'PropertyValue', name: 'Composition', value: mainMat.composition } : null,
      p.family ? { '@type': 'PropertyValue', name: 'Category', value: familyLabel ?? p.family } : null,
      p.supplier_name ? { '@type': 'PropertyValue', name: 'Manufacturer', value: p.supplier_name } : null,
      p.season ? { '@type': 'PropertyValue', name: 'Season', value: p.season } : null,
      p.year ? { '@type': 'PropertyValue', name: 'Year', value: String(p.year) } : null,
      matVocab ? { '@type': 'PropertyValue', name: 'Care', value: matVocab.en.care } : null,
    ].filter(Boolean),
    ...(p.collection_name ? {
      isPartOf: {
        '@type': 'Collection',
        name: p.collection_name,
        ...(p.season ? { temporalCoverage: p.season } : {}),
      },
    } : {}),
    offers: price ? {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: parseFloat(price).toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    } : undefined,
  };

  // BreadcrumbList
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Collections', item: '#/collections' },
      p.collection_name ? { '@type': 'ListItem', position: 2, name: p.collection_name, item: `#/collections/${p.collection_id}` } : null,
      { '@type': 'ListItem', position: p.collection_name ? 3 : 2, name: p.name, item: `#/products/${p.id}` },
    ].filter(Boolean),
  };

  // HowTo care
  const howTo = buildHowToCare(p, 'en');

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [product, breadcrumb, howTo],
  };

  return JSON.parse(JSON.stringify(graph));
}

// ─────────────────────────────────────────────────────────────
//  EXPORT PRINCIPAL
// ─────────────────────────────────────────────────────────────

function buildFiche(p) {
  const bom = p.bom ?? [];
  const variants = p.variants ?? [];
  const pFull = { ...p, bom, variants };

  return {
    wholesale_title:  buildWholesaleTitle(pFull),
    wholesale_body:   buildWholesaleBody(pFull, bom, variants),

    seo_title_fr:     buildSeoTitle(pFull, 'fr'),
    meta_desc_fr:     buildMeta(pFull, 'fr'),
    description_fr:   buildEcomDescription(pFull, 'fr'),
    keywords_fr:      buildKeywords(pFull, 'fr'),
    faq_fr:           buildFaq(pFull, 'fr'),

    seo_title_en:     buildSeoTitle(pFull, 'en'),
    meta_desc_en:     buildMeta(pFull, 'en'),
    description_en:   buildEcomDescription(pFull, 'en'),
    keywords_en:      buildKeywords(pFull, 'en'),
    faq_en:           buildFaq(pFull, 'en'),

    json_ld:          buildJsonLd(pFull),

    // GEO fields
    geo_blurb_fr:           buildGeoBlurb(pFull, 'fr'),
    geo_blurb_en:           buildGeoBlurb(pFull, 'en'),
    use_cases_fr:           buildUseCases(pFull, 'fr'),
    use_cases_en:           buildUseCases(pFull, 'en'),
    alternate_titles_fr:    buildAlternateTitles(pFull, 'fr'),
    alternate_titles_en:    buildAlternateTitles(pFull, 'en'),
    entities_fr:            buildEntities(pFull, 'fr'),
    entities_en:            buildEntities(pFull, 'en'),
    how_to_care_jsonld:     buildHowToCare(pFull, 'fr'),
  };
}

module.exports = { buildFiche };
