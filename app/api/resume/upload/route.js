import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

// Helper function to convert File to Buffer
async function fileToBuffer(file) {
  const buffer = await file.arrayBuffer();
  return Buffer.from(buffer);
}

// POST - Upload resume
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seekerId = await getUserSeekerId(session);
    if (!seekerId) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('resume');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'];
    
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ 
        error: 'Invalid file type. Only PDF, DOC, DOCX, and TXT are allowed' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ 
        error: 'File too large. Maximum size is 10MB' 
      }, { status: 400 });
    }

    // Convert file to buffer
    const fileBuffer = await fileToBuffer(file);

    // Upload to Cloudinary
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadToCloudinary(fileBuffer, file.name, 'resumes');
    } catch (cloudError) {
      console.error('Cloudinary upload error:', cloudError);
      return Response.json({ error: 'Failed to upload resume to cloud storage' }, { status: 500 });
    }

    if (!cloudinaryResult || !cloudinaryResult.url) {
      console.error('Invalid Cloudinary response:', cloudinaryResult);
      return Response.json({ error: 'Failed to get resume URL from cloud storage' }, { status: 500 });
    }

    const publicUrl = cloudinaryResult.url;
    const publicId = cloudinaryResult.publicId;

    console.log("Attempting to update job_seekers with resume info...");
    console.log("Seeker ID:", seekerId);
    console.log("Resume URL:", publicUrl);

    // Update job_seekers table with resume URL only (resume_public_id column may not exist)
    const { data: updated, error: updateError } = await supabase
      .from('job_seekers')
      .update({
        resume_url: publicUrl,
        resume_filename: file.name,
        resume_uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', seekerId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error details:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
      });
      return Response.json({ 
        error: 'Failed to save resume info: ' + (updateError.message || 'Unknown error')
      }, { status: 500 });
    }

    console.log("Resume info saved successfully");
    return Response.json({ 
      profile: updated, 
      message: 'Resume uploaded successfully',
      resume_url: publicUrl,
      publicId: publicId, // Send back to frontend for future use
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Retrieve resume
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seekerId = await getUserSeekerId(session);
    if (!seekerId) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: profile, error } = await supabase
      .from('job_seekers')
      .select('resume_url, resume_filename, resume_uploaded_at')
      .eq('id', seekerId)
      .single();

    if (error) {
      return Response.json({ error: 'Failed to fetch resume' }, { status: 500 });
    }

    if (!profile?.resume_url) {
      return Response.json({ error: 'No resume found' }, { status: 404 });
    }

    return Response.json({ 
      resume: {
        url: profile.resume_url,
        filename: profile.resume_filename,
        uploaded_at: profile.resume_uploaded_at,
      }
    });
  } catch (error) {
    console.error('Resume fetch error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove resume
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seekerId = await getUserSeekerId(session);
    if (!seekerId) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get current resume info
    const { data: profile, error: fetchError } = await supabase
      .from('job_seekers')
      .select('resume_url')
      .eq('id', seekerId)
      .single();

    if (fetchError || !profile?.resume_url) {
      return Response.json({ error: 'No resume found' }, { status: 404 });
    }

    // Extract public ID from Cloudinary URL if possible
    // Cloudinary URL format: https://res.cloudinary.com/.../image/upload/v.../folder/public_id.ext
    const publicId = profile.resume_url.split('/').pop()?.split('.')[0];
    
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
        console.log("Resume deleted from Cloudinary");
      } catch (cloudError) {
        console.error('Cloudinary delete error:', cloudError);
        // Continue even if Cloudinary delete fails, we'll still clear the DB
      }
    }

    // Update profile to remove resume URL
    const { error: updateError } = await supabase
      .from('job_seekers')
      .update({
        resume_url: null,
        resume_filename: null,
        resume_uploaded_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', seekerId);

    if (updateError) {
      console.error('Update error:', updateError);
      return Response.json({ error: 'Failed to remove resume info' }, { status: 500 });
    }

    console.log("Resume deleted successfully from database");
    return Response.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Resume delete error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}