import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

const supabase = supabaseAdmin;

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user.role === 'hr' || session.user.role === 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipients, subject, body } = await req.json();
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return Response.json({ error: 'No recipients provided' }, { status: 400 });
    }

    const inserts = [];
    const emailPromises = [];

    for (const r of recipients) {
      // Recipient shape expected: { id, source, email, name }
      const application_id = r.source === 'seeker' ? r.id : null;
      const to_email = r.email || r.to_email || '';
      const to_name = r.name || r.to_name || '';

      // Set sender_type for traceability (HR sends messages here)
      inserts.push({
        application_id,
        interview_id: r.interview_id || null,
        sender_type: 'hr',
        to_email,
        to_name,
        from_user_id: session.user.id || null,
        from_email: session.user.email || null,
        from_name: session.user.name || null,
        subject: subject || '',
        body: body || '',
        content: (subject ? subject + "\n\n" : "") + (body || '')
      });

      // Send an email notification if we have an address
      if (to_email) {
        const html = `<p>${body?.replace(/\n/g, '<br/>')}</p>`;
        emailPromises.push(sendEmail({ to: to_email, subject: subject || 'Message from HR', html }));
      }
    }

    // Insert messages
    const { data, error } = await supabase.from('messages').insert(inserts).select();
    if (error) {
      console.error('Failed to insert messages:', error);
      // Return detailed DB error to help debugging (will show up only in logs / dev)
      return Response.json({ error: 'Failed to save messages', details: error?.message || error }, { status: 500 });
    }

    // Update job_applications metadata for inserted messages that have application_id
    try {
      const appIdCounts = {};
      (data || []).forEach(m => {
        if (m.application_id) {
          appIdCounts[m.application_id] = (appIdCounts[m.application_id] || 0) + 1;
        }
      });

      for (const [appId, cnt] of Object.entries(appIdCounts)) {
        // Fetch current unread count
        const { data: appRow, error: fetchErr } = await supabase.from('job_applications').select('unread_messages').eq('id', appId).single();
        if (fetchErr) {
          console.warn('Failed to fetch application for unread update', appId, fetchErr.message || fetchErr);
          continue;
        }
        const current = (appRow?.unread_messages) || 0;
        const { error: updErr } = await supabase.from('job_applications').update({ unread_messages: current + cnt, last_message_at: new Date().toISOString() }).eq('id', appId);
        if (updErr) console.warn('Failed to update application message metadata', appId, updErr.message || updErr);
      }
    } catch (metaErr) {
      console.error('Failed to update application metadata after inserting messages:', metaErr);
    }

    // Send emails in parallel (don't block success on email failures)
    let emailWarnings = [];
    if (emailPromises.length > 0) {
      const results = await Promise.allSettled(emailPromises);
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error('Email send rejected for recipient', i, r.reason);
          emailWarnings.push(r.reason?.toString?.() || String(r.reason));
        } else if (r.value && r.value.success === false) {
          // Our sendEmail returns { success: false, error }
          emailWarnings.push(r.value.error || 'unknown email error');
        }
      });
    }

    const resp = { success: true, inserted: data?.length || 0, messages: data };
    if (emailWarnings.length > 0) resp.emailWarnings = emailWarnings;

    return Response.json(resp);
  } catch (err) {
    console.error('Messages POST error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const forEmail = searchParams.get('email');

    // HR/Admin can query all messages (optionally filter) - require auth
    if (session && (session.user.role === 'hr' || session.user.role === 'admin')) {
      const { data, error } = await supabase.from('messages').select('*').order('sent_at', { ascending: false });
      if (error) {
        console.error('Failed to fetch messages for hr:', error);
        return Response.json({ error: 'Failed to fetch messages' }, { status: 500 });
      }
      return Response.json({ messages: data });
    }

    // For job seekers: allow fetching messages addressed to their email
    if (forEmail) {
      const { data, error } = await supabase.from('messages').select('*').eq('to_email', forEmail).order('sent_at', { ascending: false });
      if (error) {
        console.error('Failed to fetch messages for email:', error);
        return Response.json({ error: 'Failed to fetch messages' }, { status: 500 });
      }
      return Response.json({ messages: data });
    }

    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (err) {
    console.error('Messages GET error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - mark a message as read
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    if (!id) return Response.json({ error: 'Message id is required' }, { status: 400 });

    // Update message is_read flag
    const { data: updated, error: updateErr } = await supabase.from('messages').update({ is_read: true }).eq('id', id).select().single();
    if (updateErr) {
      console.error('Failed to mark message read:', updateErr);
      return Response.json({ error: 'Failed to update message' }, { status: 500 });
    }

    // If message was linked to an application, decrement unread_messages (clamp >=0)
    if (updated?.application_id) {
      try {
        const appId = updated.application_id;
        const { data: appRow, error: fetchErr } = await supabase.from('job_applications').select('unread_messages').eq('id', appId).single();
        if (!fetchErr && appRow) {
          const current = appRow.unread_messages || 0;
          const newCount = Math.max(0, current - 1);
          const { error: updErr } = await supabase.from('job_applications').update({ unread_messages: newCount }).eq('id', appId);
          if (updErr) console.warn('Failed to decrement unread_messages for application', appId, updErr.message || updErr);
        }
      } catch (err) {
        console.error('Error updating application unread count:', err);
      }
    }

    return Response.json({ success: true, message: updated });
  } catch (err) {
    console.error('Messages PATCH error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
