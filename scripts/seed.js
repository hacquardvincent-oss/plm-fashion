/**
 * Seed de démonstration — PLM Fashion
 * Insère : 1 collection, 1 fournisseur, des matières, 4 produits + fiches techniques
 * Données extraites des fichiers SPECIFICATIONS/*.xlsx
 *
 * Usage : node scripts/seed_demo.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
  client_encoding: 'UTF8',
});
const q = (text, params) => pool.query(text, params);

// ─────────────────────────────────────────────────────────────
//  DONNÉES SOURCE (extraites des xlsx)
// ─────────────────────────────────────────────────────────────

const COLLECTION = {
  code: 'VB-25H',
  name: 'Vibrations — Hiver 2025',
  season: '25H',
  year: 2025,
  status: 'en_cours',
  target_refs: 80,
  budget: 2500000,
  description: 'Collection Hiver 2025 — ligne prêt-à-porter féminin. Matières nobles, coupes épurées, palette de couleurs sourdes et florales.',
  delivery_date: '2025-07-15',
  showroom_date: '2025-01-20',
};

const SUPPLIER = {
  code: 'HGT-CN',
  name: 'HONGTEX',
  country: 'Chine',
  city: 'Guangzhou',
  contact_name: 'Wei Zhang',
  contact_email: 'production@hongtex.cn',
  contact_phone: '+86 20 8888 1234',
  currency: 'EUR',
  payment_terms: '30 jours fin de mois',
  lead_time_days: 90,
  quality_score: 8.2,
  certifications: ['ISO 9001', 'ISO 45001', 'OEKO TEX-100'],
  specialties: ['Satin', 'Tissus légers', 'Prêt-à-porter féminin'],
  is_active: true,
};

const MATERIALS = [
  {
    code: 'MAT-SL-1710BVW',
    name: 'Satin Lourd 100% PL',
    type: 'tissu',
    composition: '100% Polyester',
    width_cm: 150,
    weight_gsm: 124,
    color_reference: '441',
    color_name: 'ROSE',
    unit: 'ml',
    price_per_unit: 4.80,
    currency: 'EUR',
    supplier_ref: 'SL-1710BVW',
    lead_time_days: 60,
    is_validated: true,
    notes: 'Certifié OEKO TEX-100. Usage : corps principal robe EURIA.',
  },
  {
    code: 'MAT-VISA-NR',
    name: 'Viscose Satinée',
    type: 'doublure',
    composition: '100% Viscose',
    width_cm: 140,
    weight_gsm: 85,
    color_reference: '441',
    color_name: 'ROSE',
    unit: 'ml',
    price_per_unit: 3.20,
    currency: 'EUR',
    supplier_ref: 'VISA-NR-441',
    lead_time_days: 45,
    is_validated: true,
  },
  {
    code: 'MAT-CREM-GS',
    name: 'Crêpe de Soie Georgette',
    type: 'tissu',
    composition: '100% Soie',
    width_cm: 140,
    weight_gsm: 55,
    color_reference: 'MULT',
    color_name: 'MULTICOLORE',
    unit: 'ml',
    price_per_unit: 22.00,
    currency: 'EUR',
    lead_time_days: 75,
    is_validated: false,
    notes: 'Tissu imprimé floral ESIL. Développement en cours.',
  },
  {
    code: 'MAT-ZIP-16CM',
    name: 'Fermeture Invisible 16cm',
    type: 'fermeture',
    composition: 'Nylon / Métal',
    unit: 'pce',
    price_per_unit: 0.45,
    currency: 'EUR',
    supplier_ref: 'ZIP-INV-16',
    lead_time_days: 30,
    is_validated: true,
  },
  {
    code: 'MAT-ETQ-COMP',
    name: 'Étiquette Composition',
    type: 'emballage',
    composition: 'Satin polyester',
    unit: 'pce',
    price_per_unit: 0.08,
    currency: 'EUR',
    lead_time_days: 21,
    is_validated: true,
    notes: 'Conforme directive 1007/2011/CE — mentions obligatoires FR/EN/DE.',
  },
  {
    code: 'MAT-ETQ-MARQ',
    name: 'Étiquette Marque Tissée',
    type: 'emballage',
    composition: 'Polyester tissé',
    unit: 'pce',
    price_per_unit: 0.22,
    currency: 'EUR',
    lead_time_days: 35,
    is_validated: true,
  },
];

const PRODUCTS = [
  {
    reference: '4HVA68-V08793',
    name: 'EURIA',
    type: 'pret_a_porter',
    family: 'Robes',
    sub_family: 'Robe longue',
    status: 'proto_2',
    gender: 'Femme',
    description: 'Robe longue en satin lourd 100% polyester. Col rond, manches longues, fermeture invisible dans le dos. Tombé fluide.',
    style_notes: 'Silhouette élancée. Coupe ajustée buste, légèrement évasée bas. Inspiration soirée habillée.',
    target_retail_price: 249.00,
    target_cost: 62.00,
    target_margin: 45,
    specSheet: {
      fiche_technique: {
        theme_code: '4HVA68',
        modele_code: 'V08793',
        fabricant: 'HONGTEX',
        saison: '25H',
        annee: 2025,
        genre: 'Femme',
        categorie: 'Robe longue',
        matiere_principale: 'Satin Lourd',
        composition: '100% Polyester',
        grammage_gsm: 124,
        largeur_cm: 150,
        certification: 'OEKO TEX-100',
        coloris_ref: '441',
        coloris_nom: 'ROSE',
        entretien: [
          'Lavage main 30°C',
          'Ne pas essorer',
          'Séchage à plat',
          'Repassage fer doux sur l\'envers',
          'Ne pas mettre au sèche-linge',
          'Nettoyage à sec autorisé',
        ],
        pays_fabrication: 'Chine',
        norme_qualite: 'ISO 9001 / ISO 45001',
        ref_fournisseur_tissu: 'SL-1710BVW',
      },
      fcm: [
        { position: 1, designation: 'Corps principal', matiere: 'Satin Lourd 100% PL', ref: 'SL-1710BVW', fournisseur: 'HONGTEX', quantite: 2.8, unite: 'ml', coloris: '441 ROSE', commentaire: '' },
        { position: 2, designation: 'Doublure buste', matiere: 'Viscose Satinée 100% VI', ref: 'VISA-NR-441', fournisseur: 'HONGTEX', quantite: 0.9, unite: 'ml', coloris: '441 ROSE', commentaire: 'Doublure partielle — buste uniquement' },
        { position: 3, designation: 'Fermeture invisible dos', matiere: 'Zip invisible nylon', ref: 'ZIP-INV-16', fournisseur: 'YKK', quantite: 1, unite: 'pce', coloris: 'Assorti', commentaire: 'L = 16 cm' },
        { position: 4, designation: 'Fil à coudre principal', matiere: '100% Polyester', ref: 'FIL-PL-441', fournisseur: 'AMANN', quantite: 150, unite: 'ml', coloris: '441 ROSE', commentaire: 'Ticket 40' },
        { position: 5, designation: 'Étiquette composition', matiere: 'Satin polyester tissé', ref: 'ETQ-COMP-FR', fournisseur: 'SML', quantite: 1, unite: 'pce', coloris: 'Blanc', commentaire: 'Mentions : 100% PL — Lavage 30° — Made in China' },
        { position: 6, designation: 'Étiquette marque', matiere: 'Polyester tissé', ref: 'ETQ-MARQ-VB', fournisseur: 'SML', quantite: 1, unite: 'pce', coloris: 'Noir / Or', commentaire: 'Positionnement : col centre dos' },
        { position: 7, designation: 'Étiquette taille', matiere: 'Satin polyester', ref: 'ETQ-TAILLE', fournisseur: 'SML', quantite: 1, unite: 'pce', coloris: 'Blanc', commentaire: 'Sur étiquette composition' },
        { position: 8, designation: 'Cintre épaule', matiere: 'Satin assorti', ref: 'CINTRE-SAT', fournisseur: 'HONGTEX', quantite: 2, unite: 'pce', coloris: '441 ROSE', commentaire: 'Cousus intérieur épaules' },
      ],
      mesures: {
        systeme_taille: 'FR',
        taille_base: '38',
        points_mesure: [
          { code: 'A', nom: 'Tour de poitrine', description: 'Mesuré à plat × 2, passant par les points les plus forts de poitrine' },
          { code: 'B', nom: 'Tour de taille', description: 'Au niveau de la taille naturelle, à plat × 2' },
          { code: 'C', nom: 'Tour de hanches', description: 'À 20 cm sous la taille, à plat × 2' },
          { code: 'D', nom: 'Longueur totale', description: 'Du point d\'épaule (couture) au bas de la robe' },
          { code: 'E', nom: 'Longueur de manche', description: 'De la couture d\'épaule au bas de manche' },
          { code: 'F', nom: 'Largeur d\'épaule', description: 'D\'une couture d\'épaule à l\'autre, à plat, à 12 cm du centre encolure dos' },
          { code: 'G', nom: 'Profondeur d\'encolure dos', description: 'Du point d\'épaule au bord de l\'encolure dos' },
          { code: 'H', nom: 'Hauteur de buste', description: 'Du point d\'épaule au niveau le plus fort de poitrine' },
          { code: 'I', nom: 'Bas de manche (poignet)', description: 'Tour de manche au poignet, à plat × 2' },
        ],
        grading: {
          '34': { A: 41, B: 32, C: 43, D: 138, E: 61, F: 36.5, G: 8.5, H: 24, I: 14 },
          '36': { A: 43, B: 34, C: 45, D: 138.5, E: 61.5, F: 37.5, G: 8.5, H: 24.5, I: 14.5 },
          '38': { A: 45, B: 36, C: 47, D: 139, E: 62, F: 38.5, G: 9, H: 25, I: 15 },
          '40': { A: 47, B: 38, C: 49, D: 139.5, E: 62, F: 39.5, G: 9, H: 25.5, I: 15 },
          '42': { A: 50, B: 41, C: 52, D: 140, E: 62.5, F: 40.5, G: 9.5, H: 26, I: 15.5 },
          '44': { A: 53, B: 44, C: 55, D: 140.5, E: 63, F: 41.5, G: 9.5, H: 26.5, I: 16 },
        },
        tolerances: {
          A: { plus: 1, minus: 1 },
          B: { plus: 1, minus: 1 },
          C: { plus: 1.5, minus: 1 },
          D: { plus: 1, minus: 1 },
          E: { plus: 0.5, minus: 0.5 },
          F: { plus: 0.5, minus: 0.5 },
          G: { plus: 0.5, minus: 0.5 },
          H: { plus: 0.5, minus: 0.5 },
          I: { plus: 0.5, minus: 0.5 },
        },
      },
      prise_mesures: {
        notes: 'Toutes les mesures sont prises sur vêtement à plat, sans étirer le tissu. Doubler les mesures à plat pour obtenir le tour. Référence : taille 38 FR.',
        instructions: [
          { code: 'A', description: 'Poser la robe à plat. Mesurer horizontalement à la hauteur du point le plus fort de poitrine, sous les aisselles. Valeur × 2 = tour de poitrine.' },
          { code: 'B', description: 'Identifier la taille naturelle (rétrécissement de la robe). Mesurer horizontalement à plat. Valeur × 2 = tour de taille.' },
          { code: 'C', description: 'À 20 cm sous la couture de taille (ou point B). Mesurer horizontalement. Valeur × 2 = tour de hanches.' },
          { code: 'D', description: 'Coucher la robe à plat. Mesurer du point d\'épaule (bord de couture) jusqu\'au bas de la robe, en suivant le milieu devant.' },
          { code: 'E', description: 'Bras tendu le long du corps. Mesurer de la couture d\'épaule jusqu\'au bas de la manche.' },
          { code: 'F', description: 'À plat, mesurer d\'une couture d\'épaule à l\'autre. Point de mesure : à 12 cm du bord centre encolure dos.' },
        ],
      },
      commentaires: [
        { id: '1', date: '2024-09-15T10:00:00Z', auteur: 'Marie Dupont', zone: 'Encolure', commentaire: 'Revoir la forme de l\'encolure ronde — trop fermée sur proto 1. Élargir de 1 cm côté devant.', proto: 'P1', statut: 'traite' },
        { id: '2', date: '2024-09-15T11:30:00Z', auteur: 'Sophie Martin', zone: 'Longueur', commentaire: 'Longueur validée sur taille 38 après correction +2 cm. Contrôler le grading taille 34 / 44.', proto: 'P1', statut: 'traite' },
        { id: '3', date: '2024-10-20T09:00:00Z', auteur: 'Marie Dupont', zone: 'Manche', commentaire: 'Arrondi de manche revu — OK sur P2. Légère correction poignet taille 34 à valider.', proto: 'P2', statut: 'ouvert' },
        { id: '4', date: '2024-10-20T14:00:00Z', auteur: 'Jean-Pierre Lorca', zone: 'Fermeture', commentaire: 'Zip invisible dos : vérifier que la tête de zip est bien cachée en position fermée. Valider sur P2.', proto: 'P2', statut: 'ouvert' },
      ],
      labelling: {
        notes: 'Conforme directive UE 1007/2011/CE. Langues obligatoires : FR, EN, DE, ES, IT.',
        etiquettes: [
          { type: 'Marque', position: 'Centre dos, au niveau de l\'encolure, sur couture', contenu: 'Logo marque tissé — fond noir, lettres or', obligatoire: true },
          { type: 'Composition', position: 'Cousue sur l\'étiquette marque (dos)', contenu: '100% Polyester / 100% Polyester (doublure : 100% Viscose)', obligatoire: true },
          { type: 'Taille', position: 'Cousue sur l\'étiquette composition', contenu: 'Taille FR / EU : 34 / 36 / 38 / 40 / 42 / 44', obligatoire: true },
          { type: 'Entretien', position: 'Dans la couture latérale gauche, à 5 cm du bas', contenu: 'Pictogrammes ISO : lavage main 30° / séchage plat / fer doux envers / nettoyage à sec', obligatoire: true },
          { type: 'Origine', position: 'Intégrée à l\'étiquette composition', contenu: 'Fabriqué en Chine / Made in China', obligatoire: true },
          { type: 'Prix / code-barres', position: 'Étiquette volante attachée au cintre', contenu: 'EAN-13 + prix public TTC', obligatoire: false },
        ],
      },
      croquis: {
        description: 'Robe longue EURIA — vue face et dos. Col rond, manches longues droites, fermeture invisible dos.',
        notes: 'Croquis P2 validés par DA le 22/10/2024. Prochaine étape : SMS.',
        details: [
          { label: 'Détail col', description: 'Col rond 2 cm, passepoilé satin assorti' },
          { label: 'Détail manche', description: 'Manche droite, ourlet replié 2 cm cousu main' },
          { label: 'Détail fermeture', description: 'Zip invisible 16 cm dos centre, tête de zip au niveau du col' },
          { label: 'Bas de robe', description: 'Ourlet replié 2.5 cm, point invisible machine' },
        ],
      },
    },
    variants: [
      { sku: '4HVA68-V08793-441-34', color_name: 'ROSE', color_ref: '441', size: '34', size_system: 'FR' },
      { sku: '4HVA68-V08793-441-36', color_name: 'ROSE', color_ref: '441', size: '36', size_system: 'FR' },
      { sku: '4HVA68-V08793-441-38', color_name: 'ROSE', color_ref: '441', size: '38', size_system: 'FR' },
      { sku: '4HVA68-V08793-441-40', color_name: 'ROSE', color_ref: '441', size: '40', size_system: 'FR' },
      { sku: '4HVA68-V08793-441-42', color_name: 'ROSE', color_ref: '441', size: '42', size_system: 'FR' },
      { sku: '4HVA68-V08793-441-44', color_name: 'ROSE', color_ref: '441', size: '44', size_system: 'FR' },
    ],
  },
  {
    reference: '5EVA78-V08795',
    name: 'ESIL',
    type: 'pret_a_porter',
    family: 'Robes',
    sub_family: 'Robe midi',
    status: 'proto_1',
    gender: 'Femme',
    description: 'Robe midi en crêpe de soie georgette imprimé floral. Col V, manches courtes évasées, taille marquée par une ceinture intégrée.',
    style_notes: 'Imprimé exclusif développé pour la collection. Inspiration jardin botanique. Usage : cocktail / déjeuner.',
    target_retail_price: 320.00,
    target_cost: 88.00,
    target_margin: 42,
    specSheet: {
      fiche_technique: {
        theme_code: '5EVA78',
        modele_code: 'V08795',
        fabricant: 'HONGTEX',
        saison: '25H',
        annee: 2025,
        genre: 'Femme',
        categorie: 'Robe midi',
        matiere_principale: 'Crêpe de Soie Georgette',
        composition: '100% Soie',
        grammage_gsm: 55,
        largeur_cm: 140,
        certification: 'OEKO TEX-100',
        coloris_ref: 'MULT-FLO',
        coloris_nom: 'FLORAL MULTICOLORE',
        entretien: [
          'Lavage main 30°C uniquement',
          'Ne pas essorer — égoutter doucement',
          'Séchage à l\'ombre, à plat',
          'Repassage fer doux (140°C max) sur l\'envers',
          'Ne pas mettre au sèche-linge',
          'Nettoyage à sec conseillé',
        ],
        pays_fabrication: 'Chine',
        norme_qualite: 'ISO 9001 / ISO 45001',
        impression: 'Impression numérique jet d\'encre réactive',
        solidite_couleur: 'Note 4/5 (lavage / frottement)',
      },
      fcm: [
        { position: 1, designation: 'Corps principal imprimé', matiere: 'Crêpe Georgette 100% Soie', ref: 'CREM-GS-MULT', fournisseur: 'HONGTEX', quantite: 2.2, unite: 'ml', coloris: 'Floral multicolore', commentaire: 'Imprimé exclusif développé avec Bureau Vallée Paris' },
        { position: 2, designation: 'Doublure complète', matiere: 'Viscose Satinée 100% VI', ref: 'VISA-CREM', fournisseur: 'HONGTEX', quantite: 1.8, unite: 'ml', coloris: 'Écru 001', commentaire: 'Doublure intégrale corps et manches' },
        { position: 3, designation: 'Ceinture intégrée', matiere: 'Crêpe Georgette 100% Soie', ref: 'CREM-GS-MULT', fournisseur: 'HONGTEX', quantite: 0.3, unite: 'ml', coloris: 'Assortie impression', commentaire: 'Même tissu corps, coupé en biais' },
        { position: 4, designation: 'Baguette col V', matiere: 'Sergé Soie 100%', ref: 'SERG-SI-001', fournisseur: 'HONGTEX', quantite: 0.15, unite: 'ml', coloris: 'Fond principal', commentaire: '' },
        { position: 5, designation: 'Fermeture invisible', matiere: 'Zip invisible nylon', ref: 'ZIP-INV-22', fournisseur: 'YKK', quantite: 1, unite: 'pce', coloris: 'Assorti', commentaire: 'L = 22 cm, coté gauche' },
        { position: 6, designation: 'Fil à coudre', matiere: '100% Polyester', ref: 'FIL-PL-CREM', fournisseur: 'AMANN', quantite: 120, unite: 'ml', coloris: 'Écru', commentaire: 'Ticket 40 — couleur neutre pour tissu imprimé' },
        { position: 7, designation: 'Étiquette composition', matiere: 'Satin polyester', ref: 'ETQ-COMP-SI', fournisseur: 'SML', quantite: 1, unite: 'pce', coloris: 'Blanc', commentaire: '100% Soie — Lavage main 30° — Made in China' },
        { position: 8, designation: 'Étiquette marque', matiere: 'Polyester tissé', ref: 'ETQ-MARQ-VB', fournisseur: 'SML', quantite: 1, unite: 'pce', coloris: 'Noir / Or', commentaire: 'Standard collection VB' },
      ],
      mesures: {
        systeme_taille: 'INT',
        taille_base: 'M',
        points_mesure: [
          { code: 'A', nom: 'Tour de poitrine', description: 'À plat × 2, niveau point fort poitrine' },
          { code: 'B', nom: 'Tour de taille', description: 'À la couture ceinture, à plat × 2' },
          { code: 'C', nom: 'Tour de hanches', description: 'À 18 cm sous ceinture, à plat × 2' },
          { code: 'D', nom: 'Longueur totale dos', description: 'Du col (couture) au bas de la robe' },
          { code: 'E', nom: 'Longueur manche', description: 'Couture épaule au bas de manche' },
          { code: 'F', nom: 'Largeur d\'épaule', description: 'À 12 cm du centre encolure dos' },
          { code: 'G', nom: 'Largeur bas de robe', description: 'À plat, bord à bord en bas' },
          { code: 'H', nom: 'Profondeur col V', description: 'Du point d\'épaule au pointe du V devant' },
        ],
        grading: {
          XS: { A: 41, B: 31, C: 42, D: 108, E: 18, F: 36.5, G: 68, H: 22 },
          S:  { A: 43, B: 33, C: 44, D: 109, E: 18.5, F: 37.5, G: 71, H: 22.5 },
          M:  { A: 46, B: 36, C: 47, D: 110, E: 19, F: 38.5, G: 74, H: 23 },
          L:  { A: 49, B: 39, C: 50, D: 111, E: 19.5, F: 39.5, G: 77, H: 23.5 },
          XL: { A: 53, B: 43, C: 54, D: 112, E: 20, F: 40.5, G: 81, H: 24 },
        },
        tolerances: {
          A: { plus: 1, minus: 1 },
          B: { plus: 1, minus: 1 },
          C: { plus: 1.5, minus: 1 },
          D: { plus: 1, minus: 1 },
          E: { plus: 0.5, minus: 0.5 },
          F: { plus: 0.5, minus: 0.5 },
          G: { plus: 1, minus: 1 },
          H: { plus: 0.5, minus: 0.5 },
        },
      },
      prise_mesures: {
        notes: 'Tissu très fragile (crêpe de soie). Ne pas étirer pour prendre les mesures. Déposer à plat sur surface lisse.',
        instructions: [
          { code: 'A', description: 'Robe à plat. Mesurer au niveau des pinces de poitrine. × 2.' },
          { code: 'B', description: 'Au niveau de la ceinture cousue (changement de tissu). Mesurer à plat × 2.' },
          { code: 'C', description: 'À 18 cm sous la couture de ceinture. Mesurer à plat × 2.' },
          { code: 'D', description: 'Du bord de couture encolure dos jusqu\'au bas, en suivant le milieu dos.' },
          { code: 'H', description: 'Du point d\'épaule jusqu\'à la pointe du col V, en suivant la baguette.' },
        ],
      },
      commentaires: [
        { id: '1', date: '2024-11-05T09:00:00Z', auteur: 'Sophie Martin', zone: 'Col V', commentaire: 'Profondeur du col V à revoir — trop plongeant sur proto 1. Remonter de 3 cm.', proto: 'P1', statut: 'ouvert' },
        { id: '2', date: '2024-11-05T10:30:00Z', auteur: 'Marie Dupont', zone: 'Impression', commentaire: 'Raccord du motif floral sur les côtés non vérifié — confirmer avec HONGTEX que le placement est cohérent entre devant et dos.', proto: 'P1', statut: 'ouvert' },
        { id: '3', date: '2024-11-06T14:00:00Z', auteur: 'Jean-Pierre Lorca', zone: 'Ceinture', commentaire: 'Ceinture biais — vérifier qu\'elle ne roule pas après 3 heures de port. Test usure demandé.', proto: 'P1', statut: 'ouvert' },
      ],
      labelling: {
        notes: 'Tissu soie : obligation de mention "100% Soie naturelle" selon réglementation UE.',
        etiquettes: [
          { type: 'Marque', position: 'Col centre dos, entre les deux couches', contenu: 'Logo marque tissé', obligatoire: true },
          { type: 'Composition', position: 'Sous étiquette marque', contenu: '100% Soie (Doublure : 100% Viscose)', obligatoire: true },
          { type: 'Entretien', position: 'Couture latérale gauche, à 8 cm du bas', contenu: 'Main 30° / Plat / Fer 140° envers / Sec conseillé', obligatoire: true },
          { type: 'Origine', position: 'Intégrée composition', contenu: 'Made in China / Fabriqué en Chine', obligatoire: true },
        ],
      },
      croquis: {
        description: 'Robe midi ESIL — col V, manches courtes évasées, ceinture intégrée, jupe midi évasée. Tissu imprimé floral.',
        notes: 'Proto 1 reçu le 04/11/2024. Corrections en cours. Proto 2 prévu pour janvier 2025.',
        details: [
          { label: 'Col V', description: 'Col V devant, baguette cousue en sergé soie — profondeur à corriger (-3 cm)' },
          { label: 'Manche', description: 'Manche courte 18-20 cm selon taille, légèrement évasée bas, ourlet roulotté 0.5 cm' },
          { label: 'Ceinture', description: 'Ceinture biais même tissu, L = 140 cm, largeur 4 cm fini, avec passants latéraux' },
          { label: 'Jupe', description: 'Jupe mi-longue légèrement évasée, coupe circulaire 3/4, doublure intégrale' },
        ],
      },
    },
    variants: [
      { sku: '5EVA78-V08795-MULT-XS', color_name: 'FLORAL', color_ref: 'MULT-FLO', size: 'XS', size_system: 'INT' },
      { sku: '5EVA78-V08795-MULT-S', color_name: 'FLORAL', color_ref: 'MULT-FLO', size: 'S', size_system: 'INT' },
      { sku: '5EVA78-V08795-MULT-M', color_name: 'FLORAL', color_ref: 'MULT-FLO', size: 'M', size_system: 'INT' },
      { sku: '5EVA78-V08795-MULT-L', color_name: 'FLORAL', color_ref: 'MULT-FLO', size: 'L', size_system: 'INT' },
      { sku: '5EVA78-V08795-MULT-XL', color_name: 'FLORAL', color_ref: 'MULT-FLO', size: 'XL', size_system: 'INT' },
    ],
  },
  {
    reference: '5EVA83-V09814',
    name: 'EZAI',
    type: 'pret_a_porter',
    family: 'Tops',
    sub_family: 'Blouse',
    status: 'sms',
    gender: 'Femme',
    description: 'Blouse en crêpe 100% viscose. Col officier, manches 3/4 avec patte de boutonnage, boutonnage devant caché.',
    style_notes: 'Style working girl revisité. Peut être portée rentrée ou non. Coloris exclusifs développés pour la collection.',
    target_retail_price: 149.00,
    target_cost: 38.00,
    target_margin: 48,
    specSheet: {
      fiche_technique: {
        theme_code: '5EVA83',
        modele_code: 'V09814',
        fabricant: 'HONGTEX',
        saison: '25H',
        annee: 2025,
        genre: 'Femme',
        categorie: 'Blouse',
        matiere_principale: 'Crêpe Viscose',
        composition: '100% Viscose',
        grammage_gsm: 110,
        largeur_cm: 150,
        certification: 'OEKO TEX-100',
        coloris_ref: 'MULTI',
        coloris_nom: '3 coloris : NOIR / ECRU / SAUGE',
        entretien: [
          'Lavage machine 30°C délicat',
          'Avec des couleurs similaires',
          'Essorage doux',
          'Séchage à plat',
          'Repassage fer doux 150°C maximum',
          'Ne pas mettre au sèche-linge',
        ],
        pays_fabrication: 'Chine',
        norme_qualite: 'ISO 9001 / ISO 45001',
        fiche_normalisation: {
          norme_solidite: 'EN ISO 105 — Note minimale 3/5',
          norme_retrecissement: 'EN ISO 5077 — Max -3% toutes dimensions',
          test_pilage: 'EN ISO 12945 — Grade 3 minimum',
          norme_boutons: 'EN 71-3 (jouets) par précaution enfants',
          conformite_reach: 'Oui — certificat REACH en cours',
        },
      },
      fcm: [
        { position: 1, designation: 'Corps principal', matiere: 'Crêpe Viscose 100% VI', ref: 'CREV-110-MULTI', fournisseur: 'HONGTEX', quantite: 1.6, unite: 'ml', coloris: 'Selon coloris', commentaire: '3 coloris : Noir / Écru / Sauge' },
        { position: 2, designation: 'Entoilage col et parementure', matiere: 'Thermocollant non tissé', ref: 'THERMO-50', fournisseur: 'FREUDENBERG', quantite: 0.25, unite: 'ml', coloris: 'Blanc', commentaire: '' },
        { position: 3, designation: 'Boutons cachés devant', matiere: 'Résine polyester', ref: 'BTN-14-RESIN', fournisseur: 'COATS', quantite: 7, unite: 'pce', coloris: 'Assorti coloris', commentaire: 'Ø 14 mm — 2 trous' },
        { position: 4, designation: 'Boutons patte de manche', matiere: 'Résine polyester', ref: 'BTN-11-RESIN', fournisseur: 'COATS', quantite: 4, unite: 'pce', coloris: 'Assorti coloris', commentaire: 'Ø 11 mm — 2 trous' },
        { position: 5, designation: 'Fil à coudre', matiere: '100% Polyester', ref: 'FIL-PL-MULTI', fournisseur: 'AMANN', quantite: 80, unite: 'ml', coloris: 'Assorti', commentaire: 'Ticket 40' },
        { position: 6, designation: 'Étiquette composition', matiere: 'Satin polyester', ref: 'ETQ-COMP-VI', fournisseur: 'SML', quantite: 1, unite: 'pce', coloris: 'Blanc', commentaire: '' },
        { position: 7, designation: 'Étiquette marque', matiere: 'Polyester tissé', ref: 'ETQ-MARQ-VB', fournisseur: 'SML', quantite: 1, unite: 'pce', coloris: 'Noir / Or', commentaire: '' },
      ],
      mesures: {
        systeme_taille: 'FR',
        taille_base: '38',
        points_mesure: [
          { code: 'A', nom: 'Tour de poitrine', description: 'À plat × 2, niveau axilas' },
          { code: 'B', nom: 'Tour de taille', description: 'Au niveau de la taille naturelle du vêtement' },
          { code: 'C', nom: 'Longueur totale dos', description: 'Du col à l\'ourlet bas' },
          { code: 'D', nom: 'Longueur manche 3/4', description: 'De l\'épaule au bas de patte' },
          { code: 'E', nom: 'Largeur d\'épaule', description: 'À 12 cm du centre col dos' },
          { code: 'F', nom: 'Largeur bas', description: 'À plat, bord à bord en bas, non mis en forme' },
          { code: 'G', nom: 'Hauteur col officier', description: 'Hauteur du col mesuré en position relevée' },
        ],
        grading: {
          '36': { A: 42, B: 34, C: 64, D: 42, E: 37, F: 48, G: 4.5 },
          '38': { A: 44, B: 36, C: 65, D: 43, E: 38, F: 50, G: 4.5 },
          '40': { A: 46, B: 38, C: 66, D: 43.5, E: 39, F: 52, G: 5 },
          '42': { A: 49, B: 41, C: 67, D: 44, E: 40, F: 55, G: 5 },
          '44': { A: 52, B: 44, C: 68, D: 44.5, E: 41, F: 58, G: 5 },
        },
        tolerances: {
          A: { plus: 1, minus: 1 },
          B: { plus: 1, minus: 1 },
          C: { plus: 1, minus: 0.5 },
          D: { plus: 0.5, minus: 0.5 },
          E: { plus: 0.5, minus: 0.5 },
          F: { plus: 1, minus: 1 },
          G: { plus: 0.3, minus: 0.3 },
        },
      },
      prise_mesures: {
        notes: 'Mesures sur vêtement à plat, non mis en forme. Col relevé pour mesure G.',
        instructions: [
          { code: 'A', description: 'À plat. Mesurer à la hauteur du creux des aisselles (environ 3 cm sous la couture d\'épaule). × 2.' },
          { code: 'B', description: 'À l\'endroit où la blouse est la plus étroite naturellement. × 2.' },
          { code: 'C', description: 'Du bord bas du col (couture) au bas de la blouse, milieu dos.' },
          { code: 'D', description: 'De la couture d\'épaule jusqu\'au bas de la patte de boutonnage.' },
          { code: 'G', description: 'Col relevé, mesurer la hauteur depuis la couture pied-de-col jusqu\'au bord supérieur du col.' },
        ],
      },
      commentaires: [
        { id: '1', date: '2025-01-10T09:00:00Z', auteur: 'Marie Dupont', zone: 'Col officier', commentaire: 'Col validé SMS. Hauteur et forme conformes au brief. RAS.', proto: 'SMS', statut: 'traite' },
        { id: '2', date: '2025-01-10T11:00:00Z', auteur: 'Sophie Martin', zone: 'Boutonnage', commentaire: 'Boutonnage caché — testé sur 5 essayages. Tenue correcte. Boutons solidité OK.', proto: 'SMS', statut: 'traite' },
        { id: '3', date: '2025-01-10T14:30:00Z', auteur: 'Jean-Pierre Lorca', zone: 'Couleurs', commentaire: 'Coloris SAUGE : léger écart vs nuancier LAB. Tolérance acceptable (ΔE < 2). Validé avec réserve.', proto: 'SMS', statut: 'ouvert' },
      ],
      labelling: {
        notes: 'EZAI — 3 coloris. Prévoir étiquettes avec mention coloris sur étiquette taille.',
        etiquettes: [
          { type: 'Marque', position: 'Centre col dos, intérieur', contenu: 'Logo marque', obligatoire: true },
          { type: 'Composition', position: 'Sous marque', contenu: '100% Viscose — Lavage 30° délicat', obligatoire: true },
          { type: 'Coloris', position: 'Sur étiquette taille', contenu: 'Nom du coloris selon variante', obligatoire: true },
          { type: 'Origine', position: 'Intégrée composition', contenu: 'Made in China', obligatoire: true },
        ],
      },
      croquis: {
        description: 'Blouse EZAI — col officier, manches 3/4 avec patte de boutonnage, boutonnage devant caché 7 boutons.',
        notes: 'SMS validé le 10/01/2025. Lancement production prévu mars 2025.',
        details: [
          { label: 'Col officier', description: 'Col officier H = 4.5-5 cm, entoilé, boutonnage pression caché sous rabat' },
          { label: 'Devant', description: '7 boutons cachés sous parementure, boutonnière machine invisible' },
          { label: 'Manche 3/4', description: 'Manche légèrement ajustée, patte de boutonnage 2 boutons, fente 8 cm' },
          { label: 'Bas', description: 'Ourlet bord à bord 2 cm, légèrement cintré côtés' },
        ],
      },
    },
    variants: [
      { sku: '5EVA83-V09814-NOIR-36', color_name: 'NOIR', color_ref: 'NOIR', size: '36', size_system: 'FR' },
      { sku: '5EVA83-V09814-NOIR-38', color_name: 'NOIR', color_ref: 'NOIR', size: '38', size_system: 'FR' },
      { sku: '5EVA83-V09814-NOIR-40', color_name: 'NOIR', color_ref: 'NOIR', size: '40', size_system: 'FR' },
      { sku: '5EVA83-V09814-ECRU-36', color_name: 'ECRU', color_ref: 'ECRU', size: '36', size_system: 'FR' },
      { sku: '5EVA83-V09814-ECRU-38', color_name: 'ECRU', color_ref: 'ECRU', size: '38', size_system: 'FR' },
      { sku: '5EVA83-V09814-ECRU-40', color_name: 'ECRU', color_ref: 'ECRU', size: '40', size_system: 'FR' },
      { sku: '5EVA83-V09814-SAUGE-36', color_name: 'SAUGE', color_ref: 'SAUGE', size: '36', size_system: 'FR' },
      { sku: '5EVA83-V09814-SAUGE-38', color_name: 'SAUGE', color_ref: 'SAUGE', size: '38', size_system: 'FR' },
      { sku: '5EVA83-V09814-SAUGE-40', color_name: 'SAUGE', color_ref: 'SAUGE', size: '40', size_system: 'FR' },
    ],
  },
  {
    reference: '5EVA87-V12102',
    name: 'SPIAGGIA',
    type: 'pret_a_porter',
    family: 'Robes',
    sub_family: 'Robe de plage',
    status: 'concept',
    gender: 'Femme',
    description: 'Robe de plage longue en mousseline 100% viscose imprimée. Col V, sans manches, dos nu avec liens croisés. Légère et fluide.',
    style_notes: 'Pièce lifestyle été 25. Double fonction : plage / soirée décontractée. Tissu ultra-léger.',
    target_retail_price: 189.00,
    target_cost: 45.00,
    target_margin: 50,
    specSheet: {
      fiche_technique: {
        theme_code: '5EVA87',
        modele_code: 'V12102',
        fabricant: 'À définir',
        saison: '25H',
        annee: 2025,
        genre: 'Femme',
        categorie: 'Robe de plage',
        matiere_principale: 'Mousseline Viscose',
        composition: '100% Viscose',
        grammage_gsm: 42,
        largeur_cm: 150,
        certification: 'En cours',
        coloris_ref: 'MULTI-IMP',
        coloris_nom: 'MULTI — 2 impressions à développer',
        entretien: [
          'Lavage main 30°C',
          'Ne pas essorer',
          'Séchage à l\'air libre, à l\'ombre',
          'Fer doux 130°C maximum',
          'Nettoyage à sec déconseillé',
        ],
        pays_fabrication: 'À définir',
        notes_developpement: 'Concept validé DA. Fournisseur en cours de sélection. 2 impressions en développement : tropical et liberty.',
      },
      fcm: [
        { position: 1, designation: 'Corps principal', matiere: 'Mousseline 100% Viscose', ref: 'À définir', fournisseur: 'À définir', quantite: 3.2, unite: 'ml', coloris: '2 impressions', commentaire: 'Estimation quantité — à affiner après patronage définitif' },
        { position: 2, designation: 'Liens dos croisés', matiere: 'Même tissu corps', ref: '—', fournisseur: '—', quantite: 0.2, unite: 'ml', coloris: 'Assorti', commentaire: 'Liens biais L = 80 cm × 2, largeur finie 1.5 cm' },
        { position: 3, designation: 'Anneau métal liens', matiere: 'Métal laiton doré', ref: 'ANN-20-LAIT', fournisseur: 'À définir', quantite: 2, unite: 'pce', coloris: 'Or', commentaire: 'Ø 20 mm intérieur' },
        { position: 4, designation: 'Élastique taille', matiere: 'Élastique plat', ref: 'ELAS-25-BL', fournisseur: 'À définir', quantite: 80, unite: 'cm', coloris: 'Blanc', commentaire: 'L = 25 mm, à ajuster selon taille' },
        { position: 5, designation: 'Étiquettes', matiere: 'Standard', ref: 'Standard VB', fournisseur: 'SML', quantite: 3, unite: 'pce', coloris: 'Standard', commentaire: 'Marque + Composition + Entretien' },
      ],
      mesures: {
        systeme_taille: 'INT',
        taille_base: 'M',
        points_mesure: [
          { code: 'A', nom: 'Tour de poitrine (haut)', description: 'Au niveau des pinces/fronces haut de robe' },
          { code: 'B', nom: 'Tour de taille élastiquée', description: 'Au niveau de l\'élastique de taille, étiré à plat × 2' },
          { code: 'C', nom: 'Tour de taille non étiré', description: 'Élastique au repos × 2' },
          { code: 'D', nom: 'Longueur totale', description: 'Du haut du dos nu jusqu\'au bas de la robe' },
          { code: 'E', nom: 'Largeur bas de robe', description: 'À plat × 2, en bas' },
          { code: 'F', nom: 'Longueur liens', description: 'Longueur de chaque lien dos' },
        ],
        grading: {
          XS: { A: 36, B: 56, C: 28, D: 130, E: 80, F: 80 },
          S:  { A: 38, B: 60, C: 30, D: 131, E: 84, F: 80 },
          M:  { A: 41, B: 64, C: 32, D: 132, E: 88, F: 80 },
          L:  { A: 44, B: 68, C: 35, D: 133, E: 93, F: 85 },
          XL: { A: 47, B: 72, C: 38, D: 134, E: 98, F: 85 },
        },
        tolerances: {
          A: { plus: 2, minus: 1 },
          B: { plus: 2, minus: 2 },
          C: { plus: 1, minus: 1 },
          D: { plus: 1.5, minus: 1.5 },
          E: { plus: 2, minus: 2 },
          F: { plus: 2, minus: 0 },
        },
      },
      prise_mesures: {
        notes: 'Tissu très léger — manipuler avec précaution. Élastique : mesurer étiré ET au repos.',
        instructions: [
          { code: 'A', description: 'Mesurer le haut de la robe (largeur buste) à plat. C\'est la mesure fixe du haut. × 2.' },
          { code: 'B', description: 'Étirer l\'élastique de taille au maximum à plat. Mesurer. × 2.' },
          { code: 'C', description: 'Élastique au repos (non étiré) à plat. × 2.' },
          { code: 'D', description: 'Du haut du dos (bord d\'ourlet dos nu) jusqu\'au bas de la robe.' },
        ],
      },
      commentaires: [
        { id: '1', date: '2025-02-01T10:00:00Z', auteur: 'Marie Dupont', zone: 'Général', commentaire: 'Concept validé en réunion DA. Brief créatif transmis à HONGTEX pour estimation. Attente retour faisabilité impression.', proto: 'Concept', statut: 'ouvert' },
        { id: '2', date: '2025-02-15T11:00:00Z', auteur: 'Jean-Pierre Lorca', zone: 'Impression', commentaire: '2 directions impression présentées : tropical (palmiers/perroquets) et liberty (fleurs petites). Decision en semaine 10.', proto: 'Concept', statut: 'ouvert' },
      ],
      labelling: {
        notes: 'Labelling à finaliser après sélection fournisseur. Standard collection à appliquer.',
        etiquettes: [
          { type: 'Marque', position: 'Haut dos, bord d\'ourlet intérieur', contenu: 'Logo marque', obligatoire: true },
          { type: 'Composition', position: 'Couture latérale gauche', contenu: '100% Viscose', obligatoire: true },
          { type: 'Entretien', position: 'Avec composition', contenu: 'Pictogrammes à définir', obligatoire: true },
          { type: 'Origine', position: 'Avec composition', contenu: 'À définir selon fabricant retenu', obligatoire: true },
        ],
      },
      croquis: {
        description: 'Robe de plage SPIAGGIA — sans manches, dos nu avec liens croisés et anneaux dorés, col V devant, taille élastiquée.',
        notes: 'Croquis concept — en attente validation patronage. Premier proto prévu mai 2025.',
        details: [
          { label: 'Haut', description: 'Forme bustier avec bretelles fines convergeant vers liens dos croisés' },
          { label: 'Dos nu', description: 'Dos largement dégagé, liens croisés passant dans 2 anneaux dorés au centre dos' },
          { label: 'Taille', description: 'Élastique plat 25 mm cousu dans une coulisse, fournit la forme sans couture de taille' },
          { label: 'Jupe', description: 'Jupe longue (130-134 cm) légèrement évasée, tissu ultra-fluide — mousseline' },
        ],
      },
    },
    variants: [
      { sku: '5EVA87-V12102-TROP-S', color_name: 'TROPICAL', color_ref: 'IMP-TROP', size: 'S', size_system: 'INT' },
      { sku: '5EVA87-V12102-TROP-M', color_name: 'TROPICAL', color_ref: 'IMP-TROP', size: 'M', size_system: 'INT' },
      { sku: '5EVA87-V12102-TROP-L', color_name: 'TROPICAL', color_ref: 'IMP-TROP', size: 'L', size_system: 'INT' },
      { sku: '5EVA87-V12102-LIBT-S', color_name: 'LIBERTY', color_ref: 'IMP-LIBT', size: 'S', size_system: 'INT' },
      { sku: '5EVA87-V12102-LIBT-M', color_name: 'LIBERTY', color_ref: 'IMP-LIBT', size: 'M', size_system: 'INT' },
      { sku: '5EVA87-V12102-LIBT-L', color_name: 'LIBERTY', color_ref: 'IMP-LIBT', size: 'L', size_system: 'INT' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  SEED
// ─────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Démarrage du seed démo PLM Fashion...\n');

  try {
    // Récupérer l'admin
    const adminRes = await q(`SELECT id FROM users LIMIT 1`);
    if (!adminRes.rows.length) {
      throw new Error("Aucun utilisateur trouvé. Lancer d'abord migrate.js.");
    }
    const adminId = adminRes.rows[0].id;
    console.log(`✓ Admin trouvé : ${adminId}`);

    // Fournisseur
    const supplierRes = await q(`
      INSERT INTO suppliers (code, name, country, city, contact_name, contact_email, contact_phone,
        currency, payment_terms, lead_time_days, quality_score, certifications, specialties, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (code) DO UPDATE SET
        name=EXCLUDED.name, country=EXCLUDED.country, city=EXCLUDED.city,
        contact_name=EXCLUDED.contact_name, contact_email=EXCLUDED.contact_email,
        payment_terms=EXCLUDED.payment_terms, specialties=EXCLUDED.specialties
      RETURNING id
    `, [
      SUPPLIER.code, SUPPLIER.name, SUPPLIER.country, SUPPLIER.city,
      SUPPLIER.contact_name, SUPPLIER.contact_email, SUPPLIER.contact_phone,
      SUPPLIER.currency, SUPPLIER.payment_terms, SUPPLIER.lead_time_days,
      SUPPLIER.quality_score, SUPPLIER.certifications, SUPPLIER.specialties, SUPPLIER.is_active,
    ]);
    const supplierId = supplierRes.rows[0].id;
    console.log(`✓ Fournisseur HONGTEX : ${supplierId}`);

    // Matières
    const materialIds = {};
    for (const mat of MATERIALS) {
      const res = await q(`
        INSERT INTO materials (code, name, type, composition, width_cm, weight_gsm,
          color_reference, color_name, unit, price_per_unit, currency,
          supplier_id, supplier_ref, lead_time_days, is_validated, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        ON CONFLICT (code) DO UPDATE SET
          name=EXCLUDED.name, composition=EXCLUDED.composition,
          color_name=EXCLUDED.color_name, notes=EXCLUDED.notes,
          unit=EXCLUDED.unit, price_per_unit=EXCLUDED.price_per_unit
        RETURNING id
      `, [
        mat.code, mat.name, mat.type, mat.composition ?? null,
        mat.width_cm ?? null, mat.weight_gsm ?? null,
        mat.color_reference ?? null, mat.color_name ?? null,
        mat.unit, mat.price_per_unit ?? null, mat.currency ?? 'EUR',
        supplierId, mat.supplier_ref ?? null, mat.lead_time_days ?? null,
        mat.is_validated, mat.notes ?? null,
      ]);
      materialIds[mat.code] = res.rows[0].id;
    }
    console.log(`✓ ${MATERIALS.length} matières insérées`);

    // Collection
    const collectionRes = await q(`
      INSERT INTO collections (code, name, season, year, status, target_refs, budget,
        description, delivery_date, showroom_date, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (code) DO UPDATE SET
        name=EXCLUDED.name, description=EXCLUDED.description
      RETURNING id
    `, [
      COLLECTION.code, COLLECTION.name, COLLECTION.season, COLLECTION.year,
      COLLECTION.status, COLLECTION.target_refs, COLLECTION.budget,
      COLLECTION.description, COLLECTION.delivery_date, COLLECTION.showroom_date, adminId,
    ]);
    const collectionId = collectionRes.rows[0].id;
    console.log(`✓ Collection VB-25H : ${collectionId}`);

    // Produits
    for (const prod of PRODUCTS) {
      const { specSheet, variants, ...prodData } = prod;

      const productRes = await q(`
        INSERT INTO products (reference, name, type, collection_id, family, sub_family,
          status, gender, description, style_notes,
          target_retail_price, target_cost, target_margin,
          main_supplier_id, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (reference) DO UPDATE SET
          name=EXCLUDED.name, description=EXCLUDED.description, style_notes=EXCLUDED.style_notes
        RETURNING id
      `, [
        prodData.reference, prodData.name, prodData.type, collectionId,
        prodData.family, prodData.sub_family, prodData.status, prodData.gender,
        prodData.description, prodData.style_notes,
        prodData.target_retail_price, prodData.target_cost, prodData.target_margin,
        supplierId, adminId,
      ]);
      const productId = productRes.rows[0].id;
      console.log(`  ✓ Produit ${prodData.reference} (${prodData.name}) : ${productId}`);

      // Variantes
      for (const v of variants) {
        await q(`
          INSERT INTO product_variants (product_id, sku, color_name, color_ref, size, size_system)
          VALUES ($1,$2,$3,$4,$5,$6)
          ON CONFLICT (sku) DO NOTHING
        `, [productId, v.sku, v.color_name, v.color_ref, v.size, v.size_system]);
      }
      console.log(`    ✓ ${variants.length} variantes`);

      // Fiche technique
      await q(`
        INSERT INTO product_spec_sheets (
          product_id, version, is_current,
          fiche_technique, fcm, mesures, prise_mesures, commentaires, labelling, croquis,
          created_by, updated_by
        ) VALUES ($1, 1, true, $2, $3, $4, $5, $6, $7, $8, $9, $9)
        ON CONFLICT (product_id, version) DO UPDATE
          SET fiche_technique = EXCLUDED.fiche_technique,
              fcm = EXCLUDED.fcm,
              mesures = EXCLUDED.mesures,
              prise_mesures = EXCLUDED.prise_mesures,
              commentaires = EXCLUDED.commentaires,
              labelling = EXCLUDED.labelling,
              croquis = EXCLUDED.croquis,
              updated_at = NOW()
      `, [
        productId,
        JSON.stringify(specSheet.fiche_technique),
        JSON.stringify(specSheet.fcm),
        JSON.stringify(specSheet.mesures),
        JSON.stringify(specSheet.prise_mesures),
        JSON.stringify(specSheet.commentaires),
        JSON.stringify(specSheet.labelling),
        JSON.stringify(specSheet.croquis),
        adminId,
      ]);
      console.log(`    ✓ Fiche technique insérée`);
    }

    console.log('\n✅ Seed terminé avec succès !');
    console.log(`   Collection : ${COLLECTION.name}`);
    console.log(`   Produits   : ${PRODUCTS.map(p => p.name).join(', ')}`);
    console.log(`   Connexion  : admin@plm.local`);

  } catch (err) {
    console.error('\n❌ Erreur seed :', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
