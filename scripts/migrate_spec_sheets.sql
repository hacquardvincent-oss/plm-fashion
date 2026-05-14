-- ============================================================
--  PLM Fashion — Migration fiches techniques structurées
--  Version 1.0 | Mai 2026
-- ============================================================

CREATE TABLE IF NOT EXISTS product_spec_sheets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version       SMALLINT NOT NULL DEFAULT 1,
  is_current    BOOLEAN NOT NULL DEFAULT TRUE,

  -- Onglet 1 : Fiche technique générale
  -- { theme_code, modele_code, fabricant, saison, annee, genre,
  --   matiere_principale, composition, grammage_gsm, largeur_cm,
  --   certification, coloris_ref, coloris_nom, entretien: [] }
  fiche_technique   JSONB NOT NULL DEFAULT '{}',

  -- Onglet 2 : FCM (Fournitures / Composants / Matières)
  -- [{ position, designation, composition, fournisseur, ref_fournisseur,
  --    quantite, unite, coloris, commentaire }]
  fcm               JSONB NOT NULL DEFAULT '[]',

  -- Onglet 3 : Mesures & Grading
  -- { systeme_taille, taille_base, points_mesure: [{ code, nom, description }],
  --   grading: { "taille": { "code_point": valeur_cm } },
  --   tolerances: { "code_point": { plus: x, minus: y } } }
  mesures           JSONB NOT NULL DEFAULT '{}',

  -- Onglet 4 : Prise de mesures
  -- { instructions: [{ code_point, description }], notes, schema_doc_id }
  prise_mesures     JSONB NOT NULL DEFAULT '{}',

  -- Onglet 5 : Commentaires de développement
  -- [{ id, date, auteur, zone, commentaire, statut: 'ouvert'|'traite', proto }]
  commentaires      JSONB NOT NULL DEFAULT '[]',

  -- Onglet 6 : Labelling
  -- { etiquettes: [{ type, position, contenu, obligatoire }], notes }
  labelling         JSONB NOT NULL DEFAULT '{}',

  -- Onglet 7 : Croquis (liens vers documents uploadés)
  -- { description, vue_face_doc_id, vue_dos_doc_id, details: [], notes }
  croquis           JSONB NOT NULL DEFAULT '{}',

  created_by    UUID REFERENCES users(id),
  updated_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (product_id, version)
);

CREATE INDEX IF NOT EXISTS idx_spec_sheets_product
  ON product_spec_sheets(product_id);
CREATE INDEX IF NOT EXISTS idx_spec_sheets_current
  ON product_spec_sheets(product_id) WHERE is_current = TRUE;

-- Trigger updated_at
DO $$
BEGIN
  DROP TRIGGER IF EXISTS trg_product_spec_sheets_updated_at ON product_spec_sheets;
  CREATE TRIGGER trg_product_spec_sheets_updated_at
    BEFORE UPDATE ON product_spec_sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
END;
$$;
