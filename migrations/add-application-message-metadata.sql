-- Migration: Add message metadata to job_applications

ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS unread_messages INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_job_applications_last_message_at ON job_applications(last_message_at DESC);