CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,

    original_filename VARCHAR(255) NOT NULL,

    stored_filename VARCHAR(255) NOT NULL UNIQUE,

    storage_key TEXT NOT NULL UNIQUE,

    mime_type VARCHAR(100) NOT NULL,

    file_size BIGINT NOT NULL,

    uploaded_by INTEGER,

    status VARCHAR(30) NOT NULL DEFAULT 'UPLOADED',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);