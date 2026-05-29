-- ============================================================================
-- PERFORMANCE OPTIMIZATION: Database Indexes & Query Optimization
-- ============================================================================
-- This migration adds comprehensive indexes for query performance
-- Based on cahier des charges requirements and query patterns

-- ============================================================================
-- CONTACTS TABLE INDEXES
-- ============================================================================

-- Single column indexes (frequently used in WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_contact_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contact_statut ON contacts(statut);
CREATE INDEX IF NOT EXISTS idx_contact_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contacts(created_at DESC);

-- Composite indexes (common query patterns)
CREATE INDEX IF NOT EXISTS idx_contact_statut_type ON contacts(statut, type);
CREATE INDEX IF NOT EXISTS idx_contact_type_created ON contacts(type, created_at DESC);

-- Full-text search index (search across nom, prenom, email, entreprise)
CREATE INDEX IF NOT EXISTS idx_contact_search_tsvector
  ON contacts USING GIN(search_tsvector)
  WHERE search_tsvector IS NOT NULL;

-- ============================================================================
-- INTERACTIONS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_interaction_contact_id ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interaction_date ON interactions(date_interaction DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_contact_date ON interactions(contact_id, date_interaction DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_type ON interactions(type);

-- BRIN index for time-series data (large tables benefit)
CREATE INDEX IF NOT EXISTS idx_interaction_created_brin
  ON interactions USING BRIN(created_at)
  WITH (pages_per_range = 128);

-- ============================================================================
-- EVENEMENTS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_evenement_client_id ON evenements(client_id);
CREATE INDEX IF NOT EXISTS idx_evenement_statut ON evenements(statut);
CREATE INDEX IF NOT EXISTS idx_evenement_created_at ON evenements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evenement_updated_at ON evenements(updated_at DESC);

-- Composite indexes for common filters
CREATE INDEX IF NOT EXISTS idx_evenement_client_statut ON evenements(client_id, statut);
CREATE INDEX IF NOT EXISTS idx_evenement_statut_created ON evenements(statut, created_at DESC);

-- Partial indexes for specific status (speeds up common queries)
CREATE INDEX IF NOT EXISTS idx_evenement_proposition
  ON evenements(created_at DESC)
  WHERE statut = 'proposition';

CREATE INDEX IF NOT EXISTS idx_evenement_confirme
  ON evenements(created_at DESC)
  WHERE statut = 'confirme';

-- ============================================================================
-- OPTIONS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_option_evenement_id ON options(evenement_id);
CREATE INDEX IF NOT EXISTS idx_option_created_at ON options(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_option_pax_estimÃ© ON options(pax_estimÃ©);

-- ============================================================================
-- DEVIS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_devis_numero ON devis(numero);
CREATE INDEX IF NOT EXISTS idx_devis_option_id ON devis(option_id);
CREATE INDEX IF NOT EXISTS idx_devis_statut ON devis(statut);
CREATE INDEX IF NOT EXISTS idx_devis_created_at ON devis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devis_updated_at ON devis(updated_at DESC);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_devis_statut_created ON devis(statut, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devis_option_statut ON devis(option_id, statut);

-- Partial indexes for common status
CREATE INDEX IF NOT EXISTS idx_devis_brouillon
  ON devis(created_at DESC)
  WHERE statut = 'brouillon';

CREATE INDEX IF NOT EXISTS idx_devis_envoye
  ON devis(created_at DESC)
  WHERE statut = 'envoye';

-- ============================================================================
-- DEVIS_VERSIONS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_devis_version_devis_id ON devis_versions(devis_id);
CREATE INDEX IF NOT EXISTS idx_devis_version_created_by ON devis_versions(created_by_id);
CREATE INDEX IF NOT EXISTS idx_devis_version_created_at ON devis_versions(created_at DESC);

-- Unique constraint on (devis_id, version_number)
CREATE UNIQUE INDEX IF NOT EXISTS idx_devis_version_unique
  ON devis_versions(devis_id, version_number);

-- ============================================================================
-- FACTURES TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_facture_numero ON factures(numero);
CREATE INDEX IF NOT EXISTS idx_facture_devis_id ON factures(devis_id);
CREATE INDEX IF NOT EXISTS idx_facture_statut_paiement ON factures(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_facture_created_at ON factures(created_at DESC);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_facture_statut_created ON factures(statut_paiement, created_at DESC);

-- Partial indexes for unpaid invoices (most common query)
CREATE INDEX IF NOT EXISTS idx_facture_impayee
  ON factures(created_at DESC)
  WHERE statut_paiement != 'payee';

CREATE INDEX IF NOT EXISTS idx_facture_partiellement_payee
  ON factures(created_at DESC)
  WHERE statut_paiement = 'partiellement_payee';

-- ============================================================================
-- TACHES TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tache_statut ON taches(statut);
CREATE INDEX IF NOT EXISTS idx_tache_assignee_id ON taches(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tache_evenement_id ON taches(evenement_id);
CREATE INDEX IF NOT EXISTS idx_tache_due_date ON taches(due_date);
CREATE INDEX IF NOT EXISTS idx_tache_created_at ON taches(created_at DESC);

-- Composite indexes (Kanban view)
CREATE INDEX IF NOT EXISTS idx_tache_statut_assignee ON taches(statut, assignee_id);
CREATE INDEX IF NOT EXISTS idx_tache_evenement_statut ON taches(evenement_id, statut);
CREATE INDEX IF NOT EXISTS idx_tache_assignee_statut ON taches(assignee_id, statut);

-- Partial indexes for pending tasks (most common)
CREATE INDEX IF NOT EXISTS idx_tache_a_faire
  ON taches(due_date)
  WHERE statut = 'a_faire';

CREATE INDEX IF NOT EXISTS idx_tache_en_cours
  ON taches(due_date)
  WHERE statut = 'en_cours';

-- Overdue tasks (for alerts)
CREATE INDEX IF NOT EXISTS idx_tache_overdue
  ON taches(due_date DESC)
  WHERE statut IN ('a_faire', 'en_cours')
  AND due_date < NOW();

-- ============================================================================
-- AUDIT_LOGS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_audit_entity_created ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_created ON audit_logs(user_id, created_at DESC);

-- BRIN for time-series audit data
CREATE INDEX IF NOT EXISTS idx_audit_created_brin
  ON audit_logs USING BRIN(created_at)
  WITH (pages_per_range = 256);

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_statut ON users(statut);
CREATE INDEX IF NOT EXISTS idx_user_created_at ON users(created_at DESC);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS (with appropriate index hints)
-- ============================================================================

-- Ensure foreign key columns are indexed for JOIN performance
-- Most are already indexed above, but verify:

-- evenements.client_id â†’ contacts.id
CREATE INDEX IF NOT EXISTS idx_evenement_client_fk ON evenements(client_id);

-- options.evenement_id â†’ evenements.id
CREATE INDEX IF NOT EXISTS idx_option_evenement_fk ON options(evenement_id);

-- devis.option_id â†’ options.id
CREATE INDEX IF NOT EXISTS idx_devis_option_fk ON devis(option_id);

-- taches.evenement_id â†’ evenements.id
CREATE INDEX IF NOT EXISTS idx_tache_evenement_fk ON taches(evenement_id);

-- taches.assignee_id â†’ users.id
CREATE INDEX IF NOT EXISTS idx_tache_assignee_fk ON taches(assignee_id);

-- ============================================================================
-- VACUUM ANALYZE (optimize query planner statistics)
-- ============================================================================

-- After creating indexes, update table statistics for query optimizer
VACUUM ANALYZE contacts;
VACUUM ANALYZE interactions;
VACUUM ANALYZE evenements;
VACUUM ANALYZE options;
VACUUM ANALYZE devis;
VACUUM ANALYZE devis_versions;
VACUUM ANALYZE factures;
VACUUM ANALYZE taches;
VACUUM ANALYZE audit_logs;
VACUUM ANALYZE users;

-- ============================================================================
-- MONITORING & STATISTICS
-- ============================================================================

-- To monitor index usage, run:
-- SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan DESC;
--
-- To find missing indexes:
-- SELECT * FROM pg_stat_user_tables WHERE idx_scan = 0;
--
-- To analyze query performance:
-- EXPLAIN ANALYZE SELECT ...;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Partial indexes (WHERE clause) save space and are faster for filtered queries
-- 2. Composite indexes help with multi-column WHERE and ORDER BY clauses
-- 3. BRIN indexes are efficient for time-series data and large tables
-- 4. Avoid over-indexing - each index adds write overhead
-- 5. Regular VACUUM ANALYZE maintains statistics for query optimizer
-- 6. Monitor index usage: SELECT * FROM pg_stat_user_indexes;
-- 7. Drop unused indexes: DROP INDEX IF EXISTS idx_name;
