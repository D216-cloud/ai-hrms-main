import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// Helper function to get or create job seeker profile
async function getOrCreateProfile(session) {
  if (!session?.user?.email) return null;

  // Check if profile exists
  let { data: profile, error: fetchError } = await supabaseAdmin
    .from('job_seeker_profiles')
    .select('*')
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
          phone: '',
          location: '',
          title: '',
          bio: '',
          profileImage: '',
          resume: '',
          skills: '[]',
          experience: '[]',
          education: '[]',
          certifications: '[]',
          profileCompletion: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating profile:', createError);
      return null;
    }
    
    return newProfile;
  }

  if (fetchError) {
    console.error('Error fetching profile:', fetchError);
    return null;
  }

  return profile;
}

// GET - Fetch job seeker profile
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrCreateProfile(session);
    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Parse JSON fields
    const parsedProfile = {
      ...profile,
      skills: profile.skills ? JSON.parse(profile.skills) : [],
      experience: profile.experience ? JSON.parse(profile.experience) : [],
      education: profile.education ? JSON.parse(profile.education) : [],
      certifications: profile.certifications ? JSON.parse(profile.certifications) : []
    };

    return Response.json(parsedProfile);
  } catch (error) {
    console.error('Profile API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update job seeker profile
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrCreateProfile(session);
    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const data = await req.json();
    
    // Prepare update data
    const updateData = {
      updatedAt: new Date().toISOString()
    };

    // Update basic profile fields if provided
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;
    if (data.resume !== undefined) updateData.resume = data.resume;

    // Update JSON fields if provided
    if (data.skills !== undefined) {
      updateData.skills = JSON.stringify(data.skills);
    }
    
    if (data.experience !== undefined) {
      updateData.experience = JSON.stringify(data.experience);
    }
    
    if (data.education !== undefined) {
      updateData.education = JSON.stringify(data.education);
    }
    
    if (data.certifications !== undefined) {
      updateData.certifications = JSON.stringify(data.certifications);
    }

    // Calculate profile completion
    let completion = 0;
    if (updateData.fullName) completion += 20;
    if (updateData.phone) completion += 10;
    if (updateData.location) completion += 10;
    if (updateData.bio) completion += 20;
    if (data.skills && data.skills.length > 0) completion += 15;
    if (data.experience && data.experience.length > 0) completion += 15;
    if (data.education && data.education.length > 0) completion += 10;
    updateData.profileCompletion = Math.min(completion, 100);

    // Update profile
    const { data: updatedProfile, error } = await supabaseAdmin
      .from('job_seeker_profiles')
      .update(updateData)
      .eq('email', session.user.email)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Parse JSON fields for response
    const parsedProfile = {
      ...updatedProfile,
      skills: updatedProfile.skills ? JSON.parse(updatedProfile.skills) : [],
      experience: updatedProfile.experience ? JSON.parse(updatedProfile.experience) : [],
      education: updatedProfile.education ? JSON.parse(updatedProfile.education) : [],
      certifications: updatedProfile.certifications ? JSON.parse(updatedProfile.certifications) : []
    };

    return Response.json({ 
      profile: parsedProfile, 
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}