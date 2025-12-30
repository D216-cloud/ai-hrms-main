-- Migration: Ensure messages table contains expected columns

-- Add columns if they don't exist (safe to run multiple times)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS application_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS interview_id UUID; -- Nullable by design
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_type TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS to_email TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS to_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS from_user_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS from_email TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS from_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Ensure interview_id and sender_type can be NULL (drop NOT NULL if present)
ALTER TABLE messages ALTER COLUMN interview_id DROP NOT NULL;
ALTER TABLE messages ALTER COLUMN sender_type DROP NOT NULL;

-- Backfill existing NULL sender_type values with 'system' for safety
UPDATE messages SET sender_type = 'system' WHERE sender_type IS NULL;

-- Ensure content column exists and is nullable; backfill from subject/body if missing
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;
UPDATE messages SET content = COALESCE(NULLIF(content, ''), CONCAT(COALESCE(subject, ''), '\n\n', COALESCE(body, ''))) WHERE content IS NULL OR content = '';

-- Create indexes if missing
CREATE INDEX IF NOT EXISTS idx_messages_application_id ON messages(application_id);
CREATE INDEX IF NOT EXISTS idx_messages_interview_id ON messages(interview_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_email ON messages(to_email);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
