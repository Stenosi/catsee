-- ============================================================================
-- Setup iniziale del database CatSee
-- ============================================================================
-- Da eseguire UNA SOLA VOLTA, dopo aver creato il database su Neon
-- e PRIMA del primo `drizzle-kit push`.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

SELECT PostGIS_Version();