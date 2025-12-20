-- Migration: Restrict HR access to applications to jobs they own
-- Drops any previous broad HR policy and creates a safer policy

DROP POLICY IF EXISTS "HR can view all applications" ON applications;
DROP POLICY IF EXISTS "HR can view applications for own jobs" ON applications;

CREATE POLICY "HR can view applications for own jobs" ON applications
  FOR SELECT USING (
    -- Admins keep full access
    EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role = 'admin')
    -- HR users can only select applications that belong to jobs they created
    OR EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND created_by = auth.uid())
  );
