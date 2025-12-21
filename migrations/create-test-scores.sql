-- Create table to store individual test submission scores and computed overall score
CREATE TABLE IF NOT EXISTS public.test_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id TEXT,
  test_id UUID,
  test_token TEXT,
  job_id UUID,
  test_score INTEGER,
  overall_score INTEGER,
  resume_score INTEGER,
  comm_score INTEGER,
  correct_answers INTEGER,
  total_questions INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_scores_application_id ON public.test_scores(application_id);
CREATE INDEX IF NOT EXISTS idx_test_scores_created_at ON public.test_scores(created_at DESC);
