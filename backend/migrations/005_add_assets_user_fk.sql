UPDATE assets
SET uploaded_by = NULL
WHERE uploaded_by IS NOT NULL
  AND uploaded_by NOT IN (SELECT id FROM users);

ALTER TABLE assets
  ADD CONSTRAINT fk_assets_users
  FOREIGN KEY (uploaded_by)
  REFERENCES users(id)
  ON DELETE SET NULL;
