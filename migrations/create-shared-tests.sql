-- Create a simple table for shareable ad-hoc tests (not linked to applications)
CREATE TABLE IF NOT EXISTS shared_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  job_title TEXT,
  questions JSONB NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  created_by UUID REFERENCES hr_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_tests_token ON shared_tests(token);
