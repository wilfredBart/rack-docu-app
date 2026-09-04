-- Enkel uitvoeren als je eerder al password_reset_columns.sql had toegepast.
-- Ruimt de ongebruikte reset_token kolommen op (token-flow werd vervangen
-- door de local-only recovery.html aanpak).
ALTER TABLE users
DROP COLUMN reset_token_hash,
DROP COLUMN reset_token_expires;
