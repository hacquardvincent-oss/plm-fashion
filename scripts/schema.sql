-- ============================================================
--  PLM Fashion & Maroquinerie — Schéma PostgreSQL (idempotent)
--  Version 1.1 | Mai 2026
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
--  ÉNUMÉRATIONS (idempotent via blocs DO)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'admin', 'directeur_artistique', 'chef_produit',
    'acheteur', 'qualite', 'direction', 'fournisseur'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_type AS ENUM ('pret_a_porter', 'maroquinerie', 'accessoire');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE collection_status AS ENUM ('brouillon', 'en_cours', 'validee', 'archivee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM (
    'concept', 'en_developpement', 'proto_1', 'proto_2',
    'sms', 'valide', 'abandonne', 'archive'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE validation_decision AS ENUM ('approuve', 'rejete', 'en_attente', 'revision');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE material_type AS ENUM (
    'tissu', 'cuir', 'doublure', 'fil', 'fermeture',
    'bouton', 'zip', 'quincaillerie', 'emballage', 'autre'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sample_status AS ENUM ('commande', 'en_transit', 'recu', 'valide', 'rejete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE change_type AS ENUM ('ECR', 'ECO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE change_status AS ENUM ('ouvert', 'en_cours', 'approuve', 'rejete', 'clos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'fiche_technique', 'patron', 'visuel', 'gabarit',
    'spec_fournisseur', 'rapport_qualite', 'autre'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sync_direction AS ENUM ('plm_to_erp', 'erp_to_plm', 'bidirectionnel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sync_status AS ENUM ('en_attente', 'en_cours', 'succes', 'erreur');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
--  1. UTILISATEURS & AUTHENTIFICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email          VARCHAR(255) UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  role           user_role NOT NULL DEFAULT 'chef_produit',
  supplier_id    UUID,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  2. FOURNISSEURS
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code             VARCHAR(30) UNIQUE NOT NULL,
  name             VARCHAR(255) NOT NULL,
  country          VARCHAR(100),
  city             VARCHAR(100),
  address          TEXT,
  contact_name     VARCHAR(200),
  contact_email    VARCHAR(255),
  contact_phone    VARCHAR(50),
  currency         CHAR(3) DEFAULT 'EUR',
  payment_terms    VARCHAR(100),
  lead_time_days   INTEGER,
  quality_score    NUMERIC(3,1) CHECK (quality_score BETWEEN 0 AND 10),
  certifications   TEXT[],
  specialties      TEXT[],
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  erp_code         VARCHAR(100),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT fk_users_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS supplier_evaluations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id   UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  evaluated_by  UUID NOT NULL REFERENCES users(id),
  score         NUMERIC(3,1) NOT NULL CHECK (score BETWEEN 0 AND 10),
  quality       NUMERIC(3,1),
  delay         NUMERIC(3,1),
  communication NUMERIC(3,1),
  comment       TEXT,
  evaluated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  3. COLLECTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS collections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          VARCHAR(20) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  season        VARCHAR(50),
  year          SMALLINT NOT NULL,
  status        collection_status NOT NULL DEFAULT 'brouillon',
  target_refs   INTEGER,
  budget        NUMERIC(12,2),
  description   TEXT,
  brief_url     TEXT,
  delivery_date DATE,
  showroom_date DATE,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_milestones (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id  UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  name           VARCHAR(200) NOT NULL,
  due_date       DATE NOT NULL,
  completed_at   TIMESTAMPTZ,
  responsible_id UUID REFERENCES users(id),
  notes          TEXT
);

-- ============================================================
--  4. MATIÈRES
-- ============================================================

CREATE TABLE IF NOT EXISTS materials (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code              VARCHAR(50) UNIQUE NOT NULL,
  name              VARCHAR(255) NOT NULL,
  type              material_type NOT NULL,
  composition       VARCHAR(255),
  width_cm          NUMERIC(6,2),
  weight_gsm        NUMERIC(6,2),
  color_reference   VARCHAR(100),
  color_name        VARCHAR(100),
  unit              VARCHAR(20) DEFAULT 'ml',
  min_order_qty     NUMERIC(10,2),
  price_per_unit    NUMERIC(10,4),
  currency          CHAR(3) DEFAULT 'EUR',
  supplier_id       UUID REFERENCES suppliers(id),
  supplier_ref      VARCHAR(100),
  lead_time_days    INTEGER,
  is_validated      BOOLEAN NOT NULL DEFAULT FALSE,
  validated_by      UUID REFERENCES users(id),
  validated_at      TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_samples (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id  UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),
  supplier_id  UUID REFERENCES suppliers(id),
  quantity     NUMERIC(10,2),
  unit         VARCHAR(20),
  status       sample_status NOT NULL DEFAULT 'commande',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at  TIMESTAMPTZ,
  validated_by UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  notes        TEXT
);

-- ============================================================
--  5. PRODUITS / FICHES TECHNIQUES
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference        VARCHAR(50) UNIQUE NOT NULL,
  name             VARCHAR(255) NOT NULL,
  type             product_type NOT NULL,
  collection_id    UUID NOT NULL REFERENCES collections(id),
  family           VARCHAR(100),
  sub_family       VARCHAR(100),
  status           product_status NOT NULL DEFAULT 'concept',
  gender           VARCHAR(20),
  description      TEXT,
  style_notes      TEXT,
  target_retail_price NUMERIC(10,2),
  target_cost      NUMERIC(10,2),
  target_margin    NUMERIC(5,2),
  main_supplier_id UUID REFERENCES suppliers(id),
  erp_article_code VARCHAR(100),
  created_by       UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku            VARCHAR(100) UNIQUE NOT NULL,
  color_name     VARCHAR(100),
  color_ref      VARCHAR(50),
  size           VARCHAR(20),
  size_system    VARCHAR(20) DEFAULT 'FR',
  material_ref   VARCHAR(100),
  barcode        VARCHAR(50),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  erp_sku        VARCHAR(100),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS size_grading (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size         VARCHAR(20) NOT NULL,
  measurement  VARCHAR(100) NOT NULL,
  value_cm     NUMERIC(6,2) NOT NULL,
  tolerance    NUMERIC(4,2),
  UNIQUE (product_id, size, measurement)
);

CREATE TABLE IF NOT EXISTS product_bom (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  material_id     UUID NOT NULL REFERENCES materials(id),
  usage_type      VARCHAR(100),
  quantity        NUMERIC(10,4) NOT NULL,
  unit            VARCHAR(20) NOT NULL,
  waste_factor    NUMERIC(5,4) DEFAULT 0.05,
  notes           TEXT,
  UNIQUE (product_id, material_id, usage_type)
);

-- ============================================================
--  6. COSTING
-- ============================================================

CREATE TABLE IF NOT EXISTS product_costings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version             SMALLINT NOT NULL DEFAULT 1,
  is_current          BOOLEAN NOT NULL DEFAULT TRUE,
  materials_cost      NUMERIC(10,4) DEFAULT 0,
  cmt_cost            NUMERIC(10,4) DEFAULT 0,
  accessories_cost    NUMERIC(10,4) DEFAULT 0,
  transport_cost      NUMERIC(10,4) DEFAULT 0,
  customs_cost        NUMERIC(10,4) DEFAULT 0,
  total_cost          NUMERIC(10,4) DEFAULT 0,
  currency            CHAR(3) DEFAULT 'EUR',
  wholesale_price     NUMERIC(10,2),
  retail_price        NUMERIC(10,2),
  gross_margin_pct    NUMERIC(6,3) DEFAULT 0,
  coefficient         NUMERIC(6,3) DEFAULT 0,
  notes               TEXT,
  created_by          UUID NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, version)
);

CREATE TABLE IF NOT EXISTS costing_lines (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  costing_id     UUID NOT NULL REFERENCES product_costings(id) ON DELETE CASCADE,
  category       VARCHAR(100) NOT NULL,
  label          VARCHAR(255) NOT NULL,
  quantity       NUMERIC(10,4),
  unit_price     NUMERIC(10,4),
  amount         NUMERIC(10,4) NOT NULL,
  currency       CHAR(3) DEFAULT 'EUR',
  supplier_id    UUID REFERENCES suppliers(id),
  notes          TEXT
);

-- ============================================================
--  7. WORKFLOWS DE VALIDATION
-- ============================================================

CREATE TABLE IF NOT EXISTS validation_workflows (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stage          product_status NOT NULL,
  requested_by   UUID NOT NULL REFERENCES users(id),
  requested_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date       TIMESTAMPTZ,
  decision       validation_decision NOT NULL DEFAULT 'en_attente',
  decided_by     UUID REFERENCES users(id),
  decided_at     TIMESTAMPTZ,
  comments       TEXT,
  next_stage     product_status
);

CREATE TABLE IF NOT EXISTS validation_comments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id     UUID NOT NULL REFERENCES validation_workflows(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  comment         TEXT NOT NULL,
  is_blocking     BOOLEAN DEFAULT FALSE,
  zone            VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  8. CHANGE MANAGEMENT (ECR / ECO)
-- ============================================================

CREATE TABLE IF NOT EXISTS change_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type           change_type NOT NULL DEFAULT 'ECR',
  reference      VARCHAR(50) UNIQUE NOT NULL,
  product_id     UUID NOT NULL REFERENCES products(id),
  title          VARCHAR(255) NOT NULL,
  description    TEXT NOT NULL,
  reason         VARCHAR(255),
  impact         TEXT,
  status         change_status NOT NULL DEFAULT 'ouvert',
  priority       SMALLINT DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  requested_by   UUID NOT NULL REFERENCES users(id),
  assigned_to    UUID REFERENCES users(id),
  approved_by    UUID REFERENCES users(id),
  approved_at    TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  due_date       DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  9. GESTION DOCUMENTAIRE
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type     VARCHAR(50) NOT NULL,
  entity_id       UUID NOT NULL,
  type            document_type NOT NULL,
  name            VARCHAR(255) NOT NULL,
  filename        VARCHAR(255) NOT NULL,
  storage_path    TEXT NOT NULL,
  mime_type       VARCHAR(100),
  file_size_bytes BIGINT,
  version         SMALLINT NOT NULL DEFAULT 1,
  is_current      BOOLEAN NOT NULL DEFAULT TRUE,
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,
  checksum        VARCHAR(64),
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_documents_entity  ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_current ON documents(entity_type, entity_id) WHERE is_current = TRUE;

-- ============================================================
--  10. PORTAIL FOURNISSEURS — MESSAGERIE
-- ============================================================

CREATE TABLE IF NOT EXISTS supplier_messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type    VARCHAR(50) NOT NULL,
  entity_id      UUID NOT NULL,
  thread_id      UUID,
  from_user_id   UUID NOT NULL REFERENCES users(id),
  to_supplier_id UUID REFERENCES suppliers(id),
  subject        VARCHAR(255),
  body           TEXT NOT NULL,
  is_read        BOOLEAN DEFAULT FALSE,
  read_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  11. INTÉGRATION ERP
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_sync_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type     VARCHAR(50) NOT NULL,
  entity_id       UUID,
  direction       sync_direction NOT NULL,
  status          sync_status NOT NULL DEFAULT 'en_attente',
  erp_system      VARCHAR(50) NOT NULL,
  payload         JSONB,
  response        JSONB,
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_mappings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type   VARCHAR(50) NOT NULL,
  plm_id        UUID NOT NULL,
  erp_system    VARCHAR(50) NOT NULL,
  erp_code      VARCHAR(100) NOT NULL,
  last_synced   TIMESTAMPTZ,
  UNIQUE (entity_type, plm_id, erp_system)
);

-- ============================================================
--  12. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(100) NOT NULL,
  title        VARCHAR(255) NOT NULL,
  body         TEXT,
  entity_type  VARCHAR(50),
  entity_id    UUID,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;

-- ============================================================
--  INDEXES PRINCIPAUX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_id);
CREATE INDEX IF NOT EXISTS idx_products_status     ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_reference  ON products(reference);
CREATE INDEX IF NOT EXISTS idx_products_erp        ON products(erp_article_code) WHERE erp_article_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_variants_product    ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_bom_product         ON product_bom(product_id);
CREATE INDEX IF NOT EXISTS idx_bom_material        ON product_bom(material_id);

CREATE INDEX IF NOT EXISTS idx_workflows_product   ON validation_workflows(product_id);
CREATE INDEX IF NOT EXISTS idx_workflows_pending   ON validation_workflows(product_id) WHERE decision = 'en_attente';

CREATE INDEX IF NOT EXISTS idx_ecr_product         ON change_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_ecr_status          ON change_requests(status);

CREATE INDEX IF NOT EXISTS idx_materials_supplier  ON materials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_materials_name_trgm ON materials USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm  ON products USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_audit_entity        ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user          ON audit_logs(user_id);

-- ============================================================
--  9. FICHES COMMERCIALES (WHOLESALE + E-COMMERCE SEO/GEO)
-- ============================================================

CREATE TABLE IF NOT EXISTS product_fiches (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version           SMALLINT NOT NULL DEFAULT 1,
  is_current        BOOLEAN NOT NULL DEFAULT TRUE,

  -- Fiche wholesale
  wholesale_title   TEXT,
  wholesale_body    TEXT,                   -- Markdown

  -- E-commerce FR (SEO/GEO)
  seo_title_fr      VARCHAR(70),
  meta_desc_fr      VARCHAR(160),
  description_fr    TEXT,                   -- HTML structuré avec h2
  keywords_fr       TEXT[],
  faq_fr            JSONB,                  -- [{q,a}, ...]

  -- E-commerce EN (GEO international)
  seo_title_en      VARCHAR(70),
  meta_desc_en      VARCHAR(160),
  description_en    TEXT,
  keywords_en       TEXT[],
  faq_en            JSONB,

  -- Données structurées schema.org (Product @graph avec HowTo + BreadcrumbList)
  json_ld           JSONB,

  -- GEO — Generative Engine Optimization (FR)
  geo_blurb_fr         TEXT,           -- 2-3 phrases factuelles citables par IA
  use_cases_fr         TEXT[],         -- occasions / usages FR
  alternate_titles_fr  TEXT[],         -- synonymes et noms alternatifs FR
  entities_fr          JSONB,          -- entités nommées structurées FR

  -- GEO — Generative Engine Optimization (EN)
  geo_blurb_en         TEXT,
  use_cases_en         TEXT[],
  alternate_titles_en  TEXT[],
  entities_en          JSONB,

  -- HowTo entretien (schema.org)
  how_to_care_jsonld   JSONB,

  generated_by      UUID REFERENCES users(id),
  generated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by        UUID REFERENCES users(id),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (product_id, version)
);

CREATE INDEX IF NOT EXISTS idx_fiches_product ON product_fiches(product_id);
CREATE INDEX IF NOT EXISTS idx_fiches_current ON product_fiches(product_id) WHERE is_current = true;

-- ============================================================
--  TRIGGER : updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','suppliers','collections','materials',
    'products','change_requests'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
--  TRIGGER : calcul costing (total_cost, gross_margin_pct, coefficient)
-- ============================================================

CREATE OR REPLACE FUNCTION calc_costing_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_cost := COALESCE(NEW.materials_cost, 0)
                  + COALESCE(NEW.cmt_cost, 0)
                  + COALESCE(NEW.accessories_cost, 0)
                  + COALESCE(NEW.transport_cost, 0)
                  + COALESCE(NEW.customs_cost, 0);

  IF COALESCE(NEW.retail_price, 0) > 0 THEN
    NEW.gross_margin_pct := ROUND(
      ((NEW.retail_price - NEW.total_cost) / NEW.retail_price) * 100, 3);
  ELSE
    NEW.gross_margin_pct := 0;
  END IF;

  IF NEW.total_cost > 0 THEN
    NEW.coefficient := ROUND(COALESCE(NEW.retail_price, 0) / NEW.total_cost, 3);
  ELSE
    NEW.coefficient := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_costings_calc ON product_costings;
CREATE TRIGGER trg_product_costings_calc
  BEFORE INSERT OR UPDATE ON product_costings
  FOR EACH ROW EXECUTE FUNCTION calc_costing_fields();

-- ============================================================
--  13. FICHES TECHNIQUES STRUCTURÉES (spec sheets)
-- ============================================================

CREATE TABLE IF NOT EXISTS product_spec_sheets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version       SMALLINT NOT NULL DEFAULT 1,
  is_current    BOOLEAN NOT NULL DEFAULT TRUE,
  fiche_technique   JSONB NOT NULL DEFAULT '{}',
  fcm               JSONB NOT NULL DEFAULT '[]',
  mesures           JSONB NOT NULL DEFAULT '{}',
  prise_mesures     JSONB NOT NULL DEFAULT '{}',
  commentaires      JSONB NOT NULL DEFAULT '[]',
  labelling         JSONB NOT NULL DEFAULT '{}',
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

DO $$
BEGIN
  DROP TRIGGER IF EXISTS trg_product_spec_sheets_updated_at ON product_spec_sheets;
  CREATE TRIGGER trg_product_spec_sheets_updated_at
    BEFORE UPDATE ON product_spec_sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
END;
$$;

-- Ajout idempotent des colonnes GEO sur base existante
DO $$ BEGIN ALTER TABLE product_fiches ADD COLUMN geo_blurb_fr        TEXT;           EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE product_fiches ADD COLUMN use_cases_fr         TEXT[];         EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE product_fiches ADD COLUMN alternate_titles_fr  TEXT[];         EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE product_fiches ADD COLUMN entities_fr          JSONB;          EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE product_fiches ADD COLUMN geo_blurb_en         TEXT;           EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE product_fiches ADD COLUMN use_cases_en         TEXT[];         EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE product_fiches ADD COLUMN alternate_titles_en  TEXT[];         EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE product_fiches ADD COLUMN entities_en          JSONB;          EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE product_fiches ADD COLUMN how_to_care_jsonld   JSONB;          EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================================
--  MODULE ACHATS
-- ============================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference          VARCHAR(50) UNIQUE NOT NULL,
  supplier_id        UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  collection_id      UUID REFERENCES collections(id) ON DELETE SET NULL,
  status             VARCHAR(30) NOT NULL DEFAULT 'draft',
  order_date         DATE DEFAULT CURRENT_DATE,
  expected_delivery  DATE,
  actual_delivery    DATE,
  carrier            VARCHAR(100),
  tracking_number    VARCHAR(100),
  notes              TEXT,
  created_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id            UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  material_id         UUID REFERENCES materials(id) ON DELETE SET NULL,
  product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
  designation         VARCHAR(200),
  coloris             VARCHAR(100),
  quantity_ordered    NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity_received   NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit                VARCHAR(20) DEFAULT 'ml',
  unit_price          NUMERIC(10,2) DEFAULT 0,
  quality_status      VARCHAR(20) DEFAULT 'pending',
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
--  DONNÉES DE RÉFÉRENCE INITIALES
-- ============================================================

INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
  ('admin@plm.local', '$2b$12$placeholder_change_me', 'Admin', 'PLM', 'admin')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
--  FIN DU SCHÉMA
-- ============================================================
