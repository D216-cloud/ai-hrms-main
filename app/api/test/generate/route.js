import { NextResponse } from 'next/server';
import { generateMCQs } from '../../../../lib/openai';

export async function POST(req) {
  try {
    const body = await req.json();
    const { jobTitle = 'Technical Skill', skills = [], count = 20, experienceYears = 2 } = body || {};

    // Normalize skills to array
    const skillsArray = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const questions = await generateMCQs({ jobTitle, skills: skillsArray, experienceYears, count });

    return NextResponse.json({ ok: true, questions });
  } catch (err) {
    console.error('Error in /api/test/generate:', err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to generate questions' }, { status: 500 });
  }
}
