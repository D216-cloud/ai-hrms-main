import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// Use the server-side admin client to bypass RLS and ensure consistent behavior
const supabase = supabaseAdmin;

// Helper to get user ID
async function getUserSeekerId(session) {
  if (!session?.user?.email) return null;

  let { data: user } = await supabase
    .from('job_seekers')
    .select('id')
    .eq('email', session.user.email)
    .single();

  return user?.id;
}

// POST - Apply for job
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seekerId = await getUserSeekerId(session);
    if (!seekerId) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { job_id, cover_letter } = await req.json();

    if (!job_id) {
      return Response.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Get user's resume URL
    const { data: profile } = await supabase
      .from('job_seekers')
      .select('resume_url')
      .eq('id', seekerId)
      .single();

    // Check if already applied
    const { data: existingApp } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', job_id)
      .eq('seeker_id', seekerId)
      .single();

    if (existingApp) {
      return Response.json({ error: 'You have already applied for this job' }, { status: 400 });
    }

    // Create application
    const { data: application, error } = await supabase
      .from('job_applications')
      .insert([
        {
          job_id,
          seeker_id: seekerId,
          resume_url: profile?.resume_url,
          cover_letter: cover_letter || null,
          status: 'applied',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Application insert error:', error);
      return Response.json({ error: 'Failed to apply for job', details: error.message }, { status: 500 });
    }

    return Response.json({ application, message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Application API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get applications for job (with pre-fill data)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('job_id');
    const token = searchParams.get('token');
    const testToken = searchParams.get('testToken');

    // Public lookup by application token or test token (used by status pages)
    if (token || testToken) {
      try {
        // First try the public applications table
        let query = supabase.from('applications').select(`*, jobs(title, company, location)`);
        if (token) query = query.eq('application_token', token);
        if (testToken) query = query.eq('test_token', testToken);

        const { data: apps, error } = await query;
        if (error) {
          console.error('Failed to fetch application by token:', error);
          return Response.json({ error: 'Failed to fetch application' }, { status: 500 });
        }

        // If we found results in the public applications table, return them
        if (apps && apps.length > 0) {
          return Response.json(apps);
        }

        // If no public application found and a testToken was provided, try job_applications (HR-created invites)
        if (testToken) {
          try {
            const { data: jobApps, error: jobAppsError } = await supabase
              .from('job_applications')
            .select(`*, jobs(title, company, location), job_seekers(full_name as name, email, phone, resume_url, profile_picture_url)`)
            .eq('test_token', testToken)

            if (jobAppsError) {
              console.error('Failed to fetch job_application by test token:', jobAppsError);
              return Response.json({ error: 'Failed to fetch application' }, { status: 500 });
            }

            // Normalize jobApplications to the same shape as public applications where possible
            if (jobApps && jobApps.length > 0) {
              const normalized = jobApps.map((a) => ({
                id: a.id,
                job_id: a.job_id,
                name: a.job_seekers?.name || a.name || '',
                email: a.job_seekers?.email || '',
                phone: a.job_seekers?.phone || '',
                location: a.job_seekers?.location || '',
                resume_url: a.job_seekers?.resume_url || a.resume_url || '',
                status: a.status || 'applied',
                application_token: null,
                test_token: a.test_token,
                jobs: a.jobs || null,
                created_at: a.applied_at || a.updated_at || null,
                raw: a,
              }));

              return Response.json(normalized);
            }
          } catch (err) {
            console.error('Error fetching job_applications by test token:', err);
            return Response.json({ error: 'Internal server error' }, { status: 500 });
          }
        }

        // Return empty array if nothing found
        return Response.json([]);
      } catch (err) {
        console.error('Error fetching application by token:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    // Lookup by numeric/uuid ID - allow status pages linked from internal views to pass an ID
    const idParam = searchParams.get('id');
    if (idParam) {
      try {
        // Try public applications first
        const { data: publicApp, error: publicErr } = await supabase
          .from('applications')
          .select(`*, jobs(title, company, location)`)
          .eq('id', idParam)
          .single();

        if (publicApp) return Response.json([publicApp]);

        // If not found, try job_applications
        const { data: jobApp, error: jobErr } = await supabase
          .from('job_applications')
          .select(`*, jobs(title, company, location), job_seekers(full_name, email, phone, resume_url)`)
          .eq('id', idParam)
          .single();

        if (jobApp) return Response.json([jobApp]);

        return Response.json([]);
      } catch (err) {
        console.error('Error fetching application by id:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    const session = await getServerSession(authOptions);

    // If HR/Admin asking for applications
    if (session?.user?.role === 'hr' || session?.user?.role === 'admin') {
      // If a specific jobId is requested, ensure HR owns the job (unless admin)
      if (jobId) {
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('id, hr_email, created_by')
          .eq('id', jobId)
          .single();

        if (jobError || !job) {
          console.error('Job not found when fetching applications for job:', jobId, jobError);
          return Response.json({ error: 'Job not found' }, { status: 404 });
        }

        // Only allow if admin or HR who posted the job
        if (session.user.role !== 'admin') {
          // Check if this HR user owns the job by email
          const isOwnerByEmail = job.hr_email === session.user.email;

          // Also check by created_by UUID if we have the user's ID
          const isOwnerById = session.user.id && job.created_by === session.user.id;

          if (!isOwnerByEmail && !isOwnerById) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
          }
        }

        // Fetch job_applications (authenticated seekers) and public applications (anonymous candidates) for that job
        const [{ data: jobApps, error: jobAppsError } = {}, { data: publicApps, error: publicAppsError } = {}] = await Promise.all([
          supabase
            .from('job_applications')
            .select(`
              *, 
              job_seekers(full_name, email, phone, location, resume_url, job_seeker_skills(skill_name)), 
              jobs(title)
            `)
            .eq('job_id', jobId)
            .order('applied_at', { ascending: false }),

          supabase
            .from('applications')
            .select(`*, jobs(title)`)
            .eq('job_id', jobId)
            .order('created_at', { ascending: false }),
        ]);

        if (jobAppsError || publicAppsError) {
          console.error('Failed to fetch applications for job:', jobId, { jobAppsError, publicAppsError });
          return Response.json({ error: 'Failed to fetch applications', details: process.env.NODE_ENV === 'development' ? (jobAppsError?.message || publicAppsError?.message) : undefined }, { status: 500 });
        }

        // Normalize both sources into a common shape
        const normalizeJobApp = (a) => ({
          id: a.id,
          source: 'seeker',
          job_id: a.job_id,
          job_title: a.jobs?.title || 'Unknown Position',
          name: a.job_seekers?.full_name || 'Unknown Applicant',
          email: a.job_seekers?.email || '',
          phone: a.job_seekers?.phone || '',
          location: a.job_seekers?.location || '',
          resume_url: a.job_seekers?.resume_url || a.resume_url || '',
          profile_picture_url: a.job_seekers?.profile_picture_url || null,
          skills: a.job_seekers?.job_seeker_skills?.map(s => s.skill_name) || [],
          status: a.status || 'applied',
          match_score: a.match_score || 0,
          resume_match_score: a.match_score || 0,
          overall_score: a.overall_score || 0,
          created_at: a.applied_at || a.updated_at || null,
          raw: a,
        });

        const normalizePublicApp = (a) => ({
          id: a.id,
          source: 'public',
          job_id: a.job_id,
          job_title: a.jobs?.title || 'Unknown Position',
          name: a.name || 'Unknown Applicant',
          email: a.email || '',
          phone: a.phone || '',
          location: a.location || '',
          resume_url: a.resume_url || '',
          skills: a.skills || [],
          status: a.status || 'submitted',
          match_score: a.resume_match_score || 0,
          resume_match_score: a.resume_match_score || 0,
          overall_score: a.overall_score || 0,
          created_at: a.created_at || null,
          raw: a,
        });

        const combined = [
          ...(jobApps || []).map(normalizeJobApp),
          ...(publicApps || []).map(normalizePublicApp),
        ];

        // Sort by created_at descending
        combined.sort((x, y) => new Date(y.created_at || 0) - new Date(x.created_at || 0));

        return Response.json({ applications: combined });
      }

      // If no jobId provided: list applications for HR's jobs (or all if admin)
      if (session.user.role === 'admin') {
        // Fetch all authenticated seeker applications and public applications
        const [{ data: jobApps, error: jobAppsError } = {}, { data: publicApps, error: publicAppsError } = {}] = await Promise.all([
          supabase
            .from('job_applications')
            .select(`
              *, 
              job_seekers(full_name, email, phone, location, resume_url, job_seeker_skills(skill_name)), 
              jobs(title)
            `)
            .order('applied_at', { ascending: false }),

          supabase
            .from('applications')
            .select(`*, jobs(title)`)
            .order('created_at', { ascending: false }),
        ]);

        if (jobAppsError || publicAppsError) {
          console.error('Failed to fetch all applications (admin):', { jobAppsError, publicAppsError });
          return Response.json({ error: 'Failed to fetch applications', details: process.env.NODE_ENV === 'development' ? (jobAppsError?.message || publicAppsError?.message) : undefined }, { status: 500 });
        }

        const normalizeJobApp = (a) => ({
          id: a.id,
          source: 'seeker',
          job_id: a.job_id,
          job_title: a.jobs?.title || 'Unknown Position',
          name: a.job_seekers?.full_name || 'Unknown Applicant',
          email: a.job_seekers?.email || '',
          phone: a.job_seekers?.phone || '',
          location: a.job_seekers?.location || '',
          resume_url: a.job_seekers?.resume_url || a.resume_url || '',
          profile_picture_url: a.job_seekers?.profile_picture_url || null,
          skills: a.job_seekers?.job_seeker_skills?.map(s => s.skill_name) || [],
          status: a.status || 'applied',
          match_score: a.match_score || 0,
          resume_match_score: a.match_score || 0,
          overall_score: a.overall_score || 0,
          created_at: a.applied_at || a.updated_at || null,
          raw: a,
        });

        const normalizePublicApp = (a) => ({
          id: a.id,
          source: 'public',
          job_id: a.job_id,
          job_title: a.jobs?.title || 'Unknown Position',
          name: a.name || 'Unknown Applicant',
          email: a.email || '',
          phone: a.phone || '',
          location: a.location || '',
          resume_url: a.resume_url || '',
          skills: a.skills || [],
          status: a.status || 'submitted',
          match_score: a.resume_match_score || 0,
          overall_score: a.overall_score || 0,
          created_at: a.created_at || null,
          raw: a,
        });

        const combined = [
          ...(jobApps || []).map(normalizeJobApp),
          ...(publicApps || []).map(normalizePublicApp),
        ];

        combined.sort((x, y) => new Date(y.created_at || 0) - new Date(x.created_at || 0));

        return Response.json({ applications: combined });
      } else {
        // HR: fetch applications for jobs owned by this HR user
        // We'll join jobs table and filter by hr_email OR created_by (user's UUID)
        const ownerEmail = session.user.email;
        const userId = session.user.id;

        // Fetch all jobs owned by this HR (by email or UUID)
        let jobsQuery = supabase
          .from('jobs')
          .select('id');

        // Build OR condition for hr_email or created_by
        if (userId) {
          jobsQuery = jobsQuery.or(`hr_email.eq.${ownerEmail},created_by.eq.${userId}`);
        } else {
          jobsQuery = jobsQuery.eq('hr_email', ownerEmail);
        }

        const { data: jobs, error: jobsError } = await jobsQuery;

        if (jobsError) {
          console.error('Failed to fetch jobs owned by HR:', jobsError);
          return Response.json({ error: 'Failed to fetch applications', details: process.env.NODE_ENV === 'development' ? jobsError.message : undefined }, { status: 500 });
        }

        const jobIds = (jobs || []).map(j => j.id).filter(Boolean);

        if (jobIds.length === 0) {
          return Response.json({ applications: [] });
        }

        // Fetch authenticated seeker applications and public applications for HR-owned jobs
        const [{ data: jobApps, error: jobAppsError } = {}, { data: publicApps, error: publicAppsError } = {}] = await Promise.all([
          supabase
            .from('job_applications')
            .select(`
              *, 
              job_seekers(full_name, email, phone, location, resume_url, job_seeker_skills(skill_name)), 
              jobs(title)
            `)
            .in('job_id', jobIds)
            .order('applied_at', { ascending: false }),

          supabase
            .from('applications')
            .select(`*, jobs(title)`)
            .in('job_id', jobIds)
            .order('created_at', { ascending: false }),
        ]);

        if (jobAppsError || publicAppsError) {
          console.error('Failed to fetch applications for HR-owned jobs:', { jobAppsError, publicAppsError });
          return Response.json({ error: 'Failed to fetch applications', details: process.env.NODE_ENV === 'development' ? (jobAppsError?.message || publicAppsError?.message) : undefined }, { status: 500 });
        }

        const normalizeJobApp = (a) => ({
          id: a.id,
          source: 'seeker',
          job_id: a.job_id,
          job_title: a.jobs?.title || 'Unknown Position',
          name: a.job_seekers?.full_name || 'Unknown Applicant',
          email: a.job_seekers?.email || '',
          phone: a.job_seekers?.phone || '',
          location: a.job_seekers?.location || '',
          resume_url: a.job_seekers?.resume_url || a.resume_url || '',
          profile_picture_url: a.job_seekers?.profile_picture_url || null,
          skills: a.job_seekers?.job_seeker_skills?.map(s => s.skill_name) || [],
          status: a.status || 'applied',
          match_score: a.match_score || 0,
          resume_match_score: a.match_score || 0,
          overall_score: a.overall_score || 0,
          created_at: a.applied_at || a.updated_at || null,
          raw: a,
        });

        const normalizePublicApp = (a) => ({
          id: a.id,
          source: 'public',
          job_id: a.job_id,
          job_title: a.jobs?.title || 'Unknown Position',
          name: a.name || 'Unknown Applicant',
          email: a.email || '',
          phone: a.phone || '',
          location: a.location || '',
          resume_url: a.resume_url || '',
          skills: a.skills || [],
          status: a.status || 'submitted',
          match_score: a.resume_match_score || 0,
          overall_score: a.overall_score || 0,
          created_at: a.created_at || null,
          raw: a,
        });

        const combined = [
          ...(jobApps || []).map(normalizeJobApp),
          ...(publicApps || []).map(normalizePublicApp),
        ];

        combined.sort((x, y) => new Date(y.created_at || 0) - new Date(x.created_at || 0));

        return Response.json({ applications: combined });
      }
    }

    // For job seekers - get pre-fill data for applying
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!jobId) {
      return Response.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const seekerId = await getUserSeekerId(session);
    if (!seekerId) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user has applied
    // Check if the user already applied for this job
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .eq('seeker_id', seekerId)
      .single();

    if (appError) {
      // Supabase returns 406/PGRST116 when no rows are found for single().
      // Treat that as 'not applied' and return prefill data.
      console.log('No existing application found (or fetch error):', appError?.message || appError);

      const { data: profile, error: profileError } = await supabase
        .from('job_seekers')
        .select(`id, email, full_name, phone, location, bio, resume_url, job_seeker_skills(skill_name, proficiency_level)`)
        .eq('id', seekerId)
        .single();

      if (profileError) {
        console.error('Failed to fetch seeker profile for prefill:', profileError);
        return Response.json({ error: 'Failed to fetch profile for prefill' }, { status: 500 });
      }

      return Response.json({
        has_applied: false,
        prefill_data: {
          name: profile?.full_name,
          email: profile?.email,
          phone: profile?.phone,
          location: profile?.location,
          resume_url: profile?.resume_url,
          skills: profile?.job_seeker_skills?.map(s => s.skill_name) || [],
        }
      });
    }

    // Already applied
    return Response.json({
      has_applied: true,
      application,
      status: application?.status,
    });
  } catch (error) {
    console.error('Application GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
