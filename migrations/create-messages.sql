-- Migration: Create messages table

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID, -- job_applications.id when applicable
  to_email TEXT,
  to_name TEXT,
  from_user_id UUID,
  from_email TEXT,
  from_name TEXT,
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_messages_application_id ON messages(application_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_email ON messages(to_email);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
