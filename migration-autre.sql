-- ============================================================
--  Migration — Ajoute la catégorie "autre" à la table mails
--  À exécuter UNE FOIS dans : Supabase > SQL Editor > New query
-- ============================================================

-- Supprime l'ancienne contrainte et la recrée avec "autre"
ALTER TABLE mails DROP CONSTRAINT IF EXISTS mails_classe_check;

ALTER TABLE mails ADD CONSTRAINT mails_classe_check
  CHECK (classe IN ('urgent','moyen','pasurgent','inconnu','autre'));
