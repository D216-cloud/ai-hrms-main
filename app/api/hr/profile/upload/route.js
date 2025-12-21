import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'hr' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hrUserId = session.user.id;
    const body = await req.json();
    const { image, filename } = body || {};

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Cloudinary
    const fileroot = filename || `hr_profile_${Date.now()}.png`;
    const uploadResult = await uploadToCloudinary(buffer, fileroot, 'hr_profiles');

    const url = uploadResult.url;

    // Try to write to hr_profiles; if not present, persist to hr_users.profile_data
    try {
      // Attempt update first
      const { data: existing } = await supabaseAdmin
        .from('hr_profiles')
        .select('id')
        .eq('hr_user_id', hrUserId)
        .single();

      if (existing) {
        await supabaseAdmin
          .from('hr_profiles')
          .update({ profile_picture_url: url })
          .eq('hr_user_id', hrUserId);
      } else {
        // Insert a minimal profile row
        await supabaseAdmin
          .from('hr_profiles')
          .insert({ hr_user_id: hrUserId, profile_picture_url: url });
      }
    } catch (e) {
      // If hr_profiles is missing or update failed, persist to hr_users.profile_data
      console.warn('hr_profiles write failed, falling back to hr_users.profile_data:', e.message || e);
      try {
        await supabaseAdmin.from('hr_users').update({ profile_data: { profile_picture_url: url } }).eq('id', hrUserId);
      } catch (e2) {
        console.error('Failed to persist profile picture to hr_users:', e2);
      }
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error('Error in POST /api/hr/profile/upload:', err);
    return NextResponse.json({ error: 'Internal server error', details: { message: err.message } }, { status: 500 });
  }
}
