import { NextResponse } from 'next/server';
import { generateMCQs } from '@/lib/openai';

export async function POST(req) {
  try {
    const body = await req.json();
    const { jobTitle = 'General Software Engineer', skills = [], experienceYears = 2, count = 30 } = body || {};

    // Validate count to prevent abuse
    const safeCount = Math.min(Math.max(parseInt(count, 10) || 30, 1), 100);

    const questions = await generateMCQs({ jobTitle, skills, experienceYears, count: safeCount });

    return NextResponse.json({ ok: true, questions });
  } catch (err) {
    console.error('Error in /api/generate-mcqs:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Failed to generate MCQs' }, { status: 500 });
  }
}