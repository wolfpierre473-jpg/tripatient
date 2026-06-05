-- ============================================================
--  TriPatient — Schéma Supabase
--  Copiez-collez ce SQL dans : Supabase > SQL Editor > New query
-- ============================================================

-- ── Table patients ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id                 TEXT PRIMARY KEY,              -- ex: P001
  nom                TEXT NOT NULL,
  prenom             TEXT NOT NULL,
  email              TEXT UNIQUE NOT NULL,
  antecedents        JSONB    DEFAULT '[]',         -- tableau de strings
  traitement_en_cours TEXT,
  dernier_rdv        DATE,
  prochain_rdv       DATE,
  risque             TEXT CHECK (risque IN ('faible','modéré','élevé','très élevé')),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table mails ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mails (
  id                TEXT PRIMARY KEY,              -- ex: G<gmailId> ou M001
  email_expediteur  TEXT NOT NULL,
  nom_expediteur    TEXT,
  date_reception    TIMESTAMPTZ NOT NULL,
  sujet             TEXT,
  corps             TEXT,
  classe            TEXT CHECK (classe IN ('urgent','moyen','pasurgent','inconnu','autre')),
  regle_label       TEXT,
  source            TEXT CHECK (source IN ('gmail','demo','manuel')),
  gmail_id          TEXT UNIQUE,                   -- null si demo/manuel
  patient_id        TEXT REFERENCES patients(id),
  traite            BOOLEAN DEFAULT FALSE,          -- le médecin a traité ce mail
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table settings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  TEXT
);

-- ── Index utiles ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mails_classe          ON mails(classe);
CREATE INDEX IF NOT EXISTS idx_mails_date_reception  ON mails(date_reception DESC);
CREATE INDEX IF NOT EXISTS idx_mails_traite          ON mails(traite);
CREATE INDEX IF NOT EXISTS idx_patients_email        ON patients(email);

-- ── RLS (Row Level Security) ─────────────────────────────────
-- Active la sécurité par ligne sur chaque table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mails    ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Politique : accès total uniquement via la clé anon (frontend)
-- Pour une app médicale en production, restreignez avec auth.uid()
CREATE POLICY "anon_read_write_patients" ON patients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "anon_read_write_mails" ON mails
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "anon_read_write_settings" ON settings
  FOR ALL USING (true) WITH CHECK (true);

-- ── Données de démo ──────────────────────────────────────────
INSERT INTO patients (id, nom, prenom, email, antecedents, traitement_en_cours, dernier_rdv, prochain_rdv, risque)
VALUES
  ('P001','Martin','Sophie','sophie.martin@email.com',  '["mélanome stade I (2022)","carcinome basocellulaire (2019)"]','surveillance trimestrielle','2026-02-15','2026-06-10','élevé'),
  ('P002','Dubois','Jean',  'jean.dubois@email.com',    '["eczéma chronique","psoriasis modéré"]',                      'méthotrexate 15mg/semaine',  '2026-04-01','2026-07-01','modéré'),
  ('P003','Leroy', 'Emma',  'emma.leroy@email.com',     '["acné sévère"]',                                              'isotrétinoïne 20mg/j',       '2026-05-01','2026-06-15','faible'),
  ('P004','Bernard','Michel','michel.bernard@email.com','["lymphome cutané T (2024)","diabète type 2"]',                'photothérapie UVB + corticoïdes locaux','2026-05-20','2026-06-03','très élevé'),
  ('P005','Petit','Laura',  'laura.petit@email.com',    '[]',                                                           NULL,                         '2026-01-10', NULL,        'faible')
ON CONFLICT (id) DO NOTHING;
