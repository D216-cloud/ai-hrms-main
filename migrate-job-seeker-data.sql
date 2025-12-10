-- Script to migrate existing job seeker data from separate tables to job_seekers table columns
-- This script populates the new JSON columns with data from the separate tables

-- Update job_seekers table with experience data
UPDATE public.job_seekers 
SET experience = (
  SELECT COALESCE(json_agg(row_to_json(experiences)), '[]'::json)
  FROM (
    SELECT id, title, company_name as company, description, start_date, end_date, is_current_job
    FROM public.job_seeker_experience 
    WHERE seeker_id = job_seekers.id
    ORDER BY start_date DESC
  ) experiences
)
WHERE experience IS NULL OR experience = '[]';

-- Update job_seekers table with education data
UPDATE public.job_seekers 
SET education = (
  SELECT COALESCE(json_agg(row_to_json(educations)), '[]'::json)
  FROM (
    SELECT id, school_name as school, degree, field_of_study, graduation_year, gpa
    FROM public.job_seeker_education 
    WHERE seeker_id = job_seekers.id
    ORDER BY graduation_year DESC
  ) educations
)
WHERE education IS NULL OR education = '[]';

-- Update job_seekers table with skills data
UPDATE public.job_seekers 
SET skills = (
  SELECT COALESCE(json_agg(row_to_json(skill_data)), '[]'::json)
  FROM (
    SELECT id, skill_name as name, proficiency_level as level, years_of_experience
    FROM public.job_seeker_skills 
    WHERE seeker_id = job_seekers.id
  ) skill_data
)
WHERE skills IS NULL OR skills = '[]';

-- Update profile completion based on available data
UPDATE public.job_seekers 
SET profile_completion = (
  (CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 20 ELSE 0 END) +
  (CASE WHEN phone IS NOT NULL AND phone != '' THEN 10 ELSE 0 END) +
  (CASE WHEN location IS NOT NULL AND location != '' THEN 10 ELSE 0 END) +
  (CASE WHEN bio IS NOT NULL AND bio != '' THEN 20 ELSE 0 END) +
  (CASE WHEN skills IS NOT NULL AND skills != '[]' AND skills != '' THEN 15 ELSE 0 END) +
  (CASE WHEN experience IS NOT NULL AND experience != '[]' AND experience != '' THEN 15 ELSE 0 END) +
  (CASE WHEN education IS NOT NULL AND education != '[]' AND education != '' THEN 10 ELSE 0 END)
)
WHERE profile_completion = 0;