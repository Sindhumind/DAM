ALTER TABLE assets
ADD COLUMN IF NOT EXISTS processing_lease_token UUID;