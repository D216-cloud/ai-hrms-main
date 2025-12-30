import { NextResponse } from 'next/server';
import { generateCoverLetter } from '@/lib/openai';

export async function POST(req) {
  try {
    const body = await req.json();
    const { jobTitle = '', company = '', jobDescription = '', formData = {}, matchPreview = {} } = body || {};

    // Minimal validation
    if (!jobTitle && !company && !jobDescription) {
      return NextResponse.json({ ok: false, error: 'Missing job context (title/company/description).' }, { status: 400 });
    }

    const result = await generateCoverLetter({ jobTitle, company, jobDescription, formData, matchPreview });

    return NextResponse.json({ ok: true, coverLetter: result.paragraph, suggestion: result.suggestion });
  } catch (err) {
    console.error('Error in /api/generate-cover-letter:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Failed to generate cover letter' }, { status: 500 });
  }
}
