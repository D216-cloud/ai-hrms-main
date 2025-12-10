import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

// Helper to get user ID
async function getUserSeekerId(session) {
  if (!session?.user?.email) return null;

  let { data: user } = await supabaseAdmin
    .from('job_seekers')
    .select('id')
    .eq('email', session.user.email)
    .single();

  return user?.id;
}

// GET - Get all experiences for user
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seekerId = await getUserSeekerId(session);
    if (!seekerId) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get experiences from job_seeker_profiles table
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('job_seeker_profiles')
      .select('experience')
      .eq('email', session.user.email)
      .single();

    // Handle case where profile doesn't exist yet
    if (fetchError && fetchError.code === 'PGRST116') {
      // Return empty array if no profile exists
      return Response.json({ experiences: [] });
    } else if (fetchError) {
      console.warn('Experience fetch error:', fetchError.message);
      return Response.json({ experiences: [] });
    }

    let experiences = [];
    if (profile && profile.experience) {
      try {
        experiences = JSON.parse(profile.experience);
      } catch (e) {
        console.warn('Error parsing experiences:', e);
        experiences = [];
      }
    }

    return Response.json({ experiences: experiences || [] });
  } catch (error) {
    console.error('Experience fetch error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove experience
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seekerId = await getUserSeekerId(session);
    if (!seekerId) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const experienceId = searchParams.get('id');

    if (!experienceId) {
      return Response.json({ error: 'Experience ID is required' }, { status: 400 });
    }

    // Get or create profile in job_seeker_profiles
    let { data: profile, error: fetchError } = await supabaseAdmin
      .from('job_seeker_profiles')
      .select('experience')
      .eq('email', session.user.email)
      .single();

    // If profile doesn't exist, create it
    if (fetchError && fetchError.code === 'PGRST116') {
      const { error: createError } = await supabaseAdmin
        .from('job_seeker_profiles')
        .insert([
          {
            email: session.user.email,
            fullName: session.user.name || session.user.email.split('@')[0],
            experience: JSON.stringify([]),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);

      if (createError) {
        console.error('Error creating profile:', createError);
        return Response.json({ error: 'Failed to create profile' }, { status: 500 });
      }
      
      // Set empty experiences array
      profile = { experience: '[]' };
    } else if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    let experiences = [];
    if (profile && profile.experience) {
      try {
        experiences = JSON.parse(profile.experience);
      } catch (e) {
        console.warn('Error parsing experiences:', e);
        experiences = [];
      }
    }

    // Find and remove the experience
    const experienceIndex = experiences.findIndex(exp => exp.id === experienceId);
    if (experienceIndex === -1) {
      return Response.json({ error: 'Experience not found' }, { status: 404 });
    }

    // Remove the experience
    const removedExperience = experiences.splice(experienceIndex, 1)[0];

    // Update job_seeker_profiles with updated experiences
    const { error: profileError } = await supabaseAdmin
      .from('job_seeker_profiles')
      .update({
        experience: JSON.stringify(experiences),
        updatedAt: new Date().toISOString()
      })
      .eq('email', session.user.email);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Update the denormalized columns in job_seekers table
    if (experiences.length > 0) {
      // Update with the most recent experience
      const latestExperience = experiences[0];
      const { error: jobSeekerError } = await supabaseAdmin
        .from('job_seekers')
        .update({
          job_title: latestExperience.title,
          company_name: latestExperience.company_name,
          job_bio: latestExperience.description,
          start_date: latestExperience.start_date,
          end_date: latestExperience.end_date,
          is_current_job: latestExperience.is_current_job,
          updated_at: new Date().toISOString()
        })
        .eq('id', seekerId);

      if (jobSeekerError) {
        console.error('Job seeker update error:', jobSeekerError);
        return Response.json({ error: 'Failed to update job seeker profile' }, { status: 500 });
      }
    } else {
      // Clear the denormalized columns if no experiences left
      const { error: jobSeekerError } = await supabaseAdmin
        .from('job_seekers')
        .update({
          job_title: null,
          company_name: null,
          job_bio: null,
          start_date: null,
          end_date: null,
          is_current_job: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', seekerId);

      if (jobSeekerError) {
        console.error('Job seeker update error:', jobSeekerError);
        return Response.json({ error: 'Failed to update job seeker profile' }, { status: 500 });
      }
    }

    return Response.json({ message: 'Experience removed successfully' });
  } catch (error) {
    console.error('Experience API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update experience
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seekerId = await getUserSeekerId(session);
    if (!seekerId) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const experienceId = searchParams.get('id');

    if (!experienceId) {
      return Response.json({ error: 'Experience ID is required' }, { status: 400 });
    }

    const { title, company_name, description, start_date, end_date, is_current_job } = await req.json();

    if (!title || !company_name) {
      return Response.json({ error: 'Title and company are required' }, { status: 400 });
    }

    // Format dates - ensure they're in YYYY-MM-DD format
    let formattedStartDate = null;
    let formattedEndDate = null;

    if (start_date) {
      formattedStartDate = new Date(start_date).toISOString().split('T')[0];
    }

    if (end_date && !is_current_job) {
      formattedEndDate = new Date(end_date).toISOString().split('T')[0];
    }

    // Get or create profile in job_seeker_profiles
    let { data: profile, error: fetchError } = await supabaseAdmin
      .from('job_seeker_profiles')
      .select('experience')
      .eq('email', session.user.email)
      .single();

    // If profile doesn't exist, create it
    if (fetchError && fetchError.code === 'PGRST116') {
      const { error: createError } = await supabaseAdmin
        .from('job_seeker_profiles')
        .insert([
          {
            email: session.user.email,
            fullName: session.user.name || session.user.email.split('@')[0],
            experience: JSON.stringify([]),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);

      if (createError) {
        console.error('Error creating profile:', createError);
        return Response.json({ error: 'Failed to create profile' }, { status: 500 });
      }
      
      // Re-fetch the profile
      const { data: newProfile, error: refetchError } = await supabaseAdmin
        .from('job_seeker_profiles')
        .select('experience')
        .eq('email', session.user.email)
        .single();
        
      if (refetchError) {
        console.error('Error re-fetching profile:', refetchError);
        return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
      }
      
      profile = newProfile;
    } else if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    let experiences = [];
    if (profile && profile.experience) {
      try {
        experiences = JSON.parse(profile.experience);
      } catch (e) {
        console.warn('Error parsing experiences:', e);
        experiences = [];
      }
    }

    // Find and update the experience
    const experienceIndex = experiences.findIndex(exp => exp.id === experienceId);
    if (experienceIndex === -1) {
      return Response.json({ error: 'Experience not found' }, { status: 404 });
    }

    // Update the experience
    experiences[experienceIndex] = {
      ...experiences[experienceIndex],
      title,
      company_name,
      description: description || null,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      is_current_job: is_current_job || false,
      updated_at: new Date().toISOString()
    };

    // Update job_seeker_profiles with updated experiences
    const { error: profileError } = await supabaseAdmin
      .from('job_seeker_profiles')
      .update({
        experience: JSON.stringify(experiences),
        updatedAt: new Date().toISOString()
      })
      .eq('email', session.user.email);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Update the denormalized columns in job_seekers table with the most recent experience
    const latestExperience = experiences[0]; // First item is most recent
    const { error: jobSeekerError } = await supabaseAdmin
      .from('job_seekers')
      .update({
        job_title: latestExperience.title,
        company_name: latestExperience.company_name,
        job_bio: latestExperience.description,
        start_date: latestExperience.start_date,
        end_date: latestExperience.end_date,
        is_current_job: latestExperience.is_current_job,
        updated_at: new Date().toISOString()
      })
      .eq('id', seekerId);

    if (jobSeekerError) {
      console.error('Job seeker update error:', jobSeekerError);
      return Response.json({ error: 'Failed to update job seeker profile' }, { status: 500 });
    }

    return Response.json({ experience: experiences[experienceIndex], message: 'Experience updated successfully' });
  } catch (error) {
    console.error('Experience update error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add experience
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

    const { title, company_name, description, start_date, end_date, is_current_job } = await req.json();

    console.log('Adding experience:', { title, company_name, start_date, end_date });

    if (!title || !company_name) {
      return Response.json({ error: 'Title and company are required' }, { status: 400 });
    }

    // Format dates - ensure they're in YYYY-MM-DD format
    let formattedStartDate = null;
    let formattedEndDate = null;

    if (start_date) {
      formattedStartDate = new Date(start_date).toISOString().split('T')[0];
    }

    if (end_date && !is_current_job) {
      formattedEndDate = new Date(end_date).toISOString().split('T')[0];
    }

    // Create experience object
    const newExperience = {
      id: Date.now().toString(), // Simple ID generation
      title,
      company_name,
      description: description || null,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      is_current_job: is_current_job || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Get or create profile in job_seeker_profiles
    let { data: profile, error: fetchError } = await supabaseAdmin
      .from('job_seeker_profiles')
      .select('experience')
      .eq('email', session.user.email)
      .single();

    // If profile doesn't exist, create it
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('job_seeker_profiles')
        .insert([
          {
            email: session.user.email,
            fullName: session.user.name || session.user.email.split('@')[0],
            experience: JSON.stringify([newExperience]),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ])
        .select('experience')
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return Response.json({ error: 'Failed to create profile' }, { status: 500 });
      }
      
      profile = newProfile;
    } else if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
    } else {
      // Profile exists, update it
      let experiences = [];
      if (profile && profile.experience) {
        try {
          experiences = JSON.parse(profile.experience);
        } catch (e) {
          console.warn('Error parsing experiences:', e);
          experiences = [];
        }
      }

      // Add new experience
      experiences.unshift(newExperience); // Add to beginning of array

      // Update job_seeker_profiles with new experiences
      const { error: profileError } = await supabaseAdmin
        .from('job_seeker_profiles')
        .update({
          experience: JSON.stringify(experiences),
          updatedAt: new Date().toISOString()
        })
        .eq('email', session.user.email);

      if (profileError) {
        console.error('Profile update error:', profileError);
        return Response.json({ error: 'Failed to update profile' }, { status: 500 });
      }
    }

    // Update the denormalized columns in job_seekers table with the most recent experience
    const { error: jobSeekerError } = await supabaseAdmin
      .from('job_seekers')
      .update({
        job_title: newExperience.title,
        company_name: newExperience.company_name,
        job_bio: newExperience.description,
        start_date: newExperience.start_date,
        end_date: newExperience.end_date,
        is_current_job: newExperience.is_current_job,
        updated_at: new Date().toISOString()
      })
      .eq('id', seekerId);

    if (jobSeekerError) {
      console.error('Job seeker update error:', jobSeekerError);
      return Response.json({ error: 'Failed to update job seeker profile' }, { status: 500 });
    }

    console.log('Experience added successfully:', newExperience);
    return Response.json({ experience: newExperience, message: 'Experience added successfully' });
  } catch (error) {
    console.error('Experience API error:', error);
    return Response.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
