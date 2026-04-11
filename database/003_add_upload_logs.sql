-- Add upload logs table for production upload history

CREATE TABLE IF NOT EXISTS upload_logs (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  inserted_rows INTEGER NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upload_logs_uploaded_at ON upload_logs(uploaded_at DESC);
