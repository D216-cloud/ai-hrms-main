import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    console.error('Error in test-session endpoint:', error);
    return NextResponse.json({ error: 'Failed to read session' }, { status: 500 });
  }
}
